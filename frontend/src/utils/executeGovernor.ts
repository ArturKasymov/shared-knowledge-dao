import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { EventRecord, ExtrinsicStatus } from '@polkadot/types/interfaces';

import { displayErrorToast, displaySuccessToast } from 'components/NotificationToast';

import { InjectedAccountWithMeta } from 'redux/slices/walletAccountsSlice';
import { ErrorToastMessages, SuccessToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';
import { getInjector } from 'utils/common';
import {
  isGovernorEvent,
  decodeGovernorEvent,
  ProposalExecutedEvent,
} from 'utils/decodeGovernorEvent';

import governorMetadata from '../metadata/governor_metadata.json';
import addresses from '../metadata/addresses.json';

const handleProposalExecutedEvent = (
  events: EventRecord[],
  status: ExtrinsicStatus,
  api: ApiPromise
) => {
  const proposalExecutedEvent = events
    .filter(({ event }) => api.events.contracts.ContractEmitted.is(event) && isGovernorEvent(event))
    .map(({ event }) => decodeGovernorEvent(event))
    .find((event) => event instanceof ProposalExecutedEvent) as ProposalExecutedEvent;
  // TODO: handle GovernorErrors

  if (status.type === 'InBlock' && proposalExecutedEvent) {
    console.log(proposalExecutedEvent);
    displaySuccessToast(SuccessToastMessages.PROPOSAL_EXECUTED);
  } else if (events.some(({ event: { method } }) => method === 'ExtrinsicFailed')) {
    displayErrorToast(`${ErrorToastMessages.CUSTOM} ExtrinsicFailed.`);
  }
};

export const executeProposal = async (
  id: number,
  loggedUser: InjectedAccountWithMeta,
  api: ApiPromise
): Promise<void> => {
  const contract = new ContractPromise(api, governorMetadata, addresses.governor_address);
  const injector = await getInjector(loggedUser);
  if (!injector) {
    return;
  }

  await contract.tx
    .execute(
      {
        gasLimit: GAS_LIMIT_VALUE,
      },
      id
    )
    .signAndSend(loggedUser.address, { signer: injector.signer }, ({ events = [], status }) =>
      handleProposalExecutedEvent(events, status, api)
    )
    .catch((error) => {
      displayErrorToast(`${ErrorToastMessages.CUSTOM} ${error}.`);
    });
};
