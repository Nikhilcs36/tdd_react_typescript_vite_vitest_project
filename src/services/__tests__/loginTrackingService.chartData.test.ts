/**
 * Login Tracking Service Chart Data Extraction Tests
 * Tests the chart data extraction from backend wrapper objects
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { API_ENDPOINTS } from '../apiEndpoints';
import { getLoginTrends, getLoginComparison, getLoginDistribution } from '../loginTrackingService';
import { server } from '../../tests/mocks/server';

// Mock store for authentication
vi.mock('../../store', () => ({
  default: {
    getState: () => ({
      auth: {
        accessToken: 'mock-access-token',
      },
    }),
  },
}));

// Mock i18n
vi.mock('../../locale/i18n', () => ({
  default: {
    language: 'en',
  },
}));

describe('Login Tracking Service - Chart Data Extraction', () => {
  beforeEach(() => {
    // Reset any mocks
    vi.clearAllMocks();
  });

  describe('getLoginTrends', () => {
    it('should extract chart data from login_trends wrapper object', async () => {
      const mockResponse = {
        login_trends: {
          labels: ['2025-12-01', '2025-12-02', '2025-12-03'],
          datasets: [
            {
              label: 'Successful Logins',
              data: [10, 15, 20],
              borderColor: '#4caf50',
              backgroundColor: 'rgba(76, 175, 80, 0.1)'
            }
          ]
        }
      };

      // Override the MSW handler for this test
      server.use(
        http.get(API_ENDPOINTS.LOGIN_TRENDS, () => {
          return HttpResponse.json(mockResponse, { status: 200 });
        })
      );

      const result = await getLoginTrends();

      expect(result).toEqual(mockResponse.login_trends);
      expect(result.labels).toEqual(['2025-12-01', '2025-12-02', '2025-12-03']);
      expect(result.datasets).toHaveLength(1);
      expect(result.datasets[0].label).toBe('Successful Logins');
    });

    it('should handle user filtering parameters', async () => {
      const mockResponse = {
        login_trends: {
          labels: ['2025-12-01'],
          datasets: [
            {
              label: 'Filtered Logins',
              data: [5],
              borderColor: '#2196f3',
              backgroundColor: 'rgba(33, 150, 243, 0.1)'
            }
          ]
        }
      };

      let capturedUrl = '';
      server.use(
        http.get(API_ENDPOINTS.LOGIN_TRENDS, ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json(mockResponse, { status: 200 });
        })
      );

      await getLoginTrends([1, 2]);

      expect(capturedUrl).toContain('user_ids=1');
      expect(capturedUrl).toContain('user_ids=2');
    });
  });

  describe('getLoginComparison', () => {
    it('should extract chart data from login_comparison wrapper object', async () => {
      const mockResponse = {
        login_comparison: {
          labels: ['Week 1', 'Week 2', 'Week 3'],
          datasets: [
            {
              label: 'Login Count',
              data: [25, 30, 35],
              backgroundColor: '#2196f3'
            }
          ]
        }
      };

      server.use(
        http.get(API_ENDPOINTS.LOGIN_COMPARISON, () => {
          return HttpResponse.json(mockResponse, { status: 200 });
        })
      );

      const result = await getLoginComparison();

      expect(result).toEqual(mockResponse.login_comparison);
      expect(result.labels).toEqual(['Week 1', 'Week 2', 'Week 3']);
      expect(result.datasets[0].data).toEqual([25, 30, 35]);
    });
  });

  describe('getLoginDistribution', () => {
    it('should extract success_ratio chart data from login_distribution wrapper object', async () => {
      const mockResponse = {
        login_distribution: {
          success_ratio: {
            labels: ['Successful', 'Failed'],
            datasets: [
              {
                data: [90, 10],
                backgroundColor: ['#4caf50', '#f44336']
              }
            ]
          },
          user_agents: {
            labels: ['Chrome', 'Firefox'],
            datasets: [
              {
                data: [60, 40],
                backgroundColor: ['#2196f3', '#ff9800']
              }
            ]
          }
        }
      };

      server.use(
        http.get(API_ENDPOINTS.LOGIN_DISTRIBUTION, () => {
          return HttpResponse.json(mockResponse, { status: 200 });
        })
      );

      const result = await getLoginDistribution();

      // Should return the success_ratio chart data
      expect(result).toEqual(mockResponse.login_distribution.success_ratio);
      expect(result.labels).toEqual(['Successful', 'Failed']);
      expect(result.datasets[0].data).toEqual([90, 10]);
    });

    it('should handle authentication errors', async () => {
      server.use(
        http.get(API_ENDPOINTS.LOGIN_DISTRIBUTION, () => {
          return HttpResponse.json(
            { message: 'Token is invalid or expired' },
            { status: 401 }
          );
        })
      );

      await expect(getLoginDistribution()).rejects.toThrow();
    });
  });

  describe('Error handling', () => {
    it('should handle network errors', async () => {
      server.use(
        http.get(API_ENDPOINTS.LOGIN_TRENDS, () => {
          return HttpResponse.error();
        })
      );

      await expect(getLoginTrends()).rejects.toThrow();
    });

    it('should handle malformed JSON responses', async () => {
      server.use(
        http.get(API_ENDPOINTS.LOGIN_TRENDS, () => {
          return new HttpResponse('Not JSON', { status: 200 });
        })
      );

      await expect(getLoginTrends()).rejects.toThrow();
    });
  });
});
