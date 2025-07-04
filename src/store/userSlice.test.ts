import { describe, test, expect } from 'vitest';
import userReducer, { updateUserStart, updateUserSuccess, updateUserFailure } from './userSlice';
import { UserState } from './types';

// Mock user data for testing
const mockUser = {
  id: 1,
  username: 'testuser',
  email: 'test@test.com',
  image: null,
};

// Test suite for the user slice
describe('userSlice', () => {
  // Initial state for the user slice
  const initialState: UserState = {
    user: null,
    isLoading: false,
    error: null,
  };

  // Test case for the initial state
  test('should return the initial state', () => {
    expect(userReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  // Test case for the updateUserSuccess action
  test('should handle updateUserSuccess', () => {
    // Action to be dispatched
    const action = updateUserSuccess({ user: mockUser });
    // New state after the action is dispatched
    const newState = userReducer(initialState, action);

    // Assertions to check if the state is updated correctly
    expect(newState.user).toEqual(mockUser);
    expect(newState.isLoading).toBe(false);
    expect(newState.error).toBeNull();
  });

  // Test case for the updateUserStart action
  test('should handle updateUserStart', () => {
    // Action to be dispatched
    const action = updateUserStart();
    // New state after the action is dispatched
    const newState = userReducer(initialState, action);

    // Assertions to check if the state is updated correctly
    expect(newState.isLoading).toBe(true);
    expect(newState.error).toBeNull();
  });

  // Test case for the updateUserFailure action
  test('should handle updateUserFailure', () => {
    // Error message to be dispatched
    const error = 'Failed to update user';
    // Action to be dispatched
    const action = updateUserFailure(error);
    // New state after the action is dispatched
    const newState = userReducer(initialState, action);

    // Assertions to check if the state is updated correctly
    expect(newState.isLoading).toBe(false);
    expect(newState.error).toEqual(error);
  });
});
