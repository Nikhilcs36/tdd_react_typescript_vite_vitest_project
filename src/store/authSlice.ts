import { createSlice } from "@reduxjs/toolkit";
import SecureLS from "secure-ls";
import { loginSuccess, logoutSuccess } from "./actions";

// Initialize SecureLS
const secureLS = new SecureLS({ encodingType: "aes" });

export interface AuthState {
  isAuthenticated: boolean;
  user: { id: number; username: string; image?: string; is_staff: boolean; is_superuser: boolean } | null;
  accessToken: string | null;
  refreshToken: string | null;
  showLogoutMessage: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  accessToken: null,
  refreshToken: null,
  showLogoutMessage: false,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    showLogoutMessage: (state) => {
      state.showLogoutMessage = true;
    },
    hideLogoutMessage: (state) => {
      state.showLogoutMessage = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginSuccess, (state, action) => {
        state.isAuthenticated = true;
        state.user = {
          id: action.payload.id,
          username: action.payload.username,
          is_staff: action.payload.is_staff,
          is_superuser: action.payload.is_superuser,
        };
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        state.showLogoutMessage = false; // Ensure logout message is hidden on login
        // Store tokens in secure storage
        secureLS.set("authState", {
          isAuthenticated: true,
          user: {
            id: action.payload.id,
            username: action.payload.username,
            is_staff: action.payload.is_staff,
            is_superuser: action.payload.is_superuser
          },
          accessToken: action.payload.access,
          refreshToken: action.payload.refresh,
          showLogoutMessage: false, // Ensure logout message is hidden in storage too
        });
      })
      .addCase(logoutSuccess, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.accessToken = null;
        state.refreshToken = null;
        secureLS.remove("authState");
      });
  },
});

export const { showLogoutMessage, hideLogoutMessage } = authSlice.actions;

export default authSlice.reducer;
