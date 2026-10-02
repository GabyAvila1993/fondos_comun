// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @dev Interfaz minima de un token ERC-20 (USDC en Monad cumple este estandar).
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
}

/**
 * SharedWallet
 * -------------
 * El fondo común de un grupo, guardado en USDC (no en MON nativo).
 *
 * Por qué USDC y no MON: MON es una criptomoneda con precio de mercado que
 * sube y baja. Si el fondo se guardara en MON, el saldo en pesos del grupo
 * cambiaría solo, sin que nadie haya gastado nada — inexplicable para un
 * usuario que no sigue el mercado cripto. USDC es un "stablecoin": cada
 * unidad vale siempre 1 dólar, emitido por Circle, ya activo en Monad.
 * MON se sigue usando SOLO para pagar el gas de las transacciones (eso lo
 * paga el relayer del backend, nunca el usuario, y no afecta el valor del
 * fondo).
 *
 * Importante: USDC usa 6 decimales (no 18 como MON/ETH). Todo `amount` en
 * este contrato está expresado en esas unidades — el frontend/backend usan
 * `parseUnits(monto, 6)` en vez de `parseEther`.
 */
contract SharedWallet {
    struct Member {
        bool active;
        bool isGuest; // integrante invitado (sin plan propio)
    }

    struct Transaction {
        address proposer;
        uint256 amount;
        string description;
        bool executed;
        bool rejected;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        mapping(address => bool) voted;
    }

    struct LimitProposal {
        address proposer;
        uint256 newLimit;
        bool executed;
        bool rejected;
        uint256 votesFor;
        uint256 votesAgainst;
        uint256 createdAt;
        mapping(address => bool) voted;
    }

    string public name;
    IERC20 public immutable usdc;
    address public admin;
    address[] public memberList;
    mapping(address => Member) public members;

    uint256 public creditLimit;   // monto máximo por transferencia sin aprobación (en USDC, 6 decimales)
    uint256 public dailyLimit;    // cantidad de transferencias directas permitidas por día

    mapping(address => uint256) public txCountToday;
    mapping(address => uint256) public lastTxDay;

    // ---- Meta-transacciones (gas patrocinado) ----
    address public relayer;
    mapping(address => uint256) public nonces;

    bytes32 public constant DOMAIN_TYPEHASH =
        keccak256("EIP712Domain(string name,string version,uint256 chainId,address verifyingContract)");
    bytes32 public constant REQUEST_TYPEHASH =
        keccak256("RequestExpense(address user,uint256 amount,string desc,bool forceApproval,uint256 nonce)");
    bytes32 public constant VOTE_TYPEHASH =
        keccak256("Vote(address voter,uint256 txId,bool approve,uint256 nonce)");
    bytes32 public constant JOIN_TYPEHASH =
        keccak256("Join(address user,uint256 nonce)");
    bytes32 public constant PROPOSE_LIMIT_TYPEHASH =
        keccak256("ProposeLimit(address proposer,uint256 newLimit,uint256 nonce)");
    bytes32 public constant VOTE_LIMIT_TYPEHASH =
        keccak256("VoteLimit(address voter,uint256 id,bool approve,uint256 nonce)");
    bytes32 public constant CHANGE_ADMIN_TYPEHASH =
        keccak256("ChangeAdmin(address currentAdmin,address newAdmin,uint256 nonce)");
    bytes32 public immutable DOMAIN_SEPARATOR;

    Transaction[] private transactions;
    LimitProposal[] private limitProposals;

    event Deposit(address indexed from, uint256 amount, uint256 newBalance);
    event ExpenseExecuted(uint256 indexed txId, address indexed user, uint256 amount, string desc, uint256 newBalance);
    event ApprovalRequested(uint256 indexed txId, address indexed user, uint256 amount, string desc, uint256 votesNeeded);
    event Voted(uint256 indexed txId, address indexed voter, bool approve, uint256 votesFor, uint256 votesAgainst);
    event ApprovalResolved(uint256 indexed txId, bool approved);
    event MemberAdded(address indexed member, bool isGuest);
    event LimitChangeRequested(uint256 indexed id, address indexed proposer, uint256 newLimit, uint256 votesNeeded);
    event LimitVoted(uint256 indexed id, address indexed voter, bool approve, uint256 votesFor, uint256 votesAgainst);
    event LimitChangeResolved(uint256 indexed id, bool approved, uint256 newLimit);
    event AdminChanged(address indexed oldAdmin, address indexed newAdmin);
    event MemberLeft(address indexed member);

    modifier onlyMember() {
        require(members[msg.sender].active, "No sos miembro de este fondo");
        _;
    }

    modifier onlyRelayer() {
        require(msg.sender == relayer, "Solo el relayer del backend puede llamar esto");
        _;
    }

    constructor(
        string memory _name,
        address[] memory _members,
        uint256 _creditLimit,
        uint256 _dailyLimit,
        address _relayer,
        address _usdc
    ) {
        name = _name;
        creditLimit = _creditLimit;
        dailyLimit = _dailyLimit;
        relayer = _relayer;
        usdc = IERC20(_usdc);
        if (_members.length > 0) {
            admin = _members[0];
        }
        for (uint256 i = 0; i < _members.length; i++) {
            members[_members[i]] = Member(true, false);
            memberList.push(_members[i]);
        }
        DOMAIN_SEPARATOR = keccak256(
            abi.encode(DOMAIN_TYPEHASH, keccak256(bytes("SharedWallet")), keccak256(bytes("1")), block.chainid, address(this))
        );
    }

    /// @notice El fondo NO acepta MON nativo — solo USDC via deposit().
    receive() external payable {
        revert("Este fondo usa USDC, no MON nativo. Llama a deposit().");
    }

    function balance() public view returns (uint256) {
        return usdc.balanceOf(address(this));
    }

    /// @notice Deposita USDC al fondo. Quien llama tiene que haber hecho
    /// antes `usdc.approve(direccionDeEsteContrato, amount)`.
    function deposit(uint256 amount) external {
        require(amount > 0, "Monto invalido");
        require(usdc.transferFrom(msg.sender, address(this), amount), "Transferencia de USDC fallida");
        emit Deposit(msg.sender, amount, balance());
    }

    function _today() internal view returns (uint256) {
        return block.timestamp / 1 days;
    }

    function _resetIfNewDay(address user) internal {
        if (lastTxDay[user] != _today()) {
            lastTxDay[user] = _today();
            txCountToday[user] = 0;
        }
    }

    function _activeMemberCount() internal view returns (uint256) {
        uint256 count = 0;
        for (uint256 i = 0; i < memberList.length; i++) {
            if (members[memberList[i]].active) {
                count++;
            }
        }
        return count;
    }

    function majorityNeeded() public view returns (uint256) {
        uint256 m = _activeMemberCount();
        if (m <= 1) return 0;
        if (m == 2) return 1;
        return ((m - 1) / 2) + 1;
    }

    function memberCount() external view returns (uint256) {
        return memberList.length;
    }

    function getMembers() external view returns (address[] memory) {
        return memberList;
    }

    function transactionCount() external view returns (uint256) {
        return transactions.length;
    }

    function getTransaction(uint256 id)
        external
        view
        returns (
            address proposer,
            uint256 amount,
            string memory description,
            bool executed,
            bool rejected,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 createdAt
        )
    {
        Transaction storage t = transactions[id];
        return (t.proposer, t.amount, t.description, t.executed, t.rejected, t.votesFor, t.votesAgainst, t.createdAt);
    }

    function hasVoted(uint256 id, address voter) external view returns (bool) {
        return transactions[id].voted[voter];
    }

    function limitProposalCount() external view returns (uint256) {
        return limitProposals.length;
    }

    function getLimitProposal(uint256 id)
        external
        view
        returns (
            address proposer,
            uint256 newLimit,
            bool executed,
            bool rejected,
            uint256 votesFor,
            uint256 votesAgainst,
            uint256 createdAt
        )
    {
        LimitProposal storage p = limitProposals[id];
        return (p.proposer, p.newLimit, p.executed, p.rejected, p.votesFor, p.votesAgainst, p.createdAt);
    }

    function hasVotedLimit(uint256 id, address voter) external view returns (bool) {
        return limitProposals[id].voted[voter];
    }

    /// @param forceApproval true = usa el botón "Solicitar aumento o compra superior"
    function requestExpense(uint256 amount, string calldata desc, bool forceApproval)
        external
        onlyMember
        returns (uint256 id)
    {
        require(amount > 0, "Monto invalido");
        require(amount <= balance(), "El fondo no alcanza");

        _resetIfNewDay(msg.sender);
        bool needsApproval = forceApproval || amount > creditLimit || txCountToday[msg.sender] >= dailyLimit;
        if (majorityNeeded() == 0) {
            needsApproval = false;
        }

        transactions.push();
        id = transactions.length - 1;
        Transaction storage t = transactions[id];
        t.proposer = msg.sender;
        t.amount = amount;
        t.description = desc;
        t.createdAt = block.timestamp;

        if (!needsApproval) {
            txCountToday[msg.sender] += 1;
            t.executed = true;
            require(usdc.transfer(msg.sender, amount), "Pago fallido");
            emit ExpenseExecuted(id, msg.sender, amount, desc, balance());
        } else {
            emit ApprovalRequested(id, msg.sender, amount, desc, majorityNeeded());
        }
    }

    function vote(uint256 id, bool approve) external onlyMember {
        Transaction storage t = transactions[id];
        require(!t.executed && !t.rejected, "Ya fue resuelta");
        require(!t.voted[msg.sender], "Ya votaste");
        require(msg.sender != t.proposer, "El que pide no vota");

        t.voted[msg.sender] = true;
        if (approve) {
            t.votesFor += 1;
        } else {
            t.votesAgainst += 1;
        }
        emit Voted(id, msg.sender, approve, t.votesFor, t.votesAgainst);

        uint256 needed = majorityNeeded();
        if (t.votesFor >= needed) {
            t.executed = true;
            _resetIfNewDay(t.proposer);
            require(usdc.transfer(t.proposer, t.amount), "Pago fallido");
            emit ExpenseExecuted(id, t.proposer, t.amount, t.description, balance());
            emit ApprovalResolved(id, true);
        } else if (t.votesAgainst >= needed) {
            t.rejected = true;
            emit ApprovalResolved(id, false);
        }
    }

    function addMember(address newMember, bool isGuest) external onlyMember {
        require(!members[newMember].active, "Ya es miembro");
        members[newMember] = Member(true, isGuest);
        memberList.push(newMember);
        emit MemberAdded(newMember, isGuest);
    }

    /// @notice Autoservicio: quien tenga el link de invitación puede sumarse solo.
    function join() external {
        require(!members[msg.sender].active, "Ya eras miembro");
        members[msg.sender] = Member(true, false);
        memberList.push(msg.sender);
        emit MemberAdded(msg.sender, false);
    }

    // =========================================================
    // VERSIONES "GASLESS": el usuario firma gratis (offchain) y el
    // relayer del backend manda la transacción pagando el gas.
    // =========================================================

    function _hashTypedData(bytes32 structHash) internal view returns (bytes32) {
        return keccak256(abi.encodePacked("\x19\x01", DOMAIN_SEPARATOR, structHash));
    }

    function _recoverSigner(bytes32 digest, bytes memory signature) internal pure returns (address) {
        require(signature.length == 65, "Firma invalida");
        bytes32 r; bytes32 s; uint8 v;
        assembly {
            r := mload(add(signature, 32))
            s := mload(add(signature, 64))
            v := byte(0, mload(add(signature, 96)))
        }
        if (v < 27) v += 27;
        return ecrecover(digest, v, r, s);
    }

    function joinFor(address user, uint256 nonce, bytes calldata signature) external onlyRelayer {
        require(nonce == nonces[user], "Nonce invalido");
        require(!members[user].active, "Ya era miembro");
        bytes32 structHash = keccak256(abi.encode(JOIN_TYPEHASH, user, nonce));
        require(_recoverSigner(_hashTypedData(structHash), signature) == user, "Firma invalida");

        nonces[user] += 1;
        members[user] = Member(true, false);
        memberList.push(user);
        emit MemberAdded(user, false);
    }

    function requestExpenseFor(
        address user,
        uint256 amount,
        string calldata desc,
        bool forceApproval,
        uint256 nonce,
        bytes calldata signature
    ) external onlyRelayer returns (uint256 id) {
        require(nonce == nonces[user], "Nonce invalido");
        require(amount > 0, "Monto invalido");
        require(amount <= balance(), "El fondo no alcanza");

        bytes32 structHash = keccak256(
            abi.encode(REQUEST_TYPEHASH, user, amount, keccak256(bytes(desc)), forceApproval, nonce)
        );
        require(_recoverSigner(_hashTypedData(structHash), signature) == user, "Firma invalida");
        nonces[user] += 1;

        _resetIfNewDay(user);
        bool needsApproval = forceApproval || amount > creditLimit || txCountToday[user] >= dailyLimit;
        if (majorityNeeded() == 0) {
            needsApproval = false;
        }

        transactions.push();
        id = transactions.length - 1;
        Transaction storage t = transactions[id];
        t.proposer = user;
        t.amount = amount;
        t.description = desc;
        t.createdAt = block.timestamp;

        if (!needsApproval) {
            txCountToday[user] += 1;
            t.executed = true;
            require(usdc.transfer(user, amount), "Pago fallido");
            emit ExpenseExecuted(id, user, amount, desc, balance());
        } else {
            emit ApprovalRequested(id, user, amount, desc, majorityNeeded());
        }
    }

    function voteFor(address voter, uint256 id, bool approve, uint256 nonce, bytes calldata signature)
        external
        onlyRelayer
    {
        require(nonce == nonces[voter], "Nonce invalido");
        bytes32 structHash = keccak256(abi.encode(VOTE_TYPEHASH, voter, id, approve, nonce));
        require(_recoverSigner(_hashTypedData(structHash), signature) == voter, "Firma invalida");
        nonces[voter] += 1;

        Transaction storage t = transactions[id];
        require(!t.executed && !t.rejected, "Ya fue resuelta");
        require(!t.voted[voter], "Ya voto");
        require(voter != t.proposer, "El que pide no vota");

        t.voted[voter] = true;
        if (approve) t.votesFor += 1; else t.votesAgainst += 1;
        emit Voted(id, voter, approve, t.votesFor, t.votesAgainst);

        uint256 needed = majorityNeeded();
        if (t.votesFor >= needed) {
            t.executed = true;
            _resetIfNewDay(t.proposer);
            require(usdc.transfer(t.proposer, t.amount), "Pago fallido");
            emit ExpenseExecuted(id, t.proposer, t.amount, t.description, balance());
            emit ApprovalResolved(id, true);
        } else if (t.votesAgainst >= needed) {
            t.rejected = true;
            emit ApprovalResolved(id, false);
        }
    }

    function proposeLimitChangeFor(address proposer, uint256 newLimit, uint256 nonce, bytes calldata signature) external onlyRelayer returns (uint256 id) {
        require(nonce == nonces[proposer], "Nonce invalido");
        require(proposer == admin, "Solo admin puede proponer");
        require(newLimit > 0, "Limite invalido");

        bytes32 structHash = keccak256(abi.encode(PROPOSE_LIMIT_TYPEHASH, proposer, newLimit, nonce));
        require(_recoverSigner(_hashTypedData(structHash), signature) == proposer, "Firma invalida");
        nonces[proposer] += 1;

        limitProposals.push();
        id = limitProposals.length - 1;
        LimitProposal storage p = limitProposals[id];
        p.proposer = proposer;
        p.newLimit = newLimit;
        p.createdAt = block.timestamp;
        
        if (majorityNeeded() == 0) {
            p.executed = true;
            creditLimit = newLimit;
            emit LimitChangeResolved(id, true, newLimit);
        } else {
            emit LimitChangeRequested(id, proposer, newLimit, majorityNeeded());
        }
    }

    function voteLimitChangeFor(address voter, uint256 id, bool approve, uint256 nonce, bytes calldata signature) external onlyRelayer {
        require(nonce == nonces[voter], "Nonce invalido");
        bytes32 structHash = keccak256(abi.encode(VOTE_LIMIT_TYPEHASH, voter, id, approve, nonce));
        require(_recoverSigner(_hashTypedData(structHash), signature) == voter, "Firma invalida");
        nonces[voter] += 1;

        LimitProposal storage p = limitProposals[id];
        require(!p.executed && !p.rejected, "Ya fue resuelta");
        require(!p.voted[voter], "Ya voto");
        require(voter != p.proposer, "El que propone no vota");

        p.voted[voter] = true;
        if (approve) p.votesFor += 1; else p.votesAgainst += 1;
        emit LimitVoted(id, voter, approve, p.votesFor, p.votesAgainst);

        uint256 needed = majorityNeeded();
        if (p.votesFor >= needed) {
            p.executed = true;
            creditLimit = p.newLimit;
            emit LimitChangeResolved(id, true, p.newLimit);
        } else if (p.votesAgainst >= needed) {
            p.rejected = true;
            emit LimitChangeResolved(id, false, p.newLimit);
        }
    }

    function changeAdminAndLeaveFor(address currentAdmin, address newAdmin, uint256 nonce, bytes calldata signature) external onlyRelayer {
        require(currentAdmin == admin, "No es admin");
        require(members[currentAdmin].active, "Admin no es miembro");
        require(members[newAdmin].active, "Nuevo admin no es miembro");
        require(nonce == nonces[currentAdmin], "Nonce invalido");

        bytes32 structHash = keccak256(abi.encode(CHANGE_ADMIN_TYPEHASH, currentAdmin, newAdmin, nonce));
        require(_recoverSigner(_hashTypedData(structHash), signature) == currentAdmin, "Firma invalida");
        nonces[currentAdmin] += 1;

        // Transferir admin
        admin = newAdmin;
        emit AdminChanged(currentAdmin, newAdmin);

        // Desactivar creador original
        members[currentAdmin].active = false;
        emit MemberLeft(currentAdmin);
    }
}

