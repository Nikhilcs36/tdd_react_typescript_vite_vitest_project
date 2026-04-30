import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import tw from 'twin.macro';
import { RootState } from '../../store';
import { UserStats, LoginActivityResponse, ChartData, AdminDashboardData } from '../../types/loginTracking';
import { getUserStats, getLoginActivity, getLoginTrends, getLoginComparison, getLoginDistribution, getAdminDashboard } from '../../services/loginTrackingService';
import { axiosApiServiceLoadUserList } from '../../services/apiService';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import { useUserAuthorization } from '../../utils/authorization';
import { getDateRangeLabel } from '../../utils/dateUtils';
import UserDashboardCard from './UserDashboardCard';
import LoginActivityTable from './LoginActivityTable';
import LoginTrendsChart from './LoginTrendsChart';
import DashboardFilters from './DashboardFilters';
import DashboardUserList from './DashboardUserList';
import DateRangePicker from './DateRangePicker';
import UserSelectorDropdown from './UserSelectorDropdown';
import ChartModeToggle from './ChartModeToggle';
import {
  DashboardContainerWrapper,
  DashboardGrid,
  ChartGrid,
  SectionTitle,
  AdminOverviewCard,
  AdminOverviewLoading,
  AdminOverviewSpinner,
  AdminOverviewTitle,
  AdminOverviewStat,
  AdminOverviewError
} from './DashboardContainer.styles';

