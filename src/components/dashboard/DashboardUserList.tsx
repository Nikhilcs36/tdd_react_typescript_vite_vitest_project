import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { addSelectedUser, removeSelectedUser } from '../../store/dashboardSlice';
import { axiosApiServiceLoadUserList } from '../../services/apiService';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import {
  UserListContainer,
  UserListHeader,
  UserItemContainer,
  UserCheckbox,
  UserInfo,
  UserName,
  UserEmail,
  ErrorMessage,
  EmptyMessage,
  PaginationContainer,
  PaginationButton,
  UsersScrollArea,
  CenteredContainer,
  UsersList,
  PageInfoText
} from './DashboardUserList.styles';
import { Spinner as CommonSpinner } from '../common/Loading';

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
  const previousFilterRef = useRef<string>(activeFilter);
  const previousPageRef = useRef<number>(1);

  const pageSize = 3; // Match the dashboard page size

  // Memoized fetch function to avoid recreation on every render
  const fetchUsers = useCallback(async (page: number, filter: string) => {
    try {
      setLoading(true);
      setError(null);

      // Determine API parameters based on filter
      let role: 'admin' | 'regular' | undefined;
      let me: boolean | undefined;

      switch (filter) {
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
        page,
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
    } catch (_err) {
      setError(t('dashboard.user_list.error_loading'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  // Single effect to handle all data fetching scenarios
  useEffect(() => {
    const filterChanged = previousFilterRef.current !== activeFilter;
    const pageChanged = previousPageRef.current !== currentPage;

    if (filterChanged) {
      // Filter changed - reset page and fetch with new filter
      previousFilterRef.current = activeFilter;
      previousPageRef.current = 1; // Page will be reset to 1
      setCurrentPage(1);
      fetchUsers(1, activeFilter);
      return;
    }

    if (pageChanged || !hasFetchedRef.current) {
      // Page changed (and filter stayed same) or initial load
      previousPageRef.current = currentPage;
      hasFetchedRef.current = true;
      fetchUsers(currentPage, activeFilter);
    }
  }, [currentPage, activeFilter, fetchUsers]);

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
      setCurrentPage(prev => Math.max(1, prev - 1));
    }
  };

  return (
    <UserListContainer data-testid="dashboard-user-list-container">
      <UserListHeader>{t('dashboard.user_list.title')}</UserListHeader>
      
      {/* Fixed height container for all states to prevent jumping */}
      <UsersScrollArea data-testid="users-scroll-area">
        {loading ? (
            <CenteredContainer>
              <CommonSpinner data-testid="spinner" />
            </CenteredContainer>
        ) : error ? (
          <CenteredContainer>
            <ErrorMessage>{error}</ErrorMessage>
          </CenteredContainer>
        ) : users.length === 0 ? (
          <CenteredContainer>
            <EmptyMessage>{t('dashboard.user_list.empty')}</EmptyMessage>
          </CenteredContainer>
        ) : (
          <UsersList>
            {users.map((user) => (
              <UserItemContainer key={user.id}>
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
              </UserItemContainer>
            ))}
          </UsersList>
        )}
      </UsersScrollArea>

      {/* Pagination */}
      {(hasNext || hasPrevious) && (
        <PaginationContainer data-testid="pagination-container">
          <PaginationButton
            onClick={handlePreviousPage}
            disabled={!hasPrevious}
            data-testid="prev-button"
          >
            {t('userlist.buttonPrevious')}
          </PaginationButton>

          <PageInfoText>
            {t('userlist.pageInfo', {
              current: currentPage,
              total: totalPages,
              count: totalCount
            })}
          </PageInfoText>

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