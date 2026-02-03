import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import tw from 'twin.macro';
import { RootState } from '../../store';
import { UserStats, LoginActivityResponse, ChartData, AdminDashboardData } from '../../types/loginTracking';
import { getUserStats, getLoginActivity, getLoginTrends, getLoginComparison, getLoginDistribution, getAdminDashboard, getAdminCharts } from '../../services/loginTrackingService';
import { axiosApiServiceLoadUserList } from '../../services/apiService';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { useUserAuthorization } from '../../utils/authorization';
import UserDashboardCard from './UserDashboardCard';
import LoginActivityTable from './LoginActivityTable';
import LoginTrendsChart from './LoginTrendsChart';
import DashboardFilters from './DashboardFilters';
import DashboardUserList from './DashboardUserList';
import DateRangePicker from './DateRangePicker';
import UserSelectorDropdown from './UserSelectorDropdown';
import ChartModeToggle from './ChartModeToggle';

// Styled components
const PageContainer = tw.div`min-h-screen bg-gray-50 dark:bg-dark-primary py-8`;
const ContentWrapper = tw.div`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`;
const PageHeader = tw.div`mb-8`;
const Title = tw.h1`text-3xl font-bold text-gray-900 dark:text-dark-text mb-2`;
const Subtitle = tw.p`text-gray-600 dark:text-gray-300`;

const DashboardContainerWrapper = tw.div`container mx-auto px-4 py-8`;
const DashboardGrid = tw.div`grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8`;
const ChartGrid = tw.div`grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8`;
const SectionTitle = tw.h2`text-2xl font-bold mb-6 dark:text-dark-text`;
const ErrorMessage = tw.div`text-center text-red-500 dark:text-red-400 py-8`;

interface DashboardContainerProps {
  userId?: number;
  isAdmin?: boolean;
}

/**
 * DashboardContainer Component
 * Orchestrates the fetching and display of all dashboard components
 * Handles role-based access control and user-specific data fetching
 */
