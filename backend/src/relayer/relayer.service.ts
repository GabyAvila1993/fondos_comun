import { Injectable, Logger } from "@nestjs/common";
import { ethers } from "ethers";

// CORRECCIÓN: Se cambió "import * as" por la importación directa
import SharedWalletAbi from "../config/contracts/SharedWallet.abi.json";
import FactoryAbi from "../config/contracts/SharedWalletFactory.abi.json";
import ERC20Abi from "../config/contracts/ERC20.abi.json";

/** USDC usa 6 decimales (no 18 como MON/ETH). */
const USDC_DECIMALS = 6;

/**
 * RelayerService
 * ---------------
 * Esta es LA UNICA wallet que paga gas en toda la app (en MON, para la red).
 * La plata del fondo en sí NO se guarda en MON — se guarda en USDC, un
 * stablecoin que vale siempre 1 dólar, para que el saldo del grupo no
 * fluctúe con el precio de mercado de la criptomoneda nativa.
 *
 * El usuario final nunca ve ninguna de las dos cosas: firma mensajes
 * gratis desde su wallet invisible de Privy, y este servicio es quien
 * pone esa firma en la blockchain, pagando el gas con MON y moviendo el
 * fondo en USDC.
 */
@Injectable()
export class RelayerService {
  private readonly logger = new Logger(RelayerService.name);
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet;
  private factory: ethers.Contract;
  private usdc: ethers.Contract;

  constructor() {
    this.provider = new ethers.JsonRpcProvider(process.env.MONAD_RPC_URL);
    this.wallet = new ethers.Wallet(process.env.RELAYER_PRIVATE_KEY!, this.provider);
    
    // CORRECCIÓN: Pasamos el ABI importado directamente
    this.factory = new ethers.Contract(
      process.env.FACTORY_CONTRACT_ADDRESS!,
      FactoryAbi,
      this.wallet,
    );
    
    this.usdc = new ethers.Contract(
      process.env.MONAD_USDC_ADDRESS!, 
      ERC20Abi, 
      this.wallet
    );
    
    this.logger.log(`Relayer activo: ${this.wallet.address}`);
  }

  get address() {
    return this.wallet.address;
  }

  private groupContract(address: string) {
    return new ethers.Contract(
      address, 
      SharedWalletAbi, 
      this.wallet
    );
  }

  /** MON del relayer — esto es lo que paga el gas, hay que reponerlo periódicamente. */
  async getRelayerGasBalance() {
    const bal = await this.provider.getBalance(this.wallet.address);
    return ethers.formatEther(bal);
  }

  /** USDC que el relayer tiene disponible para acreditar depósitos fiat. */
  async getRelayerUsdcBalance() {
    const bal = await this.usdc.balanceOf(this.wallet.address);
    return ethers.formatUnits(bal, USDC_DECIMALS);
  }

  // ---------- Creación de grupos ----------
  async createGroup(name: string, initialMemberAddress: string, creditLimitUsd: string, dailyLimit: number) {
    const tx = await this.factory.createWallet(
      name,
      [initialMemberAddress],
      ethers.parseUnits(creditLimitUsd, USDC_DECIMALS),
      dailyLimit,
    );
    const receipt = await tx.wait();
    const event = receipt.logs
      .map((l: any) => { try { return this.factory.interface.parseLog(l); } catch { return null; } })
      .find((e: any) => e?.name === "WalletCreated");
    return event.args.wallet as string;
  }

  // ---------- Depósitos (fiat -> USDC onchain) ----------
  async depositFiatAsOnchain(groupAddress: string, fiatAmount: number) {
    let rate = Number(process.env.DEMO_FIAT_TO_USD_RATE || "0.001");
    try {
      const resp = await fetch("https://dolarapi.com/v1/dolares/cripto");
      if (resp.ok) {
        const data = await resp.json();
        if (data.venta) {
          rate = 1 / data.venta;
        }
      }
    } catch (e) {
      this.logger.error("Error al obtener cotización Dolar Cripto, usando fallback", e);
    }

    const usdAmount = fiatAmount * rate;
    const amountUnits = ethers.parseUnits(usdAmount.toFixed(USDC_DECIMALS), USDC_DECIMALS);

    const approveTx = await this.usdc.approve(groupAddress, amountUnits);
    await approveTx.wait();

    const contract = this.groupContract(groupAddress);
    const tx = await contract.deposit(amountUnits);
    await tx.wait();
    
    return { usdAmount };
  }

