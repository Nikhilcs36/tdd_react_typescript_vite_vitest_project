import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createStore } from './index';
import { loginSuccess, logout } from './authSlice';

// Use vi.hoisted to ensure these variables are defined before the mock is used
const mockData = vi.hoisted(() => ({
  setCalls: [] as { key: string; value: any }[],
  removeCalls: [] as string[],
  getReturnValue: undefined as any
}));

// Mock the secure-ls module
vi.mock('secure-ls', () => {
  return {
    default: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((key, value) => {
        mockData.setCalls.push({ key, value });
      }),
      get: vi.fn().mockImplementation((_key) => {
        return mockData.getReturnValue;
      }),
      remove: vi.fn().mockImplementation((key) => {
        mockData.removeCalls.push(key);
      }),
    })),
  };
});

describe('Store with SecureLS', () => {
  beforeEach(() => {
    // Clear mock data between tests
    mockData.setCalls = [];
    mockData.removeCalls = [];
    mockData.getReturnValue = undefined;
    vi.clearAllMocks();
  });

  it('should use SecureLS to store auth state', () => {
    const store = createStore();
    const testUser = { id: 1, username: 'testuser' };
    
    // Dispatch login action
    store.dispatch(loginSuccess(testUser));
    
    // Verify SecureLS.set was called with correct data
    expect(mockData.setCalls.length).toBeGreaterThan(0);
    const lastCall = mockData.setCalls[mockData.setCalls.length - 1];
    expect(lastCall.key).toBe('authState');
    expect(lastCall.value).toMatchObject({
      isAuthenticated: true,
      user: testUser
    });
  });

  it('should load auth state from SecureLS on store creation', () => {
    // Setup mock return value for SecureLS.get
    mockData.getReturnValue = {
      isAuthenticated: true,
      user: { id: 5, username: 'persistedUser' }
    };
    
    // Create store which should load from SecureLS
    const store = createStore();
    
    // Check if auth state was loaded correctly
    const loadedAuthState = store.getState().auth;
    expect(loadedAuthState.isAuthenticated).toBe(true);
    expect(loadedAuthState.user).toEqual({ id: 5, username: 'persistedUser' });
  });

  it('should clear SecureLS on logout', () => {
    const store = createStore();
    
    // Dispatch logout action
    store.dispatch(logout());
    
    // Verify SecureLS.remove was called
    expect(mockData.removeCalls).toContain('authState');
  });
});






















