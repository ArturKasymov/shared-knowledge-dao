import React, { useRef } from 'react';
import styled from 'styled-components';

import { useOutsideClickCallback } from 'utils/useOutsideClickCallback';

const Wrapper = styled.div`
  width: 100vw;
  height: 100vh;
  position: fixed;
  color: ${({ theme }) => theme.colors.white};
  background-color: ${({ theme }) => theme.colors.backgroundDimmed};
  z-index: 3000;

  display: flex;
  justify-content: center;
  align-items: center;

  .proposal-container {
    background-color: ${({ theme }) => theme.colors.background};
    min-width: 400px;
    max-width: 1200px;
    max-height: 400px;
    overflow-wrap: break-word;
    box-shadow: ${({ theme }) => theme.colors.nightShadow};
  }

  .proposal-bottom {
    height: 25px;
    padding: 20px;
    background-color: ${({ theme }) => theme.colors.night[300]};
    display: flex;
    align-items: center;
    justify-content: space-between;

    p {
      height: 100%;
      font-weight: 600;
    }
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  justify-content: flex-end;
  width: max-content;

  > *:not(:last-child) {
    display: block;
    margin-right: 12px;
  }

  button {
    height: 36px;
    width: max-content;
    color: ${({ theme }) => theme.colors.primaryDarker};
    background: ${({ theme }) => theme.colors.button.secondary};
    border-radius: 18px;
    justify-content: center;
    align-items: center;
    padding: 8.5px 16px;
    gap: 8px;
    justify-self: end;
    position: relative;
    transition: background-color 0.4s ease, opacity 0.4s ease;
    will-change: background-color, opacity;
    justify-self: center;

    &:hover:not([disabled]) {
      cursor: pointer;
      background: ${({ theme }) => theme.colors.button.secondaryHover};
    }
  }

  button.execute {
    background: ${({ theme }) => theme.colors.button.cancel};
  }
`;

interface ProposalDetailsPopupTemplateProps {
  children: React.ReactNode;
  id: number;
  votes: number;
  canVote: boolean;
  canExecute: boolean;
  onPopupClose: () => void;
  onVote: (id: number) => void;
  onExecute: (id: number) => void;
}

const ProposalDetailsPopupTemplate = ({
  children,
  id,
  votes,
  canVote,
  canExecute,
  onPopupClose,
  onVote,
  onExecute,
}: ProposalDetailsPopupTemplateProps): JSX.Element => {
  const wrapperRef = useRef(null);
  useOutsideClickCallback(wrapperRef, onPopupClose);

  return (
    <Wrapper id="proposal-popup-bg" role="presentation">
      <div className="proposal-container" role="presentation" ref={wrapperRef}>
        {children}
        <div className="proposal-bottom">
          <p>
            <span>ID:</span> {id}
          </p>
          <p>
            <span>VOTED:</span> {votes}%
          </p>
          <ButtonsContainer>
            <button
              type="button"
              className="execute"
              disabled={!canExecute}
              onClick={() => onExecute(id)}
            >
              Execute
            </button>

            <button type="button" className="vote" disabled={!canVote} onClick={() => onVote(id)}>
              Vote
            </button>
          </ButtonsContainer>
        </div>
      </div>
    </Wrapper>
  );
};

export default ProposalDetailsPopupTemplate;
