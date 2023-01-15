import { Abi } from '@polkadot/api-contract';
import { GenericEvent as Event } from '@polkadot/types';

import { hexToU8a } from 'utils/decode';

import databaseMetadata from '../metadata/database_metadata.json';
import addresses from '../metadata/addresses.json';

const databaseAbi = new Abi(databaseMetadata);

export interface DatabaseEvent {
  id: number;
}

export class ItemAddedEvent implements DatabaseEvent {
  constructor(public id: number) {}
}
export class ItemModifiedEvent implements DatabaseEvent {
  constructor(public id: number) {}
}

export const isDatabaseEvent = (event: Event): boolean => {
  const accountId = event.data[0];
  return accountId.eq(addresses.database_address);
};

export const decodeDatabaseEvent = (event: Event): DatabaseEvent => {
  const eventHex = event.data[1].toHex();
  const bytes = hexToU8a(eventHex);
  const decoded = databaseAbi.decodeEvent(bytes);
  const itemId = decoded.args[0].toPrimitive() as number;
  const eventName = decoded.event.identifier;
  switch (eventName) {
    case 'ItemAdded':
      return new ItemAddedEvent(itemId);
    case 'ItemModified':
      return new ItemModifiedEvent(itemId);
    default:
        throw new Error('impossible');
  }
};
