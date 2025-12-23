import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardContainer from './DashboardContainer';
import { useSelector } from 'react-redux';
import { getUserStats, getLoginActivity, getLoginTrends, getLoginComparison, getLoginDistribution, getAdminDashboard, getAdminCharts } from '../../services/loginTrackingService';

// Mock the translation function
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' }
  }),
}));

// Mock Redux useSelector
vi.mock('react-redux', () => ({
  useSelector: vi.fn()
}));

// Mock the login tracking service
vi.mock('../../services/loginTrackingService', () => ({
  getUserStats: vi.fn(),
  getLoginActivity: vi.fn(),
  getLoginTrends: vi.fn(),
  getLoginComparison: vi.fn(),
  getLoginDistribution: vi.fn(),
  getAdminDashboard: vi.fn(),
  getAdminCharts: vi.fn()
}));

// Mock child components
vi.mock('./UserDashboardCard', () => ({
  default: ({ userStats, loading }: any) => (
    <div data-testid="user-dashboard-card">
      {loading ? 'Loading...' : userStats ? `User Stats: ${userStats.total_logins}` : 'No stats'}
    </div>
  )
}));

vi.mock('./LoginActivityTable', () => ({
  default: ({ loginActivity, loading }: any) => (
    <div data-testid="login-activity-table">
      {loading ? 'Loading...' : loginActivity.length > 0 ? `Activity: ${loginActivity.length} items` : 'No activity'}
    </div>
  )
}));

vi.mock('./LoginTrendsChart', () => ({
  default: ({ chartData, loading, chartType }: any) => (
    <div data-testid={`${chartType}-chart`}>
      {loading ? 'Loading...' : chartData ? `${chartType} chart` : 'No chart data'}
    </div>
  )
}));

describe('DashboardContainer', () => {
  const mockUserStats = {
    total_logins: 42,
    last_login: '2023-12-22T10:00:00Z',
    weekly_data: { '2023-12-18': 5, '2023-12-19': 7 },
    monthly_data: { '2023-12': 42 },
    login_trend: 15
  };

  const mockLoginActivity = {
    count: 5,
    results: [
      {
        id: 1,
        username: 'testuser',
        timestamp: '2023-12-22T10:00:00Z',
        ip_address: '192.168.1.1',
        user_agent: 'Test Browser',
        success: true
      }
    ]
  };

  const mockChartData = {
    labels: ['Jan', 'Feb', 'Mar'],
    datasets: [{
      label: 'Logins',
      data: [100, 150, 200],
      backgroundColor: ['#ff6384'],
      borderColor: '#36a2eb',
      borderWidth: 2
    }]
  };

  const mockAdminDashboard = {
    total_users: 100,
    active_users: 75,
    total_logins: 1000,
    login_activity: [],
    user_growth: { '2023-12': 10 }
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock useSelector to return authenticated user
    (useSelector as any).mockImplementation((callback: any) => {
      const state = {
        auth: {
          isAuthenticated: true,
          user: { id: 1, username: 'testuser' },
          accessToken: 'test-token'
        }
      };
      return callback(state);
    });
  });

  it('should render loading state initially', async () => {
    // Mock all API calls to be pending
    (getUserStats as any).mockImplementation(() => new Promise(() => {}));
    (getLoginActivity as any).mockImplementation(() => new Promise(() => {}));
    (getLoginTrends as any).mockImplementation(() => new Promise(() => {}));

    render(<DashboardContainer />);

    // The loading state shows a spinner with animation class
    expect(screen.getByTestId('spinner')).toBeInTheDocument();
    
    // The child components should not be visible during loading
    expect(screen.queryByTestId('user-dashboard-card')).not.toBeInTheDocument();
    expect(screen.queryByTestId('login-activity-table')).not.toBeInTheDocument();
    expect(screen.queryByTestId('line-chart')).not.toBeInTheDocument();
  });

  it('should render dashboard with data when all API calls succeed', async () => {
    // Mock successful API responses
    (getUserStats as any).mockResolvedValue(mockUserStats);
    (getLoginActivity as any).mockResolvedValue(mockLoginActivity);
    (getLoginTrends as any).mockResolvedValue(mockChartData);
    (getLoginComparison as any).mockResolvedValue(mockChartData);
    (getLoginDistribution as any).mockResolvedValue(mockChartData);

    render(<DashboardContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('user-dashboard-card')).toHaveTextContent('User Stats: 42');
      expect(screen.getByTestId('login-activity-table')).toHaveTextContent('Activity: 1 items');
      expect(screen.getByTestId('line-chart')).toHaveTextContent('line chart');
      expect(screen.getByTestId('bar-chart')).toHaveTextContent('bar chart');
      expect(screen.getByTestId('pie-chart')).toHaveTextContent('pie chart');
    });
  });

  it('should render error state when critical API calls fail', async () => {
    // Mock some API calls to fail
    (getUserStats as any).mockRejectedValue(new Error('API Error'));
    (getLoginActivity as any).mockResolvedValue(mockLoginActivity);
    (getLoginTrends as any).mockResolvedValue(mockChartData);

    render(<DashboardContainer />);

    await waitFor(() => {
      expect(screen.getByText('dashboard.error_loading_data')).toBeInTheDocument();
    });
  });

  it('should render admin section when isAdmin prop is true', async () => {
    // Mock successful API responses including admin data
    (getUserStats as any).mockResolvedValue(mockUserStats);
    (getLoginActivity as any).mockResolvedValue(mockLoginActivity);
    (getLoginTrends as any).mockResolvedValue(mockChartData);
    (getLoginComparison as any).mockResolvedValue(mockChartData);
    (getLoginDistribution as any).mockResolvedValue(mockChartData);
    (getAdminDashboard as any).mockResolvedValue(mockAdminDashboard);
    (getAdminCharts as any).mockResolvedValue(mockChartData);

    render(<DashboardContainer isAdmin={true} />);

    await waitFor(() => {
      expect(screen.getByText('dashboard.admin_overview')).toBeInTheDocument();
      expect(screen.getByText('dashboard.total_users')).toBeInTheDocument();
      expect(screen.getByText('dashboard.active_users')).toBeInTheDocument();
      expect(screen.getByText('dashboard.total_logins')).toBeInTheDocument();
    });
  });

  it('should handle empty states gracefully', async () => {
    // Mock empty responses
    (getUserStats as any).mockResolvedValue(null);
    (getLoginActivity as any).mockResolvedValue({ count: 0, results: [] });
    (getLoginTrends as any).mockResolvedValue(null);
    (getLoginComparison as any).mockResolvedValue(null);
    (getLoginDistribution as any).mockResolvedValue(null);

    render(<DashboardContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('user-dashboard-card')).toHaveTextContent('No stats');
      expect(screen.getByTestId('login-activity-table')).toHaveTextContent('No activity');
      expect(screen.getByTestId('line-chart')).toHaveTextContent('No chart data');
    });
  });

  it('should not fetch data when no user is authenticated', async () => {
    // Mock useSelector to return unauthenticated state
    (useSelector as any).mockImplementation((callback: any) => {
      const state = {
        auth: {
          isAuthenticated: false,
          user: null,
          accessToken: null
        }
      };
      return callback(state);
    });

    render(<DashboardContainer />);

    await waitFor(() => {
      expect(getUserStats).not.toHaveBeenCalled();
      expect(getLoginActivity).not.toHaveBeenCalled();
      expect(getLoginTrends).not.toHaveBeenCalled();
    });
  });
});
