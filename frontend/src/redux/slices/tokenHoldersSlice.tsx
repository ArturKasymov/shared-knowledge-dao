import { createSlice, current } from '@reduxjs/toolkit';

import type { TokenHolder } from 'utils/model';

interface InitialState {
  tokenHolders: TokenHolder[];
}

const initialState: InitialState = {
  tokenHolders: [],
};

export const tokenHoldersSlice = createSlice({
  name: 'tokenHolders',
  initialState,
  reducers: {
    setAllTokenHolders: (state, action) => {
      state.tokenHolders.splice(0, current(state).tokenHolders.length);
      state.tokenHolders.push(...action.payload);
    },
  },
});

export const { setAllTokenHolders } = tokenHoldersSlice.actions;
export default tokenHoldersSlice.reducer;
