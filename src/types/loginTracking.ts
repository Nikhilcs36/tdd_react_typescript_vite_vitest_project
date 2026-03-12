/**
 * Login Tracking TypeScript Interfaces
 * Comprehensive interfaces for login tracking API responses with error handling considerations
 */

// User Statistics Response Interface
export interface UserStats {
  total_logins: number;
  last_login: string;
  weekly_data: Record<string, number>;
  monthly_data: Record<string, number>;
  login_trend: number;
}

// Login Activity Item Interface
export interface LoginActivityItem {
  id: number;
  username: string;
  timestamp: string;
  ip_address: string;
  user_agent: string;
  success: boolean;
}

// Login Activity Response Interface (paginated)
export interface LoginActivityResponse {
  count: number;
  results: LoginActivityItem[];
}

// Admin Dashboard Data Interface
export interface AdminDashboardData {
  total_users: number;
  active_users: number;
  total_logins: number;
  total_successful_logins: number;
  total_failed_logins: number;
  login_activity: LoginActivityItem[];
  user_growth: Record<string, number>;
}

// Admin User Stats Response Interface for batch user statistics
export interface AdminUserStatsResponse {
  [userId: string]: UserStats;
}

// Chart Data Interface for visualization
export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    backgroundColor?: string[];
    borderColor?: string;
    borderWidth?: number;
  }>;
}

// Error response interfaces aligned with centralized error handling system
export interface LoginTrackingError {
  response: {
    status: number;
    data: {
      message: string;
      translationKey?: string;
      validationErrors?: Record<string, string>;
      nonFieldErrors?: string[];
      originalError?: unknown;
      context?: { endpoint?: string; operation?: string };
    };
  };
}

// Union type for API responses that can be either success or error
export type ApiResponse<T> = T | LoginTrackingError;

// Type guards for error checking
export const isLoginTrackingError = (response: unknown): response is LoginTrackingError => {
  const r = response as LoginTrackingError;
  return r && r.response && typeof r.response.status === 'number';
};

export const isUserStats = (response: unknown): response is UserStats => {
  const r = response as UserStats;
  return r && typeof r.total_logins === 'number';
};

export const isLoginActivityResponse = (response: unknown): response is LoginActivityResponse => {
  const r = response as LoginActivityResponse;
  return r && typeof r.count === 'number' && Array.isArray(r.results);
};

export const isAdminDashboardData = (response: unknown): response is AdminDashboardData => {
  const r = response as AdminDashboardData;
  return r && typeof r.total_users === 'number';
};

export const isChartData = (response: unknown): response is ChartData => {
  const r = response as ChartData;
  return r && Array.isArray(r.labels) && Array.isArray(r.datasets);
};

export const isAdminUserStatsResponse = (response: unknown): response is AdminUserStatsResponse => {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return false;
  }
  const values = Object.values(response as AdminUserStatsResponse);
  return values.length > 0 && values.every(isUserStats);
};
