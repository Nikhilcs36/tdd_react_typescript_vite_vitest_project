import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getUserStats } from '../loginTrackingService';

// Mock the errorService
vi.mock('../errorService', () => ({
  handleApiError: vi.fn((error) => error),
}));

// Mock the store for authentication
vi.mock('../../store', () => ({
  default: {
    getState: () => ({
      auth: {
        accessToken: 'mock-token-123',
        user: { id: 1 }
      }
    })
  }
}));

// Mock i18n for translation
vi.mock('../../locale/i18n', () => ({
  default: {
    language: 'en'
  }
}));

describe('loginTrackingService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    globalThis.fetch = vi.fn();
  });

  it('should fetch user stats successfully', async () => {
    const mockResponse = {
      total_logins: 42,
      last_login: "2025-12-13 14:30:25",
      weekly_data: {"2025-12-07": 5, "2025-12-08": 3, "2025-12-09": 7},
      monthly_data: {"2025-11": 15, "2025-12": 27},
      login_trend: 80
    };

    (globalThis.fetch as any).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockResponse),
    });

    const result = await getUserStats();
    expect(result).toEqual(mockResponse);
  });

  it('should handle errors properly', async () => {
    (globalThis.fetch as any).mockResolvedValue({
      ok: false,
      status: 401,
      json: () => Promise.resolve({ detail: 'Token is invalid or expired' }),
    });

    await expect(getUserStats()).rejects.toBeDefined();
  });
});
