import React from 'react';
import { useTranslation } from 'react-i18next';
import { LoginActivityItem } from '../../types/loginTracking';
import {
  TableContainer,
  TableHeader,
  TableTitle,
  TableWrapper,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  StatusBadge,
  LoadingSpinner,
  EmptyState,
  LoadMoreContainer,
  LoadMoreButton,
  AllLoadedMessage
} from './LoginActivityTable.styles';

interface LoginActivityTableProps {
  loginActivity: LoginActivityItem[];
  loading: boolean;
  hasNext?: boolean;
  onLoadMore?: () => void;
  loadMoreLoading?: boolean;
  totalCount?: number;
}

/**
 * LoginActivityTable Component
 * Displays login activity history in a tabular format
 * Shows loading state, empty state, and success state
 * Supports Load More functionality for pagination
 */
const LoginActivityTable: React.FC<LoginActivityTableProps> = React.memo(({
  loginActivity,
  loading,
  hasNext,
  onLoadMore,
  loadMoreLoading = false
}) => {
  const { t } = useTranslation();

  // Format the timestamp for display
  const formatTimestamp = (timestamp: string): string => {
    try {
      const date = new Date(timestamp);
      return date.toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return timestamp; // Return original string if parsing fails
    }
  };

  // Truncate long user agent strings
  const truncateUserAgent = (userAgent: string, maxLength: number = 40): string => {
    if (userAgent.length <= maxLength) return userAgent;
    return userAgent.substring(0, maxLength) + '...';
  };

  // Render loading state
  if (loading) {
    return (
      <TableContainer data-testid="activity-table-loading">
        <TableHeader>
          <TableTitle>{t('dashboard.login_activity')}</TableTitle>
        </TableHeader>
        <div className="flex items-center justify-center h-32">
          <LoadingSpinner />
        </div>
      </TableContainer>
    );
  }

  // Render empty state
  if (loginActivity.length === 0) {
    return (
      <TableContainer>
        <TableHeader>
          <TableTitle>{t('dashboard.login_activity')}</TableTitle>
        </TableHeader>
        <EmptyState>
          {t('dashboard.no_activity_data')}
        </EmptyState>
      </TableContainer>
    );
  }

  // Render table with data
  return (
    <TableContainer>
      <TableHeader>
        <TableTitle>{t('dashboard.login_activity')}</TableTitle>
      </TableHeader>
      <TableWrapper data-testid="table-scroll-wrapper">
        <Table>
          <TableHead>
            <tr>
              <TableHeaderCell>{t('dashboard.row_number', '#')}</TableHeaderCell>
              <TableHeaderCell>{t('dashboard.username')}</TableHeaderCell>
              <TableHeaderCell>{t('dashboard.timestamp')}</TableHeaderCell>
              <TableHeaderCell className="hidden md:table-cell">{t('dashboard.ip_address')}</TableHeaderCell>
              <TableHeaderCell className="hidden md:table-cell">{t('dashboard.user_agent')}</TableHeaderCell>
              <TableHeaderCell>{t('dashboard.status')}</TableHeaderCell>
            </tr>
          </TableHead>
          <TableBody>
            {loginActivity.map((activity, index) => (
              <TableRow key={activity.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell>{activity.username}</TableCell>
                <TableCell>{formatTimestamp(activity.timestamp)}</TableCell>
                <TableCell className="hidden md:table-cell">{activity.ip_address}</TableCell>
                <TableCell title={activity.user_agent} className="hidden md:table-cell">
                  {truncateUserAgent(activity.user_agent)}
                </TableCell>
                <TableCell>
                  <StatusBadge $isSuccess={activity.success}>
                    {activity.success ? t('dashboard.success') : t('dashboard.failed')}
                  </StatusBadge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>

      {/* Load More functionality */}
      <LoadMoreContainer>
        {hasNext && onLoadMore && (
          <LoadMoreButton
            onClick={onLoadMore}
            disabled={loadMoreLoading}
            data-testid="load-more-button"
          >
            {loadMoreLoading ? t('dashboard.loading') : t('dashboard.load_more')}
          </LoadMoreButton>
        )}
        {!hasNext && loginActivity.length > 0 && (
          <AllLoadedMessage data-testid="all-loaded-message">
            {t('dashboard.all_records_loaded')}
          </AllLoadedMessage>
        )}
      </LoadMoreContainer>
    </TableContainer>
  );
});

LoginActivityTable.displayName = 'LoginActivityTable';

export default LoginActivityTable;
