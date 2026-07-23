import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../locale/i18n';
import store from '../../../store';
import GameLeaderboard from '../../../components/game/GameLeaderboard';
import { loginSuccess, logoutSuccess } from "../../../store/authSlice";

// renderWithProviders not used here — this test uses a custom Wrapper component

describe('GameLeaderboard - no flicker', () => {
  beforeEach(() => {
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
  });

  afterEach(() => {
    act(() => {
      store.dispatch(logoutSuccess());
    });
  });

  it('should keep leaderboard table visible across parent re-renders after data is loaded', async () => {
    const Wrapper = () => {
      return (
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <div>
              <GameLeaderboard />
              <button
                data-testid="re-render-trigger"
                onClick={() => {
                  // Dispatch the EXACT SAME auth state to trigger a re-render
                  // without changing any values — this simulates a parent re-render
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
                }}
              >
                Trigger Re-render
              </button>
            </div>
          </I18nextProvider>
        </Provider>
      );
    };

    await act(async () => {
      render(<Wrapper />);
    });

    // Open the leaderboard
    await act(async () => {
      fireEvent.click(screen.getByTestId('leaderboard-toggle'));
    });

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    // Verify data is shown
    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('95.0%')).toBeDefined();

    // Trigger a re-render by dispatching identical auth state
    await act(async () => {
      fireEvent.click(screen.getByTestId('re-render-trigger'));
    });

    // The table should STILL be visible immediately after re-render
    // BUG: currently the useMemo recalculates, effect re-fires, loading = true, table disappears
    expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('95.0%')).toBeDefined();

    // Flush any remaining effects
    await act(async () => {});
  });
});
