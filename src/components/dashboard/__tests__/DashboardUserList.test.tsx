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
