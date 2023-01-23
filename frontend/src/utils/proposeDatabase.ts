import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';

import { displayErrorToast } from 'components/NotificationToast';

import { InjectedAccountWithMeta } from 'redux/slices/walletAccountsSlice';
import { ErrorToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';
import { getInjector } from 'utils/common';
import { handleProposalAddedEvent } from 'utils/handleEvent';

import governorMetadata from '../metadata/governor_metadata.json';
import addresses from '../metadata/addresses.json';

export const proposeAddItem = async (
  text: string,
  description: string,
  loggedUser: InjectedAccountWithMeta,
  api: ApiPromise,
  transferValue?: number,
  onSuccess?: (proposalId: number) => void
): Promise<void> => {
  const contract = new ContractPromise(api, governorMetadata, addresses.governor_address);
  const injector = await getInjector(loggedUser);
  if (!injector) {
    return;
  }

  const isHolder = transferValue === undefined;

  const tx = isHolder
    ? contract.tx.proposeAddGovernor(
        {
          gasLimit: GAS_LIMIT_VALUE,
        },
        text,
        description
      )
    : contract.tx.proposeAddExternal(
        {
          gasLimit: GAS_LIMIT_VALUE,
          value: transferValue!,
        },
        text,
        description
      );

  await tx
    .signAndSend(loggedUser.address, { signer: injector.signer }, ({ events = [], status }) => {
      const proposalId = handleProposalAddedEvent(events, status, api);
      if (proposalId !== null) {
        onSuccess?.(proposalId);
      }
    })
    .catch((error) => {
      displayErrorToast(`${ErrorToastMessages.CUSTOM} ${error}.`);
    });
};

export const proposeModifyItem = async (
  id: number,
  text: string,
  description: string,
  loggedUser: InjectedAccountWithMeta,
  api: ApiPromise,
  transferValue?: number,
  onSuccess?: (proposalId: number) => void
): Promise<void> => {
  const contract = new ContractPromise(api, governorMetadata, addresses.governor_address);
  const injector = await getInjector(loggedUser);
  if (!injector) {
    return;
  }

  const isHolder = transferValue === undefined;

  const tx = isHolder
    ? contract.tx.proposeModifyGovernor(
        {
          gasLimit: GAS_LIMIT_VALUE,
        },
        id,
        text,
        description
      )
    : contract.tx.proposeModifyExternal(
        {
          gasLimit: GAS_LIMIT_VALUE,
          value: transferValue!,
        },
        id,
        text,
        description
      );

  await tx
    .signAndSend(loggedUser.address, { signer: injector.signer }, ({ events = [], status }) => {
      const proposalId = handleProposalAddedEvent(events, status, api);
      if (proposalId !== null) {
        onSuccess?.(proposalId);
      }
    })
    .catch((error) => {
      displayErrorToast(`${ErrorToastMessages.CUSTOM} ${error}.`);
    });
};
