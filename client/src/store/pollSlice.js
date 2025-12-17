import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentPoll: null,
  isActive: false,
  timeLeft: 0,
  history: [],
  hasVoted: false,
  isKicked: false,
};

export const pollSlice = createSlice({
  name: 'poll',
  initialState,
  reducers: {
    setNewPoll: (state, action) => {
      state.currentPoll = action.payload;
      state.isActive = true;
      state.timeLeft = action.payload.duration;
      state.hasVoted = false; // Reset vote status for new question
    },
    updateTimer: (state, action) => {
      state.timeLeft = action.payload;
    },
    endPoll: (state, action) => {
      state.currentPoll = action.payload; // Update with final counts
      state.isActive = false;
      state.timeLeft = 0;
    },
    updateResults: (state, action) => {
      state.currentPoll = action.payload; // Real-time vote updates
    },
    setHistory: (state, action) => {
      state.history = action.payload;
    },
    setVoted: (state) => {
      state.hasVoted = true;
    },
    setKicked: (state) => {
      state.isKicked = true;
    }
  },
});

export const { 
  setNewPoll, 
  updateTimer, 
  endPoll, 
  updateResults, 
  setHistory, 
  setVoted, 
  setKicked 
} = pollSlice.actions;

export default pollSlice.reducer;