import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../locale/i18n';
import store from '../../../store';
import GameLeaderboard from '../../../components/game/GameLeaderboard';
import { loginSuccess, logoutSuccess } from '../../../store/actions';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    </Provider>
  );
};

describe('GameLeaderboard - stale admin state', () => {
  afterEach(() => {
    act(() => {
      store.dispatch(logoutSuccess());
    });
  });

  it('should show toggle button when admin state is set AFTER component mount', async () => {
    // Start with non-admin user
    act(() => {
      store.dispatch(loginSuccess({
        id: 1,
        username: 'user',
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        is_staff: false,
        is_superuser: false,
        logins_remaining_for_staff: 0,
        staff_access_granted: false,
        active_role: 'regular' as const,
        role_label: 'Regular',
      }));
    });

    // Mount the component while user is non-admin
    await act(async () => {
      renderWithProviders(<GameLeaderboard />);
    });

    // Initially, should not render for non-admin
    expect(screen.queryByTestId('leaderboard-toggle')).toBeNull();

    // Now update Redux state to make the user admin (simulating role change)
    act(() => {
      store.dispatch(loginSuccess({
        id: 1,
        username: 'admin',
        access: 'mock-admin-token',
        refresh: 'mock-refresh-token',
        is_staff: true,
        is_superuser: true,
        logins_remaining_for_staff: 0,
        staff_access_granted: true,
        active_role: 'staff' as const,
        role_label: 'Staff',
      }));
    });

    // After Redux state update, the component should now show the toggle button
    // BUG: Currently the useState(() => isAdminFn()) captures the initial non-admin value
    // and never updates, so this assertion will FAIL
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-toggle')).toBeDefined();
    });

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should fetch and display leaderboard entries after admin state is set post-mount', async () => {
    // Start with non-admin user
    act(() => {
      store.dispatch(loginSuccess({
        id: 1,
        username: 'user',
        access: 'mock-access-token',
        refresh: 'mock-refresh-token',
        is_staff: false,
        is_superuser: false,
        logins_remaining_for_staff: 0,
        staff_access_granted: false,
        active_role: 'regular' as const,
        role_label: 'Regular',
      }));
    });

    await act(async () => {
      renderWithProviders(<GameLeaderboard />);
    });

    // Update Redux state to make the user admin
    act(() => {
      store.dispatch(loginSuccess({
        id: 1,
        username: 'admin',
        access: 'mock-admin-token',
        refresh: 'mock-refresh-token',
        is_staff: true,
        is_superuser: true,
        logins_remaining_for_staff: 0,
        staff_access_granted: true,
        active_role: 'staff' as const,
        role_label: 'Staff',
      }));
    });

    // Toggle should appear after admin state update
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-toggle')).toBeDefined();
    });

    // Click to open leaderboard
    await act(async () => {
      fireEvent.click(screen.getByTestId('leaderboard-toggle'));
    });

    // Should fetch and display entries
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('95.0%')).toBeDefined();

    // Flush any remaining effects
    await act(async () => {});
  });
});