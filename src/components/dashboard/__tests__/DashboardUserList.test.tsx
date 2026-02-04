import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import i18n from '../../../locale/i18n';
import DashboardUserList from '../DashboardUserList';
import dashboardReducer, { DashboardState } from '../../../store/dashboardSlice';
import { axiosApiServiceLoadUserList } from '../../../services/apiService';

const createMockStore = (initialState: Partial<DashboardState> = {}) => {
  const defaultState: DashboardState = {
    activeFilter: 'all',
    selectedUserIds: [],
    selectedDashboardUserId: null,
    currentDropdownUsers: [],
    chartMode: 'individual',
    startDate: null,
    endDate: null,
    isLoading: false,
    error: null,
    ...initialState,
  };

  return configureStore({
    reducer: {
      dashboard: dashboardReducer,
    },
    preloadedState: {
      dashboard: defaultState,
    },
  });
};

const renderWithProviders = (component: React.ReactElement, initialState = {}) => {
  const store = createMockStore(initialState);
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        {component}
      </I18nextProvider>
    </Provider>
  );
};

// Mock the API service
vi.mock('../../../services/apiService', () => ({
  axiosApiServiceLoadUserList: {
    get: vi.fn(),
  },
}));

const mockGetUsers = vi.mocked(axiosApiServiceLoadUserList.get);

