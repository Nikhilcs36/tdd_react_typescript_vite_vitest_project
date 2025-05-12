import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mockSecureLS, resetSecureLSMock } from '../tests/mocks/secureLsMock';
import createSecureLSMock from '../tests/mocks/secureLsMockFactory';

// Mock secure-ls before importing the modules that use it
vi.mock('secure-ls', () => createSecureLSMock(mockSecureLS));

// Import modules that use secure-ls after the mock is set up
import { loginSuccess, logout } from './authSlice';
import { createStore } from './index';

describe('Auth Slice', () => {
  beforeEach(() => {
    // Reset mock data between tests
    resetSecureLSMock();
  });

  it('should properly clear auth state and SecureLS on logout', async () => {
    // Setup: Create store and login a user
    const store = createStore();
    const testUser = { id: 1, username: 'testuser' };
    
    // Dispatch login action
    store.dispatch(loginSuccess(testUser));
    
    // Verify user is logged in
    expect(store.getState().auth.isAuthenticated).toBe(true);
    expect(store.getState().auth.user).toEqual(testUser);
    
    // Verify SecureLS.set was called with auth state
    expect(mockSecureLS.setCalls.length).toBeGreaterThan(0);
    const lastSetCall = mockSecureLS.setCalls[mockSecureLS.setCalls.length - 1];
    expect(lastSetCall.key).toBe('authState');
    
    // Now logout
    store.dispatch(logout());
    
    // Verify auth state is cleared
    expect(store.getState().auth.isAuthenticated).toBe(false);
    expect(store.getState().auth.user).toBeNull();
    
    // Verify SecureLS.remove was called to clear stored auth data
    expect(mockSecureLS.removeCalls).toContain('authState');
    
    // Create a new store to verify no auth data is loaded from SecureLS
    mockSecureLS.getReturnValue = null; // Simulate empty storage
    const newStore = createStore();
    
    // Verify new store has no auth data
    expect(newStore.getState().auth.isAuthenticated).toBe(false);
    expect(newStore.getState().auth.user).toBeNull();
  });
});
