import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import SecureLS from "secure-ls";

// Initialize SecureLS
const secureLS = new SecureLS({ encodingType: "aes" });

interface AuthState {
  isAuthenticated: boolean;
  user: { id: number; username: string } | null;
  token: string | null; // Add token to state
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null, // Initialize token as null
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Update loginSuccess to store token in state
    loginSuccess: (
      state,
      action: PayloadAction<{ id: number; username: string; token: string }>
    ) => {
      state.isAuthenticated = true;
      state.user = { id: action.payload.id, username: action.payload.username };
      state.token = action.payload.token; // Store token in state
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      state.token = null; // Clear token on logout
      // Clear auth data from SecureLS
      secureLS.remove("authState");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
