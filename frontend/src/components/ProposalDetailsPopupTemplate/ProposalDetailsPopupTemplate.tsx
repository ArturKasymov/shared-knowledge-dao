import React from 'react';

import PopupTemplate from 'components/PopupTemplate';
import { Button, Label } from 'components/Widgets';

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
}: ProposalDetailsPopupTemplateProps): JSX.Element => (
  <PopupTemplate
    leftBottom={
      <>
        <Label>
          <span>ID:</span> {id}
        </Label>
        <Label>
          <span>VOTED:</span> {votes}%
        </Label>
      </>
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
          onClick={() => onVote(id)}
        >
          Vote
        </Button>
      </>
    }
    onPopupClose={onPopupClose}
  >
    {children}
  </PopupTemplate>
);

export default ProposalDetailsPopupTemplate;
