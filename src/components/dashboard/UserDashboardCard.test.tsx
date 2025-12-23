import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UserDashboardCard from './UserDashboardCard';
import { UserStats } from '../../types/loginTracking';

// Mock the translation function
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  }),
}));

describe('UserDashboardCard', () => {
  const mockUserStats: UserStats = {
    total_logins: 42,
    last_login: "2025-12-13 14:30:25",
    weekly_data: {"2025-12-07": 5, "2025-12-08": 3, "2025-12-09": 7},
    monthly_data: {"2025-11": 15, "2025-12": 27},
    login_trend: 80
  };

  it('should render user statistics correctly', () => {
    render(<UserDashboardCard userStats={mockUserStats} loading={false} />);
    
    expect(screen.getByText('42')).toBeInTheDocument();
    expect(screen.getByText('dashboard.total_logins')).toBeInTheDocument();
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
});
