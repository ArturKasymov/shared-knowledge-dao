import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';

import { displayErrorToast } from 'components/NotificationToast';

import { ErrorToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';

import databaseMetadata from '../metadata/database_metadata.json';
import addresses from '../metadata/addresses.json';

export const getDatabaseItemsIds = async (api: ApiPromise): Promise<number[] | null> => {
  const contract = new ContractPromise(api, databaseMetadata, addresses.database_address);
  const { result, output } = await contract.query.getItemsCount(contract.address, {
    gasLimit: GAS_LIMIT_VALUE,
  });

  if (result.isOk && output) {
    const itemsCount = output.toPrimitive() as number;

    const ids: number[] = new Array(itemsCount);
    for (let i = 0; i < itemsCount; i += 1) {
      ids[i] = i;
    }
    return ids; // [0, 1, 2, ..., itemsCount - 1]
  }

  if (result.isErr) {
    displayErrorToast(ErrorToastMessages.ERROR_FETCHING_DATA);
  }
  return null;
};
