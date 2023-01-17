import React, { useEffect, useState } from 'react';
import styled from 'styled-components';
import { ApiPromise } from '@polkadot/api';
import type { EventRecord } from '@polkadot/types/interfaces';
import { useDispatch, useSelector } from 'react-redux';

import HeroHeading from 'components/HeroHeading';
import Layout from 'components/Layout';
import DatabaseItem from 'components/DatabaseItem';

import { RootState } from 'redux/store';
import { setAllDatabaseItems } from 'redux/slices/databaseItemsSlice';
import { queries } from 'shared/layout';
import { getDatabaseItemsIds } from 'utils/getDatabaseItemsIds';
import { getDatabaseItem, DatabaseItem as DatabaseItemModel } from 'utils/getDatabaseItem';
import {
  isDatabaseEvent,
  decodeDatabaseEvent,
  ItemAddedEvent,
  ItemModifiedEvent,
} from 'utils/decodeDatabaseEvent';

import DatabaseItemDetailsPopup from './DatabaseItemDetailsPopup';

const Wrapper = styled.div`
  color: ${({ theme }) => theme.colors.white};
`;

const DatabaseContainer = styled.div`
  width: 100%;
  max-height: 520px;
  display: flex;
  flex-direction: column;
  gap: 40px;
  align-items: center;
  z-index: 10;

  ${queries.tablet} {
  }
`;

interface DatabaseProps {
  api: ApiPromise | null;
}

const Database = ({ api }: DatabaseProps): JSX.Element => {
  const [databaseItems, setDatabaseItems] = useState<DatabaseItemModel[]>([]);
  const dispatch = useDispatch();
  const testDatabaseItems = useSelector((state: RootState) => state.databaseItems.databaseItems);
  const [databaseItemDetailsDisplay, setDatabaseItemDetailsDisplay] =
    useState<DatabaseItemModel | null>(null);

  useEffect(() => {
    const allDatabaseItems: DatabaseItemModel[] = [];

    const getAllDatabaseItemsIds = async () => {
      const itemsIds = await getDatabaseItemsIds(api);
      return itemsIds;
    };

    const getDatabaseItemById = async (id: number) => {
      const item = await getDatabaseItem(id, api);
      return item;
    };

    getAllDatabaseItemsIds().then((ids) => {
      ids?.forEach((id) => {
        getDatabaseItemById(id).then((databaseItem) => {
          if (databaseItem) {
            allDatabaseItems.push(databaseItem);
          }
        });
      });
    });
    setDatabaseItems(allDatabaseItems);
  }, [api, dispatch]);

  useEffect(() => {
    dispatch(setAllDatabaseItems(databaseItems));
  }, [databaseItems, databaseItems.length, dispatch]);

  api?.query.system.events(async (events: EventRecord[]) => {
    console.log(`Num events = ${events.length}`);
    events.forEach(async ({ event, phase }) => {
      if (api?.events.contracts.ContractEmitted.is(event)) {
        if (isDatabaseEvent(event)) {
          const decodedEvent = decodeDatabaseEvent(event);
          switch (decodedEvent.constructor) {
            case ItemAddedEvent: {
              console.log(decodedEvent);
              const newItem = await getDatabaseItem(decodedEvent.id, api);
              if (newItem) {
                // FIXME: for some reason, each event gets reported 20 times
                // we need to either store already handled IDs in a map,
                // or find out what's wrong
                // databaseItems.push(newItem);
                // setDatabaseItems(databaseItems);
              }
              break;
            }
            case ItemModifiedEvent:
              console.log(decodedEvent);
              break;
            default:
              break;
          }
        }
      }
    });
  });

  const displayFullDatabaseItem = (id: number) => {
    const itemToBeDisplayed = databaseItems.find((item) => item.id === id);
    if (!itemToBeDisplayed) return;
    setDatabaseItemDetailsDisplay(itemToBeDisplayed);
  };

  return (
    <>
      {databaseItemDetailsDisplay && (
        <DatabaseItemDetailsPopup
          item={databaseItemDetailsDisplay}
          onPopupClose={() => setDatabaseItemDetailsDisplay(null)}
        />
      )}
      <Layout>
        <Wrapper className="wrapper">
          <HeroHeading variant="database" />
          <DatabaseContainer>
            {testDatabaseItems.map(({ id, text }) => (
              <DatabaseItem
                key={id}
                id={id}
                text={text}
                displayFullItem={displayFullDatabaseItem}
              />
            ))}
          </DatabaseContainer>
        </Wrapper>
      </Layout>
    </>
  );
};

export default Database;
