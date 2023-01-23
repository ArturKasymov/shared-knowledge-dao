import React, { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import styled from 'styled-components';
import { ApiPromise } from '@polkadot/api';

import HeroHeading from 'components/HeroHeading';
import Layout from 'components/Layout';
import DatabaseItem from 'components/DatabaseItem';
import PlaceholderDatabaseItem from 'components/DatabaseItem/Placeholder';
import { displayErrorToast } from 'components/NotificationToast';

import { ErrorToastMessages, MIN_PROPOSAL_PRICE } from 'shared/constants';
import { RootState } from 'redux/store';
import { setAllDatabaseItems } from 'redux/slices/databaseItemsSlice';
import { queries } from 'shared/layout';
import { getDatabaseItemsIds } from 'utils/getDatabaseItemsIds';
import { getDatabaseItem, DatabaseItem as DatabaseItemModel } from 'utils/getDatabaseItem';
import {
  proposeModifyItem as proposeModifyDatabaseItem,
  proposeAddItem as proposeAddDatabaseItem,
} from 'utils/proposeDatabase';

import DatabaseProposeNewItemPopup from './DatabaseProposeNewItemPopup';
import DatabaseItemDetailsPopup from './DatabaseItemDetailsPopup';

const Wrapper = styled.div`
  color: ${({ theme }) => theme.colors.white};
`;

const DatabaseContainer = styled.div`
  width: 100%;
  height: 100%;
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
  const loggedAccount = useSelector((state: RootState) => state.walletAccounts.account);
  const testDatabaseItems = useSelector((state: RootState) => state.databaseItems.databaseItems);
  const tokenHolders = useSelector((state: RootState) => state.tokenHolders.tokenHolders);
  const [databaseItemDetailsDisplay, setDatabaseItemDetailsDisplay] =
    useState<DatabaseItemModel | null>(null);
  const [proposeNewItemDisplay, setProposeNewItemDisplay] = useState(false);

  const getAllDatabaseItemsIds = useCallback(async () => api && getDatabaseItemsIds(api), [api]);
  const getDatabaseItemById = useCallback(
    async (id: number) => api && getDatabaseItem(id, api),
    [api]
  );

  useEffect(() => {
    const getDatabaseItems = async () => {
      const ids = await getAllDatabaseItemsIds();
      const allDatabaseItems = ids?.map(async (id) => getDatabaseItemById(id));
      if (allDatabaseItems) {
        Promise.all(allDatabaseItems).then(
          (items) => items && setDatabaseItems(items as DatabaseItemModel[])
        );
      }
    };
    getDatabaseItems();
  }, [getAllDatabaseItemsIds, getDatabaseItemById]);

  useEffect(() => {
    dispatch(setAllDatabaseItems(databaseItems));
  }, [databaseItems, databaseItems.length, dispatch]);

  /*
  api?.query.system.events(async (events: EventRecord[]) => {
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
*/
  const computePlaceholderId = () => {
    const countItems = testDatabaseItems.length;
    if (countItems > 0) {
      return testDatabaseItems[countItems - 1].id + 1;
    }
    return 0;
  };

  const handleProposeAdd = (text: string, description: string, transferValue: number) => {
    if (!loggedAccount) {
      displayErrorToast(ErrorToastMessages.NO_WALLET);
      return;
    }

    if (api) {
      const $transferValue = tokenHolders.some((holder) => holder.address === loggedAccount.address)
        ? undefined
        : transferValue;
      proposeAddDatabaseItem(text, description, loggedAccount, api, $transferValue).then(() =>
        setProposeNewItemDisplay(false)
      );
    }
  };

  const handleProposeModify = (
    id: number,
    text: string,
    description: string,
    transferValue: number
  ) => {
    if (!loggedAccount) {
      displayErrorToast(ErrorToastMessages.NO_WALLET);
      return;
    }

    if (api) {
      const $transferValue = tokenHolders.some((holder) => holder.address === loggedAccount.address)
        ? undefined
        : transferValue;
      proposeModifyDatabaseItem(id, text, description, loggedAccount, api, $transferValue).then(
        () => setDatabaseItemDetailsDisplay(null)
      );
    }
  };

  const displayFullDatabaseItem = (id: number) => {
    const itemToBeDisplayed = databaseItems.find((item) => item.id === id);
    if (!itemToBeDisplayed) return;
    setDatabaseItemDetailsDisplay(itemToBeDisplayed);
  };

  return (
    <>
      {proposeNewItemDisplay && (
        <DatabaseProposeNewItemPopup
          onPopupClose={() => setProposeNewItemDisplay(false)}
          onItemPropose={handleProposeAdd}
          proposalPrice={MIN_PROPOSAL_PRICE}
        />
      )}
      {databaseItemDetailsDisplay && (
        <DatabaseItemDetailsPopup
          item={databaseItemDetailsDisplay}
          proposalPrice={100}
          onPopupClose={() => setDatabaseItemDetailsDisplay(null)}
          onItemPropose={handleProposeModify}
        />
      )}
      <Layout api={api}>
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
            <PlaceholderDatabaseItem
              id={computePlaceholderId()}
              onClick={() => setProposeNewItemDisplay(true)}
            />
          </DatabaseContainer>
        </Wrapper>
      </Layout>
    </>
  );
};

export default Database;
