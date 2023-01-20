import { createSlice, current } from '@reduxjs/toolkit';

import { Proposal } from 'utils/model';

interface InitialState {
  proposals: Proposal[];
}

const initialState: InitialState = {
  proposals: [],
};

export const proposalsSlice = createSlice({
  name: 'proposals',
  initialState,
  reducers: {
    setAllProposals: (state, action) => {
      state.proposals.splice(0, current(state).proposals.length);
      state.proposals.push(...action.payload);
    },
    onVoted: (state, action) => {
      state.proposals = [...current(state).proposals];
      const index = current(state).proposals.findIndex(
        (proposal) => proposal.id === action.payload
      );
      if (index !== -1) {
        state.proposals[index].hasSelfVoted = true;
      }
    },
    onExecuted: (state, action) => {
      const index = current(state).proposals.findIndex(
        (proposal) => proposal.id === action.payload
      );
      if (index !== -1) {
        state.proposals[index].executed = true;
      }
    },
  },
});

export const { setAllProposals, onVoted, onExecuted } = proposalsSlice.actions;
export default proposalsSlice.reducer;
