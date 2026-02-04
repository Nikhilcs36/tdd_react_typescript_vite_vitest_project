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
  const [chartsLoading, setChartsLoading] = useState(true);
  const [adminDashboardLoading, setAdminDashboardLoading] = useState(true);

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

      setUserStatsLoading(true);
      setError(null);

      try {
        const targetUserId = isAdmin() ? (dashboardState.selectedDashboardUserId || userId) : userId;
        const startDate = dashboardState.startDate || undefined;
        const endDate = dashboardState.endDate || undefined;

        const response = await getUserStats(targetUserId, startDate, endDate);
        setUserStats(response);
      } catch (err) {
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
      setLoginActivityLoading(true);

      try {
        const targetUserId = isAdmin() ? (dashboardState.selectedDashboardUserId || userId) : userId;
        const startDate = dashboardState.startDate || undefined;
        const endDate = dashboardState.endDate || undefined;

        const response = await getLoginActivity(1, 15, targetUserId, startDate, endDate);
        setLoginActivity(response);
      } catch (err) {
        setLoginActivity(null);
      } finally {
        setLoginActivityLoading(false);
      }
    };

    fetchLoginActivity();
  }, [currentUserId, userId, isAdmin, dashboardState.selectedDashboardUserId, dashboardState.startDate, dashboardState.endDate]);

  // Fetch charts - triggered by chart mode, user selection, and date range changes
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
      } catch (err) {
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
      } catch (err) {
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
            />
          </DashboardGrid>

          {/* Login Activity Section */}
          <SectionTitle>{t('dashboard.recent_activity')}</SectionTitle>
          <LoginActivityTable
            loginActivity={loginActivity?.results || []}
            loading={loginActivityLoading}
          />

          {/* Charts Section */}
          <SectionTitle>{t('dashboard.visualizations')}</SectionTitle>
          <ChartModeToggle disabled={false} />
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
