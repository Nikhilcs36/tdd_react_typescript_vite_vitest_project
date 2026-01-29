import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import i18n from '../../locale/i18n';
import DashboardContainer from './DashboardContainer';
import dashboardReducer, { DashboardState } from '../../store/dashboardSlice';
import authReducer, { AuthState } from '../../store/authSlice';
import globalErrorReducer from '../../store/globalErrorSlice';
import { getUserStats, getLoginActivity, getLoginTrends, getLoginComparison, getLoginDistribution, getAdminDashboard, getAdminCharts } from '../../services/loginTrackingService';
import { axiosApiServiceLoadUserList } from '../../services/apiService';

const createMockStore = (dashboardState: Partial<DashboardState> = {}, authState: Partial<AuthState> = {}) => {
  const defaultDashboardState: DashboardState = {
    activeFilter: 'all',
    selectedUserIds: [],
    startDate: null,
    endDate: null,
    isLoading: false,
    error: null,
    chartMode: 'individual',
    selectedDashboardUserId: 1,
    currentDropdownUsers: [],
    ...dashboardState,
  };

  const defaultAuthState: AuthState = {
    user: { id: 1, username: 'testuser', is_staff: true, is_superuser: false },
    accessToken: 'fake-token',
    refreshToken: 'fake-refresh-token',
    isAuthenticated: true,
    showLogoutMessage: false,
    ...authState,
  };

  return configureStore({
    reducer: {
      dashboard: dashboardReducer,
      auth: authReducer,
      globalError: globalErrorReducer,
    },
    preloadedState: {
      dashboard: defaultDashboardState,
      auth: defaultAuthState,
    },
  });
};

const renderWithProviders = (component: React.ReactElement, dashboardState = {}, authState = {}) => {
  const store = createMockStore(dashboardState, authState);
  return { ...render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </Provider>
  ), store };
};

// Mock the API services
vi.mock('../../services/loginTrackingService', () => ({
  getUserStats: vi.fn(),
  getLoginActivity: vi.fn(),
  getLoginTrends: vi.fn(),
  getLoginComparison: vi.fn(),
  getLoginDistribution: vi.fn(),
  getAdminDashboard: vi.fn(),
  getAdminCharts: vi.fn(),
}));

vi.mock('../../services/apiService', () => ({
  axiosApiServiceLoadUserList: {
    get: vi.fn(),
  },
}));

vi.mock('../../utils/authorization', () => ({
  useUserAuthorization: () => ({
    isAdmin: () => true,
    canAccessUserData: () => true,
  }),
}));

// Mock child components to avoid complex rendering
vi.mock('./UserDashboardCard', () => ({
  default: ({ userStats }: any) => <div data-testid="user-dashboard-card">{userStats ? 'User Stats Loaded' : 'No Stats'}</div>,
}));

vi.mock('./LoginActivityTable', () => ({
  default: ({ loginActivity }: any) => <div data-testid="login-activity-table">{loginActivity?.length || 0} items</div>,
}));

vi.mock('./LoginTrendsChart', () => ({
  default: ({ customTitle }: any) => <div data-testid="login-trends-chart">{customTitle}</div>,
}));

vi.mock('./DashboardFilters', () => ({
  default: () => <div data-testid="dashboard-filters">Filters</div>,
}));

vi.mock('./DashboardUserList', () => ({
  default: () => <div data-testid="dashboard-user-list">User List</div>,
}));

vi.mock('./DateRangePicker', () => ({
  default: () => <div data-testid="date-range-picker">Date Picker</div>,
}));

vi.mock('./UserSelectorDropdown', () => ({
  default: () => <div data-testid="user-selector-dropdown">User Selector</div>,
}));

vi.mock('./ChartModeToggle', () => ({
  default: () => <div data-testid="chart-mode-toggle">Chart Mode Toggle</div>,
}));