// Page styled components
const PageContainer = tw.div`min-h-screen bg-gray-50 dark:bg-dark-primary py-8`;
const ContentWrapper = tw.div`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`;
const PageHeader = tw.div`mb-8`;
const Title = tw.h1`text-3xl font-bold text-gray-900 dark:text-dark-text mb-2`;
const Subtitle = tw.p`text-gray-600 dark:text-gray-300`;


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

  // Granular loading states instead of global loading
  const [userStatsLoading, setUserStatsLoading] = useState(true);
  const [loginActivityLoading, setLoginActivityLoading] = useState(true);
  const [loginActivityLoadMoreLoading, setLoginActivityLoadMoreLoading] = useState(false);
  const [chartsLoading, setChartsLoading] = useState(true);
  const [adminDashboardLoading, setAdminDashboardLoading] = useState(true);

  const [_error, setError] = useState<string | null>(null);

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

  // Fetch user stats - triggered by user selection and date range changes
  useEffect(() => {
    const fetchKey = [currentUserId, dashboardState.selectedDashboardUserId, dashboardState.startDate, dashboardState.endDate].join('|');

    if (dashboardDataFetchedRef.current === fetchKey) {
      return;
    }

    dashboardDataFetchedRef.current = fetchKey;

    const fetchUserStats = async () => {
      if (!currentUserId) {
        setError(t('dashboard.user_not_found'));
        setUserStatsLoading(false);
        return;
      }

      if (!canAccessUserData(currentUserId)) {
        setError(t('dashboard.unauthorized_access'));
        setUserStatsLoading(false);
        return;
      }

      // Don't fetch if we're an admin and don't have a selected user yet
      if (isAdmin() && !dashboardState.selectedDashboardUserId) {
        setUserStats(null);
        setUserStatsLoading(false);
        return;
      }

      setUserStatsLoading(true);
      setError(null);

      try {
        const targetUserId = isAdmin() ? (dashboardState.selectedDashboardUserId || userId) : userId;
        const startDate = dashboardState.startDate || undefined;
        const endDate = dashboardState.endDate || undefined;

        const response = await getUserStats(targetUserId, startDate, endDate);
        setUserStats(response);
      } catch (_err: unknown) {
        setError(t('dashboard.error_loading_data'));
        setUserStats(null);
      } finally {
        setUserStatsLoading(false);
      }
    };

    fetchUserStats();
  }, [currentUserId, userId, isAdmin, canAccessUserData, t, dashboardState.selectedDashboardUserId, dashboardState.startDate, dashboardState.endDate]);

  // Fetch login activity - triggered by user selection and date range changes
  useEffect(() => {
    const fetchLoginActivity = async () => {
      // Don't fetch if we're an admin and don't have a selected user yet
      if (isAdmin() && !dashboardState.selectedDashboardUserId) {
        setLoginActivity(null);
        setLoginActivityLoading(false);
        return;
      }

      setLoginActivityLoading(true);

      try {
        const targetUserId = isAdmin() ? (dashboardState.selectedDashboardUserId || userId) : userId;
        const startDate = dashboardState.startDate || undefined;
        const endDate = dashboardState.endDate || undefined;

        // Use maximum page size (100) to get as many records as possible initially
        const response = await getLoginActivity(1, 100, targetUserId, startDate, endDate);
        setLoginActivity(response);
      } catch (_err: unknown) {
        setLoginActivity(null);
      } finally {
        setLoginActivityLoading(false);
      }
    };

    fetchLoginActivity();
  }, [currentUserId, userId, isAdmin, dashboardState.selectedDashboardUserId, dashboardState.startDate, dashboardState.endDate]);

  // Load more login activity records
  const loadMoreLoginActivity = async () => {
    if (!loginActivity || loginActivityLoadMoreLoading) {
      return;
    }

    setLoginActivityLoadMoreLoading(true);

    try {
      const targetUserId = isAdmin() ? (dashboardState.selectedDashboardUserId || userId) : userId;
      const startDate = dashboardState.startDate || undefined;
      const endDate = dashboardState.endDate || undefined;

      // Calculate next page number based on current results length and page size (100)
      const nextPage = Math.floor(loginActivity.results.length / 100) + 1;

      const response = await getLoginActivity(nextPage, 100, targetUserId, startDate, endDate);

      // Append new results to existing ones and update the response
      setLoginActivity({
        ...response,
        results: [...loginActivity.results, ...response.results]
      });
    } catch (_err: unknown) {
      // Keep existing data on error - don't show error to user for load more failures
      console.warn('Failed to load more login activity:', _err);
    } finally {
      setLoginActivityLoadMoreLoading(false);
    }
  };

  // Fetch charts - triggered by chart mode, user selection, and global date range changes
  useEffect(() => {
    const fetchCharts = async () => {
      setChartsLoading(true);

      try {
        const startDate = dashboardState.startDate || undefined;
        const endDate = dashboardState.endDate || undefined;

        let chartUserIds: number[] | undefined;
        if (dashboardState.chartMode === 'individual') {
          chartUserIds = dashboardState.selectedDashboardUserId ? [dashboardState.selectedDashboardUserId] : undefined;
        } else {
          chartUserIds = dashboardState.currentDropdownUsers.map(user => user.id);
        }

        const [trendsResponse, comparisonResponse, distributionResponse] = await Promise.allSettled([
          getLoginTrends(chartUserIds, startDate, endDate),
          getLoginComparison(chartUserIds, startDate, endDate),
          getLoginDistribution(chartUserIds, startDate, endDate)
        ]);

        if (trendsResponse.status === 'fulfilled') {
          setLoginTrends(trendsResponse.value);
        }
        if (comparisonResponse.status === 'fulfilled') {
          setLoginComparison(comparisonResponse.value);
        }
        if (distributionResponse.status === 'fulfilled') {
          setLoginDistribution(distributionResponse.value);
        }
      } catch (_err: unknown) {
        setLoginTrends(null);
        setLoginComparison(null);
        setLoginDistribution(null);
      } finally {
        setChartsLoading(false);
      }
    };

    fetchCharts();
  }, [dashboardState.chartMode, dashboardState.selectedDashboardUserId, dashboardState.currentDropdownUsers, dashboardState.startDate, dashboardState.endDate]);

  // Fetch admin dashboard - triggered by admin filters, user selection, and date range changes
  useEffect(() => {
    if (!isAdmin()) {
      setAdminDashboardLoading(false);
      return;
    }

    const fetchAdminDashboard = async () => {
      // Don't fetch if we're in individual mode and don't have a selected user yet
      if (dashboardState.chartMode === 'individual' && !dashboardState.selectedDashboardUserId) {
        setAdminDashboard(null);
        setAdminDashboardLoading(false);
        return;
      }

      // Don't fetch if we're in group mode and don't have any users in dropdown
      if (dashboardState.chartMode === 'grouped' && dashboardState.currentDropdownUsers.length === 0) {
        setAdminDashboard(null);
        setAdminDashboardLoading(false);
        return;
      }

      setAdminDashboardLoading(true);

      try {
        const startDate = dashboardState.startDate || undefined;
        const endDate = dashboardState.endDate || undefined;

        let adminUserIds: number[] | undefined;
        if (dashboardState.chartMode === 'individual') {
          adminUserIds = dashboardState.selectedDashboardUserId ? [dashboardState.selectedDashboardUserId] : undefined;
        } else {
          adminUserIds = dashboardState.currentDropdownUsers.map(user => user.id);
        }

        const adminFilter = mapFilterToApiValue(dashboardState.activeFilter);

        const [adminDashboardResponse] = await Promise.allSettled([
          getAdminDashboard(adminUserIds, startDate, endDate, adminFilter)
        ]);

        if (adminDashboardResponse.status === 'fulfilled') {
          setAdminDashboard(adminDashboardResponse.value);
        }
      } catch (_err: unknown) {
        setAdminDashboard(null);
      } finally {
        setAdminDashboardLoading(false);
      }
    };

    fetchAdminDashboard();
  }, [isAdmin, dashboardState.activeFilter, dashboardState.chartMode, dashboardState.selectedDashboardUserId, dashboardState.currentDropdownUsers, dashboardState.startDate, dashboardState.endDate]);

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
        // FIRST: Check if user exists in currentDropdownUsers and set immediately
        const userFromDropdown = dashboardState.currentDropdownUsers.find(
          user => user.id === userId
        );
        
        if (userFromDropdown) {
          setSelectedUserInfo({
            id: userFromDropdown.id,
            username: userFromDropdown.username,
            email: userFromDropdown.email
          });
        }

        try {
          // SECOND: Fetch fresh data from API (optional, for completeness)
          const response = await axiosApiServiceLoadUserList.get<{
            id: number;
            username: string;
            email: string;
          }>(API_ENDPOINTS.GET_USER_BY_ID(userId));

          if (response && response.id) {
            setSelectedUserInfo({
              id: response.id,
              username: response.username,
              email: response.email
            });
          }
        } catch (_error: unknown) {
          console.warn('Failed to fetch selected user info:', _error);
          // Don't clear selectedUserInfo if we already have it from dropdown
          if (!userFromDropdown) {
            setSelectedUserInfo(null);
          }
        }
      } else {
        setSelectedUserInfo(null);
      }
    };

    fetchSelectedUserInfo();
  }, [dashboardState.selectedDashboardUserId, dashboardState.currentDropdownUsers, isAdmin]);

  // Note: selectedGroupUsers fetching was removed as it's no longer needed

  // Calculate date range label
  const dateRangeLabel = getDateRangeLabel(
    dashboardState.datePreset,
    dashboardState.startDate,
    dashboardState.endDate
  );

  // Generate custom chart titles based on chart mode and user selection
  const getChartTitle = (baseKey: string) => {
    if (dashboardState.chartMode === 'individual') {
      // Individual mode: Show selected username only
      
      // FIRST: Try to get username from currentDropdownUsers (immediate, no API call needed)
      const selectedUserFromDropdown = dashboardState.currentDropdownUsers.find(
        user => user.id === dashboardState.selectedDashboardUserId
      );
      
      if (selectedUserFromDropdown && isAdmin()) {
        return `${t(baseKey)} - ${selectedUserFromDropdown.username}`;
      }
      
      // SECOND: Try selectedUserInfo from API (if already loaded)
      if (selectedUserInfo && isAdmin()) {
        return `${t(baseKey)} - ${selectedUserInfo.username}`;
      }
      
      // THIRD: Fallback (better than "Select User")
      if (dashboardState.selectedDashboardUserId && isAdmin()) {
        return `${t(baseKey)} - ${t('dashboard.user')}`; // Shows "User" instead of "Select User"
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
    if (dashboardState.chartMode === 'individual') {
      // Individual mode: Show selected username only
      
      // FIRST: Try to get username from currentDropdownUsers (immediate, no API call needed)
      const selectedUserFromDropdown = dashboardState.currentDropdownUsers.find(
        user => user.id === dashboardState.selectedDashboardUserId
      );
      
      if (selectedUserFromDropdown && isAdmin()) {
        return `${t('dashboard.admin_statistics')} - ${selectedUserFromDropdown.username}`;
      }
      
      // SECOND: Try selectedUserInfo from API (if already loaded)
      if (selectedUserInfo && isAdmin()) {
        return `${t('dashboard.admin_statistics')} - ${selectedUserInfo.username}`;
      }
      
      // THIRD: Fallback (better than "Select User")
      if (dashboardState.selectedDashboardUserId && isAdmin()) {
        return `${t('dashboard.admin_statistics')} - ${t('dashboard.user')}`; // Shows "User" instead of "Select User"
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
        return `${t('dashboard.admin_statistics')} - ${filterLabel} (${selectedCount} users selected)`;
      }

      return `${t('dashboard.admin_statistics')} - ${filterLabel}`;
    }
    return t('dashboard.admin_statistics');
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
          <DateRangePicker disabled={false} />

          {/* Dashboard Filters - Only show for admins */}
          {isAdmin() && (
            <DashboardFilters
              disabled={false}
            />
          )}

          {/* User List Section - Only show for admins */}
          {isAdmin() && (
            <DashboardUserList />
          )}

          {/* User Selector Dropdown - Only show for admins */}
          {isAdmin() && (
            <UserSelectorDropdown disabled={false} />
          )}

          {/* User Statistics Section */}
          <SectionTitle>{t('dashboard.user_statistics')}</SectionTitle>
          <DashboardGrid data-testid="dashboard-grid">
            <UserDashboardCard
              userStats={userStats}
              loading={userStatsLoading}
              showBreakdown={!isAdmin()}
            />
          </DashboardGrid>

          {/* Login Activity Section */}
          <SectionTitle>{t('dashboard.recent_activity')}</SectionTitle>
          <LoginActivityTable
            loginActivity={loginActivity?.results || []}
            loading={loginActivityLoading}
            hasNext={loginActivity ? loginActivity.results.length < loginActivity.count : false}
            onLoadMore={loadMoreLoginActivity}
            loadMoreLoading={loginActivityLoadMoreLoading}
            totalCount={loginActivity?.count}
          />

          {/* Charts Section */}
          <SectionTitle>{t('dashboard.visualizations')}</SectionTitle>
          <ChartModeToggle disabled={false} dateRangeLabel={dateRangeLabel} />
          <ChartGrid data-testid="dashboard-chart-grid">
            <LoginTrendsChart
              chartData={loginTrends}
              loading={chartsLoading}
              chartType="line"
              customTitle={getChartTitle('dashboard.login_trends')}
            />
            <LoginTrendsChart
              chartData={loginComparison}
              loading={chartsLoading}
              chartType="bar"
              customTitle={getChartTitle('dashboard.login_comparison')}
            />
            <LoginTrendsChart
              chartData={loginDistribution}
              loading={chartsLoading}
              chartType="pie"
              customTitle={getChartTitle('dashboard.login_distribution')}
            />
          </ChartGrid>

          {/* Admin Dashboard Section (if applicable) */}
          {isAdmin() && (
            <>
              <SectionTitle>{t('dashboard.admin_overview')}</SectionTitle>
              {/* Admin-specific components would go here */}
              <AdminOverviewCard>
                {adminDashboardLoading ? (
                  <AdminOverviewLoading>
                    <AdminOverviewSpinner />
                  </AdminOverviewLoading>
                ) : adminDashboard ? (
                  <>
                    <AdminOverviewTitle>
                      {getAdminStatsTitle()}
                    </AdminOverviewTitle>
                    <AdminOverviewStat>
                      {t('dashboard.total_users', { count: adminDashboard.total_users })}
                    </AdminOverviewStat>
                    <AdminOverviewStat>
                      {t('dashboard.total_logins', {
                        count: adminDashboard.total_logins,
                        successful: adminDashboard.total_successful_logins,
                        failed: adminDashboard.total_failed_logins
                      })}
                    </AdminOverviewStat>
                  </>
                ) : (
                  <AdminOverviewError>
                    {t('dashboard.error_loading_data')}
                  </AdminOverviewError>
                )}
              </AdminOverviewCard>
            </>
          )}
        </DashboardContainerWrapper>
      </ContentWrapper>
    </PageContainer>
  );
};

export default DashboardContainer;
