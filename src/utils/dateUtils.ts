/**
 * Date utility functions for dashboard date filtering
 */

/**
 * Get a date string in YYYY-MM-DD format for a date that is X days ago
 * @param daysAgo Number of days ago from today
 * @returns Date string in YYYY-MM-DD format
 */
export const getDateDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

/**
 * Get today's date string in YYYY-MM-DD format
 * @returns Today's date string
 */
export const getTodayDateString = (): string => {
  return new Date().toISOString().split('T')[0];
};

/**
 * Calculate date range based on preset
 * @param preset The chart date preset
 * @returns Object with startDate and endDate strings
 */
export const getDateRangeFromPreset = (preset: '1day' | '7days' | '30days'): { startDate: string; endDate: string } => {
  const endDate = getTodayDateString();

  switch (preset) {
    case '1day':
      return {
        startDate: getDateDaysAgo(1),
        endDate,
      };
    case '7days':
      return {
        startDate: getDateDaysAgo(7),
        endDate,
      };
    case '30days':
      return {
        startDate: getDateDaysAgo(30),
        endDate,
      };
    default:
      throw new Error(`Unknown preset: ${preset}`);
  }
};