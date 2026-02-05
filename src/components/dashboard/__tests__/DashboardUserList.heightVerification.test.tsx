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

describe('DashboardUserList - Height Verification', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have consistent height when displaying 1 user', async () => {
    mockGetUsers.mockResolvedValue({
      count: 1,
      next: null,
      previous: null,
      results: [
        { id: 1, username: 'singleuser', email: 'single@test.com' },
      ],
    });
    
    const { container } = renderWithProviders(<DashboardUserList />);
    
    await waitFor(() => {
      expect(screen.getByText('singleuser')).toBeInTheDocument();
    });
    
    const userListContainer = container.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(userListContainer).not.toBeNull();
    
    const computedStyle = window.getComputedStyle(userListContainer!);
    const height = parseInt(computedStyle.height);
    expect(height).toEqual(420);
  });

  it('should have consistent height when displaying 2 users', async () => {
    mockGetUsers.mockResolvedValue({
      count: 2,
      next: null,
      previous: null,
      results: [
        { id: 1, username: 'user1', email: 'user1@test.com' },
        { id: 2, username: 'user2', email: 'user2@test.com' },
      ],
    });
    
    const { container } = renderWithProviders(<DashboardUserList />);
    
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
    
    const userListContainer = container.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(userListContainer).not.toBeNull();
    
    const computedStyle = window.getComputedStyle(userListContainer!);
    const height = parseInt(computedStyle.height);
    expect(height).toEqual(420);
  });

  it('should have consistent height when displaying 3 users', async () => {
    mockGetUsers.mockResolvedValue({
      count: 3,
      next: null,
      previous: null,
      results: [
        { id: 1, username: 'user1', email: 'user1@test.com' },
        { id: 2, username: 'user2', email: 'user2@test.com' },
        { id: 3, username: 'user3', email: 'user3@test.com' },
      ],
    });
    
    const { container } = renderWithProviders(<DashboardUserList />);
    
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
    
    const userListContainer = container.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(userListContainer).not.toBeNull();
    
    const computedStyle = window.getComputedStyle(userListContainer!);
    const height = parseInt(computedStyle.height);
    expect(height).toEqual(420);
  });

  it('should have consistent height when displaying many users', async () => {
    const manyUsers = Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      username: `user${i + 1}`,
      email: `user${i + 1}@test.com`,
    }));
    
    mockGetUsers.mockResolvedValue({
      count: 10,
      next: null,
      previous: null,
      results: manyUsers,
    });
    
    const { container } = renderWithProviders(<DashboardUserList />);
    
    await waitFor(() => {
      expect(screen.getByText('user1')).toBeInTheDocument();
    });
    
    const userListContainer = container.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(userListContainer).not.toBeNull();
    
    const computedStyle = window.getComputedStyle(userListContainer!);
    const height = parseInt(computedStyle.height);
    expect(height).toEqual(420);
  });

  it('should have consistent height in empty state', async () => {
    mockGetUsers.mockResolvedValue({
      count: 0,
      next: null,
      previous: null,
      results: [],
    });
    
    const { container } = renderWithProviders(<DashboardUserList />);
    
    await waitFor(() => {
      expect(screen.getByText('No users found')).toBeInTheDocument();
    });
    
    const userListContainer = container.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(userListContainer).not.toBeNull();
    
    const computedStyle = window.getComputedStyle(userListContainer!);
    const height = parseInt(computedStyle.height);
    expect(height).toEqual(420);
  });

  it('should have consistent height in loading state', async () => {
    mockGetUsers.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 1000)));
    
    const { container } = renderWithProviders(<DashboardUserList />);
    
    await waitFor(() => {
      expect(screen.getByTestId('spinner')).toBeInTheDocument();
    });
    
    const userListContainer = container.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(userListContainer).not.toBeNull();
    
    const computedStyle = window.getComputedStyle(userListContainer!);
    const height = parseInt(computedStyle.height);
    expect(height).toEqual(420);
  });

  it('should have consistent height in error state', async () => {
    mockGetUsers.mockRejectedValue(new Error('API Error'));
    
    const { container } = renderWithProviders(<DashboardUserList />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading users')).toBeInTheDocument();
    });
    
    const userListContainer = container.querySelector('[data-testid="dashboard-user-list-container"]');
    expect(userListContainer).not.toBeNull();
    
    const computedStyle = window.getComputedStyle(userListContainer!);
    const height = parseInt(computedStyle.height);
    expect(height).toEqual(420);
  });
});