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
    // Sets loading state to true when a user update begins
    updateUserStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    // Updates state with new user data after a successful profile update
    updateUserSuccess: (state, action: PayloadAction<{ user: User }>) => {
      state.user = action.payload.user;
      state.isLoading = false;
      state.error = null;
    },
    // Handles errors during the user update process
    updateUserFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    // Clears the user error state without affecting loading status
    clearUserError: (state) => {
      state.error = null;
    },
  },
});

// Export the action creator
export const { updateUserStart, updateUserSuccess, updateUserFailure, clearUserError } = userSlice.actions;

// Export the reducer
export default userSlice.reducer;
