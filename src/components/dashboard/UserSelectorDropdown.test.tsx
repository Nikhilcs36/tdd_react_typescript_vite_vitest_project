import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import i18n from '../../locale/i18n';
import UserSelectorDropdown from './/UserSelectorDropdown';
import dashboardReducer, { DashboardState } from '../../store/dashboardSlice';
import { axiosApiServiceLoadUserList } from '../../services/apiService';

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
vi.mock('../../services/apiService', () => ({
  axiosApiServiceLoadUserList: {
    get: vi.fn(),
  },
}));

const mockGetUsers = vi.mocked(axiosApiServiceLoadUserList.get);

describe('UserSelectorDropdown', () => {
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
    it('renders dropdown with user options when no checkboxes selected', async () => {
      renderWithProviders(<UserSelectorDropdown />);

      await waitFor(() => {
        expect(screen.getByText('user1 (user1@test.com)')).toBeInTheDocument();
        expect(screen.getByText('user2 (user2@test.com)')).toBeInTheDocument();
        expect(screen.getByText('user3 (user3@test.com)')).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      expect(select).toBeInTheDocument();
    });

    it('renders dropdown with selected users only when checkboxes selected', async () => {
      renderWithProviders(<UserSelectorDropdown />, { selectedUserIds: [1, 3] });

      await waitFor(() => {
        expect(screen.getByText('user1 (user1@test.com)')).toBeInTheDocument();
        expect(screen.getByText('user3 (user3@test.com)')).toBeInTheDocument();
        expect(screen.queryByText('user2 (user2@test.com)')).not.toBeInTheDocument();
      });
    });

    it('shows loading state initially', async () => {
      const delayedPromise = new Promise<typeof mockPaginatedResponse>((resolve) => {
        setTimeout(() => resolve(mockPaginatedResponse), 10);
      });

      mockGetUsers.mockReturnValue(delayedPromise);

      renderWithProviders(<UserSelectorDropdown />);

      expect(screen.getByTestId('spinner')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.queryByTestId('spinner')).not.toBeInTheDocument();
      });
    });

    it('shows error message when API fails', async () => {
      mockGetUsers.mockRejectedValue(new Error('API Error'));

      renderWithProviders(<UserSelectorDropdown />);

      await waitFor(() => {
        expect(screen.getByText('Error loading users')).toBeInTheDocument();
      });
    });
  });

  describe('Default Selection', () => {
    it('defaults to first user in the list', async () => {
      renderWithProviders(<UserSelectorDropdown />);

      await waitFor(() => {
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('1'); // First user ID
      });
    });

    it('defaults to first user when checkbox selection changes', async () => {
      const { rerender } = renderWithProviders(<UserSelectorDropdown />, { selectedUserIds: [] });

      await waitFor(() => {
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('1');
      });

      // Simulate checkbox selection change
      rerender(
        <Provider store={createMockStore({ selectedUserIds: [2, 3] })}>
          <I18nextProvider i18n={i18n}>
            <UserSelectorDropdown />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('2'); // First selected user
      });
    });
  });

  describe('User Selection', () => {
    it('updates Redux state when user is selected', async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <UserSelectorDropdown />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');

      await act(async () => {
        fireEvent.change(select, { target: { value: '2' } });
      });

      const state = store.getState().dashboard;
      expect(state.selectedDashboardUserId).toBe(2);
    });

    it('maintains selection when valid user is chosen', async () => {
      const store = createMockStore({ selectedDashboardUserId: 1 });
      render(
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <UserSelectorDropdown />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');

      await act(async () => {
        fireEvent.change(select, { target: { value: '2' } });
      });

      const state = store.getState().dashboard;
      expect(state.selectedDashboardUserId).toBe(2);
    });

    it('updates currentDropdownUsers in Redux state after fetching', async () => {
      const store = createMockStore();
      render(
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <UserSelectorDropdown />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      const state = store.getState().dashboard;
      expect(state.currentDropdownUsers).toEqual(mockUsers);
    });
  });

  describe('Filter Changes', () => {
    it('updates user list when active filter changes', async () => {
      const { rerender } = renderWithProviders(<UserSelectorDropdown />, { activeFilter: 'all' });

      await waitFor(() => {
        expect(screen.getByText('user1 (user1@test.com)')).toBeInTheDocument();
      });

      // Mock different response for admin filter
      const adminUsers = [
        { id: 4, username: 'admin1', email: 'admin1@test.com' },
        { id: 5, username: 'admin2', email: 'admin2@test.com' },
      ];

      mockGetUsers.mockResolvedValue({
        count: 2,
        next: null,
        previous: null,
        results: adminUsers,
      });

      rerender(
        <Provider store={createMockStore({ activeFilter: 'admin' })}>
          <I18nextProvider i18n={i18n}>
            <UserSelectorDropdown />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('admin1 (admin1@test.com)')).toBeInTheDocument();
        expect(screen.getByText('admin2 (admin2@test.com)')).toBeInTheDocument();
        expect(screen.queryByText('user1 (user1@test.com)')).not.toBeInTheDocument();
      });
    });
  });

  describe('Checkbox Selection Changes', () => {
    it('updates dropdown options when selectedUserIds change', async () => {
      const { rerender } = renderWithProviders(<UserSelectorDropdown />, { selectedUserIds: [] });

      await waitFor(() => {
        expect(screen.getByText('user1 (user1@test.com)')).toBeInTheDocument();
        expect(screen.getByText('user2 (user2@test.com)')).toBeInTheDocument();
        expect(screen.getByText('user3 (user3@test.com)')).toBeInTheDocument();
      });

      rerender(
        <Provider store={createMockStore({ selectedUserIds: [1, 3] })}>
          <I18nextProvider i18n={i18n}>
            <UserSelectorDropdown />
          </I18nextProvider>
        </Provider>
      );

      await waitFor(() => {
        expect(screen.getByText('user1 (user1@test.com)')).toBeInTheDocument();
        expect(screen.getByText('user3 (user3@test.com)')).toBeInTheDocument();
        expect(screen.queryByText('user2 (user2@test.com)')).not.toBeInTheDocument();
      });
    });

    it('handles empty selectedUserIds array correctly', async () => {
      renderWithProviders(<UserSelectorDropdown />, { selectedUserIds: [] });

      await waitFor(() => {
        expect(screen.getByText('user1 (user1@test.com)')).toBeInTheDocument();
        expect(screen.getByText('user2 (user2@test.com)')).toBeInTheDocument();
        expect(screen.getByText('user3 (user3@test.com)')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('has proper ARIA labels', async () => {
      renderWithProviders(<UserSelectorDropdown />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toHaveAttribute('aria-label', 'Select user for dashboard');
      });
    });

    it('supports keyboard navigation', async () => {
      renderWithProviders(<UserSelectorDropdown />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
      });

      const select = screen.getByRole('combobox');
      select.focus();
      expect(select).toHaveFocus();
    });
  });

  describe('Edge Cases', () => {
    it('handles empty user list gracefully', async () => {
      mockGetUsers.mockResolvedValue({
        count: 0,
        next: null,
        previous: null,
        results: [],
      });

      renderWithProviders(<UserSelectorDropdown />);

      await waitFor(() => {
        expect(screen.getByText('No users available')).toBeInTheDocument();
      });
    });

    it('handles API response with malformed data', async () => {
      mockGetUsers.mockResolvedValue({
        count: 'invalid',
        next: null,
        previous: null,
        results: null,
      });

      renderWithProviders(<UserSelectorDropdown />);

      await waitFor(() => {
        expect(screen.getByText('No users available')).toBeInTheDocument();
      });
    });

    it('handles disabled state', async () => {
      renderWithProviders(<UserSelectorDropdown disabled={true} />);

      await waitFor(() => {
        const select = screen.getByRole('combobox');
        expect(select).toBeDisabled();
      });
    });

    it('does not make multiple concurrent API calls when errors occur', async () => {
      // Mock API to always fail
      mockGetUsers.mockRejectedValue(new Error('Network error'));

      renderWithProviders(<UserSelectorDropdown />);

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
  });
});
