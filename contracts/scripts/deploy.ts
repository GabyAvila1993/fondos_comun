import { ethers } from "hardhat";

/**
 * Despliega la Factory UNA sola vez. Le pasa la dirección del relayer
 * (paga el gas de todos) y la dirección del USDC oficial de Monad Testnet
 * (Circle) — así todos los grupos que se creen usan el mismo token estable.
 */
async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Desplegando con la cuenta:", deployer.address);

  const relayerAddress = process.env.RELAYER_ADDRESS || deployer.address;
  // USDC oficial de Circle en Monad Testnet (confirmar la vigente en
  // https://www.circle.com/multi-chain-usdc/monad antes de desplegar).
  const usdcAddress = process.env.MONAD_USDC_ADDRESS || "0x534b2f3A21130d7a60830c2Df862319e593943A3";

  const Factory = await ethers.getContractFactory("SharedWalletFactory");
  const factory = await Factory.deploy(relayerAddress, usdcAddress);
  await factory.waitForDeployment();

  console.log("SharedWalletFactory desplegada en:", await factory.getAddress());
  console.log("Relayer configurado:", relayerAddress);
  console.log("USDC configurado:", usdcAddress);
  console.log("\nPegá esta dirección en:");
  console.log("  - backend/.env -> FACTORY_CONTRACT_ADDRESS");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
