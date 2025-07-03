// This file contains authentication-related action creators
import { createAction } from '@reduxjs/toolkit';
import { AUTH_LOGIN_SUCCESS, AUTH_LOGOUT_SUCCESS } from './types';

export const loginSuccess = createAction<{ id: number; username: string; token: string }>(AUTH_LOGIN_SUCCESS);
export const logoutSuccess = createAction(AUTH_LOGOUT_SUCCESS);
