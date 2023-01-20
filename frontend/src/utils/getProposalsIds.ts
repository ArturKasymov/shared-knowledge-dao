import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';

import { displayErrorToast } from 'components/NotificationToast';

import { ErrorToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';

import governorMetadata from '../metadata/governor_metadata.json';
import addresses from '../metadata/addresses.json';

export const getProposalsIds = async (api: ApiPromise): Promise<number[] | null> => {
  const contract = new ContractPromise(api, governorMetadata, addresses.governor_address);
  const { result, output } = await contract.query.getProposalsCount(contract.address, {
    gasLimit: GAS_LIMIT_VALUE,
  });

  if (result.isOk && output) {
    const proposalsCount = output.toPrimitive() as number;

    const ids: number[] = new Array(proposalsCount);
    for (let i = 0; i < proposalsCount; i += 1) {
      ids[i] = i;
    }
    return ids; // [0, 1, 2, ..., proposalsCount - 1]
  }

  if (result.isErr) {
    displayErrorToast(ErrorToastMessages.ERROR_FETCHING_DATA);
  }
  return null;
};
