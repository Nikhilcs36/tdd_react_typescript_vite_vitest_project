import { useSelector } from 'react-redux';
import { useCallback } from 'react';
import { RootState } from '../store';

/**
 * Authorization utilities for role-based access control
 * Provides hooks and functions to check user permissions and roles
 */

/**
 * Hook for user authorization checks
 * Provides functions to determine user roles and access permissions
 */
export const useUserAuthorization = () => {
  const authState = useSelector((state: RootState) => state.auth);

  /**
   * Check if the current user is an admin (staff or superuser)
   */
  const isAdmin = useCallback((): boolean => {
    return authState.user?.is_staff === true || authState.user?.is_superuser === true;
  }, [authState.user?.is_staff, authState.user?.is_superuser]);

  /**
   * Check if the given userId matches the current user's ID
   */
  const isCurrentUser = useCallback((userId: number): boolean => {
    return authState.user?.id === userId;
  }, [authState.user?.id]);

  /**
   * Check if the current user can access data for the given userId
   * Admins can access any user's data, regular users can only access their own data
   */
  const canAccessUserData = useCallback((userId: number): boolean => {
    return isAdmin() || isCurrentUser(userId);
  }, [authState.user?.is_staff, authState.user?.is_superuser, authState.user?.id]);

  /**
   * Get the current user's role information
   */
  const getUserRole = useCallback(() => {
    const user = authState.user;
    if (!user) return null;

    return {
      isStaff: user.is_staff,
      isSuperuser: user.is_superuser,
      isAdmin: isAdmin(),
      userId: user.id
    };
  }, [authState.user, isAdmin]);

  return {
    isAdmin,
    isCurrentUser,
    canAccessUserData,
    getUserRole,
    user: authState.user
  };
};

/**
 * Standalone authorization functions for use outside of React components
 * These functions require the auth state to be passed in
 */

/**
 * Check if a user is an admin based on their role fields
 */
export const isUserAdmin = (user: { is_staff?: boolean; is_superuser?: boolean } | null): boolean => {
  return user?.is_staff === true || user?.is_superuser === true;
};

/**
 * Check if the given userId matches the current user's ID
 */
export const isUserCurrentUser = (user: { id?: number } | null, userId: number): boolean => {
  return user?.id === userId;
};

/**
 * Check if a user can access data for the given userId
 */
export const canUserAccessUserData = (user: { id?: number; is_staff?: boolean; is_superuser?: boolean } | null, userId: number): boolean => {
  return isUserAdmin(user) || isUserCurrentUser(user, userId);
};
