import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserDashboardCard from './UserDashboardCard';
import { UserStats } from '../../types/loginTracking';

// Mock the translation function
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      const successful = options?.successful !== undefined ? options.successful : '{{successful}}';
      const failed = options?.failed !== undefined ? options.failed : '{{failed}}';
      if (key === 'dashboard.total_logins') {
        return `Total Logins: ${options?.count} (${successful} success, ${failed} failed)`;
      }
      if (key === 'dashboard.user_total_logins_value') {
        return `${options?.count} (${successful} success, ${failed} failed)`;
      }
      if (key === 'dashboard.user_total_logins') {
        return `Total Logins: ${options?.count}`;
      }
      if (key === 'dashboard.user_total_logins_label') {
        return 'Total Logins';
      }
      return key;
    },
    i18n: { language: 'en' }
  }),
}));

describe('UserDashboardCard', () => {
  const mockUserStats: UserStats = {
    total_logins: 42,
    total_successful_logins: 40,
    total_failed_logins: 2,
    last_login: "2025-12-13 14:30:25",
    weekly_data: {"2025-12-07": 5, "2025-12-08": 3, "2025-12-09": 7},
    monthly_data: {"2025-11": 15, "2025-12": 27},
    login_trend: 80
  };

  it('should render user statistics correctly', () => {
    render(<UserDashboardCard userStats={mockUserStats} loading={false} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total Logins')).toBeInTheDocument();
    expect(screen.getByText('dashboard.last_login')).toBeInTheDocument();
    expect(screen.getByText('dashboard.login_trend')).toBeInTheDocument();
  });

  it('should display loading state when loading is true', () => {
    render(<UserDashboardCard userStats={null} loading={true} />);
    
    expect(screen.getByTestId('dashboard-card-loading')).toBeInTheDocument();
    expect(screen.queryByText('42')).not.toBeInTheDocument();
  });

  it('should display error state when userStats is null and not loading', () => {
    render(<UserDashboardCard userStats={null} loading={false} />);
    
    expect(screen.getByText('dashboard.error_loading_data')).toBeInTheDocument();
  });

  it('should show positive trend indicator when login_trend is positive', () => {
    render(<UserDashboardCard userStats={mockUserStats} loading={false} />);
    
    expect(screen.getByText('+80%')).toBeInTheDocument();
  });

  it('should show negative trend indicator when login_trend is negative', () => {
    const negativeStats: UserStats = {
      ...mockUserStats,
      login_trend: -15
    };
    
    render(<UserDashboardCard userStats={negativeStats} loading={false} />);
    
    expect(screen.getByText('-15%')).toBeInTheDocument();
  });

  it('should format last login date correctly', () => {
    render(<UserDashboardCard userStats={mockUserStats} loading={false} />);

    // The component formats the date, so we check for the formatted version
    // The formatted date should include "Dec" (month) and "2025" (year)
    expect(screen.getByText(/Dec/)).toBeInTheDocument();
    expect(screen.getByText(/2025/)).toBeInTheDocument();
  });

  it('should display total logins without breakdown format for user statistics', () => {
    render(<UserDashboardCard userStats={mockUserStats} loading={false} />);

    // Should show label "Total Logins" and the value separately, not the breakdown format
    expect(screen.getByText('Total Logins')).toBeInTheDocument();
    expect(screen.queryByText(/\{\{successful\}\}/)).not.toBeInTheDocument();
    expect(screen.queryByText(/\{\{failed\}\}/)).not.toBeInTheDocument();
  });

  it('should show breakdown for regular user when showBreakdown is true', () => {
    render(<UserDashboardCard userStats={mockUserStats} loading={false} showBreakdown />);

    expect(screen.getByText('42 (40 success, 2 failed)')).toBeInTheDocument();
    expect(screen.getByText('Total Logins')).toBeInTheDocument();
  });

  it('should show plain count for admin when showBreakdown is false', () => {
    render(<UserDashboardCard userStats={mockUserStats} loading={false} showBreakdown={false} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('Total Logins')).toBeInTheDocument();
    expect(screen.queryByText('40 success')).not.toBeInTheDocument();
    expect(screen.queryByText('2 failed')).not.toBeInTheDocument();
  });

  it('should show plain count by default when showBreakdown is not provided', () => {
    render(<UserDashboardCard userStats={mockUserStats} loading={false} />);

    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.queryByText('40 success')).not.toBeInTheDocument();
  });
});
