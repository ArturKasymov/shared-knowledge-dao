import { combineReducers, configureStore } from '@reduxjs/toolkit';

import walletAccountsReducer from './slices/walletAccountsSlice';
import databaseItemsReducer from './slices/databaseItemsSlice';
import proposalsReducer from './slices/proposalsSlice';
import tokenHoldersReducer from './slices/tokenHoldersSlice';
import { loadState, saveState } from './localStorage';

const persistedState = loadState();

const store = configureStore({
  preloadedState: persistedState,
  reducer: combineReducers({
    walletAccounts: walletAccountsReducer,
    databaseItems: databaseItemsReducer,
    proposals: proposalsReducer,
    tokenHolders: tokenHoldersReducer,
  }),
});

const STORAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24; // 24 hours

store.subscribe(() => {
  saveState({ walletAccounts: store.getState().walletAccounts }, STORAGE_EXPIRATION_TIME);
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
