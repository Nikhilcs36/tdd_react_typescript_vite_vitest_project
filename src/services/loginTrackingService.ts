/**
 * Login Tracking Service
 * API service functions for login tracking dashboard functionality
 * Integrated with centralized error handling system
 */
import { handleApiError } from './errorService';
import { API_ENDPOINTS } from './apiEndpoints';
import store from '../store';
import i18n from '../locale/i18n';
import {
  UserStats,
  LoginActivityResponse,
  AdminDashboardData,
  ChartData
} from '../types/loginTracking';

export interface ApiGetService {
  get: <T>(url: string, page?: number, page_size?: number) => Promise<T>;
}

// Common function to build headers with authentication
const buildHeaders = () => {
  const authState = store.getState().auth;
  const accessToken: string | null = authState.accessToken;

  if (!accessToken) {
    throw handleApiError(
      { message: 'Authentication token not found' },
      { operation: 'get' }
    );
  }

  return {
    'Accept-Language': i18n.language,
    Authorization: `JWT ${accessToken}`,
  };
};

// Axios implementation for login tracking
export const axiosApiServiceLoginTracking: ApiGetService = {
  get: async <T>(url: string, page?: number, page_size?: number): Promise<T> => {
    try {
      const headers = buildHeaders();
      const params: Record<string, any> = {};

      if (page !== undefined) params.page = page;
      if (page_size !== undefined) params.page_size = page_size;

      // Using axios for actual implementation
      const { default: axios } = await import('axios');
      const response = await axios.get<T>(url, {
        headers,
        params: Object.keys(params).length > 0 ? params : undefined,
      });

      return response.data;
    } catch (error) {
      throw handleApiError(error, { endpoint: url, operation: 'get' });
    }
  },
};

// Fetch implementation for login tracking (for MSW testing)
export const fetchApiServiceLoginTracking: ApiGetService = {
  get: async <T>(url: string, page?: number, page_size?: number): Promise<T> => {
    const headers = buildHeaders();

    // Handle pagination parameters for Django
    let finalUrl = url;
    if (page !== undefined || page_size !== undefined) {
      const urlObj = new URL(url, window.location.origin);
      if (page !== undefined) urlObj.searchParams.set('page', page.toString());
      if (page_size !== undefined) urlObj.searchParams.set('page_size', page_size.toString());
      finalUrl = urlObj.toString();
    }

    try {
      const response = await fetch(finalUrl, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw handleApiError(
          { response: { status: response.status, data: errorData } },
          { endpoint: url, operation: 'get' }
        );
      }

      return response.json() as T;
    } catch (error) {
      throw handleApiError(error, { endpoint: url, operation: 'get' });
    }
  },
};

// Specific service functions for each endpoint
export const loginTrackingService = {
  // User Statistics
  getUserStats: async (): Promise<UserStats> => {
    return fetchApiServiceLoginTracking.get<UserStats>(API_ENDPOINTS.USER_STATS);
  },

  // Login Activity with pagination
  getLoginActivity: async (page: number = 1, page_size: number = 10): Promise<LoginActivityResponse> => {
    return fetchApiServiceLoginTracking.get<LoginActivityResponse>(
      API_ENDPOINTS.LOGIN_ACTIVITY,
      page,
      page_size
    );
  },

  // Chart Data Endpoints
  getLoginTrends: async (): Promise<ChartData> => {
    return fetchApiServiceLoginTracking.get<ChartData>(API_ENDPOINTS.LOGIN_TRENDS);
  },

  getLoginComparison: async (): Promise<ChartData> => {
    return fetchApiServiceLoginTracking.get<ChartData>(API_ENDPOINTS.LOGIN_COMPARISON);
  },

  getLoginDistribution: async (): Promise<ChartData> => {
    return fetchApiServiceLoginTracking.get<ChartData>(API_ENDPOINTS.LOGIN_DISTRIBUTION);
  },

  // Admin Endpoints
  getAdminDashboard: async (): Promise<AdminDashboardData> => {
    return fetchApiServiceLoginTracking.get<AdminDashboardData>(API_ENDPOINTS.ADMIN_DASHBOARD);
  },

  getAdminCharts: async (): Promise<ChartData> => {
    return fetchApiServiceLoginTracking.get<ChartData>(API_ENDPOINTS.ADMIN_CHARTS);
  },
};

// Export individual functions for easier testing
export const {
  getUserStats,
  getLoginActivity,
  getLoginTrends,
  getLoginComparison,
  getLoginDistribution,
  getAdminDashboard,
  getAdminCharts,
} = loginTrackingService;
