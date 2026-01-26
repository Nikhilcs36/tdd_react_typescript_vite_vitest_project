import React, { useState, useEffect } from 'react';
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
  const [adminUserIds, setAdminUserIds] = useState<number[]>([]);
  const [selectedUserInfo, setSelectedUserInfo] = useState<{ id: number; username: string; email: string } | null>(null);
  const [selectedGroupUsers, setSelectedGroupUsers] = useState<{ id: number; username: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authorization before fetching data
  useEffect(() => {
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

        // Determine chart filtering based on chart mode and user selections
        let chartUserIds: number[] | undefined;

        if (dashboardState.chartMode === 'individual') {
          // Individual mode: Show charts for the selected dashboard user
          chartUserIds = dashboardState.selectedDashboardUserId ? [dashboardState.selectedDashboardUserId] : undefined;
        } else {
          // Group mode: Show aggregated charts based on selected users or all users
          if (dashboardState.selectedUserIds.length > 0) {
            // If checkboxes are selected, aggregate those users
            chartUserIds = dashboardState.selectedUserIds;
          } else {
            // If no checkboxes selected, aggregate all users (don't filter)
            // chartUserIds remains undefined to indicate "all users"
          }
        }

        // For backward compatibility with filter-based logic, apply filters only in Group mode
        if (dashboardState.chartMode === 'grouped') {
          if (dashboardState.activeFilter === 'admin') {
            // For admin filter, use cached admin user IDs or fetch them
            if (adminUserIds.length > 0) {
              chartUserIds = adminUserIds;
            } else {
              // Fetch admin users first
              try {
                const response: any = await axiosApiServiceLoadUserList.get(
                  API_ENDPOINTS.GET_USERS,
                  1,
                  1000,
                  'admin' // Use the role parameter
                );

                if (Array.isArray(response.results)) {
                  const adminIds = response.results.map((admin: any) => admin.id);
                  setAdminUserIds(adminIds);
                  chartUserIds = adminIds;
                }
              } catch (adminFetchError) {
                console.warn('Failed to fetch admin users for admin filter:', adminFetchError);
                chartUserIds = [];
              }
            }
          } else if (dashboardState.activeFilter === 'regular') {
            // For regular users filter, fetch regular users
            try {
              const response: any = await axiosApiServiceLoadUserList.get(
                API_ENDPOINTS.GET_USERS,
                1,
                1000,
                'regular'
              );

              if (Array.isArray(response.results)) {
                chartUserIds = response.results.map((user: any) => user.id);
              }
            } catch (regularFetchError) {
              console.warn('Failed to fetch regular users for regular filter:', regularFetchError);
              chartUserIds = [];
            }
          } else if (dashboardState.activeFilter === 'me') {
            // For 'me' filter, use current user's ID
            chartUserIds = [currentUserId].filter(Boolean) as number[];
          }
          // For 'all' filter, chartUserIds remains undefined (backend handles aggregated data)
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
          isAdmin() ? getAdminDashboard() : Promise.resolve(null),
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
  }, [currentUserId, userId, isAdmin, canAccessUserData, t, dashboardState.activeFilter, dashboardState.selectedUserIds, dashboardState.selectedDashboardUserId, dashboardState.chartMode, dashboardState.startDate, dashboardState.endDate]);

  // Fetch selected user info for chart titles
  useEffect(() => {
    const fetchSelectedUserInfo = async () => {
      if (dashboardState.selectedDashboardUserId && isAdmin()) {
        try {
          // Use the specific user endpoint instead of filtering the user list
          const response: any = await axiosApiServiceLoadUserList.get(
            API_ENDPOINTS.GET_USER_BY_ID(dashboardState.selectedDashboardUserId)
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

  // Fetch selected group users info for chart titles
  useEffect(() => {
    const fetchSelectedGroupUsers = async () => {
      if (dashboardState.selectedUserIds.length > 0 && isAdmin()) {
        try {
          // Fetch user details for selected IDs
          const userPromises = dashboardState.selectedUserIds.map(userId =>
            axiosApiServiceLoadUserList.get(API_ENDPOINTS.GET_USER_BY_ID(userId))
          );

          const userResponses = await Promise.all(userPromises);
          const users = userResponses
            .filter((response: any) => response && response.id)
            .map((response: any) => ({
              id: response.id,
              username: response.username
            }));

          setSelectedGroupUsers(users);
        } catch (error) {
          console.warn('Failed to fetch selected group users:', error);
          setSelectedGroupUsers([]);
        }
      } else {
        setSelectedGroupUsers([]);
      }
    };

    fetchSelectedGroupUsers();
  }, [dashboardState.selectedUserIds, isAdmin]);

  // Render loading state
  if (loading) {
    return (
      <DashboardContainerWrapper>
        <div className="flex items-center justify-center h-64">
          <div data-testid="spinner" className="w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent animate-spin"></div>
        </div>
      </DashboardContainerWrapper>
    );
  }

  // Render error state
  if (error) {
    return (
      <DashboardContainerWrapper>
        <ErrorMessage>
          {error}
        </ErrorMessage>
      </DashboardContainerWrapper>
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
      // Group mode: Show actual usernames
      if (dashboardState.selectedUserIds.length > 0 && selectedGroupUsers.length > 0) {
        // Format usernames: show first 3, then "+X more" if more than 3
        const maxDisplay = 3;
        const displayedUsers = selectedGroupUsers.slice(0, maxDisplay);
        const remainingCount = selectedGroupUsers.length - maxDisplay;

        const userList = displayedUsers.map(user => user.username).join(', ');
        const suffix = remainingCount > 0 ? `, +${remainingCount} more` : '';

        return `${t(baseKey)} - Group (${userList}${suffix})`;
      } else if (dashboardState.selectedUserIds.length > 0) {
        // Fallback while loading user info
        return `${t(baseKey)} - Group (${dashboardState.selectedUserIds.length} users)`;
      } else {
        // No selection - all users
        return `${t(baseKey)} - All Users`;
      }
    }
    return t(baseKey);
  };

  return (
    <DashboardContainerWrapper>
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
      <DashboardGrid>
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
      <ChartGrid>
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
              {t('dashboard.admin_statistics')}
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {t('dashboard.total_users', { count: adminDashboard.total_users })}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {t('dashboard.active_users', { count: adminDashboard.active_users })}
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              {t('dashboard.total_logins', { count: adminDashboard.total_logins })}
            </p>
          </div>
        </>
      )}
    </DashboardContainerWrapper>
  );
};

export default DashboardContainer;
