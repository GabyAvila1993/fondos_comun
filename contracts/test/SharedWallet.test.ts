import { expect } from "chai";
import { ethers } from "hardhat";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-toolbox/network-helpers";

describe("SharedWallet (sobre USDC)", () => {
  let owner: HardhatEthersSigner, relayer: HardhatEthersSigner;
  let alice: HardhatEthersSigner, bob: HardhatEthersSigner, carol: HardhatEthersSigner;
  let wallet: any;
  let usdc: any;

  // USDC usa 6 decimales. 1_000_000 unidades = "1" USDC.
  const u = (n: number) => BigInt(n) * 1_000_000n;

  const CREDIT_LIMIT = u(100); // equivalente a "$10.000" en el demo
  const DAILY_LIMIT = 2;

  beforeEach(async () => {
    [owner, relayer, alice, bob, carol] = await ethers.getSigners();

    const MockUSDC = await ethers.getContractFactory("MockUSDC");
    usdc = await MockUSDC.deploy();
    await usdc.waitForDeployment();

    const Wallet = await ethers.getContractFactory("SharedWallet");
    wallet = await Wallet.deploy(
      "Vacaciones Bariloche",
      [alice.address, bob.address, carol.address],
      CREDIT_LIMIT,
      DAILY_LIMIT,
      relayer.address,
      await usdc.getAddress(),
    );
    await wallet.waitForDeployment();

    // Fondeamos el contrato como si alguien hubiese depositado USDC.
    await usdc.mint(owner.address, u(1000));
    await usdc.connect(owner).approve(await wallet.getAddress(), u(1000));
    await wallet.connect(owner).deposit(u(1000));
  });

  it("rechaza MON nativo mandado directo al contrato", async () => {
    await expect(
      owner.sendTransaction({ to: await wallet.getAddress(), value: ethers.parseEther("1") }),
    ).to.be.revertedWith("Este fondo usa USDC, no MON nativo. Llama a deposit().");
  });

  it("el balance del fondo es el balance real de USDC del contrato", async () => {
    expect(await wallet.balance()).to.equal(u(1000));
  });

  it("ejecuta directo un gasto dentro del límite y del cupo diario", async () => {
    const before = await usdc.balanceOf(alice.address);
    await wallet.connect(alice).requestExpense(u(50), "Combustible", false);
    const after = await usdc.balanceOf(alice.address);
    expect(after - before).to.equal(u(50));
  });

  it("un gasto que supera el límite queda pendiente, no se auto-ejecuta", async () => {
    await wallet.connect(alice).requestExpense(u(200), "Compra grande", false);
    const tx = await wallet.getTransaction(0);
    expect(tx.executed).to.equal(false);
  });

  it("exige aprobación después de agotar las transferencias diarias", async () => {
    await wallet.connect(alice).requestExpense(u(10), "Gasto 1", false);
    await wallet.connect(alice).requestExpense(u(10), "Gasto 2", false);
    await wallet.connect(alice).requestExpense(u(10), "Gasto 3 (debería quedar pendiente)", false);
    const tx = await wallet.getTransaction(2);
    expect(tx.executed).to.equal(false);
  });

  it("ejecuta una solicitud pendiente recién al llegar a mayoría de votos", async () => {
    await wallet.connect(alice).requestExpense(u(200), "Compra grande", false);
    await wallet.connect(bob).vote(0, true); // 1 de 2 votos, no alcanza
    let tx = await wallet.getTransaction(0);
    expect(tx.executed).to.equal(false);
    await wallet.connect(carol).vote(0, true); // 2 de 2, se ejecuta sola
    tx = await wallet.getTransaction(0);
    expect(tx.executed).to.equal(true);
    expect(await usdc.balanceOf(alice.address)).to.equal(u(200));
  });

  it("rechaza la solicitud si la mayoría vota en contra", async () => {
    await wallet.connect(alice).requestExpense(u(200), "Compra grande", false);
    await wallet.connect(bob).vote(0, false);
    await wallet.connect(carol).vote(0, false);
    const tx = await wallet.getTransaction(0);
    expect(tx.rejected).to.equal(true);
    expect(tx.executed).to.equal(false);
  });

  it("no deja votar dos veces ni votar la propia solicitud", async () => {
    await wallet.connect(alice).requestExpense(u(200), "Compra grande", false);
    await expect(wallet.connect(alice).vote(0, true)).to.be.revertedWith("El que pide no vota");
    await wallet.connect(bob).vote(0, true);
    await expect(wallet.connect(bob).vote(0, true)).to.be.revertedWith("Ya voto");
  });

  it("permite sumarse con join() sin que un miembro existente lo invite a mano", async () => {
    const [, , , , , dave] = await ethers.getSigners();
    await wallet.connect(dave).join();
    expect(await wallet.memberCount()).to.equal(4);
  });

  it("ejecuta un gasto 'gasless' vía requestExpenseFor con la firma EIP-712 de Alice, pagado por el relayer", async () => {
    const contractAddress = await wallet.getAddress();
    const domain = { name: "SharedWallet", version: "1", chainId: (await ethers.provider.getNetwork()).chainId, verifyingContract: contractAddress };
    const types = {
      RequestExpense: [
        { name: "user", type: "address" },
        { name: "amount", type: "uint256" },
        { name: "desc", type: "string" },
        { name: "forceApproval", type: "bool" },
        { name: "nonce", type: "uint256" },
      ],
    };
    const nonce = await wallet.nonces(alice.address);
    const value = { user: alice.address, amount: u(30), desc: "Cena (gasless)", forceApproval: false, nonce };
    const signature = await alice.signTypedData(domain, types, value);

    // La transacción la manda y paga el RELAYER, no Alice.
    await wallet.connect(relayer).requestExpenseFor(alice.address, value.amount, value.desc, false, nonce, signature);

    const tx = await wallet.getTransaction(0);
    expect(tx.proposer).to.equal(alice.address);
    expect(tx.executed).to.equal(true);
    expect(await usdc.balanceOf(alice.address)).to.equal(u(30));
  });

  it("rechaza requestExpenseFor si la llama alguien que no es el relayer", async () => {
    await expect(
      wallet.connect(bob).requestExpenseFor(alice.address, u(10), "x", false, 0, "0x"),
    ).to.be.revertedWith("Solo el relayer del backend puede llamar esto");
  });
});
