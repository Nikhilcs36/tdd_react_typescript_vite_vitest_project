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

/**
 * Calculate number of days between two dates
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @returns Number of days between dates
 */
export const getDaysBetweenDates = (startDate: string, endDate: string): number => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  // Calculate difference in milliseconds
  const diffTime = Math.abs(end.getTime() - start.getTime());
  // Convert to days
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
};

/**
 * Get date range label based on preset and dates
 * @param datePreset The date preset (30days, 7days, 1day, custom)
 * @param startDate Start date string or null
 * @param endDate End date string or null
 * @returns Formatted date range label (e.g., "30 days", "15 days")
 */
export const getDateRangeLabel = (
  datePreset: '30days' | '7days' | '1day' | 'custom',
  startDate: string | null,
  endDate: string | null
): string => {
  // Handle preset cases
  if (datePreset === '30days') {
    return '30 days';
  }
  if (datePreset === '7days') {
    return '7 days';
  }
  if (datePreset === '1day') {
    return '1 day';
  }
  
  // Handle custom preset
  if (datePreset === 'custom') {
    // If dates are null or empty, use 30 days as fallback
    if (!startDate || !endDate || startDate === '' || endDate === '') {
      return '30 days';
    }
    
    // Calculate days between dates and add 1 to include both start and end dates
    const days = getDaysBetweenDates(startDate, endDate) + 1;
    
    // Return formatted label
    return `${days} ${days === 1 ? 'day' : 'days'}`;
  }
  
  // Fallback (should not happen)
  return '30 days';
};
