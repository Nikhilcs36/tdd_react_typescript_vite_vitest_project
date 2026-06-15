import { createSlice } from "@reduxjs/toolkit";
import SecureLS from "secure-ls";
import { loginSuccess, logoutSuccess } from "./actions";

// Initialize SecureLS
const secureLS = new SecureLS({ encodingType: "aes" });

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    username: string;
    image?: string;
    is_staff: boolean;
    is_superuser: boolean;
    logins_remaining_for_staff: number;
    staff_access_granted: boolean;
    active_role: 'regular' | 'staff' | 'superuser';
    role_label: string;
  } | null;
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
    switchRole: (state, action) => {
      if (state.user) {
        state.user.active_role = action.payload.active_role;
        state.user.role_label = action.payload.role_label;
      }
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
          logins_remaining_for_staff: action.payload.logins_remaining_for_staff,
          staff_access_granted: action.payload.staff_access_granted,
          active_role: action.payload.active_role,
          role_label: action.payload.role_label,
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
            is_superuser: action.payload.is_superuser,
            logins_remaining_for_staff: action.payload.logins_remaining_for_staff,
            staff_access_granted: action.payload.staff_access_granted,
            active_role: action.payload.active_role,
            role_label: action.payload.role_label,
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

export const { showLogoutMessage, hideLogoutMessage, switchRole } = authSlice.actions;

export default authSlice.reducer;
