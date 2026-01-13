import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DashboardFilterMode } from '../components/dashboard/DashboardFilters';

export interface DashboardState {
  activeFilter: DashboardFilterMode;
  selectedUserIds: number[];
  startDate: string | null;
  endDate: string | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: DashboardState = {
  activeFilter: 'all',
  selectedUserIds: [],
  startDate: null,
  endDate: null,
  isLoading: false,
  error: null,
};

const dashboardSlice = createSlice({
  name: 'dashboard',
  initialState,
  reducers: {
    setActiveFilter: (state, action: PayloadAction<DashboardFilterMode>) => {
      state.activeFilter = action.payload;
      // Clear selected users when changing filters
      state.selectedUserIds = [];
      state.error = null;
    },
    setSelectedUserIds: (state, action: PayloadAction<number[]>) => {
      state.selectedUserIds = action.payload;
      state.error = null;
    },
    addSelectedUser: (state, action: PayloadAction<number>) => {
      if (!state.selectedUserIds.includes(action.payload)) {
        state.selectedUserIds.push(action.payload);
      }
    },
    removeSelectedUser: (state, action: PayloadAction<number>) => {
      state.selectedUserIds = state.selectedUserIds.filter(id => id !== action.payload);
    },
    clearSelectedUsers: (state) => {
      state.selectedUserIds = [];
    },
    setDateRange: (state, action: PayloadAction<{ startDate: string | null; endDate: string | null }>) => {
      state.startDate = action.payload.startDate;
      state.endDate = action.payload.endDate;
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.isLoading = false;
    },
    resetDashboardState: () => initialState,
  },
});

export const {
  setActiveFilter,
  setSelectedUserIds,
  addSelectedUser,
  removeSelectedUser,
  clearSelectedUsers,
  setDateRange,
  setLoading,
  setError,
  resetDashboardState,
} = dashboardSlice.actions;

export default dashboardSlice.reducer;
