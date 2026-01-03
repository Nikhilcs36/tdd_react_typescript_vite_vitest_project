import { combineReducers } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import userReducer from './userSlice';
import globalErrorReducer from './globalErrorSlice';
import dashboardReducer from './dashboardSlice';

const rootReducer = combineReducers({
  auth: authReducer,
  user: userReducer,
  globalError: globalErrorReducer,
  dashboard: dashboardReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
export default rootReducer;
