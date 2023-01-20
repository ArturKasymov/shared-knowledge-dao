import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { EventRecord, ExtrinsicStatus } from '@polkadot/types/interfaces';

import { displayErrorToast, displaySuccessToast } from 'components/NotificationToast';

import { InjectedAccountWithMeta } from 'redux/slices/walletAccountsSlice';
import { ErrorToastMessages, SuccessToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';
import { getInjector } from 'utils/common';
import { isGovernorEvent, decodeGovernorEvent, VoteCastedEvent } from 'utils/decodeGovernorEvent';

import governorMetadata from '../metadata/governor_metadata.json';
import addresses from '../metadata/addresses.json';

const handleVoteCastedEvent = (events: EventRecord[], status: ExtrinsicStatus, api: ApiPromise) => {
  const voteCastedEvent = events
    .filter(({ event }) => api.events.contracts.ContractEmitted.is(event) && isGovernorEvent(event))
    .map(({ event }) => decodeGovernorEvent(event))
    .find((event) => event instanceof VoteCastedEvent) as VoteCastedEvent;
  // TODO: handle GovernorErrors

  if (status.type === 'InBlock' && voteCastedEvent) {
    console.log(voteCastedEvent);
    displaySuccessToast(SuccessToastMessages.VOTE_CASTED);
  } else if (events.some(({ event: { method } }) => method === 'ExtrinsicFailed')) {
    displayErrorToast(`${ErrorToastMessages.CUSTOM} ExtrinsicFailed.`);
  }
};

export const voteForProposal = async (
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
    .vote(
      {
        gasLimit: GAS_LIMIT_VALUE,
      },
      id
    )
    .signAndSend(loggedUser.address, { signer: injector.signer }, ({ events = [], status }) =>
      handleVoteCastedEvent(events, status, api)
    )
    .catch((error) => {
      displayErrorToast(`${ErrorToastMessages.CUSTOM} ${error}.`);
    });
};
