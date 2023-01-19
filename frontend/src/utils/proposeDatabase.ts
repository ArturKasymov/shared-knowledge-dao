import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import type { EventRecord, ExtrinsicStatus } from '@polkadot/types/interfaces';
import { web3FromSource } from '@polkadot/extension-dapp';
import { InjectedExtension } from '@polkadot/extension-inject/types';

import { displayErrorToast, displaySuccessToast } from 'components/NotificationToast';

import { InjectedAccountWithMeta } from 'redux/slices/walletAccountsSlice';
import { ErrorToastMessages, SuccessToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';
import {
  isGovernorEvent,
  decodeGovernorEvent,
  ProposalAddedEvent,
} from 'utils/decodeGovernorEvent';

import governorMetadata from '../metadata/governor_metadata.json';
import addresses from '../metadata/addresses.json';
import { sleep } from './sleep';

const getInjector = async (
  loggedUser: InjectedAccountWithMeta
): Promise<InjectedExtension | null> => {
  if (!loggedUser.meta.source) {
    displayErrorToast(ErrorToastMessages.NO_WALLET);
    return null;
  }

  return web3FromSource(loggedUser.meta.source);
};

const handleProposalAddedEvent = (
  events: EventRecord[],
  status: ExtrinsicStatus,
  api: ApiPromise
) => {
  const proposalAddedEvent = events
    .filter(({ event }) => api.events.contracts.ContractEmitted.is(event) && isGovernorEvent(event))
    .map(({ event }) => decodeGovernorEvent(event))
    .find((event) => event instanceof ProposalAddedEvent) as ProposalAddedEvent;
  // TODO: handle GovernorErrors

  if (status.type === 'InBlock' && proposalAddedEvent) {
    console.log(proposalAddedEvent);
    displaySuccessToast(SuccessToastMessages.PROPOSAL_ADDED);
  } else if (events.some(({ event: { method } }) => method === 'ExtrinsicFailed')) {
    displayErrorToast(`${ErrorToastMessages.CUSTOM} ExtrinsicFailed.`);
  }
};

export const proposeAddItem = async (
  text: string,
  loggedUser: InjectedAccountWithMeta,
  api: ApiPromise | null
): Promise<void> => {
  await sleep(500);
  if (api === null) {
    displayErrorToast(ErrorToastMessages.ERROR_API_CONN);
    return;
  }

  const contract = new ContractPromise(api, governorMetadata, addresses.governor_address);
  const injector = await getInjector(loggedUser);
  if (!injector) {
    return;
  }

  await contract.tx
    .proposeAdd(
      {
        gasLimit: GAS_LIMIT_VALUE,
      },
      text,
      "" // description
    )
    .signAndSend(loggedUser.address, { signer: injector.signer }, ({ events = [], status }) =>
      handleProposalAddedEvent(events, status, api)
    )
    .catch((error) => {
      displayErrorToast(`${ErrorToastMessages.CUSTOM} ${error}.`);
    });
};

export const proposeModifyItem = async (
  id: number,
  text: string,
  loggedUser: InjectedAccountWithMeta,
  api: ApiPromise | null
): Promise<void> => {
  await sleep(500);
  if (api === null) {
    displayErrorToast(ErrorToastMessages.ERROR_API_CONN);
    return;
  }

  const contract = new ContractPromise(api, governorMetadata, addresses.governor_address);
  const injector = await getInjector(loggedUser);
  if (!injector) {
    return;
  }

  await contract.tx
    .proposeModify(
      {
        gasLimit: GAS_LIMIT_VALUE,
      },
      id,
      text,
      "" // description
    )
    .signAndSend(loggedUser.address, { signer: injector.signer }, ({ events = [], status }) =>
      handleProposalAddedEvent(events, status, api)
    )
    .catch((error) => {
      displayErrorToast(`${ErrorToastMessages.CUSTOM} ${error}.`);
    });
};
