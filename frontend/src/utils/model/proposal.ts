type ProposalKind = 'itemAdd' | 'itemModify';

interface ProposalBase {
  kind: ProposalKind;
  id: number;
  votes: number;
  hasSelfVoted: boolean;
  executed: boolean;
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
