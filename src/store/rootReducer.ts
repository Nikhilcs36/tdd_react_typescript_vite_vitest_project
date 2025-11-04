import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import globalErrorReducer from './globalErrorSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  globalError: globalErrorReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
