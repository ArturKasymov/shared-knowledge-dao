import { ApiPromise } from '@polkadot/api';
import type { EventRecord, ExtrinsicStatus } from '@polkadot/types/interfaces';

import { displayErrorToast, displaySuccessToast } from 'components/NotificationToast';

import { ErrorToastMessages, SuccessToastMessages } from 'shared/constants';
import {
  isGovernorEvent,
  decodeGovernorEvent,
  ProposalAddedEvent,
} from 'utils/decodeGovernorEvent';

export const handleProposalAddedEvent = (
  events: EventRecord[],
  status: ExtrinsicStatus,
  api: ApiPromise
): number | null => {
  const proposalAddedEvent = events
    .filter(({ event }) => api.events.contracts.ContractEmitted.is(event) && isGovernorEvent(event))
    .map(({ event }) => decodeGovernorEvent(event))
    .find((event) => event instanceof ProposalAddedEvent) as ProposalAddedEvent;
  // TODO: handle GovernorErrors

  if (status.type === 'InBlock' && proposalAddedEvent) {
    console.log(proposalAddedEvent.proposalId);
    displaySuccessToast(SuccessToastMessages.PROPOSAL_ADDED);
    return proposalAddedEvent.proposalId;
  }

  if (events.some(({ event: { method } }) => method === 'ExtrinsicFailed')) {
    displayErrorToast(`${ErrorToastMessages.CUSTOM} ExtrinsicFailed.`);
  }
  return null;
};
