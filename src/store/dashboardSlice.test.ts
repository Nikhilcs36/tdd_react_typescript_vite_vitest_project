import { describe, it, expect } from 'vitest';
import dashboardReducer, {
  setActiveFilter,
  setSelectedUserIds,
  addSelectedUser,
  removeSelectedUser,
  clearSelectedUsers,
  setLoading,
  setError,
  resetDashboardState,
  DashboardState,
} from './dashboardSlice';

describe('dashboardSlice', () => {
  const initialState: DashboardState = {
    activeFilter: 'all',
    selectedUserIds: [],
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

      const action = setActiveFilter('specific');
      const result = dashboardReducer(state, action);

      expect(result.activeFilter).toBe('specific');
      expect(result.selectedUserIds).toEqual([]);
      expect(result.error).toBeNull();
    });

    it('should handle all filter modes', () => {
      const filterModes: ('all' | 'specific' | 'admin')[] = ['all', 'specific', 'admin'];

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

  describe('resetDashboardState', () => {
    it('should reset to initial state', () => {
      const state: DashboardState = {
        activeFilter: 'specific',
        selectedUserIds: [1, 2, 3],
        isLoading: true,
        error: 'Test error',
      };

      const action = resetDashboardState();
      const result = dashboardReducer(state, action);

      expect(result).toEqual(initialState);
    });
  });

  describe('integration scenarios', () => {
    it('should handle filter change workflow', () => {
      let state = initialState;

      // Set filter to specific
      state = dashboardReducer(state, setActiveFilter('specific'));
      expect(state.activeFilter).toBe('specific');
      expect(state.selectedUserIds).toEqual([]);

      // Add some users
      state = dashboardReducer(state, addSelectedUser(1));
      state = dashboardReducer(state, addSelectedUser(2));
      expect(state.selectedUserIds).toEqual([1, 2]);

      // Change filter (should clear selections)
      state = dashboardReducer(state, setActiveFilter('admin'));
      expect(state.activeFilter).toBe('admin');
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
  });
});
