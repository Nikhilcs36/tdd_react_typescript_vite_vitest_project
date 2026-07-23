// This file contains all the action types for the redux store.

// Represents the shape of a user object
export interface User {
  id: number;
  username: string;
  email: string;
  image: string | null;
}

// Represents the state of the user slice
export interface UserState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}

// Auth State Interfaces

export interface AuthState {
  isAuthenticated: boolean;
  user: {
    id: number;
    username: string;
    image?: string;
    is_staff: boolean;
    is_superuser: boolean;
    logins_remaining_for_staff: number;
    staff_access_granted: boolean;
    active_role: 'regular' | 'staff' | 'superuser';
    role_label: string;
  } | null;
  accessToken: string | null;
  refreshToken: string | null;
  showLogoutMessage: boolean;
}

export interface LoginPayload {
  id: number;
  username: string;
  access: string;
  refresh: string;
  is_staff: boolean;
  is_superuser: boolean;
  logins_remaining_for_staff: number;
  staff_access_granted: boolean;
  active_role: 'regular' | 'staff' | 'superuser';
  role_label: string;
}