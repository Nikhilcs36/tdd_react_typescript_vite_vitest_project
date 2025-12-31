import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSelector } from 'react-redux';
import { useUserAuthorization, isUserAdmin, isUserCurrentUser, canUserAccessUserData } from './authorization';

// Mock react-redux
vi.mock('react-redux', () => ({
  useSelector: vi.fn()
}));

describe('Authorization Utilities', () => {
  describe('useUserAuthorization hook', () => {
    it('should identify admin users correctly (staff)', () => {
      (useSelector as any).mockImplementation(() => ({
        user: { id: 1, is_staff: true, is_superuser: false }
      }));

      const { result } = renderHook(() => useUserAuthorization());

      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.getUserRole()).toEqual({
        isStaff: true,
        isSuperuser: false,
        isAdmin: true,
        userId: 1
      });
    });

    it('should identify admin users correctly (superuser)', () => {
      (useSelector as any).mockImplementation(() => ({
        user: { id: 2, is_staff: false, is_superuser: true }
      }));

      const { result } = renderHook(() => useUserAuthorization());

      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.getUserRole()).toEqual({
        isStaff: false,
        isSuperuser: true,
        isAdmin: true,
        userId: 2
      });
    });

    it('should identify admin users correctly (both staff and superuser)', () => {
      (useSelector as any).mockImplementation(() => ({
        user: { id: 3, is_staff: true, is_superuser: true }
      }));

      const { result } = renderHook(() => useUserAuthorization());

      expect(result.current.isAdmin()).toBe(true);
      expect(result.current.getUserRole()).toEqual({
        isStaff: true,
        isSuperuser: true,
        isAdmin: true,
        userId: 3
      });
    });

    it('should identify regular users correctly', () => {
      (useSelector as any).mockImplementation(() => ({
        user: { id: 4, is_staff: false, is_superuser: false }
      }));

      const { result } = renderHook(() => useUserAuthorization());

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.getUserRole()).toEqual({
        isStaff: false,
        isSuperuser: false,
        isAdmin: false,
        userId: 4
      });
    });

    it('should check if user is current user correctly', () => {
      (useSelector as any).mockImplementation(() => ({
        user: { id: 5, is_staff: false, is_superuser: false }
      }));

      const { result } = renderHook(() => useUserAuthorization());

      expect(result.current.isCurrentUser(5)).toBe(true);
      expect(result.current.isCurrentUser(6)).toBe(false);
    });

    it('should allow admins to access any user data', () => {
      (useSelector as any).mockImplementation(() => ({
        user: { id: 1, is_staff: true, is_superuser: false }
      }));

      const { result } = renderHook(() => useUserAuthorization());

      expect(result.current.canAccessUserData(1)).toBe(true); // Own data
      expect(result.current.canAccessUserData(999)).toBe(true); // Other user's data
    });

    it('should allow regular users to access only their own data', () => {
      (useSelector as any).mockImplementation(() => ({
        user: { id: 5, is_staff: false, is_superuser: false }
      }));

      const { result } = renderHook(() => useUserAuthorization());

      expect(result.current.canAccessUserData(5)).toBe(true); // Own data
      expect(result.current.canAccessUserData(6)).toBe(false); // Other user's data
    });

    it('should return null for user role when no user is logged in', () => {
      (useSelector as any).mockImplementation(() => ({
        user: null
      }));

      const { result } = renderHook(() => useUserAuthorization());

      expect(result.current.isAdmin()).toBe(false);
      expect(result.current.isCurrentUser(1)).toBe(false);
      expect(result.current.canAccessUserData(1)).toBe(false);
      expect(result.current.getUserRole()).toBe(null);
    });

    it('should return the user object', () => {
      const user = { id: 1, username: 'test', is_staff: true, is_superuser: false };
      (useSelector as any).mockImplementation(() => ({
        user
      }));

      const { result } = renderHook(() => useUserAuthorization());

      expect(result.current.user).toEqual(user);
    });

    it('should return stable function references to prevent infinite loops', () => {
      const user = { id: 1, username: 'test', is_staff: false, is_superuser: false };
      (useSelector as any).mockImplementation(() => ({
        user
      }));

      const { result, rerender } = renderHook(() => useUserAuthorization());

      // Store initial function references
      const initialIsAdmin = result.current.isAdmin;
      const initialIsCurrentUser = result.current.isCurrentUser;
      const initialCanAccessUserData = result.current.canAccessUserData;

      // Re-render the hook (simulating a component re-render)
      rerender();

      // Function references should be the same (stable)
      expect(result.current.isAdmin).toBe(initialIsAdmin);
      expect(result.current.isCurrentUser).toBe(initialIsCurrentUser);
      expect(result.current.canAccessUserData).toBe(initialCanAccessUserData);
    });
  });

  describe('Standalone authorization functions', () => {
    describe('isUserAdmin', () => {
      it('should return true for staff users', () => {
        const user = { is_staff: true, is_superuser: false };
        expect(isUserAdmin(user)).toBe(true);
      });

      it('should return true for superuser users', () => {
        const user = { is_staff: false, is_superuser: true };
        expect(isUserAdmin(user)).toBe(true);
      });

      it('should return true for users who are both staff and superuser', () => {
        const user = { is_staff: true, is_superuser: true };
        expect(isUserAdmin(user)).toBe(true);
      });

      it('should return false for regular users', () => {
        const user = { is_staff: false, is_superuser: false };
        expect(isUserAdmin(user)).toBe(false);
      });

      it('should return false for null user', () => {
        expect(isUserAdmin(null)).toBe(false);
      });

      it('should return false for undefined role fields', () => {
        const user = {};
        expect(isUserAdmin(user)).toBe(false);
      });
    });

    describe('isUserCurrentUser', () => {
      it('should return true when user IDs match', () => {
        const user = { id: 5 };
        expect(isUserCurrentUser(user, 5)).toBe(true);
      });

      it('should return false when user IDs do not match', () => {
        const user = { id: 5 };
        expect(isUserCurrentUser(user, 6)).toBe(false);
      });

      it('should return false for null user', () => {
        expect(isUserCurrentUser(null, 5)).toBe(false);
      });

      it('should return false for undefined user ID', () => {
        const user = {};
        expect(isUserCurrentUser(user, 5)).toBe(false);
      });
    });

    describe('canUserAccessUserData', () => {
      it('should allow admin users to access any data', () => {
        const adminUser = { id: 1, is_staff: true, is_superuser: false };
        expect(canUserAccessUserData(adminUser, 1)).toBe(true); // Own data
        expect(canUserAccessUserData(adminUser, 999)).toBe(true); // Other user's data
      });

      it('should allow regular users to access only their own data', () => {
        const regularUser = { id: 5, is_staff: false, is_superuser: false };
        expect(canUserAccessUserData(regularUser, 5)).toBe(true); // Own data
        expect(canUserAccessUserData(regularUser, 6)).toBe(false); // Other user's data
      });

      it('should return false for null user', () => {
        expect(canUserAccessUserData(null, 5)).toBe(false);
      });

      it('should return false when user has no permissions and IDs do not match', () => {
        const user = { id: 1, is_staff: false, is_superuser: false };
        expect(canUserAccessUserData(user, 2)).toBe(false);
      });
    });
  });
});
