import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { UserState, User } from './types';

// Manages state related to user profile data and updates
// Initial state configuration for user slice
const initialState: UserState = {
  user: null,
  isLoading: false,
  error: null,
};

// Create and configure the user slice with reducers
const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    // Updates state with new user data after a successful profile update
    updateUserSuccess: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
      state.isLoading = false;
      state.error = null;
    },
  },
});

// Export the action creator
export const { updateUserSuccess } = userSlice.actions;

// Export the reducer
export default userSlice.reducer;
