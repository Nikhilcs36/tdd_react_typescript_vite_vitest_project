// This file contains authentication-related action creators
import { createAction } from "@reduxjs/toolkit";
import { AUTH_LOGIN_SUCCESS, AUTH_LOGOUT_SUCCESS } from "./types";

export const loginSuccess = createAction<{
  id: number;
  username: string;
  access: string;
  refresh: string;
  is_staff: boolean;
  is_superuser: boolean;
  logins_remaining_for_staff: number;
  staff_access_granted: boolean;
  active_role: 'regular' | 'staff' | 'superuser';
  role_label: string;
}>(AUTH_LOGIN_SUCCESS);
export const logoutSuccess = createAction(AUTH_LOGOUT_SUCCESS);
