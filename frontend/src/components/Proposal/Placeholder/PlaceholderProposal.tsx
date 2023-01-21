import React from 'react';
import styled from 'styled-components';

import ProposalTemplate from '../Common';

const ProposalContent = styled.h3`
  align-self: center;
  font-weight: 500;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  height: 100%;
  background-color: ${({ theme }) => theme.colors.primaryLighter};
  color: ${({ theme }) => theme.colors.night[100]};
  display: flex;
  align-items: center;
  justify-content: center;
`;

interface PlaceholderProposalProps {
  action: string;
  onClick: () => void;
}

const PlaceholderProposal = ({ action, onClick }: PlaceholderProposalProps): JSX.Element => (
  <ProposalTemplate action={action} isExecuted={false}>
    <ProposalContent role="presentation" onClick={onClick}>
      +PROPOSE
    </ProposalContent>
  </ProposalTemplate>
);

const MemoizedPlaceholderProposal = React.memo(PlaceholderProposal);

export default MemoizedPlaceholderProposal;
