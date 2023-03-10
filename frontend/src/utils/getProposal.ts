import { ContractPromise } from '@polkadot/api-contract';
import { ApiPromise } from '@polkadot/api';

import { displayErrorToast } from 'components/NotificationToast';

import { InjectedAccountWithMeta } from 'redux/slices/walletAccountsSlice';
import { Proposal } from 'utils/model/proposal';
import type { DistributiveOmit } from 'utils/types';
import { ErrorToastMessages, GAS_LIMIT_VALUE } from 'shared/constants';

import governorMetadata from '../metadata/governor_metadata.json';
import addresses from '../metadata/addresses.json';

type RawProposal = DistributiveOmit<Proposal, 'votes' | 'hasSelfVoted' | 'quorum'>;

const getRawProposal = async (
  id: number,
  contract: ContractPromise
): Promise<RawProposal | null> => {
  const { result, output } = await contract.query.getProposal(
    contract.address,
    {
      gasLimit: GAS_LIMIT_VALUE,
    },
    id
  );

  if (result.isOk && output) {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const response: any = output;
    if (response.isNone) {
      return null;
    }

    const proposal = response.unwrap();
    const executed = proposal.get('executed').valueOf();
    const category = proposal.get('category');
    const voteEnd = proposal.get('voteEnd').toPrimitive() as number;
    const description = proposal.get('description').toString();

    if (category.isDatabase) {
      const dbCategory = category.asDatabase;
      const item = dbCategory.get('item').toString();

      const rProposal = { id, item, description, voteEnd, executed };

      if (dbCategory.kind.isAdd) {
        return { kind: 'itemAdd', ...rProposal };
      }
      if (dbCategory.kind.isModify) {
        const itemId = dbCategory.kind.asModify.toNumber();
        return {
          kind: 'itemModify',
          itemId,
          ...rProposal,
        };
      }
    }

    if (category.isToken) {
      const tkKind = category.asToken;
      const rProposal = { id, description, voteEnd, executed };

      if (tkKind.isMint) {
        const recipient = tkKind.asMint.toString();
        return { kind: 'tokenMint', recipient, ...rProposal };
      }

      if (tkKind.isBurn) {
        const holder = tkKind.asBurn.toString();
        return { kind: 'tokenBurn', holder, ...rProposal };
      }
    }

    return null;
  }

  if (result.isErr) {
    displayErrorToast(ErrorToastMessages.ERROR_FETCHING_DATA);
  }
  return null;
};

const getProposalVotes = async (id: number, contract: ContractPromise): Promise<number> => {
  const { result, output } = await contract.query.getProposalVote(
    contract.address,
    {
      gasLimit: GAS_LIMIT_VALUE,
    },
    id
  );

  if (result.isOk && output) {
    /* eslint-disable  @typescript-eslint/no-explicit-any */
    const response: any = output;
    if (response.isNone) {
      return 0;
    }

    const proposalVote = response.unwrap();
    const votes = proposalVote.get('forVotes').toPrimitive() as number;
    return votes;
  }

  if (result.isErr) {
    displayErrorToast(ErrorToastMessages.ERROR_FETCHING_DATA);
  }
  return 0;
};

const getHasVoted = async (
  id: number,
  address: string | undefined,
  contract: ContractPromise
): Promise<boolean> => {
  if (!address) return false;

  const { result, output } = await contract.query.hasVoted(
    contract.address,
    {
      gasLimit: GAS_LIMIT_VALUE,
    },
    id,
    address
  );

  if (result.isOk && output) {
    return output.toPrimitive() as boolean;
  }

  if (result.isErr) {
    displayErrorToast(ErrorToastMessages.ERROR_FETCHING_DATA);
  }
  return false;
};

const getQuorum = async (contract: ContractPromise): Promise<number> => {
  const { result, output } = await contract.query.getQuorum(contract.address, {
    gasLimit: GAS_LIMIT_VALUE,
  });

  if (result.isOk && output) {
    return output.toPrimitive() as number;
  }

  if (result.isErr) {
    displayErrorToast(ErrorToastMessages.ERROR_FETCHING_DATA);
  }
  return 100;
};

export const getProposal = async (
  id: number,
  loggedUser: InjectedAccountWithMeta | null,
  api: ApiPromise
): Promise<Proposal | null> => {
  const contract = new ContractPromise(api, governorMetadata, addresses.governor_address);

  const [proposal, votes, hasSelfVoted, quorum] = await Promise.all([
    getRawProposal(id, contract),
    getProposalVotes(id, contract),
    getHasVoted(id, loggedUser?.address, contract),
    getQuorum(contract),
  ]);

  if (!proposal) return null;

  return { ...proposal, votes, hasSelfVoted, quorum };
};
