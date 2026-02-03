import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addSelectedUser, removeSelectedUser } from '../../store/dashboardSlice';
import { axiosApiServiceLoadUserList } from '../../services/apiService';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import tw from 'twin.macro';

interface User {
  id: number;
  username: string;
  email: string;
}

interface PaginatedResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

const UserListContainer = tw.div`bg-white dark:bg-dark-secondary rounded-lg shadow-lg p-6 mb-8`;
const UserListHeader = tw.h3`text-lg font-semibold mb-4 dark:text-dark-text`;
const UserItem = tw.div`flex items-center space-x-3 p-3 border-b border-gray-200 dark:border-dark-accent last:border-b-0`;
const UserCheckbox = tw.input`w-4 h-4 text-blue-600 rounded focus:ring-blue-500`;
const UserInfo = tw.div`flex-1`;
const UserName = tw.div`font-medium text-gray-900 dark:text-dark-text`;
const UserEmail = tw.div`text-sm text-gray-500 dark:text-gray-400`;
const LoadingSpinner = tw.div`w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin`;
const ErrorMessage = tw.div`text-center text-red-500 dark:text-red-400 py-4`;
const EmptyMessage = tw.div`text-center text-gray-500 dark:text-gray-400 py-8`;
const PaginationContainer = tw.div`flex justify-between items-center mt-6`;
const PaginationButton = tw.button`w-20 px-4 py-2 bg-blue-600 text-white flex justify-center items-center rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed`;

/**
 * DashboardUserList Component
 * Displays a paginated list of users with checkboxes for selection
 * Integrated with Redux for state management
 */
const DashboardUserList: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const selectedUserIds = useSelector((state: RootState) => state.dashboard.selectedUserIds);
  const activeFilter = useSelector((state: RootState) => state.dashboard.activeFilter);

  // Local state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNext, setHasNext] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);

  // Ref to prevent multiple concurrent API calls
  const hasFetchedRef = useRef(false);
  const currentFetchKeyRef = useRef<string>('');

  const pageSize = 3; // Match the dashboard page size

  // Fetch users on component mount, page changes, and filter changes
  useEffect(() => {
    // Create a unique key for this fetch based on dependencies
    const fetchKey = `${activeFilter}-${currentPage}`;

    // Prevent multiple concurrent fetches for the same parameters
    if (currentFetchKeyRef.current === fetchKey && hasFetchedRef.current) {
      return;
    }

    currentFetchKeyRef.current = fetchKey;
    hasFetchedRef.current = true;

    const fetchUsers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Determine API parameters based on active filter
        let role: 'admin' | 'regular' | undefined;
        let me: boolean | undefined;

        switch (activeFilter) {
          case 'regular':
            role = 'regular';
            break;
          case 'admin':
            role = 'admin';
            break;
          case 'me':
            me = true;
            break;
          case 'all':
          default:
            // No additional parameters for 'all'
            break;
        }

        const response: PaginatedResponse = await axiosApiServiceLoadUserList.get(
          API_ENDPOINTS.GET_USERS,
          currentPage,
          pageSize,
          role,
          me
        );

        // Handle malformed responses
        const userResults = Array.isArray(response.results) ? response.results : [];
        const userCount = typeof response.count === 'number' ? response.count : 0;

        setUsers(userResults);
        setTotalCount(userCount);
        setTotalPages(Math.ceil(userCount / pageSize));
        setHasNext(response.next !== null);
        setHasPrevious(response.previous !== null);
      } catch (err) {
        setError(t('dashboard.user_list.error_loading'));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [currentPage, activeFilter, t]);

  // Handle user selection
  const handleUserToggle = (userId: number) => {
    if (selectedUserIds.includes(userId)) {
      dispatch(removeSelectedUser(userId));
    } else {
      dispatch(addSelectedUser(userId));
    }
  };

  // Handle pagination
  const handleNextPage = () => {
    if (hasNext) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePreviousPage = () => {
    if (hasPrevious) {
      setCurrentPage(prev => prev - 1);
    }
  };

  // Loading state
  if (loading) {
    return (
      <UserListContainer>
        <UserListHeader>{t('dashboard.user_list.title')}</UserListHeader>
        <div className="flex justify-center py-8">
          <LoadingSpinner data-testid="spinner" />
        </div>
      </UserListContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <UserListContainer>
        <UserListHeader>{t('dashboard.user_list.title')}</UserListHeader>
        <ErrorMessage>{error}</ErrorMessage>
      </UserListContainer>
    );
  }

  // Empty state
  if (users.length === 0) {
    return (
      <UserListContainer>
        <UserListHeader>{t('dashboard.user_list.title')}</UserListHeader>
        <EmptyMessage>{t('dashboard.user_list.empty')}</EmptyMessage>
      </UserListContainer>
    );
  }

  return (
    <UserListContainer>
      <UserListHeader>{t('dashboard.user_list.title')}</UserListHeader>

      <div className="space-y-2">
        {users.map((user) => (
          <UserItem key={user.id}>
            <UserCheckbox
              type="checkbox"
              checked={selectedUserIds.includes(user.id)}
              onChange={() => handleUserToggle(user.id)}
              value={`user-${user.id}`}
              data-testid={`user-checkbox-${user.id}`}
            />
            <UserInfo>
              <UserName>{user.username}</UserName>
              <UserEmail>{user.email}</UserEmail>
            </UserInfo>
          </UserItem>
        ))}
      </div>

      {/* Pagination */}
      {(hasNext || hasPrevious) && (
        <PaginationContainer>
          <PaginationButton
            onClick={handlePreviousPage}
            disabled={!hasPrevious}
            data-testid="prev-button"
          >
            {t('userlist.buttonPrevious')}
          </PaginationButton>

          <span className="text-sm text-gray-600 dark:text-gray-400">
            {t('userlist.pageInfo', {
              current: currentPage,
              total: totalPages,
              count: totalCount
            })}
          </span>

          <PaginationButton
            onClick={handleNextPage}
            disabled={!hasNext}
            data-testid="next-button"
          >
            {t('userlist.buttonNext')}
          </PaginationButton>
        </PaginationContainer>
      )}
    </UserListContainer>
  );
};

export default DashboardUserList;
