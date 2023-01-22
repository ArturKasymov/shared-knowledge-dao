import { ContractPromise } from '@polkadot/api-contract';
import { ApiPromise } from '@polkadot/api';

import { displayErrorToast } from 'components/NotificationToast';

import { ErrorToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';

import tokenMetadata from '../metadata/token_metadata.json';
import addresses from '../metadata/addresses.json';

export const getTokenHolders = async (api: ApiPromise): Promise<string[] | null> => {
  const contract = new ContractPromise(api, tokenMetadata, addresses.token_address);
  const { result, output } = await contract.query.getHolders(contract.address, {
    gasLimit: GAS_LIMIT_VALUE,
  });

  if (result.isOk && output) {
    return output.toHuman() as string[];
  }

  if (result.isErr) {
    displayErrorToast(ErrorToastMessages.ERROR_FETCHING_DATA);
  }
  return null;
};
