import { ContractPromise } from '@polkadot/api-contract';
import { ApiPromise } from '@polkadot/api';

import { displayErrorToast } from 'components/NotificationToast';

import { ErrorToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';

import tokenMetadata from '../metadata/token_metadata.json';
import addresses from '../metadata/addresses.json';

export const getTokensBalance = async (account: string, api: ApiPromise): Promise<number> => {
  const contract = new ContractPromise(api, tokenMetadata, addresses.token_address);

  const { result, output } = await contract.query['psp34::balanceOf'](
    contract.address,
    {
      gasLimit: GAS_LIMIT_VALUE,
    },
    account
  );

  if (result.isOk && output) {
    return output.toPrimitive() as number;
  }

  if (result.isErr) {
    displayErrorToast(ErrorToastMessages.ERROR_FETCHING_DATA);
  }

  return 0;
};