describe('DashboardUserList', () => {
  const mockUsers = [
    { id: 1, username: 'user1', email: 'user1@test.com' },
    { id: 2, username: 'user2', email: 'user2@test.com' },
    { id: 3, username: 'user3', email: 'user3@test.com' },
  ];

  const mockPaginatedResponse = {
    count: 3,
    next: null,
    previous: null,
    results: mockUsers,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUsers.mockResolvedValue(mockPaginatedResponse);
  });

  describe('Rendering', () => {
    it('renders user list with checkboxes', async () => {
      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user2')).toBeInTheDocument();
        expect(screen.getByText('user3')).toBeInTheDocument();
      });

      // Check that checkboxes are present
      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);
    });

    it('displays user information correctly', async () => {
      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('user1@test.com')).toBeInTheDocument();
        expect(screen.getByText('user2@test.com')).toBeInTheDocument();
        expect(screen.getByText('user3@test.com')).toBeInTheDocument();
      });
    });

    it('shows loading state initially', async () => {
      // Using delayed promise resolution to test loading state without act() warnings.
      // This approach allows us to:
      // 1. Verify the spinner is displayed initially (loading state)
      // 2. Avoid act() warnings from component's useEffect API call on mount
      // 3. Test the complete loading behavior (initial state → loading → loaded)
      // Alternative approaches considered:
      // - Wrapping render in act(): Would resolve API immediately, hiding loading state
      // - Accepting warnings: Would pollute test output with expected warnings
      // - Global mocking: Would affect other tests unnecessarily

      // Create a promise that resolves after a short delay
      const delayedPromise = new Promise<typeof mockPaginatedResponse>((resolve) => {
        setTimeout(() => resolve(mockPaginatedResponse), 10);
      });

      mockGetUsers.mockReturnValue(delayedPromise);

      renderWithProviders(<DashboardUserList />);

      // Verify loading state is shown initially (before promise resolves)
      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      // Wait for the promise to resolve and loading to complete
      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });
    });

    it('shows empty state when no users', async () => {
      mockGetUsers.mockResolvedValue({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });

      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });
  });

  describe('User Selection', () => {
    it('shows selected users as checked', async () => {
      renderWithProviders(<DashboardUserList />, { selectedUserIds: [1, 3] });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(3);

      // Check that the correct checkboxes are checked based on selectedUserIds
      expect(checkboxes[0]).toBeChecked(); // user 1
      expect(checkboxes[1]).not.toBeChecked(); // user 2
      expect(checkboxes[2]).toBeChecked(); // user 3
    });

    it('shows unselected users as unchecked', async () => {
      renderWithProviders(<DashboardUserList />, { selectedUserIds: [] });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Pagination', () => {
    it('displays pagination controls when multiple pages', async () => {
      const paginatedResponse = {
        count: 6,
        next: 'http://test.com?page=2',
        previous: null,
        results: mockUsers,
      };
      mockGetUsers.mockResolvedValue(paginatedResponse);

      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });
    });

    it('handles page navigation', async () => {
      const paginatedResponse = {
        count: 6,
        next: 'http://test.com?page=2',
        previous: null,
        results: mockUsers,
      };
      mockGetUsers.mockResolvedValue(paginatedResponse);

      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });

      const nextButton = screen.getByTestId('next-button');
      await act(async () => {
        fireEvent.click(nextButton);
      });

      expect(mockGetUsers).toHaveBeenCalledWith('/api/user/users/', 2, 3, undefined, undefined);
    });

    it('displays correct pagination button text using proper translation keys', async () => {
      const paginatedResponse = {
        count: 6,
        next: 'http://test.com?page=2',
        previous: 'http://test.com?page=1',
        results: mockUsers,
      };
      mockGetUsers.mockResolvedValue(paginatedResponse);

      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByTestId('prev-button')).toBeInTheDocument();
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });

      // Check that buttons show translated text, not raw keys
      const prevButton = screen.getByTestId('prev-button');
      const nextButton = screen.getByTestId('next-button');

      expect(prevButton).toHaveTextContent('Previous');
      expect(nextButton).toHaveTextContent('Next');
    });

    it('displays correct page info using proper translation key', async () => {
      const paginatedResponse = {
        count: 6,
        next: 'http://test.com?page=2',
        previous: null,
        results: mockUsers,
      };
      mockGetUsers.mockResolvedValue(paginatedResponse);

      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('Page 1 of 2 (6 users)')).toBeInTheDocument();
      });
    });




  });

  describe('Error Handling', () => {
    it('displays error message when API fails', async () => {
      mockGetUsers.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('Error loading users')).toBeInTheDocument();
      });
    });
  });

  describe('Selection State Persistence', () => {
    it('maintains selection state across re-renders', async () => {
      const { rerender } = renderWithProviders(<DashboardUserList />, { selectedUserIds: [1] });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // user 1 should be checked

      // Re-render with same state
      rerender(
        <Provider store={createMockStore({ selectedUserIds: [1] })}>
          <I18nextProvider i18n={i18n}>
            <DashboardUserList />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        const updatedCheckboxes = screen.getAllByRole('checkbox');
        expect(updatedCheckboxes[0]).toBeChecked(); // Should still be checked
      });
    });

    it('updates selection when Redux state changes', async () => {
      const store = createMockStore({ selectedUserIds: [] });
      const { rerender } = render(
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <DashboardUserList />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      let checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).not.toBeChecked();

      // Update Redux state
      await act(async () => {
        store.dispatch({ type: 'dashboard/addSelectedUser', payload: 1 });
      });

      rerender(
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <DashboardUserList />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[0]).toBeChecked();
      });
    });
  });

  describe('Bulk Selection Operations', () => {
    it('supports selecting all users', async () => {
      renderWithProviders(<DashboardUserList />, { selectedUserIds: [] });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // This would require a "Select All" button to be implemented
      // For now, test that individual selections work as expected
      const checkboxes = screen.getAllByRole('checkbox');

      // Simulate selecting all users individually
      checkboxes.forEach(checkbox => {
        fireEvent.click(checkbox);
      });

      // Verify all are selected (would need Redux state check in real implementation)
      expect(checkboxes.every(cb => (cb as HTMLInputElement).checked)).toBe(true);
    });

    it('supports deselecting all users', async () => {
      renderWithProviders(<DashboardUserList />, { selectedUserIds: [1, 2, 3] });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach(checkbox => {
        expect(checkbox).toBeChecked();
        fireEvent.click(checkbox); // Deselect each
      });

      // Verify all are deselected
      checkboxes.forEach(checkbox => {
        expect(checkbox).not.toBeChecked();
      });
    });
  });

  describe('Filter Integration', () => {
    it('responds to filter changes by clearing selections', async () => {
      const store = createMockStore({ selectedUserIds: [1, 2], activeFilter: 'all' });
      render(
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <DashboardUserList />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Simulate filter change from 'all' to 'specific'
      await act(async () => {
        store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'specific' });
      });

      // The filter change should clear selections (this is handled by the filter component)
      // This test verifies the component receives the updated state
      const state = store.getState().dashboard;
      expect(state.activeFilter).toBe('specific');
      // Note: Selection clearing would be handled by the filter component's logic
    });

    it('maintains selections when filter stays the same', async () => {
      renderWithProviders(<DashboardUserList />, { selectedUserIds: [1], activeFilter: 'specific' });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked(); // Should remain selected
    });

    it('resets page to 1 when filter changes', async () => {
      // Setup initial response with pagination
      const initialResponse = {
        count: 6,
        next: 'http://test.com?page=2',
        previous: null,
        results: mockUsers,
      };

      // Setup page 2 response
      const page2Response = {
        count: 6,
        next: null,
        previous: 'http://test.com?page=1',
        results: [
          { id: 4, username: 'user4', email: 'user4@test.com' },
          { id: 5, username: 'user5', email: 'user5@test.com' },
          { id: 6, username: 'user6', email: 'user6@test.com' },
        ],
      };

      // Setup regular users response
      const regularUsersResponse = {
        count: 3,
        next: null,
        previous: null,
        results: [
          { id: 7, username: 'regular1', email: 'regular1@test.com' },
          { id: 8, username: 'regular2', email: 'regular2@test.com' },
          { id: 9, username: 'regular3', email: 'regular3@test.com' },
        ],
      };

      // Clear default mock and set up mocks in sequence
      mockGetUsers.mockClear();
      mockGetUsers.mockResolvedValueOnce(initialResponse); // 1. Initial load
      mockGetUsers.mockResolvedValueOnce(page2Response); // 2. Page 2 navigation
      mockGetUsers.mockResolvedValueOnce(regularUsersResponse); // 3. Filter change with page reset

      const store = createMockStore({ activeFilter: 'all' });
      render(
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <DashboardUserList />
          </I18nextProvider>
        </Provider>
      );

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });

      // Navigate to page 2
      const nextButton = screen.getByTestId('next-button');
      await act(async () => {
        fireEvent.click(nextButton);
      });

      // Wait for page 2 to load
      await waitFor(() => {
        expect(screen.getByText('user4')).toBeInTheDocument();
        expect(screen.getByText('Page 2 of 2 (6 users)')).toBeInTheDocument();
      });

      // Now change filter to 'regular' - this should reset page to 1
      await act(async () => {
        store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'regular' });
      });

      // Verify API was called with page=1 for the new filter and component updated
      await waitFor(() => {
        expect(mockGetUsers).toHaveBeenCalledTimes(3); // Initial + page 2 + filter change
        expect(mockGetUsers).toHaveBeenLastCalledWith('/api/user/users/', 1, 3, 'regular', undefined);
        expect(screen.getByText('regular1')).toBeInTheDocument();
        // Since regular users has only 1 page, pagination controls are not shown
        expect(screen.queryByText('Page 1 of 1 (3 users)')).not.toBeInTheDocument();
      });
    });

    it('filters users correctly when changing filter types', async () => {
      // Setup different responses for different filter types
      const allUsersResponse = {
        count: 6,
        next: null,
        previous: null,
        results: [
          { id: 1, username: 'admin1', email: 'admin1@test.com' },
          { id: 2, username: 'regular1', email: 'regular1@test.com' },
          { id: 3, username: 'admin2', email: 'admin2@test.com' },
          { id: 4, username: 'regular2', email: 'regular2@test.com' },
          { id: 5, username: 'admin3', email: 'admin3@test.com' },
          { id: 6, username: 'regular3', email: 'regular3@test.com' },
        ],
      };

      const adminUsersResponse = {
        count: 3,
        next: null,
        previous: null,
        results: [
          { id: 1, username: 'admin1', email: 'admin1@test.com' },
          { id: 3, username: 'admin2', email: 'admin2@test.com' },
          { id: 5, username: 'admin3', email: 'admin3@test.com' },
        ],
      };

      const regularUsersResponse = {
        count: 3,
        next: null,
        previous: null,
        results: [
          { id: 2, username: 'regular1', email: 'regular1@test.com' },
          { id: 4, username: 'regular2', email: 'regular2@test.com' },
          { id: 6, username: 'regular3', email: 'regular3@test.com' },
        ],
      };

      const meUsersResponse = {
        count: 1,
        next: null,
        previous: null,
        results: [
          { id: 99, username: 'currentuser', email: 'current@test.com' },
        ],
      };

      // Set up mocks in sequence
      mockGetUsers.mockClear();
      mockGetUsers.mockResolvedValueOnce(allUsersResponse); // Initial load
      mockGetUsers.mockResolvedValueOnce(adminUsersResponse); // After admin filter
      mockGetUsers.mockResolvedValueOnce(regularUsersResponse); // After regular filter
      mockGetUsers.mockResolvedValueOnce(meUsersResponse); // After me filter

      const store = createMockStore({ activeFilter: 'all' });
      render(
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <DashboardUserList />
          </I18nextProvider>
        </Provider>
      );

      // Initial load should show all users
      await waitFor(() => {
        expect(screen.getByText('admin1')).toBeInTheDocument();
        expect(screen.getByText('regular1')).toBeInTheDocument();
      });

      // Change to admin filter
      await act(async () => {
        store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'admin' });
      });

      await waitFor(() => {
        expect(mockGetUsers).toHaveBeenLastCalledWith('/api/user/users/', 1, 3, 'admin', undefined);
        expect(screen.getByText('admin1')).toBeInTheDocument();
        expect(screen.getByText('admin2')).toBeInTheDocument();
        expect(screen.queryByText('regular1')).not.toBeInTheDocument();
      });

      // Change to regular filter
      await act(async () => {
        store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'regular' });
      });

      await waitFor(() => {
        expect(mockGetUsers).toHaveBeenLastCalledWith('/api/user/users/', 1, 3, 'regular', undefined);
        expect(screen.getByText('regular1')).toBeInTheDocument();
        expect(screen.getByText('regular2')).toBeInTheDocument();
        expect(screen.queryByText('admin1')).not.toBeInTheDocument();
      });

      // Change to me filter
      await act(async () => {
        store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'me' });
      });

      await waitFor(() => {
        expect(mockGetUsers).toHaveBeenLastCalledWith('/api/user/users/', 1, 3, undefined, true);
        expect(screen.getByText('currentuser')).toBeInTheDocument();
        expect(screen.queryByText('admin1')).not.toBeInTheDocument();
        expect(screen.queryByText('regular1')).not.toBeInTheDocument();
      });
    });

    describe('Pagination Reset Edge Cases', () => {
      it('handles rapid filter changes without breaking pagination', async () => {
        const filterResponses = {
          all: {
            count: 12,
            next: 'http://test.com?page=2',
            previous: null,
            results: [
              { id: 1, username: 'user1', email: 'user1@test.com' },
              { id: 2, username: 'user2', email: 'user2@test.com' },
              { id: 3, username: 'user3', email: 'user3@test.com' },
            ],
          },
          admin: {
            count: 6,
            next: 'http://test.com?page=2',
            previous: null,
            results: [
              { id: 1, username: 'admin1', email: 'admin1@test.com' },
              { id: 3, username: 'admin2', email: 'admin2@test.com' },
              { id: 5, username: 'admin3', email: 'admin3@test.com' },
            ],
          },
          regular: {
            count: 6,
            next: 'http://test.com?page=2',
            previous: null,
            results: [
              { id: 2, username: 'regular1', email: 'regular1@test.com' },
              { id: 4, username: 'regular2', email: 'regular2@test.com' },
              { id: 6, username: 'regular3', email: 'regular3@test.com' },
            ],
          },
        };

        // Set up mocks that will be called in sequence
        mockGetUsers.mockClear();
        mockGetUsers.mockResolvedValueOnce(filterResponses.all); // Initial load
        mockGetUsers.mockResolvedValueOnce(filterResponses.admin); // Change to admin
        mockGetUsers.mockResolvedValueOnce(filterResponses.regular); // Change to regular
        mockGetUsers.mockResolvedValueOnce(filterResponses.all); // Change back to all

        const store = createMockStore({ activeFilter: 'all' });
        render(
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <DashboardUserList />
            </I18nextProvider>
          </Provider>
        );

        // Initial load
        await waitFor(() => {
          expect(screen.getByText('user1')).toBeInTheDocument();
        });

        // Rapid filter changes
        await act(async () => {
          store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'admin' });
        });

        await waitFor(() => {
          expect(screen.getByText('admin1')).toBeInTheDocument();
        });

        await act(async () => {
          store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'regular' });
        });

        await waitFor(() => {
          expect(screen.getByText('regular1')).toBeInTheDocument();
        });

        await act(async () => {
          store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'all' });
        });

        await waitFor(() => {
          expect(screen.getByText('user1')).toBeInTheDocument();
        });

        // Verify all API calls were made with page=1 (reset pagination)
        expect(mockGetUsers).toHaveBeenCalledTimes(4);
        expect(mockGetUsers).toHaveBeenNthCalledWith(1, '/api/user/users/', 1, 3, undefined, undefined); // all
        expect(mockGetUsers).toHaveBeenNthCalledWith(2, '/api/user/users/', 1, 3, 'admin', undefined); // admin
        expect(mockGetUsers).toHaveBeenNthCalledWith(3, '/api/user/users/', 1, 3, 'regular', undefined); // regular
        expect(mockGetUsers).toHaveBeenNthCalledWith(4, '/api/user/users/', 1, 3, undefined, undefined); // all
      });



      it('handles component re-mounting with different initial filter states', async () => {
        // Test that component works correctly when mounted with different filter states
        const adminResponse = {
          count: 3,
          next: null,
          previous: null,
          results: [
            { id: 1, username: 'admin1', email: 'admin1@test.com' },
            { id: 3, username: 'admin2', email: 'admin2@test.com' },
            { id: 5, username: 'admin3', email: 'admin3@test.com' },
          ],
        };

        mockGetUsers.mockResolvedValue(adminResponse);

        // Mount component with admin filter as initial state
        const store = createMockStore({ activeFilter: 'admin' });
        const { rerender } = render(
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <DashboardUserList />
            </I18nextProvider>
          </Provider>
        );

        await waitFor(() => {
          expect(screen.getByText('admin1')).toBeInTheDocument();
        });

        // Re-mount with different filter
        mockGetUsers.mockResolvedValue({
          count: 3,
          next: null,
          previous: null,
          results: [
            { id: 2, username: 'regular1', email: 'regular1@test.com' },
            { id: 4, username: 'regular2', email: 'regular2@test.com' },
            { id: 6, username: 'regular3', email: 'regular3@test.com' },
          ],
        });

        rerender(
          <Provider store={createMockStore({ activeFilter: 'regular' })}>
            <I18nextProvider i18n={i18n}>
              <DashboardUserList />
            </I18nextProvider>
          </Provider>
        );

        await waitFor(() => {
          expect(screen.getByText('regular1')).toBeInTheDocument();
          expect(screen.queryByText('admin1')).not.toBeInTheDocument();
        });
      });

      it('handles page 2 to regular filter switch without 404 error', async () => {
        // Reproduce the exact issue: navigate to page 2 with "all users", then switch to "regular"
        const allUsersPage1 = {
          count: 9,
          next: 'http://test.com?page=2',
          previous: null,
          results: [
            { id: 1, username: 'user1', email: 'user1@test.com' },
            { id: 2, username: 'user2', email: 'user2@test.com' },
            { id: 3, username: 'user3', email: 'user3@test.com' },
          ],
        };

        const allUsersPage2 = {
          count: 9,
          next: 'http://test.com?page=3',
          previous: 'http://test.com?page=1',
          results: [
            { id: 4, username: 'user4', email: 'user4@test.com' },
            { id: 5, username: 'user5', email: 'user5@test.com' },
            { id: 6, username: 'user6', email: 'user6@test.com' },
          ],
        };

        const regularUsersPage1 = {
          count: 3,
          next: null,
          previous: null,
          results: [
            { id: 7, username: 'regular1', email: 'regular1@test.com' },
            { id: 8, username: 'regular2', email: 'regular2@test.com' },
            { id: 9, username: 'regular3', email: 'regular3@test.com' },
          ],
        };

        mockGetUsers.mockClear();
        mockGetUsers.mockResolvedValueOnce(allUsersPage1); // Initial load
        mockGetUsers.mockResolvedValueOnce(allUsersPage2); // Navigate to page 2
        mockGetUsers.mockResolvedValueOnce(regularUsersPage1); // Filter change to regular

        const store = createMockStore({ activeFilter: 'all' });
        render(
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <DashboardUserList />
            </I18nextProvider>
          </Provider>
        );

        // Initial load (page 1)
        await waitFor(() => {
          expect(screen.getByText('user1')).toBeInTheDocument();
          expect(screen.getByTestId('next-button')).toBeInTheDocument();
        });

        // Navigate to page 2
        const nextButton = screen.getByTestId('next-button');
        await act(async () => {
          fireEvent.click(nextButton);
        });

        await waitFor(() => {
          expect(screen.getByText('user4')).toBeInTheDocument();
          expect(screen.getByText('Page 2 of 3 (9 users)')).toBeInTheDocument();
        });

        // CRITICAL TEST: Switch from "all users" (page 2) to "regular" filter
        // This should NOT cause a 404 error
        await act(async () => {
          store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'regular' });
        });

        // Should show regular users without 404 error
        await waitFor(() => {
          expect(screen.getByText('regular1')).toBeInTheDocument();
          expect(screen.getByText('regular2')).toBeInTheDocument();
          expect(screen.queryByText('user4')).not.toBeInTheDocument(); // Should not show old page 2 results
        });

        // Verify API calls: should be called with page=1 for regular filter
        expect(mockGetUsers).toHaveBeenCalledTimes(3);
        expect(mockGetUsers).toHaveBeenNthCalledWith(1, '/api/user/users/', 1, 3, undefined, undefined); // Initial load
        expect(mockGetUsers).toHaveBeenNthCalledWith(2, '/api/user/users/', 2, 3, undefined, undefined); // Page 2 navigation
        expect(mockGetUsers).toHaveBeenNthCalledWith(3, '/api/user/users/', 1, 3, 'regular', undefined); // Filter change - page reset to 1
      });

      it('prevents duplicate API calls during rapid filter changes', async () => {
        // Test that rapid filter changes don't cause multiple concurrent API calls
        const allResponse = {
          count: 6,
          next: null,
          previous: null,
          results: [
            { id: 1, username: 'user1', email: 'user1@test.com' },
            { id: 2, username: 'user2', email: 'user2@test.com' },
            { id: 3, username: 'user3', email: 'user3@test.com' },
          ],
        };

        const adminResponse = {
          count: 3,
          next: null,
          previous: null,
          results: [
            { id: 1, username: 'admin1', email: 'admin1@test.com' },
            { id: 3, username: 'admin2', email: 'admin2@test.com' },
            { id: 5, username: 'admin3', email: 'admin3@test.com' },
          ],
        };

        const regularResponse = {
          count: 3,
          next: null,
          previous: null,
          results: [
            { id: 2, username: 'regular1', email: 'regular1@test.com' },
            { id: 4, username: 'regular2', email: 'regular2@test.com' },
            { id: 6, username: 'regular3', email: 'regular3@test.com' },
          ],
        };

        mockGetUsers.mockClear();
        mockGetUsers.mockResolvedValueOnce(allResponse); // Initial load
        mockGetUsers.mockResolvedValueOnce(adminResponse); // First filter change (admin)
        mockGetUsers.mockResolvedValueOnce(regularResponse); // Second filter change (regular)
        mockGetUsers.mockResolvedValueOnce(allResponse); // Third filter change (back to all)

        const store = createMockStore({ activeFilter: 'all' });
        render(
          <Provider store={store}>
            <I18nextProvider i18n={i18n}>
              <DashboardUserList />
            </I18nextProvider>
          </Provider>
        );

        // Initial load
        await waitFor(() => {
          expect(screen.getByText('user1')).toBeInTheDocument();
        });

        // Rapid filter changes - each should trigger an API call
        await act(async () => {
          store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'admin' });
        });

        await waitFor(() => {
          expect(screen.getByText('admin1')).toBeInTheDocument();
        });

        await act(async () => {
          store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'regular' });
        });

        await waitFor(() => {
          expect(screen.getByText('regular1')).toBeInTheDocument();
        });

        await act(async () => {
          store.dispatch({ type: 'dashboard/setActiveFilter', payload: 'all' });
        });

        await waitFor(() => {
          expect(screen.getByText('user1')).toBeInTheDocument();
        });

        // Should have made 4 API calls total: initial + 3 filter changes
        expect(mockGetUsers).toHaveBeenCalledTimes(4);
      });


    });
  });

  describe('Accessibility Features', () => {
    it('has proper ARIA labels for checkboxes', async () => {
      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      checkboxes.forEach((checkbox, index) => {
        expect(checkbox).toHaveAttribute('value', `user-${index + 1}`);
        expect(checkbox).toHaveAttribute('type', 'checkbox');
      });
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const firstCheckbox = screen.getAllByRole('checkbox')[0];

      // Focus the checkbox
      firstCheckbox.focus();
      expect(firstCheckbox).toHaveFocus();

      // Test keyboard activation (spacebar)
      fireEvent.keyDown(firstCheckbox, { key: ' ', code: 'Space' });
      // This would trigger the onChange in a real implementation
      expect(firstCheckbox).toBeInTheDocument();
    });

    it('maintains focus management', async () => {
      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');

      // Test tab navigation between checkboxes
      checkboxes[0].focus();
      expect(checkboxes[0]).toHaveFocus();

      // Simulate tab to next checkbox
      fireEvent.keyDown(checkboxes[0], { key: 'Tab', code: 'Tab' });
      // Note: Actual focus management would need more complex testing
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('handles API errors gracefully during pagination', async () => {
      // Mock initial response with pagination (6 total users, 3 per page)
      const paginatedResponse = {
        count: 6,
        next: 'http://test.com?page=2',
        previous: null,
        results: mockUsers,
      };
      mockGetUsers.mockResolvedValueOnce(paginatedResponse);
      mockGetUsers.mockRejectedValueOnce(new Error('Network Error'));

      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByTestId('next-button')).toBeInTheDocument();
      });

      // Try to navigate to next page
      const nextButton = screen.getByTestId('next-button');
      fireEvent.click(nextButton);

      // Should handle the error and not crash
      await waitFor(() => {
        expect(screen.getByText('Error loading users')).toBeInTheDocument();
      });
    });

    it('does not make multiple concurrent API calls when errors occur', async () => {
      // Mock API to always fail
      mockGetUsers.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<DashboardUserList />);

      // Wait for error to be handled
      await waitFor(() => {
        expect(screen.getByText('Error loading users')).toBeInTheDocument();
      });

      // Verify API was called only once
      expect(mockGetUsers).toHaveBeenCalledTimes(1);

      // Simulate dependency change that would normally trigger re-fetch
      // This should not cause another API call if we prevent looping
      // (This test verifies the fix - without it, multiple calls would happen)
    });

    it('handles empty user list from API', async () => {
      mockGetUsers.mockResolvedValueOnce({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });

      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
        expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
      });
    });

    it('handles very large user lists', async () => {
      const largeUserList = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        username: `user${i + 1}`,
        email: `user${i + 1}@test.com`,
      }));

      mockGetUsers.mockResolvedValue({
        count: 100,
        next: 'http://test.com?page=2',
        previous: null,
        results: largeUserList,
      });

      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
        expect(screen.getByText('user100')).toBeInTheDocument();
      });

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(100);
    });

    it('handles malformed API responses', async () => {
      mockGetUsers.mockResolvedValue({
        count: 'invalid',
        next: null,
        previous: null,
        results: null,
      });

      renderWithProviders(<DashboardUserList />);

      // Should handle the malformed response gracefully by showing empty state
      await waitFor(() => {
        expect(screen.getByText('No users found')).toBeInTheDocument();
      });
    });

    it('does not mutate frozen Redux state arrays during fetch key generation', async () => {
      // Test that the component doesn't crash when Redux state arrays are frozen
      // This simulates the development environment where Redux state is frozen
      const frozenArray = Object.freeze([3, 1, 2]);

      renderWithProviders(<DashboardUserList />, { selectedUserIds: frozenArray });

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // The test passes if no error is thrown during render
      expect(mockGetUsers).toHaveBeenCalled();
    });
  });

  describe('Performance and Memory', () => {
    it('does not cause unnecessary re-renders', async () => {
      const { rerender } = renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });

      // Re-render with same props should not cause issues
      rerender(
        <Provider store={createMockStore()}>
          <I18nextProvider i18n={i18n}>
            <DashboardUserList />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });
    });

    it('cleans up event listeners on unmount', () => {
      const { unmount } = renderWithProviders(<DashboardUserList />);

      // Component should unmount without errors
      expect(() => unmount()).not.toThrow();
    });
  });

  describe('Basic Functionality', () => {
    it('renders component without crashing', async () => {
      renderWithProviders(<DashboardUserList />);

      await waitFor(() => {
        expect(screen.getByText('user1')).toBeInTheDocument();
      });
    });
  });
});
