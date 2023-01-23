type ProposalKind = 'itemAdd' | 'itemModify' | 'tokenMint' | 'tokenBurn';

type Timestamp = number;

interface ProposalBase {
  kind: ProposalKind;
  id: number;
  description: string;
  votes: number;
  hasSelfVoted: boolean;
  voteEnd: Timestamp;
  executed: boolean;
  quorum: number;
}

export type ProposalItemAdd = ProposalBase & {
  kind: 'itemAdd';
  item: string;
};

export type ProposalItemModify = ProposalBase & {
  kind: 'itemModify';
  itemId: number;
  item: string;
};

export type ProposalTokenMint = ProposalBase & {
  kind: 'tokenMint';
  recipient: string;
};

export type ProposalTokenBurn = ProposalBase & {
  kind: 'tokenBurn';
  holder: string;
};

export type ProposalDatabase = ProposalItemAdd | ProposalItemModify;
export type ProposalToken = ProposalTokenMint | ProposalTokenBurn;

export type Proposal = ProposalDatabase | ProposalToken;

export const newAddProposal = (id: number, item: string, description: string): ProposalItemAdd => ({
  kind: 'itemAdd',
  id,
  item,
  description,
  votes: 0,
  hasSelfVoted: false,
  voteEnd: Date.now() + 60 * 1000, // FIXME
  executed: false,
  quorum: 25, // FIXME
});

export const newMintProposal = (id: number, recipient: string, description: string): ProposalTokenMint => ({
  kind: 'tokenMint',
  id,
  recipient,
  description,
  votes: 0,
  hasSelfVoted: false,
  voteEnd: Date.now() + 60 * 1000, // FIXME
  executed: false,
  quorum: 25, // FIXME
});

export const isQuorumReached = (proposal: ProposalBase): boolean =>
  proposal.votes >= proposal.quorum;

export const isActive = (proposal: ProposalBase): boolean => {
  if (proposal.executed) return false;

  const now = Date.now();
  return now <= proposal.voteEnd || isQuorumReached(proposal);
};

export const isDatabaseProposal = (proposal: Proposal): proposal is ProposalDatabase =>
  (proposal as ProposalDatabase).kind.substring(0, 4) === 'item';

export const isTokenProposal = (proposal: Proposal): proposal is ProposalToken =>
  (proposal as ProposalToken).kind.substring(0, 5) === 'token';
