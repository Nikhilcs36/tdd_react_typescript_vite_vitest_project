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
      originalError?: any;
      context?: { endpoint?: string; operation?: string };
    };
  };
}

// Union type for API responses that can be either success or error
export type ApiResponse<T> = T | LoginTrackingError;

// Type guards for error checking
export const isLoginTrackingError = (response: any): response is LoginTrackingError => {
  return response && response.response && typeof response.response.status === 'number';
};

export const isUserStats = (response: any): response is UserStats => {
  return response && typeof response.total_logins === 'number';
};

export const isLoginActivityResponse = (response: any): response is LoginActivityResponse => {
  return response && typeof response.count === 'number' && Array.isArray(response.results);
};

export const isAdminDashboardData = (response: any): response is AdminDashboardData => {
  return response && typeof response.total_users === 'number';
};

export const isChartData = (response: any): response is ChartData => {
  return response && Array.isArray(response.labels) && Array.isArray(response.datasets);
};

export const isAdminUserStatsResponse = (response: any): response is AdminUserStatsResponse => {
  if (!response || typeof response !== 'object' || Array.isArray(response)) {
    return false;
  }
  const values = Object.values(response);
  return values.length > 0 && values.every(isUserStats);
};
