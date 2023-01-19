import { combineReducers, configureStore } from '@reduxjs/toolkit';

import welcomePopupReducer from './slices/welcomePopupSlice';
import walletAccountsReducer from './slices/walletAccountsSlice';
import databaseItemsReducer from './slices/databaseItemsSlice';

const store = configureStore({
  reducer: combineReducers({
    welcomePopup: welcomePopupReducer,
    walletAccounts: walletAccountsReducer,
    databaseItems: databaseItemsReducer,
  }),
});

export default store;

export type RootState = ReturnType<typeof store.getState>;
