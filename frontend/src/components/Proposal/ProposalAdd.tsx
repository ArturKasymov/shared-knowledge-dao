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

interface ProposalAddProps {
  id: number;
  item: string;
  isExecuted: boolean;
  displayDetails: (id: number) => void;
}

const ProposalAdd = ({ id, item, isExecuted, displayDetails }: ProposalAddProps): JSX.Element => (
  <ProposalTemplate action="A" isExecuted={isExecuted}>
    <ProposalContent role="presentation" onClick={() => displayDetails(id)}>
      {item}
    </ProposalContent>
  </ProposalTemplate>
);

const MemoizedProposalAdd = ProposalAdd; // React.memo(ProposalAdd);

export default MemoizedProposalAdd;
