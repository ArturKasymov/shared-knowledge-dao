import React from 'react';
import styled from 'styled-components';
import Countdown from 'react-countdown';

import PopupTemplate from 'components/PopupTemplate';
import { Button, Label } from 'components/Widgets';

const Wrapper = styled.div`
  display: flex;
  flex-direction: row;
  gap: 16px;
  justify-content: center;
  padding-bottom: 4px;
`;

interface ProposalDetailsPopupTemplateProps {
  children: React.ReactNode;
  id: number;
  votes: number;
  voteDeadline: Date;
  canVote: boolean;
  canExecute: boolean;
  onPopupClose: () => void;
  onVote: (id: number, isFor: boolean) => void;
  onExecute: (id: number) => void;
}

const ProposalDetailsPopupTemplate = ({
  children,
  id,
  votes,
  voteDeadline,
  canVote,
  canExecute,
  onPopupClose,
  onVote,
  onExecute,
}: ProposalDetailsPopupTemplateProps): JSX.Element => (
  <PopupTemplate
    leftBottom={
      <Wrapper>
        <Label>
          <span>ID:</span> {id}
        </Label>
        <Label>
          <span>VOTED:</span> {votes}%
        </Label>
        <Label>
          <Countdown date={voteDeadline}
            renderer={({ minutes, seconds }) => <span>{minutes}:{seconds}</span>} />
        </Label>
      </Wrapper>
    }
    buttons={
      <>
        <Button
          type="button"
          className="secondary-btn"
          disabled={!canExecute}
          onClick={() => onExecute(id)}
        >
          Execute
        </Button>

        <Button
          type="button"
          className="primary-btn"
          disabled={!canVote}
          onClick={() => onVote(id, false)}
        >
          Vote Against
        </Button>
        
        <Button
          type="button"
          className="primary-btn"
          disabled={!canVote}
          onClick={() => onVote(id, true)}
        >
          Vote For
        </Button>
      </>
    }
    onPopupClose={onPopupClose}
  >
    {children}
  </PopupTemplate>
);

export default ProposalDetailsPopupTemplate;
