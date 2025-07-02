import { createSlice } from "@reduxjs/toolkit";
import SecureLS from "secure-ls";
import { loginSuccess, logoutSuccess, updateUserSuccess } from "./actions";

// Initialize SecureLS
const secureLS = new SecureLS({ encodingType: "aes" });

interface AuthState {
  isAuthenticated: boolean;
  user: { id: number; username: string, image?: string } | null;
  token: string | null;
  showLogoutMessage: boolean;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
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
        state.token = action.payload.token;
      })
      .addCase(logoutSuccess, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        secureLS.remove("authState");
      })
      .addCase(updateUserSuccess, (state, action) => {
        if (state.user) {
          state.user.username = action.payload.username;
          state.user.image = action.payload.image;
        }
      });
  },
});

export const { showLogoutMessage, hideLogoutMessage } = authSlice.actions;

export default authSlice.reducer;
