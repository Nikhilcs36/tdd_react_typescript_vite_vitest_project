import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import SecureLS from "secure-ls";

// Initialize SecureLS
const secureLS = new SecureLS({ encodingType: "aes" });

interface AuthState {
  isAuthenticated: boolean;
  user: { id: number; username: string } | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    // Update loginSuccess to accept token but not store it in state
    loginSuccess: (
      state,
      action: PayloadAction<{ id: number; username: string; token?: string }>
    ) => {
      state.isAuthenticated = true;
      state.user = { id: action.payload.id, username: action.payload.username };
      // Token is not stored in state
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      // Clear auth data from SecureLS
      secureLS.remove("authState");
    },
  },
});

export const { loginSuccess, logout } = authSlice.actions;

export default authSlice.reducer;