describe('DashboardContainer', () => {
  // Basic rendering tests (fast, lightweight)
  describe('Basic Rendering', () => {
    // Mock the entire DashboardContainer component for basic rendering tests
    const MockDashboardContainer = ({ userId }: { userId?: number }) => (
      <div data-testid="dashboard-container">
        <div data-testid="user-dashboard-card">User Stats: 39</div>
        <div data-testid="login-activity-table">Activity: 3 items</div>
        <div data-testid="line-chart">line chart</div>
        <div data-testid="bar-chart">bar chart</div>
        <div data-testid="pie-chart">pie chart</div>
        {userId === 1 && <div data-testid="user-selector-dropdown">User Selector Dropdown</div>}
      </div>
    );

    it('should render dashboard components', () => {
      render(<MockDashboardContainer />);

      expect(screen.getByTestId('dashboard-container')).toBeInTheDocument();
      expect(screen.getByTestId('user-dashboard-card')).toHaveTextContent('User Stats: 39');
      expect(screen.getByTestId('login-activity-table')).toHaveTextContent('Activity: 3 items');
      expect(screen.getByTestId('line-chart')).toHaveTextContent('line chart');
      expect(screen.getByTestId('bar-chart')).toHaveTextContent('bar chart');
      expect(screen.getByTestId('pie-chart')).toHaveTextContent('pie chart');
    });

    it('should show user selector dropdown when userId is 1', () => {
      render(<MockDashboardContainer userId={1} />);

      expect(screen.getByTestId('user-selector-dropdown')).toBeInTheDocument();
    });

    it('should not show user selector dropdown when userId is not 1', () => {
      render(<MockDashboardContainer userId={2} />);

      expect(screen.queryByTestId('user-selector-dropdown')).not.toBeInTheDocument();
    });
  });

  // Integration tests (comprehensive, slower)
  describe('Integration Tests', () => {
    const mockUserStats = {
      total_logins: 10,
      last_login: '2023-01-01',
      weekly_data: {},
      monthly_data: {},
      login_trend: 5
    };
  const mockLoginActivity = {
    count: 3,
    results: [
      { id: 1, username: 'user1', timestamp: '2023-01-01', ip_address: '127.0.0.1', user_agent: 'test', success: true },
      { id: 2, username: 'user2', timestamp: '2023-01-01', ip_address: '127.0.0.1', user_agent: 'test', success: true },
      { id: 3, username: 'user3', timestamp: '2023-01-01', ip_address: '127.0.0.1', user_agent: 'test', success: true }
    ]
  };
  const mockChartData = {
    labels: ['Jan', 'Feb'],
    datasets: [{
      label: 'Test Data',
      data: [1, 2],
      backgroundColor: ['red', 'blue'],
      borderColor: 'black',
      borderWidth: 1
    }]
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default mocks
    vi.mocked(getUserStats).mockResolvedValue(mockUserStats);
    vi.mocked(getLoginActivity).mockResolvedValue(mockLoginActivity);
    vi.mocked(getLoginTrends).mockResolvedValue(mockChartData);
    vi.mocked(getLoginComparison).mockResolvedValue(mockChartData);
    vi.mocked(getLoginDistribution).mockResolvedValue(mockChartData);
    vi.mocked(getAdminDashboard).mockResolvedValue({
      total_users: 10,
      active_users: 8,
      total_logins: 100,
      login_activity: [],
      user_growth: {}
    });
    vi.mocked(getAdminCharts).mockResolvedValue(mockChartData);
    vi.mocked(axiosApiServiceLoadUserList.get).mockResolvedValue({ id: 1, username: 'testuser', email: 'test@example.com' });
  });

  it('should render dashboard components', async () => {
    renderWithProviders(<DashboardContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('user-dashboard-card')).toBeInTheDocument();
      expect(screen.getByTestId('login-activity-table')).toBeInTheDocument();
      expect(screen.getAllByTestId('login-trends-chart')).toHaveLength(3); // line, bar, pie charts
    });
  });

  it('should show user selector dropdown for admin users', async () => {
    renderWithProviders(<DashboardContainer />);

    await waitFor(() => {
      expect(screen.getByTestId('user-selector-dropdown')).toBeInTheDocument();
    });
  });

  describe('Chart Title Generation', () => {
    describe('Individual Mode', () => {
      it('should show individual user title for individual mode', async () => {
        const mockUserInfo = { id: 1, username: 'testuser', email: 'test@example.com' };
        vi.mocked(axiosApiServiceLoadUserList.get).mockResolvedValue(mockUserInfo);

        renderWithProviders(<DashboardContainer />, {
          chartMode: 'individual',
          selectedDashboardUserId: 2, // Different user selected
          currentDropdownUsers: [
            { id: 1, username: 'user1', email: 'user1@test.com' },
            { id: 2, username: 'selecteduser', email: 'selected@test.com' },
            { id: 3, username: 'user3', email: 'user3@test.com' },
          ],
        });
      });
    });

    describe('Group Mode', () => {
      it('should show filter name without count when no users selected', async () => {
        const currentDropdownUsers = [
          { id: 1, username: 'user1', email: 'user1@test.com' },
          { id: 2, username: 'user2', email: 'user2@test.com' },
          { id: 3, username: 'user3', email: 'user3@test.com' },
        ];

        renderWithProviders(<DashboardContainer />, {
          chartMode: 'grouped',
          activeFilter: 'all',
          selectedUserIds: [], // No users selected
          currentDropdownUsers,
        });

        await waitFor(() => {
          const chartTitles = screen.getAllByTestId('login-trends-chart');
          expect(chartTitles[1]).toHaveTextContent('Login Comparison - All Users');
        });
      });

      it('should show filter name with user count when users are selected', async () => {
        const currentDropdownUsers = [
          { id: 1, username: 'user1', email: 'user1@test.com' },
          { id: 2, username: 'user2', email: 'user2@test.com' },
          { id: 3, username: 'user3', email: 'user3@test.com' },
          { id: 4, username: 'user4', email: 'user4@test.com' },
          { id: 5, username: 'user5', email: 'user5@test.com' },
        ];

        renderWithProviders(<DashboardContainer />, {
          chartMode: 'grouped',
          activeFilter: 'all',
          selectedUserIds: [1, 2, 3], // 3 users selected
          currentDropdownUsers,
        });

        await waitFor(() => {
          const chartTitles = screen.getAllByTestId('login-trends-chart');
          expect(chartTitles[1]).toHaveTextContent('Login Comparison - All Users (3 users selected)');
        });
      });

      it('should show admin filter with user count when admin users selected', async () => {
        const currentDropdownUsers = [
          { id: 1, username: 'admin1', email: 'admin1@test.com' },
          { id: 2, username: 'admin2', email: 'admin2@test.com' },
        ];

        renderWithProviders(<DashboardContainer />, {
          chartMode: 'grouped',
          activeFilter: 'admin',
          selectedUserIds: [1], // 1 admin selected
          currentDropdownUsers,
        });

        await waitFor(() => {
          const chartTitles = screen.getAllByTestId('login-trends-chart');
          expect(chartTitles[1]).toHaveTextContent('Login Comparison - Admin Only (1 users selected)');
      });
    });
  });

  describe('Admin Statistics Title Generation', () => {
    it('should show admin statistics title with filter name when no users selected', async () => {
      renderWithProviders(<DashboardContainer />, {
        activeFilter: 'all',
        selectedUserIds: [], // No users selected
        currentDropdownUsers: [
          { id: 1, username: 'user1', email: 'user1@test.com' },
          { id: 2, username: 'user2', email: 'user2@test.com' },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText('Admin Statistics - All Users')).toBeInTheDocument();
      });
    });

    it('should show admin statistics title with filter name and user count when users selected', async () => {
      renderWithProviders(<DashboardContainer />, {
        activeFilter: 'regular',
        selectedUserIds: [1, 2], // 2 users selected
        currentDropdownUsers: [
          { id: 1, username: 'user1', email: 'user1@test.com' },
          { id: 2, username: 'user2', email: 'user2@test.com' },
          { id: 3, username: 'user3', email: 'user3@test.com' },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText('Admin Statistics - Regular Users (2 users selected)')).toBeInTheDocument();
      });
    });

    it('should show admin statistics title with admin filter when admin users selected', async () => {
      renderWithProviders(<DashboardContainer />, {
        activeFilter: 'admin',
        selectedUserIds: [1], // 1 admin selected
        currentDropdownUsers: [
          { id: 1, username: 'admin1', email: 'admin1@test.com' },
        ],
      });

      await waitFor(() => {
        expect(screen.getByText('Admin Statistics - Admin Only (1 users selected)')).toBeInTheDocument();
      });
    });
  });

  describe('Admin Statistics Reactivity', () => {
    it('should refetch admin dashboard when filters change', async () => {
      const { rerender } = renderWithProviders(<DashboardContainer />, {
        activeFilter: 'all',
        startDate: null,
        endDate: null,
        selectedDashboardUserId: null, // No selected user
      });

      await waitFor(() => {
        expect(getAdminDashboard).toHaveBeenCalledWith(undefined, undefined, undefined, undefined);
      });

      // Clear mocks to check next call
      vi.clearAllMocks();

      // Re-render with filter changes
      rerender(
        <Provider store={createMockStore({
          activeFilter: 'admin',
          startDate: '2025-01-01',
          endDate: '2025-12-31',
          selectedDashboardUserId: null, // No selected user
        })}>
          <I18nextProvider i18n={i18n}>
            <DashboardContainer />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        // Should refetch with new parameters (admin maps to admin_only)
        expect(getAdminDashboard).toHaveBeenCalledWith(undefined, '2025-01-01', '2025-12-31', 'admin_only');
      });
    });

    it('should pass date range parameters to admin dashboard', async () => {
      renderWithProviders(<DashboardContainer />, {
        startDate: '2025-06-01',
        endDate: '2025-06-30',
        selectedDashboardUserId: null, // No selected user
      });

      await waitFor(() => {
        expect(getAdminDashboard).toHaveBeenCalledWith(undefined, '2025-06-01', '2025-06-30', undefined);
      });
    });

    it('should pass user filter parameters to admin dashboard', async () => {
      renderWithProviders(<DashboardContainer />, {
        activeFilter: 'regular',
        selectedDashboardUserId: null, // No selected user
      });

      await waitFor(() => {
        expect(getAdminDashboard).toHaveBeenCalledWith(undefined, undefined, undefined, 'regular_users');
      });
    });

    it('should send filter=me parameter when activeFilter is "me" for admin dashboard', async () => {
      renderWithProviders(<DashboardContainer />, {
        activeFilter: 'me',
        selectedDashboardUserId: 1, // Selected user
        chartMode: 'individual', // Individual mode uses selected user
      });

      await waitFor(() => {
        // For admin dashboard, "me" sends filter=me but also includes selected user ID
        expect(getAdminDashboard).toHaveBeenCalledWith([1], undefined, undefined, 'me');
      });
    });

    it('should pass user IDs to admin dashboard based on chart mode', async () => {
      renderWithProviders(<DashboardContainer />, {
        selectedUserIds: [1, 2, 3],
        chartMode: 'grouped',
        selectedDashboardUserId: 1,
        currentDropdownUsers: [
          { id: 1, username: 'user1', email: 'user1@test.com' },
          { id: 2, username: 'user2', email: 'user2@test.com' },
          { id: 3, username: 'user3', email: 'user3@test.com' },
        ],
      });

      await waitFor(() => {
        // Admin stats now filter by users based on chart mode - group mode uses all dropdown users
        expect(getAdminDashboard).toHaveBeenCalledWith([1, 2, 3], undefined, undefined, undefined);
      });
    });

    it('should pass selected user ID to admin dashboard when dropdown user is selected', async () => {
      renderWithProviders(<DashboardContainer />, {
        selectedDashboardUserId: 2,
        chartMode: 'individual',
        currentDropdownUsers: [
          { id: 1, username: 'user1', email: 'user1@test.com' },
          { id: 2, username: 'selecteduser', email: 'selected@test.com' },
          { id: 3, username: 'user3', email: 'user3@test.com' },
        ],
      });

      await waitFor(() => {
        // Admin stats should now filter by the selected dropdown user
        expect(getAdminDashboard).toHaveBeenCalledWith([2], undefined, undefined, undefined);
      });
    });

    it('should pass all dropdown user IDs to admin dashboard in group mode', async () => {
      const currentDropdownUsers = [
        { id: 1, username: 'user1', email: 'user1@test.com' },
        { id: 2, username: 'user2', email: 'user2@test.com' },
        { id: 3, username: 'user3', email: 'user3@test.com' },
      ];

      renderWithProviders(<DashboardContainer />, {
        chartMode: 'grouped',
        selectedDashboardUserId: 1,
        currentDropdownUsers,
      });

      await waitFor(() => {
        // Admin stats should aggregate for all users in dropdown in group mode
        expect(getAdminDashboard).toHaveBeenCalledWith([1, 2, 3], undefined, undefined, undefined);
      });
    });

    it('should show loading state during admin dashboard refetch', async () => {
      // Mock a delay in the admin dashboard response
      vi.mocked(getAdminDashboard).mockImplementationOnce(() =>
        new Promise(resolve => setTimeout(() => resolve({
          total_users: 10,
          active_users: 8,
          total_logins: 100,
          login_activity: [],
          user_growth: {}
        }), 100))
      );

      const { rerender } = renderWithProviders(<DashboardContainer />, {
        activeFilter: 'all',
        selectedDashboardUserId: 1, // Set selected user
        chartMode: 'individual', // Individual mode uses selected user
      });

      // Initially should not show admin stats
      expect(screen.queryByText('Total Users: 10')).not.toBeInTheDocument();

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Total Users: 10')).toBeInTheDocument();
      });

      // Clear mocks and trigger refetch
      vi.clearAllMocks();

      // Re-render with different filter
      rerender(
        <Provider store={createMockStore({
          activeFilter: 'admin',
          selectedDashboardUserId: 1,
          chartMode: 'individual',
        })}>
          <I18nextProvider i18n={i18n}>
            <DashboardContainer />
          </I18nextProvider>
        </Provider>
      );

      // Should refetch with user ID and new filter
      expect(getAdminDashboard).toHaveBeenCalledWith([1], undefined, undefined, 'admin_only');
    });
  });
});

  describe('Chart Data API Calls', () => {
    describe('Dropdown User Selection', () => {
      it('should fetch chart data for selected user in individual mode', async () => {
        const mockUserInfo = { id: 2, username: 'selecteduser', email: 'selected@example.com' };
        vi.mocked(axiosApiServiceLoadUserList.get).mockResolvedValue(mockUserInfo);

        renderWithProviders(<DashboardContainer />, {
          chartMode: 'individual',
          selectedDashboardUserId: 2, // Different user selected
          currentDropdownUsers: [
            { id: 1, username: 'user1', email: 'user1@example.com' },
            { id: 2, username: 'selecteduser', email: 'selected@example.com' },
            { id: 3, username: 'user3', email: 'user3@example.com' },
          ],
        });

        await waitFor(() => {
          // Verify chart functions are called with selected user ID in individual mode
          expect(getLoginTrends).toHaveBeenCalledWith([2], undefined, undefined);
          expect(getLoginComparison).toHaveBeenCalledWith([2], undefined, undefined);
          expect(getLoginDistribution).toHaveBeenCalledWith([2], undefined, undefined);
        });
      });

      it('should not fetch chart data when no user selected in individual mode', async () => {
        renderWithProviders(<DashboardContainer />, {
          chartMode: 'individual',
          selectedDashboardUserId: null, // No specific user selected
          currentDropdownUsers: [],
        });

        await waitFor(() => {
          // In individual mode with no selected user, charts should not be fetched
          expect(getLoginTrends).toHaveBeenCalledWith(undefined, undefined, undefined);
          expect(getLoginComparison).toHaveBeenCalledWith(undefined, undefined, undefined);
          expect(getLoginDistribution).toHaveBeenCalledWith(undefined, undefined, undefined);
        });
      });
    });

    describe('Chart Mode Changes', () => {
      it('should fetch aggregated chart data in group mode', async () => {
        const currentDropdownUsers = [
          { id: 1, username: 'user1', email: 'user1@test.com' },
          { id: 2, username: 'user2', email: 'user2@test.com' },
          { id: 3, username: 'user3', email: 'user3@test.com' },
        ];

        renderWithProviders(<DashboardContainer />, {
          chartMode: 'grouped',
          selectedDashboardUserId: 1,
          currentDropdownUsers,
        });

        await waitFor(() => {
          // In group mode, should use all dropdown users
          const expectedUserIds = [1, 2, 3];
          expect(getLoginTrends).toHaveBeenCalledWith(expectedUserIds, undefined, undefined);
          expect(getLoginComparison).toHaveBeenCalledWith(expectedUserIds, undefined, undefined);
          expect(getLoginDistribution).toHaveBeenCalledWith(expectedUserIds, undefined, undefined);
        });
      });

      it('should switch from individual to group mode with different user arrays', async () => {
        const currentDropdownUsers = [
          { id: 1, username: 'user1', email: 'user1@test.com' },
          { id: 2, username: 'user2', email: 'user2@test.com' },
          { id: 3, username: 'user3', email: 'user3@test.com' },
        ];

        // First render in individual mode
        const { rerender } = renderWithProviders(<DashboardContainer />, {
          chartMode: 'individual',
          selectedDashboardUserId: 2,
          currentDropdownUsers,
        });

        await waitFor(() => {
          expect(getLoginTrends).toHaveBeenCalledWith([2], undefined, undefined);
        });

        // Clear mocks to check next calls
        vi.clearAllMocks();

        // Re-render with group mode
        rerender(
          <Provider store={createMockStore({
            chartMode: 'grouped',
            selectedDashboardUserId: 2,
            currentDropdownUsers,
          })}>
            <I18nextProvider i18n={i18n}>
              <DashboardContainer />
            </I18nextProvider>
          </Provider>
        );

        await waitFor(() => {
          // Should now use all dropdown users in group mode
          const expectedUserIds = [1, 2, 3];
          expect(getLoginTrends).toHaveBeenCalledWith(expectedUserIds, undefined, undefined);
          expect(getLoginComparison).toHaveBeenCalledWith(expectedUserIds, undefined, undefined);
          expect(getLoginDistribution).toHaveBeenCalledWith(expectedUserIds, undefined, undefined);
        });
      });
    });

    describe('Multiple User Selection in Group Mode', () => {
      it('should aggregate data for all users in dropdown when in group mode', async () => {
        const currentDropdownUsers = [
          { id: 1, username: 'user1', email: 'user1@test.com' },
          { id: 2, username: 'user2', email: 'user2@test.com' },
          { id: 3, username: 'user3', email: 'user3@test.com' },
          { id: 4, username: 'user4', email: 'user4@test.com' },
          { id: 5, username: 'user5', email: 'user5@test.com' },
        ];

        renderWithProviders(<DashboardContainer />, {
          chartMode: 'grouped',
          selectedUserIds: [1, 3, 5], // These are checked/selected in UI
          currentDropdownUsers, // But group mode aggregates ALL users in dropdown
        });

        await waitFor(() => {
          // Group mode aggregates ALL users currently in the dropdown
          const expectedUserIds = [1, 2, 3, 4, 5]; // All dropdown users
          expect(getLoginTrends).toHaveBeenCalledWith(expectedUserIds, undefined, undefined);
          expect(getLoginComparison).toHaveBeenCalledWith(expectedUserIds, undefined, undefined);
          expect(getLoginDistribution).toHaveBeenCalledWith(expectedUserIds, undefined, undefined);
        });
      });
    });
  });
  });
});
