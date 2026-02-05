import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import i18n from '../../../locale/i18n';
import DashboardUserList from '../DashboardUserList';
import dashboardReducer, { DashboardState } from '../../../store/dashboardSlice';
import { axiosApiServiceLoadUserList } from '../../../services/apiService';

// Mock the API service
vi.mock('../../../services/apiService', () => ({
  axiosApiServiceLoadUserList: {
    get: vi.fn(),
  },
}));

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

const mockGetUsers = vi.mocked(axiosApiServiceLoadUserList.get);

const mockPaginatedResponse = {
  count: 3,
  next: null,
  previous: null,
  results: [
    { id: 1, username: 'user1', email: 'user1@test.com' },
    { id: 2, username: 'user2', email: 'user2@test.com' },
    { id: 3, username: 'user3', email: 'user3@test.com' },
  ],
};

describe('DashboardUserList - Dynamic Height Stability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockGetUsers.mockResolvedValue(mockPaginatedResponse);
  });

  it('should have fixed height when displaying 3 users', async () => {
    renderWithProviders(<DashboardUserList />);
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
    
    const container = document.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(container).not.toBeNull();
    
    // Get computed styles to verify fixed height
    const styles = window.getComputedStyle(container!);
    expect(parseInt(styles.height)).toEqual(420);
  });

  it('should have fixed height when displaying less than 3 users', async () => {
    mockGetUsers.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        { id: 1, username: 'user1', email: 'user1@test.com' },
        { id: 2, username: 'user2', email: 'user2@test.com' },
      ],
    });
    
    renderWithProviders(<DashboardUserList />);
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
    
    const container = document.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(container).not.toBeNull();
    
    const styles = window.getComputedStyle(container!);
    expect(parseInt(styles.height)).toEqual(420);
  });

  it('should have fixed height in empty state', async () => {
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
    
    const container = document.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(container).not.toBeNull();
    
    const styles = window.getComputedStyle(container!);
    expect(parseInt(styles.height)).toEqual(420);
  });

  it('should maintain consistent height across different user counts', async () => {
    // Test with 3 users
    renderWithProviders(<DashboardUserList />);
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
    const container1 = document.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(container1).not.toBeNull();

    // Test with 1 user
    mockGetUsers.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        { id: 1, username: 'singleuser', email: 'single@test.com' },
      ],
    });

    const { unmount } = renderWithProviders(<DashboardUserList />);
    await waitFor(() => {
      expect(screen.getByText('singleuser')).toBeInTheDocument();
    });
    const container2 = document.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(container2).not.toBeNull();

    const styles1 = window.getComputedStyle(container1!);
    const styles2 = window.getComputedStyle(container2!);

    // Both containers should have the same fixed height
    expect(parseInt(styles1.height)).toEqual(parseInt(styles2.height));
    expect(parseInt(styles1.height)).toEqual(420);
    
    unmount();
  });

  it('should not show scrollbar for 3 users', async () => {
    renderWithProviders(<DashboardUserList />);
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
    
    const userListContent = document.querySelector('.overflow-y-auto');
    expect(userListContent).not.toBeNull();
    
    // Check if scrollable content fits within visible area
    // We calculate this by comparing clientHeight and scrollHeight
    const clientHeight = userListContent?.clientHeight ?? 0;
    const scrollHeight = userListContent?.scrollHeight ?? 0;
    
    // For 3 users, content should fit without scrolling
    expect(scrollHeight).toBeLessThanOrEqual(clientHeight);
  });
});