import { ContractPromise } from '@polkadot/api-contract';
import { ApiPromise } from '@polkadot/api';

import { displayErrorToast } from 'components/NotificationToast';

import { ErrorToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';

import governorMetadata from '../metadata/governor_metadata.json';
import addresses from '../metadata/addresses.json';

export const getProposalPrice = async (api: ApiPromise): Promise<number> => {
  const contract = new ContractPromise(api, governorMetadata, addresses.governor_address);

  const { result, output } = await contract.query.getProposalPrice(contract.address, {
    gasLimit: GAS_LIMIT_VALUE,
  });

  if (result.isOk && output) {
    return output.toPrimitive() as number;
  }

  if (result.isErr) {
    displayErrorToast(ErrorToastMessages.ERROR_FETCHING_DATA);
  }

  return 0;
};