const DashboardContainer: React.FC<DashboardContainerProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { isAdmin, canAccessUserData } = useUserAuthorization();
  const authState = useSelector((state: RootState) => state.auth);
  const dashboardState = useSelector((state: RootState) => state.dashboard);
  const currentUserId = userId || authState.user?.id;
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loginActivity, setLoginActivity] = useState<LoginActivityResponse | null>(null);
  const [loginTrends, setLoginTrends] = useState<ChartData | null>(null);
  const [loginComparison, setLoginComparison] = useState<ChartData | null>(null);
  const [loginDistribution, setLoginDistribution] = useState<ChartData | null>(null);
  const [adminDashboard, setAdminDashboard] = useState<AdminDashboardData | null>(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState<{ id: number; username: string; email: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Refs to prevent multiple concurrent API calls
  const dashboardDataFetchedRef = useRef<string>('');
  const selectedUserInfoFetchedRef = useRef<string>('');

  // Map frontend filter values to backend API values
  const mapFilterToApiValue = (filter: string): string | undefined => {
    switch (filter) {
      case 'all':
        return undefined; // No filter means all users
      case 'admin':
        return 'admin_only';
      case 'regular':
        return 'regular_users';
      case 'me':
        return 'me'; // Send filter=me for backend to filter by current admin user
      default:
        return undefined;
    }
  };

  // Check authorization before fetching data
  useEffect(() => {
    // Create a comprehensive fetch key for all dashboard data dependencies
    const fetchKey = [
      currentUserId,
      userId,
      isAdmin(),
      dashboardState.activeFilter,
      dashboardState.selectedUserIds?.slice().sort().join(','),
      dashboardState.selectedDashboardUserId,
      dashboardState.currentDropdownUsers?.map(u => u.id).sort().join(','),
      dashboardState.chartMode,
      dashboardState.startDate,
      dashboardState.endDate
    ].join('|');

    // Prevent multiple concurrent fetches for the same parameters
    if (dashboardDataFetchedRef.current === fetchKey) {
      return;
    }

    dashboardDataFetchedRef.current = fetchKey;

    const fetchDashboardData = async () => {
      if (!currentUserId) {
        setError(t('dashboard.user_not_found'));
        setLoading(false);
        return;
      }

      // Check if user can access the requested dashboard data
      if (!canAccessUserData(currentUserId)) {
        setError(t('dashboard.unauthorized_access'));
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Determine which user data to fetch based on authorization and dropdown selection
        let targetUserId: number | undefined;

        if (isAdmin()) {
          // For admins, use the selected dashboard user from dropdown, or fallback to passed userId
          targetUserId = dashboardState.selectedDashboardUserId || userId;
        } else {
          // For regular users, use passed userId or current user
          targetUserId = userId;
        }

        // Get date range from state
        const startDate = dashboardState.startDate || undefined;
        const endDate = dashboardState.endDate || undefined;

        // Determine chart filtering based on chart mode and dropdown users
        let chartUserIds: number[] | undefined;

        if (dashboardState.chartMode === 'individual') {
          // Individual mode: Show charts for the selected dashboard user
          chartUserIds = dashboardState.selectedDashboardUserId ? [dashboardState.selectedDashboardUserId] : undefined;
        } else {
          // Group mode: Show aggregated charts for all users currently in the dropdown
          chartUserIds = dashboardState.currentDropdownUsers.map(user => user.id);
        }

        // Determine admin dashboard filtering parameters
        let adminUserIds: number[] | undefined;
        let adminFilter: string | undefined;

        if (isAdmin()) {
          // Admin statistics now respond to dropdown selection like user stats
          if (dashboardState.chartMode === 'individual') {
            // Individual mode: Show admin stats for the selected dashboard user
            adminUserIds = dashboardState.selectedDashboardUserId ? [dashboardState.selectedDashboardUserId] : undefined;
          } else {
            // Group mode: Show aggregated admin stats for all users currently in the dropdown
            adminUserIds = dashboardState.currentDropdownUsers.map(user => user.id);
          }

          // Still apply filter if needed (can be combined with user selection)
          adminFilter = mapFilterToApiValue(dashboardState.activeFilter);
        }

        // Execute all API calls in parallel
        const [
          userStatsResponse,
          loginActivityResponse,
          trendsResponse,
          comparisonResponse,
          distributionResponse,
          adminDashboardResponse,
          adminChartsResponse
        ] = await Promise.allSettled([
          getUserStats(targetUserId, startDate, endDate),
          getLoginActivity(1, 15, targetUserId, startDate, endDate),
          getLoginTrends(chartUserIds, startDate, endDate),
          getLoginComparison(chartUserIds, startDate, endDate),
          getLoginDistribution(chartUserIds, startDate, endDate),
          isAdmin() ? getAdminDashboard(adminUserIds, startDate, endDate, adminFilter) : Promise.resolve(null),
          isAdmin() ? getAdminCharts() : Promise.resolve(null)
        ]);

        // Process responses
        if (userStatsResponse.status === 'fulfilled') {
          setUserStats(userStatsResponse.value);
        }

        if (loginActivityResponse.status === 'fulfilled') {
          setLoginActivity(loginActivityResponse.value);
        }

        if (trendsResponse.status === 'fulfilled') {
          setLoginTrends(trendsResponse.value);
        }

        if (comparisonResponse.status === 'fulfilled') {
          setLoginComparison(comparisonResponse.value);
        }

        if (distributionResponse.status === 'fulfilled') {
          setLoginDistribution(distributionResponse.value);
        }

        if (isAdmin() && adminDashboardResponse.status === 'fulfilled') {
          setAdminDashboard(adminDashboardResponse.value);
        }

        if (isAdmin() && adminChartsResponse.status === 'fulfilled') {
          // Admin charts data is available but not currently used in the UI
        }

        // Check if any critical requests failed
        const criticalFailures = [
          userStatsResponse.status === 'rejected',
          loginActivityResponse.status === 'rejected',
          trendsResponse.status === 'rejected'
        ];

        if (criticalFailures.some(failed => failed)) {
          setError(t('dashboard.error_loading_data'));
        }

      } catch (err) {
        setError(t('dashboard.error_loading_data'));
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentUserId, userId, isAdmin, canAccessUserData, t, dashboardState.activeFilter, dashboardState.selectedUserIds, dashboardState.selectedDashboardUserId, dashboardState.currentDropdownUsers, dashboardState.chartMode, dashboardState.startDate, dashboardState.endDate]);

  // Fetch selected user info for chart titles
  useEffect(() => {
    const userId = dashboardState.selectedDashboardUserId;
    const fetchKey = `user-${userId}`;

    // Prevent multiple concurrent fetches for the same user
    if (selectedUserInfoFetchedRef.current === fetchKey) {
      return;
    }

    selectedUserInfoFetchedRef.current = fetchKey;

    const fetchSelectedUserInfo = async () => {
      if (userId && isAdmin()) {
        try {
          // Use the specific user endpoint instead of filtering the user list
          const response: any = await axiosApiServiceLoadUserList.get(
            API_ENDPOINTS.GET_USER_BY_ID(userId)
          );

          if (response && response.id) {
            setSelectedUserInfo({
              id: response.id,
              username: response.username,
              email: response.email
            });
          }
        } catch (error) {
          console.warn('Failed to fetch selected user info:', error);
          setSelectedUserInfo(null);
        }
      } else {
        setSelectedUserInfo(null);
      }
    };

    fetchSelectedUserInfo();
  }, [dashboardState.selectedDashboardUserId, isAdmin]);

  // Note: selectedGroupUsers fetching was removed as it's no longer needed

  // Render loading state
  if (loading) {
    return (
      <PageContainer data-testid="dashboard-page-container">
        <ContentWrapper data-testid="dashboard-content-wrapper">
          <PageHeader data-testid="dashboard-page-header">
            <Title data-testid="dashboard-title">{t('dashboard.title')}</Title>
            <Subtitle data-testid="dashboard-subtitle">{t('dashboard.subtitle')}</Subtitle>
          </PageHeader>
          <DashboardContainerWrapper data-testid="dashboard-main-container">
            <div className="flex items-center justify-center h-64">
              <div data-testid="spinner" className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
            </div>
          </DashboardContainerWrapper>
        </ContentWrapper>
      </PageContainer>
    );
  }

  // Render error state
  if (error) {
    return (
      <PageContainer data-testid="dashboard-page-container">
        <ContentWrapper data-testid="dashboard-content-wrapper">
          <PageHeader data-testid="dashboard-page-header">
            <Title data-testid="dashboard-title">{t('dashboard.title')}</Title>
            <Subtitle data-testid="dashboard-subtitle">{t('dashboard.subtitle')}</Subtitle>
          </PageHeader>
          <DashboardContainerWrapper data-testid="dashboard-main-container">
            <ErrorMessage>
              {error}
            </ErrorMessage>
          </DashboardContainerWrapper>
        </ContentWrapper>
      </PageContainer>
    );
  }

  // Generate custom chart titles based on chart mode and user selection
  const getChartTitle = (baseKey: string) => {
    if (dashboardState.chartMode === 'individual') {
      // Individual mode: Show selected username only
      if (selectedUserInfo && isAdmin()) {
        return `${t(baseKey)} - ${selectedUserInfo.username}`;
      } else if (dashboardState.selectedDashboardUserId && isAdmin()) {
        // Fallback if user info not loaded yet
        return `${t(baseKey)} - ${t('dashboard.user_selector.label').toLowerCase()}`;
      }
    } else {
      // Group mode: Show filter type with user count if users are selected
      const filterLabels = {
        all: t('dashboard.filters.allUsers'),
        admin: t('dashboard.filters.adminOnly'),
        regular: t('dashboard.filters.regularUsers'),
        me: t('dashboard.filters.me'),
      };
      const filterLabel = filterLabels[dashboardState.activeFilter] || t('dashboard.filters.allUsers');

      // Add user count if any users are selected
      if (dashboardState.selectedUserIds.length > 0) {
        const selectedCount = dashboardState.selectedUserIds.length;
        return `${t(baseKey)} - ${filterLabel} (${selectedCount} users selected)`;
      }

      return `${t(baseKey)} - ${filterLabel}`;
    }
    return t(baseKey);
  };

  // Generate custom admin statistics title based on filter and user selection
  const getAdminStatsTitle = () => {
    const filterLabels = {
      all: t('dashboard.filters.allUsers'),
      admin: t('dashboard.filters.adminOnly'),
      regular: t('dashboard.filters.regularUsers'),
      me: t('dashboard.filters.me'),
    };
    const filterLabel = filterLabels[dashboardState.activeFilter] || t('dashboard.filters.allUsers');

    // Add user count if any users are selected
    if (dashboardState.selectedUserIds.length > 0) {
      const selectedCount = dashboardState.selectedUserIds.length;
      return `${t('dashboard.admin_statistics')} - ${filterLabel} (${selectedCount} users selected)`;
    }

    return `${t('dashboard.admin_statistics')} - ${filterLabel}`;
  };

  return (
    <PageContainer data-testid="dashboard-page-container">
      <ContentWrapper data-testid="dashboard-content-wrapper">
        <PageHeader data-testid="dashboard-page-header">
          <Title data-testid="dashboard-title">{t('dashboard.title')}</Title>
          <Subtitle data-testid="dashboard-subtitle">{t('dashboard.subtitle')}</Subtitle>
        </PageHeader>

        <DashboardContainerWrapper data-testid="dashboard-main-container">
          {/* Date Range Picker - Show for all users */}
          <DateRangePicker disabled={loading} />

          {/* Dashboard Filters - Only show for admins */}
          {isAdmin() && (
            <DashboardFilters
              disabled={loading}
            />
          )}

          {/* User List Section - Only show for admins */}
          {isAdmin() && (
            <DashboardUserList />
          )}

          {/* User Selector Dropdown - Only show for admins */}
          {isAdmin() && (
            <UserSelectorDropdown disabled={loading} />
          )}

          {/* User Statistics Section */}
          <SectionTitle>{t('dashboard.user_statistics')}</SectionTitle>
          <DashboardGrid data-testid="dashboard-grid">
            <UserDashboardCard
              userStats={userStats}
              loading={false}
            />
          </DashboardGrid>

          {/* Login Activity Section */}
          <SectionTitle>{t('dashboard.recent_activity')}</SectionTitle>
          <LoginActivityTable
            loginActivity={loginActivity?.results || []}
            loading={false}
          />

          {/* Charts Section */}
          <SectionTitle>{t('dashboard.visualizations')}</SectionTitle>
          <ChartModeToggle disabled={loading} />
          <ChartGrid data-testid="dashboard-chart-grid">
            <LoginTrendsChart
              chartData={loginTrends}
              loading={false}
              chartType="line"
              customTitle={getChartTitle('dashboard.login_trends')}
            />
            <LoginTrendsChart
              chartData={loginComparison}
              loading={false}
              chartType="bar"
              customTitle={getChartTitle('dashboard.login_comparison')}
            />
            <LoginTrendsChart
              chartData={loginDistribution}
              loading={false}
              chartType="pie"
              customTitle={getChartTitle('dashboard.login_distribution')}
            />
          </ChartGrid>

          {/* Admin Dashboard Section (if applicable) */}
          {isAdmin() && adminDashboard && (
            <>
              <SectionTitle>{t('dashboard.admin_overview')}</SectionTitle>
              {/* Admin-specific components would go here */}
              <div className="p-6 mb-8 bg-white rounded-lg shadow-lg dark:bg-dark-secondary">
                <h3 className="mb-4 text-lg font-semibold dark:text-dark-text">
                  {getAdminStatsTitle()}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('dashboard.total_users', { count: adminDashboard.total_users })}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('dashboard.active_users', { count: adminDashboard.active_users })}
                </p>
                <p className="text-gray-600 dark:text-gray-400">
                  {t('dashboard.total_logins', {
                    count: adminDashboard.total_logins,
                    successful: adminDashboard.total_successful_logins,
                    failed: adminDashboard.total_failed_logins
                  })}
                </p>
              </div>
            </>
          )}
        </DashboardContainerWrapper>
      </ContentWrapper>
    </PageContainer>
  );
};

export default DashboardContainer;
