import React from 'react';
import styled from 'styled-components';

import ProposalTemplate from '../Common';

const ProposalContent = styled.h3`
  align-self: center;
  font-weight: 500;
  padding: 20px;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
  cursor: pointer;
  min-height: 60px;
  padding: 10px;
  background-color: ${({ theme }) => theme.colors.night[300]};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

interface PlaceholderProposalProps {
  onClick: () => void;
}

const PlaceholderProposal = ({ onClick }: PlaceholderProposalProps): JSX.Element => (
  <ProposalTemplate action="A" isExecuted={false}>
    <ProposalContent role="presentation" onClick={onClick}>
      +PROPOSE
    </ProposalContent>
  </ProposalTemplate>
);

const MemoizedPlaceholderProposal = React.memo(PlaceholderProposal);

export default MemoizedPlaceholderProposal;
