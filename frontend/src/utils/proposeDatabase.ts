import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';

import { displayErrorToast, displaySuccessToast } from 'components/NotificationToast';

import { InjectedAccountWithMeta } from 'redux/slices/walletAccountsSlice';
import { ErrorToastMessages, SuccessToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';
import { getInjector } from 'utils/common';
import { handleProposalAddedEvent } from 'utils/handleEvent';

import governorMetadata from '../metadata/governor_metadata.json';
import addresses from '../metadata/addresses.json';

export const proposeAddItem = async (
  text: string,
  loggedUser: InjectedAccountWithMeta,
  api: ApiPromise
): Promise<void> => {
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
      '' // description
    )
    .signAndSend(loggedUser.address, { signer: injector.signer }, ({ events = [], status }) => {
      handleProposalAddedEvent(events, status, api);
    })
    .catch((error) => {
      displayErrorToast(`${ErrorToastMessages.CUSTOM} ${error}.`);
    });
};

export const proposeModifyItem = async (
  id: number,
  text: string,
  loggedUser: InjectedAccountWithMeta,
  api: ApiPromise
): Promise<void> => {
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
      '' // description
    )
    .signAndSend(loggedUser.address, { signer: injector.signer }, ({ events = [], status }) => {
      handleProposalAddedEvent(events, status, api);
    })
    .catch((error) => {
      displayErrorToast(`${ErrorToastMessages.CUSTOM} ${error}.`);
    });
};
