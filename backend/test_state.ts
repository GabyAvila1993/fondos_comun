
import { ethers } from 'ethers';

async function main() {
  const provider = new ethers.JsonRpcProvider('https://testnet-rpc.monad.xyz');
  const abi = require('./src/config/contracts/SharedWallet.abi.json');
  const contract = new ethers.Contract('0xDa2d450736f2aCdcbBDf674Ac97d820EEFb5142E', abi, provider);

  try {
    const [name, creditLimit, dailyLimit, majority, bal, total] = await Promise.all([
        contract.name(),
        contract.creditLimit(),
        contract.dailyLimit(),
        contract.majorityNeeded(),
        contract.balance(),
        contract.transactionCount(),
    ]);
    console.log('Promise.all succeeded:', {name, creditLimit, dailyLimit, majority, bal, total});
  } catch(e: any) {
    console.error('Promise.all failed:', e.message);
  }

  try {
      const tx = await contract.getTransaction(0);
      console.log('getTransaction(0):', tx);
  } catch(e: any) {
      console.error('getTransaction(0) failed:', e.message);
  }

  try {
      const c = await contract.limitProposalCount();
      console.log('limitProposalCount:', c);
  } catch(e: any) {
      console.error('limitProposalCount failed:', e.message);
  }
}
main();
