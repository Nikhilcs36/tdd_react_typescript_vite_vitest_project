// This file contains all the action creators for the redux store.
import { createAction } from '@reduxjs/toolkit';
import { AUTH_LOGIN_SUCCESS, AUTH_LOGOUT_SUCCESS, USER_UPDATE_SUCCESS } from './types';

export const loginSuccess = createAction<{ id: number; username: string; token: string }>(AUTH_LOGIN_SUCCESS);
export const logoutSuccess = createAction(AUTH_LOGOUT_SUCCESS);
export const updateUserSuccess = createAction<{ id: number; username: string; image?: string }>(USER_UPDATE_SUCCESS);
