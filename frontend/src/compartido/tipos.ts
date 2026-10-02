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
  deleteProposals?: GroupDeleteProposal[];
  members?: string[];
  deposits?: Deposit[];
  creatorUserId?: string;
  isCreator?: boolean;
  blockchainDataLoaded?: boolean;
  usersMap?: Record<string, {name?: string, email?: string, walletAddress?: string}>;
  currentUserId?: string;
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

export interface GroupDeleteProposal {
  id: string;
  groupId: string;
  creatorUserId: string;
  status: "pending" | "approved" | "rejected";
  votes: { userId: string; approve: boolean }[];
  createdAt: string;
}

export interface NotificationHistory {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  groupId?: string;
  read: boolean;
  createdAt: string;
}
