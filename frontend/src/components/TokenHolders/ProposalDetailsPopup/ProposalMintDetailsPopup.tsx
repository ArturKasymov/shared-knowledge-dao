import React from 'react';
import styled from 'styled-components';

import ProposalDetailsPopupTemplate from 'components/ProposalDetailsPopupTemplate';
import { AddressInput } from 'components/Widgets';

const Wrapper = styled.div`
  width: 480px;
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

interface ProposalMintDetailsPopupProps {
  id: number;
  accountAddress: string;
  votes: number;
  canVote: boolean;
  canExecute: boolean;
  onPopupClose: () => void;
  onVote: (id: number) => void;
  onExecute: (id: number) => void;
}

const ProposalMintDetailsPopup = ({
  id,
  accountAddress,
  votes,
  canVote,
  canExecute,
  onPopupClose,
  onVote,
  onExecute,
}: ProposalMintDetailsPopupProps): JSX.Element => (
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
      <p>MINT TOKEN</p>
      <AddressInput defaultValue={accountAddress} valid disabled />
    </Wrapper>
  </ProposalDetailsPopupTemplate>
);

export default ProposalMintDetailsPopup;
