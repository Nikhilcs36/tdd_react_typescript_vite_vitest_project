import React from 'react';
import { useTranslation } from 'react-i18next';
import { UserStats } from '../../types/loginTracking';
import {
  Card,
  CardHeader,
  CardTitle,
  StatsContainer,
  StatItem,
  StatValue,
  StatLabel,
  TrendIndicator,
  TrendValue,
  LoadingSpinner,
  LoadingContainer,
  ErrorMessage
} from './UserDashboardCard.styles';

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
        <LoadingContainer>
          <LoadingSpinner />
        </LoadingContainer>
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
            <TrendValue>
              {userStats.login_trend > 0 ? '+' : ''}{userStats.login_trend}%
            </TrendValue>
            <TrendIndicator $isPositive={userStats.login_trend >= 0}>
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
