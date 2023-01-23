import React from 'react';
import styled from 'styled-components';

import { TextArea } from 'components/Widgets';
import ProposalDetailsPopupTemplate from 'components/ProposalDetailsPopupTemplate';

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

  div.with-arrow {
    border-top: 1px dashed white;
    height: max-content;

    &::before {
      content: '';
      position: absolute;
      width: 0;
      height: 0;
      left: 50%;
      z-index: 1;
      align-items: center;
      border-style: solid;
      border-width: 18px 9px 0 9px;
      border-color: ${({ theme }) => theme.colors.gray.medium} transparent transparent transparent;
      transform: translate(-8px, -50%);
    }
  }
`;

interface ProposalModifyDetailsPopupProps {
  id: number;
  itemId: number;
  currentItem: string;
  proposedItem: string;
  description: string;
  votes: number;
  voteDeadline: Date;
  canVote: boolean;
  canExecute: boolean;
  onPopupClose: () => void;
  onVote: (id: number, isFor: boolean) => void;
  onExecute: (id: number) => void;
}

const ProposalModifyDetailsPopup = ({
  id,
  itemId,
  currentItem,
  proposedItem,
  description,
  votes,
  voteDeadline,
  canVote,
  canExecute,
  onPopupClose,
  onVote,
  onExecute,
}: ProposalModifyDetailsPopupProps): JSX.Element => (
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
      <p>MODIFY {itemId}</p>
      <TextArea value={currentItem} disabled />
      <div className="with-arrow">
        <TextArea value={proposedItem} disabled />
      </div>
      <hr />
      <TextArea value={`Description: ${description}`} disabled />
    </Wrapper>
  </ProposalDetailsPopupTemplate>
);
export default ProposalModifyDetailsPopup;