/**
 * SharedWalletFactory
 * --------------------
 * Despliega un SharedWallet por cada grupo, todos usando el mismo USDC y
 * el mismo relayer, y aplica el límite de "cuántos grupos" según el plan.
 */
contract SharedWalletFactory {
    address public admin;
    address public relayer;
    address public usdc;
    mapping(address => address[]) public walletsByOwner;
    mapping(address => uint256) public maxGroupsAllowed; // 0 = usa default (Basic = 2)

    event WalletCreated(address indexed wallet, address indexed owner, string name);
    event PlanUpdated(address indexed user, uint256 maxGroups);

    constructor(address _relayer, address _usdc) {
        admin = msg.sender;
        relayer = _relayer;
        usdc = _usdc;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Solo admin");
        _;
    }

    function setPlan(address user, uint256 maxGroups) external onlyAdmin {
        maxGroupsAllowed[user] = maxGroups;
        emit PlanUpdated(user, maxGroups);
    }

    function _limitFor(address user) internal view returns (uint256) {
        uint256 custom = maxGroupsAllowed[user];
        return custom == 0 ? 2 : custom; // Basic por defecto = 2 grupos
    }

    function createWallet(
        string calldata groupName,
        address[] calldata members,
        uint256 creditLimit,
        uint256 dailyLimit
    ) external returns (address) {

        SharedWallet w = new SharedWallet(groupName, members, creditLimit, dailyLimit, relayer, usdc);
        walletsByOwner[msg.sender].push(address(w));
        emit WalletCreated(address(w), msg.sender, groupName);
        return address(w);
    }

    function getWalletsByOwner(address owner) external view returns (address[] memory) {
        return walletsByOwner[owner];
    }
}
