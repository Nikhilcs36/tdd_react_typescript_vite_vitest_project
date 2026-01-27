import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '../../store';
import { setSelectedDashboardUser, setCurrentDropdownUsers } from '../../store/dashboardSlice';
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

interface UserSelectorDropdownProps {
  disabled?: boolean;
}

const DropdownContainer = tw.div`mb-6`;
const DropdownLabel = tw.label`block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2`;
const DropdownSelect = tw.select`
  w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm
  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
  disabled:bg-gray-100 disabled:cursor-not-allowed
  dark:bg-dark-secondary dark:border-dark-accent dark:text-dark-text
`;
const LoadingSpinner = tw.div`w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin inline-block ml-2`;
const ErrorMessage = tw.div`text-sm text-red-600 dark:text-red-400 mt-1`;
const EmptyMessage = tw.div`text-sm text-gray-500 dark:text-gray-400 mt-1`;

/**
 * UserSelectorDropdown Component
 * Allows selection of a user for individual dashboard data display
 * Shows different users based on checkbox selections and active filter
 * Defaults to first user and updates Redux state on selection
 */
const UserSelectorDropdown: React.FC<UserSelectorDropdownProps> = ({
  disabled = false,
}) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  // Redux state
  const selectedUserIds = useSelector((state: RootState) => state.dashboard.selectedUserIds);
  const activeFilter = useSelector((state: RootState) => state.dashboard.activeFilter);
  const selectedDashboardUserId = useSelector((state: RootState) => state.dashboard.selectedDashboardUserId);

  // Local state
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref to prevent multiple concurrent API calls
  const hasFetchedRef = useRef(false);
  const currentFetchKeyRef = useRef<string>('');

  // Fetch users based on current filter and selections
  useEffect(() => {
    // Create a unique key for this fetch based on dependencies
    const fetchKey = `${activeFilter}-${selectedUserIds.slice().sort().join(',')}`;

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
          1,
          1000, // Large page size to get all users
          role,
          me
        );

        // Handle malformed responses
        const userResults = Array.isArray(response.results) ? response.results : [];

        // Filter users based on checkbox selections
        let filteredUsers: User[];
        if (selectedUserIds.length > 0) {
          // Show only selected users
          filteredUsers = userResults.filter(user => selectedUserIds.includes(user.id));
        } else {
          // Show all filtered users
          filteredUsers = userResults;
        }

        setUsers(filteredUsers);

        // Update Redux with current dropdown users (only once)
        dispatch(setCurrentDropdownUsers(filteredUsers));

        // Set default selection to first user if not already set or if current selection is not in the list
        if (filteredUsers.length > 0) {
          const firstUserId = filteredUsers[0].id;
          const currentSelectionValid = selectedDashboardUserId && filteredUsers.some(user => user.id === selectedDashboardUserId);

          if (!selectedDashboardUserId || !currentSelectionValid) {
            dispatch(setSelectedDashboardUser(firstUserId));
          }
        } else if (selectedDashboardUserId) {
          // Clear selection if no users available
          dispatch(setSelectedDashboardUser(null));
        }

      } catch (err) {
        setError(t('dashboard.user_selector.error_loading'));
        setUsers([]);
        // Don't dispatch setCurrentDropdownUsers on error to prevent cascading re-fetches
        if (selectedDashboardUserId) {
          dispatch(setSelectedDashboardUser(null));
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [selectedUserIds, activeFilter, dispatch, t]);

  // Handle user selection change
  const handleUserChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    const value = event.target.value;
    const userId = value === '' ? null : parseInt(value, 10);
    dispatch(setSelectedDashboardUser(userId));
  };

  return (
    <DropdownContainer>
      <DropdownLabel htmlFor="user-selector">
        {t('dashboard.user_selector.label')}
      </DropdownLabel>

      <DropdownSelect
        id="user-selector"
        value={selectedDashboardUserId || ''}
        onChange={handleUserChange}
        disabled={disabled || loading}
        aria-label={t('dashboard.user_selector.aria_label')}
        data-testid="user-selector"
      >
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.username} ({user.email})
          </option>
        ))}
      </DropdownSelect>

      {loading && (
        <LoadingSpinner data-testid="spinner" />
      )}

      {error && (
        <ErrorMessage data-testid="error-message">
          {error}
        </ErrorMessage>
      )}

      {!loading && !error && users.length === 0 && (
        <EmptyMessage data-testid="empty-message">
          {t('dashboard.user_selector.no_users')}
        </EmptyMessage>
      )}
    </DropdownContainer>
  );
};

export default UserSelectorDropdown;
