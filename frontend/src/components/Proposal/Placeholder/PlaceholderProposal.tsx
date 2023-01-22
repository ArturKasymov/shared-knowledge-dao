import React from 'react';
import styled from 'styled-components';

import ProposalTemplate from '../Common';

const ProposalContent = styled.div`
  flex-grow: 1;
  align-self: stretch;
  margin: 0;
  overflow: hidden;
  white-space: nowrap;
  cursor: pointer;
  background-color: ${({ theme }) => theme.colors.primaryLighter};
  display: flex;
  align-items: center;
  justify-content: center;

  h3 {
    font-weight: 500;
    color: ${({ theme }) => theme.colors.night[100]};
    text-overflow: ellipsis;
  }
`;

interface PlaceholderProposalProps {
  action: string;
  onClick: () => void;
}

const PlaceholderProposal = ({ action, onClick }: PlaceholderProposalProps): JSX.Element => (
  <ProposalTemplate action={action} isActive>
    <ProposalContent role="presentation" onClick={onClick}>
      <h3>+PROPOSE</h3>
    </ProposalContent>
  </ProposalTemplate>
);

const MemoizedPlaceholderProposal = React.memo(PlaceholderProposal);

export default MemoizedPlaceholderProposal;