  // ---------- Lectura de estado (para pintar la pantalla) ----------
  async getGroupState(groupAddress: string, _userAddress: string) {
    const contract = this.groupContract(groupAddress);
    
    // Add retry for RPC flakes on testnet
    let name, creditLimit, dailyLimit, majority, bal, total;
    let attempts = 0;
    while (attempts < 3) {
      try {
        [name, creditLimit, dailyLimit, majority, bal, total] = await Promise.all([
          contract.name(),
          contract.creditLimit(),
          contract.dailyLimit(),
          contract.majorityNeeded(),
          contract.balance(),
          contract.transactionCount(),
        ]);
        break; // Success
      } catch (err: any) {
        attempts++;
        if (attempts >= 3) throw err;
        await new Promise(r => setTimeout(r, 1000)); // wait 1s before retry
      }
    }

    const fmt = (v: bigint) => ethers.formatUnits(v, USDC_DECIMALS);
    const transactions = [];
    for (let i = 0; i < Number(total); i++) {
      try {
        const t = await contract.getTransaction(i);
        transactions.push({
          id: i,
          proposer: t.proposer,
          amount: fmt(t.amount),
          desc: t.description,
          executed: t.executed,
          rejected: t.rejected,
          votesFor: Number(t.votesFor),
          votesAgainst: Number(t.votesAgainst),
          createdAt: t.createdAt ? Number(t.createdAt) * 1000 : 0,
        });
      } catch (e) {
        console.warn(`Could not fetch transaction ${i} for ${groupAddress} (might be an old contract format)`);
      }
    }

    let limitProposalCount = 0n;
    try {
      limitProposalCount = await contract.limitProposalCount();
    } catch (e) {
      console.warn(`Contract does not support limitProposalCount: ${groupAddress}`);
    }

    const limitProposals = [];
    for (let i = 0; i < Number(limitProposalCount); i++) {
      const p = await contract.getLimitProposal(i);
      limitProposals.push({
        id: i,
        proposer: p[0],
        newLimit: fmt(p[1]),
        executed: p[2],
        rejected: p[3],
        votesFor: Number(p[4]),
        votesAgainst: Number(p[5]),
        createdAt: Number(p[6]) * 1000,
      });
    }

    return {
      name,
      creditLimit: fmt(creditLimit),
      dailyLimit: Number(dailyLimit),
      majorityNeeded: Number(majority),
      balance: fmt(bal),
      transactions: transactions.reverse(),
      pending: transactions.filter((t) => !t.executed && !t.rejected),
      limitProposals: limitProposals.reverse(),
      pendingLimitProposals: limitProposals.filter((p) => !p.executed && !p.rejected),
    };
  }

  // ---------- Acciones gasless firmadas por el usuario ----------
  async getNonce(groupAddress: string, userAddress: string): Promise<bigint> {
    const contract = this.groupContract(groupAddress);
    return contract.nonces(userAddress);
  }

  async joinGroup(groupAddress: string, userAddress: string, nonce: bigint, signature: string) {
    const contract = this.groupContract(groupAddress);
    const tx = await contract.joinFor(userAddress, nonce, signature);
    return tx.wait();
  }

  async requestExpense(
    groupAddress: string,
    userAddress: string,
    amountUsd: string,
    desc: string,
    forceApproval: boolean,
    nonce: bigint,
    signature: string,
  ) {
    const contract = this.groupContract(groupAddress);
    const tx = await contract.requestExpenseFor(
      userAddress,
      ethers.parseUnits(amountUsd, USDC_DECIMALS),
      desc,
      forceApproval,
      nonce,
      signature,
    );
    return tx.wait();
  }

  async vote(groupAddress: string, voterAddress: string, txId: number, approve: boolean, nonce: bigint, signature: string) {
    const contract = this.groupContract(groupAddress);
    const tx = await contract.voteFor(voterAddress, txId, approve, nonce, signature);
    return tx.wait();
  }

  async proposeLimitChange(groupAddress: string, proposer: string, newLimitFiat: number, nonce: bigint, signature: string) {
    const contract = this.groupContract(groupAddress);
    const tx = await contract.proposeLimitChangeFor(proposer, ethers.parseUnits(newLimitFiat.toString(), USDC_DECIMALS), nonce, signature);
    return tx.wait();
  }

  async voteLimitChange(groupAddress: string, voterAddress: string, proposalId: number, approve: boolean, nonce: bigint, signature: string) {
    const contract = this.groupContract(groupAddress);
    const tx = await contract.voteLimitChangeFor(voterAddress, proposalId, approve, nonce, signature);
    return tx.wait();
  }
}