import { describe, it, expect } from 'vitest';
import {
  isAdminUserStatsResponse,
  AdminUserStatsResponse,
  UserStats
} from './loginTracking';

describe('Type Guards', () => {
  describe('isAdminUserStatsResponse', () => {
    it('should return true for valid AdminUserStatsResponse', () => {
      const validResponse: AdminUserStatsResponse = {
        "1": {
          total_logins: 42,
          last_login: "2025-12-13 14:30:25",
          weekly_data: { "2025-12-07": 5, "2025-12-08": 3 },
          monthly_data: { "2025-11": 15, "2025-12": 27 },
          login_trend: 80
        },
        "2": {
          total_logins: 25,
          last_login: "2025-12-12 10:15:30",
          weekly_data: { "2025-12-06": 2, "2025-12-07": 4 },
          monthly_data: { "2025-11": 10, "2025-12": 15 },
          login_trend: 65
        }
      };
      expect(isAdminUserStatsResponse(validResponse)).toBe(true);
    });

    it('should return false for invalid responses', () => {
      expect(isAdminUserStatsResponse(null)).toBe(false);
      expect(isAdminUserStatsResponse({})).toBe(false);
      expect(isAdminUserStatsResponse({ "1": "invalid" })).toBe(false);
      expect(isAdminUserStatsResponse({ "1": { invalid: "data" } })).toBe(false);
    });

    it('should return false for non-object responses', () => {
      expect(isAdminUserStatsResponse("string")).toBe(false);
      expect(isAdminUserStatsResponse(123)).toBe(false);
      expect(isAdminUserStatsResponse([])).toBe(false);
    });

    it('should return false when object values are not valid UserStats', () => {
      const invalidResponse = {
        "1": { total_logins: 42, last_login: "2025-12-13 14:30:25" }, // missing required fields
        "2": { total_logins: "not_a_number", last_login: "2025-12-12 10:15:30" } // invalid type
      };
      expect(isAdminUserStatsResponse(invalidResponse)).toBe(false);
    });
  });
});
