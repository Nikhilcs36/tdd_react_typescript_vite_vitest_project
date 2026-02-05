import React from 'react';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import { UserStats } from '../../types/loginTracking';

// Styled components
const Card = tw.div`bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-4 min-h-[280px]`;
const CardHeader = tw.div`text-center border-b pb-2 dark:border-dark-accent`;
const CardTitle = tw.h3`text-lg font-semibold dark:text-dark-text`;
const StatsContainer = tw.div`mt-4 grid grid-cols-2 gap-4`;
const StatItem = tw.div`text-center`;
const StatValue = tw.div`text-2xl font-bold text-blue-600 dark:text-blue-400`;
const StatLabel = tw.div`text-sm text-gray-600 dark:text-gray-400`;
const TrendIndicator = tw.span`text-sm font-medium ml-1`;
const LoadingSpinner = tw.div`w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`;
const ErrorMessage = tw.div`text-center text-red-500 dark:text-red-400`;

interface UserDashboardCardProps {
  userStats: UserStats | null;
  loading: boolean;
}

/**
 * UserDashboardCard Component
 * Displays user login statistics in a card format
 * Shows loading state, error state, and success state
 */
const UserDashboardCard: React.FC<UserDashboardCardProps> = React.memo(({ userStats, loading }) => {
  const { t } = useTranslation();

  // Format the last login date for display
  const formatLastLogin = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateString; // Return original string if parsing fails
    }
  };

  // Render loading state
  if (loading) {
    return (
      <Card data-testid="dashboard-card-loading">
        <CardHeader>
          <CardTitle>{t('dashboard.loading')}</CardTitle>
        </CardHeader>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </Card>
    );
  }

  // Render error state
  if (!userStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('dashboard.user_stats')}</CardTitle>
        </CardHeader>
        <ErrorMessage>
          {t('dashboard.error_loading_data')}
        </ErrorMessage>
      </Card>
    );
  }

  // Render success state with user statistics
  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('dashboard.user_stats')}</CardTitle>
      </CardHeader>
      <StatsContainer>
        {/* Total Logins */}
        <StatItem>
          <StatValue>{userStats.total_logins}</StatValue>
          <StatLabel>{t('dashboard.user_total_logins', { count: userStats.total_logins })}</StatLabel>
        </StatItem>

        {/* Last Login */}
        <StatItem>
          <StatValue>{formatLastLogin(userStats.last_login)}</StatValue>
          <StatLabel>{t('dashboard.last_login')}</StatLabel>
        </StatItem>

        {/* Login Trend */}
        <StatItem className="col-span-2">
          <div className="flex items-center justify-center">
            <span className="text-lg font-semibold">
              {userStats.login_trend > 0 ? '+' : ''}{userStats.login_trend}%
            </span>
            <TrendIndicator className={userStats.login_trend >= 0 ? 'text-green-600' : 'text-red-600'}>
              {userStats.login_trend >= 0 ? '↗' : '↘'}
            </TrendIndicator>
          </div>
          <StatLabel>{t('dashboard.login_trend')}</StatLabel>
        </StatItem>
      </StatsContainer>
    </Card>
  );
});

UserDashboardCard.displayName = 'UserDashboardCard';

export default UserDashboardCard;
