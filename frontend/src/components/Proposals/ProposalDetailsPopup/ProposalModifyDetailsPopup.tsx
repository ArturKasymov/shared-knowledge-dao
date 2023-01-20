import React, { useRef, useState } from 'react';
import styled from 'styled-components';

import ProposalDetailsPopupTemplate from './ProposalDetailsPopupTemplate';

const Wrapper = styled.div`
  width: 100%;
  align-self: center;
  box-sizing: border-box;

  p {
    width: 100%;
    text-align: center;
    font-weight: 600;
    font-size: 18px;
    background-color: ${({ theme }) => theme.colors.gray.medium};
    color: black;
  }

  textarea {
    width: 100%;
    height: 150px;
    box-sizing: border-box;
    border: transparent;
    font-weight: 500;
    font-size: 16px;
    padding: 12px 20px;
    resize: none;

    &:disabled {
      background-color: ${({ theme }) => theme.colors.background};
      color: white;
    }
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
  votes: number;
  canVote: boolean;
  canExecute: boolean;
  onPopupClose: () => void;
  onVote: (id: number) => void;
  onExecute: (id: number) => void;
}

const ProposalModifyDetailsPopup = ({
  id,
  itemId,
  currentItem,
  proposedItem,
  votes,
  canVote,
  canExecute,
  onPopupClose,
  onVote,
  onExecute,
}: ProposalModifyDetailsPopupProps): JSX.Element => (
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
      <p>MODIFY {itemId}</p>
      <textarea value={currentItem} disabled />
      <div className="with-arrow">
        <textarea value={proposedItem} disabled />
      </div>
    </Wrapper>
  </ProposalDetailsPopupTemplate>
);
export default ProposalModifyDetailsPopup;
