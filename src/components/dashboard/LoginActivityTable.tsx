import React from 'react';
import { useTranslation } from 'react-i18next';
import tw from 'twin.macro';
import { LoginActivityItem } from '../../types/loginTracking';

// Styled components
const TableContainer = tw.div`bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-4`;
const TableHeader = tw.div`text-center border-b pb-2 dark:border-dark-accent`;
const TableTitle = tw.h3`text-lg font-semibold dark:text-dark-text`;
const Table = tw.table`w-full mt-4`;
const TableHead = tw.thead`bg-gray-50 dark:bg-gray-800`;
const TableHeaderCell = tw.th`px-4 py-2 text-left text-sm font-medium text-gray-700 dark:text-gray-300`;
const TableBody = tw.tbody`divide-y divide-gray-200 dark:divide-gray-700`;
const TableRow = tw.tr`hover:bg-gray-50 dark:hover:bg-gray-800`;
const TableCell = tw.td`px-4 py-2 text-sm text-gray-700 dark:text-gray-300`;
const LoadingSpinner = tw.div`w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`;
const EmptyState = tw.div`text-center text-gray-500 dark:text-gray-400 py-8`;
const StatusBadge = tw.span`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium`;

interface LoginActivityTableProps {
  loginActivity: LoginActivityItem[];
  loading: boolean;
}

/**
 * LoginActivityTable Component
 * Displays login activity history in a tabular format
 * Shows loading state, empty state, and success state
 */
const LoginActivityTable: React.FC<LoginActivityTableProps> = ({ loginActivity, loading }) => {
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
      <Table>
        <TableHead>
          <tr>
            <TableHeaderCell>{t('dashboard.username')}</TableHeaderCell>
            <TableHeaderCell>{t('dashboard.timestamp')}</TableHeaderCell>
            <TableHeaderCell>{t('dashboard.ip_address')}</TableHeaderCell>
            <TableHeaderCell>{t('dashboard.user_agent')}</TableHeaderCell>
            <TableHeaderCell>{t('dashboard.status')}</TableHeaderCell>
          </tr>
        </TableHead>
        <TableBody>
          {loginActivity.map((activity) => (
            <TableRow key={activity.id}>
              <TableCell>{activity.username}</TableCell>
              <TableCell>{formatTimestamp(activity.timestamp)}</TableCell>
              <TableCell>{activity.ip_address}</TableCell>
              <TableCell title={activity.user_agent}>
                {truncateUserAgent(activity.user_agent)}
              </TableCell>
              <TableCell>
                <StatusBadge className={
                  activity.success 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }>
                  {activity.success ? t('dashboard.success') : t('dashboard.failed')}
                </StatusBadge>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default LoginActivityTable;
