type ProposalKind = 'itemAdd' | 'itemModify' | 'tokenMint' | 'tokenBurn';

interface ProposalBase {
  kind: ProposalKind;
  id: number;
  votes: number;
  hasSelfVoted: boolean;
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

export const newAddProposal = (id: number, item: string): ProposalItemAdd => ({
  kind: 'itemAdd',
  id,
  item,
  votes: 0,
  hasSelfVoted: false,
  executed: false,
  quorum: 100, // FIXME
});

export const newMintProposal = (id: number, recipient: string): ProposalTokenMint => ({
  kind: 'tokenMint',
  id,
  recipient,
  votes: 0,
  hasSelfVoted: false,
  executed: false,
  quorum: 100, // FIXME
});

export const isQuorumReached = (proposal: ProposalBase): boolean =>
  proposal.votes >= proposal.quorum;

export const isDatabaseProposal = (proposal: Proposal): proposal is ProposalDatabase =>
  (proposal as ProposalDatabase).kind.substring(0, 4) === 'item';

export const isTokenProposal = (proposal: Proposal): proposal is ProposalToken =>
  (proposal as ProposalToken).kind.substring(0, 5) === 'token';
