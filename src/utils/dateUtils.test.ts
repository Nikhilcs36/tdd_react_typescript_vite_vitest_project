import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getDateDaysAgo, getTodayDateString, getDateRangeFromPreset, getDaysBetweenDates, getDateRangeLabel } from './dateUtils';

describe('dateUtils', () => {
  beforeEach(() => {
    // Mock Date to have consistent tests
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2023-01-31'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('getDateDaysAgo', () => {
    it('returns date string for 1 day ago', () => {
      const result = getDateDaysAgo(1);
      expect(result).toBe('2023-01-30');
    });

    it('returns date string for 7 days ago', () => {
      const result = getDateDaysAgo(7);
      expect(result).toBe('2023-01-24');
    });

    it('returns date string for 30 days ago', () => {
      const result = getDateDaysAgo(30);
      expect(result).toBe('2023-01-01');
    });

    it('returns date string for 0 days ago (today)', () => {
      const result = getDateDaysAgo(0);
      expect(result).toBe('2023-01-31');
    });
  });

  describe('getTodayDateString', () => {
    it('returns today\'s date in YYYY-MM-DD format', () => {
      const result = getTodayDateString();
      expect(result).toBe('2023-01-31');
    });
  });

  describe('getDateRangeFromPreset', () => {
    it('returns date range for 1 day preset', () => {
      const result = getDateRangeFromPreset('1day');
      expect(result).toEqual({
        startDate: '2023-01-30',
        endDate: '2023-01-31'
      });
    });

    it('returns date range for 7 days preset', () => {
      const result = getDateRangeFromPreset('7days');
      expect(result).toEqual({
        startDate: '2023-01-24',
        endDate: '2023-01-31'
      });
    });

    it('returns date range for 30 days preset', () => {
      const result = getDateRangeFromPreset('30days');
      expect(result).toEqual({
        startDate: '2023-01-01',
        endDate: '2023-01-31'
      });
    });

    it('throws error for unknown preset', () => {
      expect(() => getDateRangeFromPreset('unknown' as any)).toThrow('Unknown preset: unknown');
    });
  });

  // NEW TESTS FOR DATE RANGE COUNT FUNCTIONALITY
  describe('getDaysBetweenDates', () => {
    it('should calculate days between two dates (1 day difference)', () => {
      const result = getDaysBetweenDates('2023-01-01', '2023-01-02');
      expect(result).toBe(1);
    });

    it('should calculate days between two dates (7 days difference)', () => {
      const result = getDaysBetweenDates('2023-01-01', '2023-01-08');
      expect(result).toBe(7);
    });

    it('should calculate days between two dates (30 days difference)', () => {
      const result = getDaysBetweenDates('2023-01-01', '2023-01-31');
      expect(result).toBe(30);
    });

    it('should return 0 days for same date', () => {
      const result = getDaysBetweenDates('2023-01-01', '2023-01-01');
      expect(result).toBe(0);
    });

    it('should handle dates in reverse order (end before start)', () => {
      const result = getDaysBetweenDates('2023-01-08', '2023-01-01');
      expect(result).toBe(7); // Should still return positive number
    });
  });

  describe('getDateRangeLabel', () => {
    it('should return "1 day" for 1 day preset', () => {
      const result = getDateRangeLabel('1day', null, null);
      expect(result).toBe('1 day');
    });

    it('should return "7 days" for 7 days preset', () => {
      const result = getDateRangeLabel('7days', null, null);
      expect(result).toBe('7 days');
    });

    it('should return "30 days" for 30 days preset', () => {
      const result = getDateRangeLabel('30days', null, null);
      expect(result).toBe('30 days');
    });

    it('should return "30 days" for custom preset with null dates (fallback)', () => {
      const result = getDateRangeLabel('custom', null, null);
      expect(result).toBe('30 days');
    });

    it('should return "30 days" for custom preset with empty dates (fallback)', () => {
      const result = getDateRangeLabel('custom', '', '');
      expect(result).toBe('30 days');
    });

    it('should calculate days for custom preset with specific dates', () => {
      const result = getDateRangeLabel('custom', '2023-01-01', '2023-01-15');
      expect(result).toBe('15 days');
    });

    it('should return "1 day" for custom preset with same start and end date', () => {
      const result = getDateRangeLabel('custom', '2023-01-01', '2023-01-01');
      expect(result).toBe('1 day');
    });
  });
});