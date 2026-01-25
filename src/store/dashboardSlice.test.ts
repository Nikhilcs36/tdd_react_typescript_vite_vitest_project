import { describe, it, expect } from 'vitest';
import dashboardReducer, {
  setActiveFilter,
  setSelectedUserIds,
  addSelectedUser,
  removeSelectedUser,
  clearSelectedUsers,
  setSelectedDashboardUser,
  clearSelectedDashboardUser,
  setDateRange,
  setLoading,
  setError,
  resetDashboardState,
  DashboardState,
} from './dashboardSlice';

describe('dashboardSlice', () => {
  const initialState: DashboardState = {
    activeFilter: 'all',
    selectedUserIds: [],
    selectedDashboardUserId: null,
    startDate: null,
    endDate: null,
    isLoading: false,
    error: null,
  };

  it('should return the initial state', () => {
    expect(dashboardReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  describe('setActiveFilter', () => {
    it('should set the active filter and clear selected users', () => {
      const state: DashboardState = {
        ...initialState,
        activeFilter: 'all',
        selectedUserIds: [1, 2, 3],
      };

      const action = setActiveFilter('admin');
      const result = dashboardReducer(state, action);

      expect(result.activeFilter).toBe('admin');
      expect(result.selectedUserIds).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should handle all filter modes', () => {
      const filterModes: ('all' | 'regular' | 'admin' | 'me')[] = ['all', 'regular', 'admin', 'me'];

      filterModes.forEach(mode => {
        const action = setActiveFilter(mode);
        const result = dashboardReducer(initialState, action);
        expect(result.activeFilter).toBe(mode);
        expect(result.selectedUserIds).toEqual([]);
        expect(result.error).toBeNull();
      });
    });
  });

  describe('setSelectedUserIds', () => {
    it('should set the selected user IDs', () => {
      const action = setSelectedUserIds([1, 2, 3]);
      const result = dashboardReducer(initialState, action);

      expect(result.selectedUserIds).toEqual([1, 2, 3]);
      expect(result.error).toBeNull();
    });

    it('should replace existing selected user IDs', () => {
      const state = {
        ...initialState,
        selectedUserIds: [1, 2],
      };

      const action = setSelectedUserIds([3, 4]);
      const result = dashboardReducer(state, action);

      expect(result.selectedUserIds).toEqual([3, 4]);
    });

    it('should handle empty array', () => {
      const state = {
        ...initialState,
        selectedUserIds: [1, 2, 3],
      };

      const action = setSelectedUserIds([]);
      const result = dashboardReducer(state, action);

      expect(result.selectedUserIds).toEqual([]);
    });
  });

  describe('addSelectedUser', () => {
    it('should add a user ID to the selected list', () => {
      const action = addSelectedUser(1);
      const result = dashboardReducer(initialState, action);

      expect(result.selectedUserIds).toEqual([1]);
      expect(result.error).toBeNull();
    });

    it('should not add duplicate user IDs', () => {
      const state = {
        ...initialState,
        selectedUserIds: [1, 2],
      };

      const action = addSelectedUser(1);
      const result = dashboardReducer(state, action);

      expect(result.selectedUserIds).toEqual([1, 2]);
    });

    it('should add multiple different user IDs', () => {
      let state = initialState;

      const action1 = addSelectedUser(1);
      state = dashboardReducer(state, action1);

      const action2 = addSelectedUser(2);
      state = dashboardReducer(state, action2);

      expect(state.selectedUserIds).toEqual([1, 2]);
    });
  });

  describe('removeSelectedUser', () => {
    it('should remove a user ID from the selected list', () => {
      const state = {
        ...initialState,
        selectedUserIds: [1, 2, 3],
      };

      const action = removeSelectedUser(2);
      const result = dashboardReducer(state, action);

      expect(result.selectedUserIds).toEqual([1, 3]);
    });

    it('should handle removing non-existent user ID', () => {
      const state = {
        ...initialState,
        selectedUserIds: [1, 2],
      };

      const action = removeSelectedUser(3);
      const result = dashboardReducer(state, action);

      expect(result.selectedUserIds).toEqual([1, 2]);
    });

    it('should handle removing from empty list', () => {
      const action = removeSelectedUser(1);
      const result = dashboardReducer(initialState, action);

      expect(result.selectedUserIds).toEqual([]);
    });
  });

  describe('clearSelectedUsers', () => {
    it('should clear all selected user IDs', () => {
      const state = {
        ...initialState,
        selectedUserIds: [1, 2, 3, 4, 5],
      };

      const action = clearSelectedUsers();
      const result = dashboardReducer(state, action);

      expect(result.selectedUserIds).toEqual([]);
    });

    it('should handle clearing empty list', () => {
      const action = clearSelectedUsers();
      const result = dashboardReducer(initialState, action);

      expect(result.selectedUserIds).toEqual([]);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const action = setLoading(true);
      const result = dashboardReducer(initialState, action);

      expect(result.isLoading).toBe(true);
    });

    it('should set loading to false', () => {
      const state = {
        ...initialState,
        isLoading: true,
      };

      const action = setLoading(false);
      const result = dashboardReducer(state, action);

      expect(result.isLoading).toBe(false);
    });
  });

  describe('setError', () => {
    it('should set error message and set loading to false', () => {
      const state = {
        ...initialState,
        isLoading: true,
      };

      const action = setError('Network error');
      const result = dashboardReducer(state, action);

      expect(result.error).toBe('Network error');
      expect(result.isLoading).toBe(false);
    });

    it('should clear error when set to null', () => {
      const state = {
        ...initialState,
        error: 'Previous error',
      };

      const action = setError(null);
      const result = dashboardReducer(state, action);

      expect(result.error).toBeNull();
      expect(result.isLoading).toBe(false);
    });
  });

  describe('setDateRange', () => {
    it('should set both start and end dates', () => {
      const action = setDateRange({ startDate: '2023-01-01', endDate: '2023-12-31' });
      const result = dashboardReducer(initialState, action);

      expect(result.startDate).toBe('2023-01-01');
      expect(result.endDate).toBe('2023-12-31');
      expect(result.error).toBeNull();
    });

    it('should set start date only', () => {
      const action = setDateRange({ startDate: '2023-01-01', endDate: null });
      const result = dashboardReducer(initialState, action);

      expect(result.startDate).toBe('2023-01-01');
      expect(result.endDate).toBeNull();
    });

    it('should set end date only', () => {
      const action = setDateRange({ startDate: null, endDate: '2023-12-31' });
      const result = dashboardReducer(initialState, action);

      expect(result.startDate).toBeNull();
      expect(result.endDate).toBe('2023-12-31');
    });

    it('should clear both dates', () => {
      const state = {
        ...initialState,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };

      const action = setDateRange({ startDate: null, endDate: null });
      const result = dashboardReducer(state, action);

      expect(result.startDate).toBeNull();
      expect(result.endDate).toBeNull();
    });

    it('should replace existing dates', () => {
      const state = {
        ...initialState,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
      };

      const action = setDateRange({ startDate: '2024-01-01', endDate: '2024-12-31' });
      const result = dashboardReducer(state, action);

      expect(result.startDate).toBe('2024-01-01');
      expect(result.endDate).toBe('2024-12-31');
    });
  });

  describe('resetDashboardState', () => {
    it('should reset to initial state', () => {
      const state: DashboardState = {
        activeFilter: 'admin',
        selectedUserIds: [1, 2, 3],
        selectedDashboardUserId: 5,
        startDate: '2023-01-01',
        endDate: '2023-12-31',
        isLoading: true,
        error: 'Test error',
      };

      const action = resetDashboardState();
      const result = dashboardReducer(state, action);

      expect(result).toEqual(initialState);
    });
  });

  describe('setSelectedDashboardUser', () => {
    it('should set the selected dashboard user ID', () => {
      const action = setSelectedDashboardUser(5);
      const result = dashboardReducer(initialState, action);

      expect(result.selectedDashboardUserId).toBe(5);
      expect(result.error).toBeNull();
    });

    it('should replace existing selected dashboard user ID', () => {
      const state = {
        ...initialState,
        selectedDashboardUserId: 3,
      };

      const action = setSelectedDashboardUser(7);
      const result = dashboardReducer(state, action);

      expect(result.selectedDashboardUserId).toBe(7);
    });

    it('should handle null value', () => {
      const state = {
        ...initialState,
        selectedDashboardUserId: 5,
      };

      const action = setSelectedDashboardUser(null);
      const result = dashboardReducer(state, action);

      expect(result.selectedDashboardUserId).toBeNull();
    });
  });

  describe('clearSelectedDashboardUser', () => {
    it('should clear the selected dashboard user ID', () => {
      const state = {
        ...initialState,
        selectedDashboardUserId: 5,
      };

      const action = clearSelectedDashboardUser();
      const result = dashboardReducer(state, action);

      expect(result.selectedDashboardUserId).toBeNull();
    });

    it('should handle clearing when already null', () => {
      const action = clearSelectedDashboardUser();
      const result = dashboardReducer(initialState, action);

      expect(result.selectedDashboardUserId).toBeNull();
    });
  });

  describe('integration scenarios', () => {
    it('should handle filter change workflow', () => {
      let state = initialState;

      // Set filter to admin
      state = dashboardReducer(state, setActiveFilter('admin'));
      expect(state.activeFilter).toBe('admin');
      expect(state.selectedUserIds).toEqual([]);

      // Add some users
      state = dashboardReducer(state, addSelectedUser(1));
      state = dashboardReducer(state, addSelectedUser(2));
      expect(state.selectedUserIds).toEqual([1, 2]);

      // Change filter (should clear selections)
      state = dashboardReducer(state, setActiveFilter('regular'));
      expect(state.activeFilter).toBe('regular');
      expect(state.selectedUserIds).toEqual([]);
    });

    it('should handle loading and error states', () => {
      let state = initialState;

      // Start loading
      state = dashboardReducer(state, setLoading(true));
      expect(state.isLoading).toBe(true);

      // Set error (should stop loading)
      state = dashboardReducer(state, setError('API Error'));
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('API Error');

      // Clear error
      state = dashboardReducer(state, setError(null));
      expect(state.error).toBeNull();
    });

    it('should handle dashboard user selection workflow', () => {
      let state = initialState;

      // Set dashboard user
      state = dashboardReducer(state, setSelectedDashboardUser(10));
      expect(state.selectedDashboardUserId).toBe(10);

      // Change filter (should not affect dashboard user selection)
      state = dashboardReducer(state, setActiveFilter('admin'));
      expect(state.selectedDashboardUserId).toBe(10);

      // Clear dashboard user
      state = dashboardReducer(state, clearSelectedDashboardUser());
      expect(state.selectedDashboardUserId).toBeNull();
    });
  });
});
