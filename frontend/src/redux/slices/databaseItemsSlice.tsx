import { createSlice, current } from '@reduxjs/toolkit';

import { DatabaseItem } from 'utils/getDatabaseItem';

interface InitialState {
  databaseItems: DatabaseItem[];
}

const initialState: InitialState = {
  databaseItems: [],
};

export const databaseItemsSlice = createSlice({
  name: 'databaseItems',
  initialState,
  reducers: {
    setAllDatabaseItems: (state, action) => {
      state.databaseItems.splice(0, current(state).databaseItems.length);
      state.databaseItems.push(...action.payload);
    },
  },
});

export const { setAllDatabaseItems } = databaseItemsSlice.actions;
export default databaseItemsSlice.reducer;
