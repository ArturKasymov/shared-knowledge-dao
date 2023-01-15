import { ContractPromise } from '@polkadot/api-contract';
import { ApiPromise } from '@polkadot/api';

import { displayErrorToast } from 'components/NotificationToast';

import { ErrorToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';

import databaseMetadata from '../metadata/database_metadata.json';
import addresses from '../metadata/addresses.json';
import { sleep } from './sleep';

export type DatabaseItem = {
  id: number;
  text: string;
};

export const getDatabaseItem = async (
  id: number,
  api: ApiPromise | null
): Promise<DatabaseItem | null> => {
  await sleep(500);
  if (api === null) {
    displayErrorToast(ErrorToastMessages.ERROR_API_CONN);
    return null;
  }

  const contract = new ContractPromise(api, databaseMetadata, addresses.database_address);
  const { result, output } = await contract.query.getById(
    contract.address,
    {
      gasLimit: GAS_LIMIT_VALUE,
    },
    id
  );

  if (result.isOk && output) {
    const text = output.toString();
    return { id, text } as DatabaseItem;
  }

  if (result.isErr) {
    displayErrorToast(ErrorToastMessages.ERROR_FETCHING_DATA);
  }
  return null;
};
