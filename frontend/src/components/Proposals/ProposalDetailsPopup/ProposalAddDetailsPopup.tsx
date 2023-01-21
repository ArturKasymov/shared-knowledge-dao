import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import ProposalDetailsPopupTemplate from 'components/ProposalDetailsPopupTemplate';
import { TextArea } from 'components/Widgets';

const Wrapper = styled.div`
  width: 100%;
  align-self: center;
  box-sizing: border-box;

  p {
    width: 100%;
    margin: 0;
    padding: 4px 0;
    text-align: center;
    font-weight: 600;
    font-size: 18px;
    background-color: ${({ theme }) => theme.colors.gray.medium};
    color: black;
  }
`;

interface ProposalAddDetailsPopupProps {
  id: number;
  item: string;
  votes: number;
  canVote: boolean;
  canExecute: boolean;
  onPopupClose: () => void;
  onVote: (id: number) => void;
  onExecute: (id: number) => void;
}

const ProposalAddDetailsPopup = ({
  id,
  item,
  votes,
  canVote,
  canExecute,
  onPopupClose,
  onVote,
  onExecute,
}: ProposalAddDetailsPopupProps): JSX.Element => (
  <ProposalDetailsPopupTemplate
    id={id}
    votes={votes}
    canVote={canVote}
    canExecute={canExecute}
    onPopupClose={onPopupClose}
    onVote={onVote}
    onExecute={onExecute}
  >
    <Wrapper>
      <p>ADD</p>
      <TextArea value={item} disabled />
    </Wrapper>
  </ProposalDetailsPopupTemplate>
);
export default ProposalAddDetailsPopup;
