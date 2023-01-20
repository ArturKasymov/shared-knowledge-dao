import { InjectedExtension } from '@polkadot/extension-inject/types';
import { web3FromSource } from '@polkadot/extension-dapp';

import { displayErrorToast } from 'components/NotificationToast';

import { InjectedAccountWithMeta } from 'redux/slices/walletAccountsSlice';
import { ErrorToastMessages } from 'shared/constants';

export const getInjector = async (
  loggedUser: InjectedAccountWithMeta
): Promise<InjectedExtension | null> => {
  if (!loggedUser.meta.source) {
    displayErrorToast(ErrorToastMessages.NO_WALLET);
    return null;
  }

  return web3FromSource(loggedUser.meta.source);
};
