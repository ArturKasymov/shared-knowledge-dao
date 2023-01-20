import { combineReducers, configureStore } from '@reduxjs/toolkit';

import welcomePopupReducer from './slices/welcomePopupSlice';
import walletAccountsReducer from './slices/walletAccountsSlice';
import databaseItemsReducer from './slices/databaseItemsSlice';
import proposalsReducer from './slices/proposalsSlice';
import { loadState, saveState } from './localStorage';

const persistedState = loadState();

const store = configureStore({
  preloadedState: persistedState,
  reducer: combineReducers({
    welcomePopup: welcomePopupReducer,
    walletAccounts: walletAccountsReducer,
    databaseItems: databaseItemsReducer,
    proposals: proposalsReducer,
  }),
});

const STORAGE_EXPIRATION_TIME = 1000 * 60 * 60 * 24; // 24 hours

store.subscribe(() => {
  saveState({ walletAccounts: store.getState().walletAccounts }, STORAGE_EXPIRATION_TIME);
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
