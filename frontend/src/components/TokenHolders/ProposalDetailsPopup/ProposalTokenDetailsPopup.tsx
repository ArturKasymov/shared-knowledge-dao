import React from 'react';
import styled from 'styled-components';

import ProposalDetailsPopupTemplate from 'components/ProposalDetailsPopupTemplate';
import { AddressInput, TextArea } from 'components/Widgets';

const Wrapper = styled.div`
  min-width: 480px;
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
    color: black;i
  }
`;

interface ProposalTokenDetailsPopupProps {
  id: number;
  action: 'Mint' | 'Burn';
  accountAddress: string;
  description: string;
  votes: number;
  voteDeadline: Date;
  canVote: boolean;
  canExecute: boolean;
  onPopupClose: () => void;
  onVote: (id: number, isFor: boolean) => void;
  onExecute: (id: number) => void;
}

const ProposalTokenDetailsPopup = ({
  id,
  action,
  accountAddress,
  description,
  votes,
  voteDeadline,
  canVote,
  canExecute,
  onPopupClose,
  onVote,
  onExecute,
}: ProposalTokenDetailsPopupProps): JSX.Element => (
  <ProposalDetailsPopupTemplate
    id={id}
    votes={votes}
    voteDeadline={voteDeadline}
    canVote={canVote}
    canExecute={canExecute}
    onPopupClose={onPopupClose}
    onVote={onVote}
    onExecute={onExecute}
  >
    <Wrapper>
      <p>{action.toUpperCase()} TOKEN</p>
      <AddressInput defaultValue={accountAddress} valid disabled />
      <hr />
      <TextArea value={`Description: ${description}`} disabled />
    </Wrapper>
  </ProposalDetailsPopupTemplate>
);

export default ProposalTokenDetailsPopup;
