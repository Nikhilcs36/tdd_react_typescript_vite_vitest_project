import { createSlice } from "@reduxjs/toolkit";
import SecureLS from "secure-ls";
import { loginSuccess, logoutSuccess } from "./actions";

// Initialize SecureLS
const secureLS = new SecureLS({ encodingType: "aes" });

interface AuthState {
  isAuthenticated: boolean;
  user: { id: number; username: string, image?: string } | null;
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
        state.user = { id: action.payload.id, username: action.payload.username };
        state.accessToken = action.payload.access;
        state.refreshToken = action.payload.refresh;
        // Store tokens in secure storage
        secureLS.set("authState", {
          isAuthenticated: true,
          user: { id: action.payload.id, username: action.payload.username },
          accessToken: action.payload.access,
          refreshToken: action.payload.refresh,
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
