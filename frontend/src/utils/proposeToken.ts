import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';

import { displayErrorToast } from 'components/NotificationToast';

import { InjectedAccountWithMeta } from 'redux/slices/walletAccountsSlice';
import { ErrorToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';
import { getInjector } from 'utils/common';
import { handleProposalAddedEvent } from 'utils/handleEvent';

import governorMetadata from '../metadata/governor_metadata.json';
import addresses from '../metadata/addresses.json';

export const proposeMint = async (
  recipientAddress: string,
  description: string,
  loggedUser: InjectedAccountWithMeta,
  api: ApiPromise,
  onSuccess?: (proposalId: number) => void
): Promise<void> => {
  const contract = new ContractPromise(api, governorMetadata, addresses.governor_address);
  const injector = await getInjector(loggedUser);
  if (!injector) {
    return;
  }

  await contract.tx
    .proposeMint(
      {
        gasLimit: GAS_LIMIT_VALUE,
      },
      recipientAddress,
      description,
    )
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

export const proposeBurn = async (
  holderAddress: string,
  description: string,
  loggedUser: InjectedAccountWithMeta,
  api: ApiPromise,
  onSuccess?: (proposalId: number) => void
): Promise<void> => {
  const contract = new ContractPromise(api, governorMetadata, addresses.governor_address);
  const injector = await getInjector(loggedUser);
  if (!injector) {
    return;
  }

  await contract.tx
    .proposeBurn(
      {
        gasLimit: GAS_LIMIT_VALUE,
      },
      holderAddress,
      description,
    )
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
