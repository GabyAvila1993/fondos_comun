const { ethers } = require("hardhat");

async function main() {
  const [signer] = await ethers.getSigners();
  const usdcAddress = process.env.MONAD_USDC_ADDRESS || "0x00B0efe27230f54f3e2783f0EC9Cac48254EE00f";
  const usdc = await ethers.getContractAt("MockUSDC", usdcAddress);
  
  const amount = ethers.parseUnits("100000", 6);
  console.log("Minting to:", signer.address);
  const tx = await usdc.mint(signer.address, amount);
  await tx.wait();
  console.log("Minted successfully.");
}

main().catch(console.error);
