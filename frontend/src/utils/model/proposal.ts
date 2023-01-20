type ProposalKind = 'itemAdd' | 'itemModify';

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

export type Proposal = ProposalItemAdd | ProposalItemModify;

export const isQuorumReached = (proposal: ProposalBase): boolean =>
  proposal.votes >= proposal.quorum;
