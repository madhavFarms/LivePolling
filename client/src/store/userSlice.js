import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  name: '',
  role: '', // 'student' | 'teacher'
  participants: [], // List of all users (Teacher + Students)
};

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setUser: (state, action) => {
      state.name = action.payload.name;
      state.role = action.payload.role;
    },
    setParticipants: (state, action) => {
      // Ensure we always store an array to prevent .map() errors
      state.participants = Array.isArray(action.payload) ? action.payload : [];
    },
  },
});

export const { setUser, setParticipants } = userSlice.actions;
export default userSlice.reducer;