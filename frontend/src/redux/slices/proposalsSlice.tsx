import { createSlice, current } from '@reduxjs/toolkit';

import { Proposal } from 'utils/model';

interface InitialState {
  proposals: Proposal[];
  selfVoteWeight: number;
}

const initialState: InitialState = {
  proposals: [],
  selfVoteWeight: 0,
};

export const proposalsSlice = createSlice({
  name: 'proposals',
  initialState,
  reducers: {
    setAllProposals: (state, action) => {
      state.proposals.splice(0, current(state).proposals.length);
      state.proposals.push(...action.payload);
    },
    setSelfVoteWeight: (state, action) => {
      state.selfVoteWeight = action.payload;
    },
    onProposed: (state, action) => {
      state.proposals.push(action.payload);
    },
    onVoted: (state, action) => {
      const index = current(state).proposals.findIndex(
        (proposal) => proposal.id === action.payload
      );
      if (index !== -1) {
        state.proposals[index].hasSelfVoted = true;
        state.proposals[index].votes += current(state).selfVoteWeight;
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

export const { setAllProposals, setSelfVoteWeight, onProposed, onVoted, onExecuted } =
  proposalsSlice.actions;
export default proposalsSlice.reducer;
