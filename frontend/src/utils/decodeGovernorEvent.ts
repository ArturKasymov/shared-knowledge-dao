import { Abi } from '@polkadot/api-contract';
import { GenericEvent as Event } from '@polkadot/types';

import { hexToU8a } from 'utils/decode';

import governorMetadata from '../metadata/governor_metadata.json';
import addresses from '../metadata/addresses.json';

const governorAbi = new Abi(governorMetadata);

export interface GovernorEvent {
  proposalId: number;
}

export class ProposalAddedEvent implements GovernorEvent {
  constructor(public proposalId: number) {}
}

export const isGovernorEvent = (event: Event): boolean => {
  const accountId = event.data[0];
  return accountId.eq(addresses.governor_address);
};

export const decodeGovernorEvent = (event: Event): GovernorEvent => {
  const eventHex = event.data[1].toHex();
  const bytes = hexToU8a(eventHex);
  const decoded = governorAbi.decodeEvent(bytes);
  const proposalId = decoded.args[0].toPrimitive() as number;
  const eventName = decoded.event.identifier;
  switch (eventName) {
    case 'ProposalAdded':
      return new ProposalAddedEvent(proposalId);
    default:
      throw new Error('impossible');
  }
};
