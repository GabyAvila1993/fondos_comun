import { ethers } from "ethers";
import { ENV } from "../env";

/**
 * Estos tipos tienen que calzar EXACTO (nombres, orden, tipos) con los
 * TYPEHASH del contrato SharedWallet.sol. Si algún día cambiás el contrato,
 * este archivo es el primero que hay que actualizar.
 */
export function domainFor(contractAddress: string) {
  return {
    name: "SharedWallet",
    version: "1",
    chainId: ENV.CHAIN_ID,
    verifyingContract: contractAddress,
  };
}

export const TYPES = {
  RequestExpense: [
    { name: "user", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "desc", type: "string" },
    { name: "forceApproval", type: "bool" },
    { name: "nonce", type: "uint256" },
  ],
  Vote: [
    { name: "voter", type: "address" },
    { name: "txId", type: "uint256" },
    { name: "approve", type: "bool" },
    { name: "nonce", type: "uint256" },
  ],
  Join: [
    { name: "user", type: "address" },
    { name: "nonce", type: "uint256" },
  ],
  ProposeLimit: [
    { name: "proposer", type: "address" },
    { name: "newLimit", type: "uint256" },
    { name: "nonce", type: "uint256" },
  ],
  VoteLimit: [
    { name: "voter", type: "address" },
    { name: "id", type: "uint256" },
    { name: "approve", type: "bool" },
    { name: "nonce", type: "uint256" },
  ],
};

/**
 * 'signTypedData' arreglado para la versión actual de Privy y Ethers v6.
 * Extraemos el proveedor estándar (EIP-1193) de la billetera embebida y
 * usamos un BrowserProvider de ethers para hacer la firma gratis.
 */
export async function signTyped(
  wallet: { getEthereumProvider: () => Promise<any> },
  primaryType: "RequestExpense" | "Vote" | "Join" | "ProposeLimit" | "VoteLimit",
  contractAddress: string,
  message: Record<string, any>,
) {
  // 1. Obtener el proveedor subyacente de Privy
  const ethereumProvider = await wallet.getEthereumProvider();
  
  // 2. Envolverlo con ethers para poder interactuar
  const provider = new ethers.BrowserProvider(ethereumProvider);
  
  // 3. Obtener el "Signer" (el usuario que va a firmar)
  const signer = await provider.getSigner();
  
  // 4. Firmar la data estructurada
  return signer.signTypedData(
    domainFor(contractAddress),
    { [primaryType]: TYPES[primaryType] },
    message
  );
}

export const toWei = (amount: string) => ethers.parseUnits(amount, 6).toString(); // USDC = 6 decimales