import React from 'react';
import styled from 'styled-components';

import ProposalTemplate from './Common';

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

interface ProposalTokenProps {
  id: number;
  action: 'Mint' | 'Burn';
  recipientAddress: string;
  isExecuted: boolean;
  displayDetails: (id: number) => void;
}

const ProposalToken = ({
  id,
  action,
  recipientAddress,
  isExecuted,
  displayDetails,
}: ProposalTokenProps): JSX.Element => (
  <ProposalTemplate action={action.substring(0, 1)} isExecuted={isExecuted}>
    <ProposalContent role="presentation" onClick={() => displayDetails(id)}>
      {recipientAddress}
    </ProposalContent>
  </ProposalTemplate>
);

const MemoizedProposalToken = ProposalToken; // React.memo(ProposalToken);

export default MemoizedProposalToken;
