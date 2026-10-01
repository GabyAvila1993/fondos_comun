export interface Group {
  id: string;
  name: string;
  editedName?: string;
  contractAddress: string;
  creditLimit: string;
  dailyLimit: number;
  majorityNeeded?: number;
  balance?: string;
  transactions?: Tx[];
  pending?: Tx[];
  limitProposals?: LimitProposal[];
  pendingLimitProposals?: LimitProposal[];
  members?: string[];
  deposits?: Deposit[];
  creatorUserId?: string;
  isCreator?: boolean;
  blockchainDataLoaded?: boolean;
}

export interface Deposit {
  id: string;
  userId: string;
  groupId: string;
  amount: number;
  createdAt: string;
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

export interface UserStats {
  totalDeposited: string;
  groupsCount: number;
}

export interface LimitProposal {
  id: number;
  proposer: string;
  newLimit: string;
  executed: boolean;
  rejected: boolean;
  votesFor: number;
  votesAgainst: number;
  createdAt: number;
}
