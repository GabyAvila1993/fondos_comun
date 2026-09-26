export interface Group {
  id: string;
  name: string;
  contractAddress: string;
  creditLimit: string;
  dailyLimit: number;
  majorityNeeded?: number;
  balance?: string;
  transactions?: Tx[];
  pending?: Tx[];
}

export interface Tx {
  id: number;
  proposer: string;
  amount: string;
  desc: string;
  executed: boolean;
  rejected: boolean;
  votesFor: number;
  votesAgainst: number;
  createdAt: number;
}
