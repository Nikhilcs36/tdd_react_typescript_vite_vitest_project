import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../locale/i18n';
import store from '../../../store';
import GameLeaderboard from '../../../components/game/GameLeaderboard';
import { loginSuccess, logoutSuccess } from '../../../store/actions';

const defaultAdminFields = {
  logins_remaining_for_staff: 0,
  staff_access_granted: true,
  active_role: 'superuser' as const,
  role_label: 'Superuser',
};

const defaultRegularFields = {
  logins_remaining_for_staff: 3,
  staff_access_granted: false,
  active_role: 'regular' as const,
  role_label: 'Regular',
};

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    </Provider>
  );
};

describe('GameLeaderboard', () => {
  beforeEach(() => {
    // Set up admin user
    store.dispatch(loginSuccess({
      id: 1,
      username: 'admin',
      access: 'mock-admin-token',
      refresh: 'mock-refresh-token',
      is_staff: true,
      is_superuser: true,
      ...defaultAdminFields,
    }));
  });

  afterEach(() => {
    store.dispatch(logoutSuccess());
  });

  it('should not render for non-admin users', () => {
    store.dispatch(logoutSuccess());
    store.dispatch(loginSuccess({
      id: 2,
      username: 'user',
      access: 'mock-access-token',
      refresh: 'mock-refresh-token',
      is_staff: false,
      is_superuser: false,
      ...defaultRegularFields,
    }));

    const { container } = renderWithProviders(<GameLeaderboard />);
    expect(container.textContent).toBe('');
  });

  it('should show toggle button for admin users', () => {
    renderWithProviders(<GameLeaderboard />);
    expect(screen.getByTestId('leaderboard-toggle')).toBeDefined();
  });

  it('should fetch and display leaderboard entries when opened', async () => {
    renderWithProviders(<GameLeaderboard />);

    // Click toggle to open
    fireEvent.click(screen.getByTestId('leaderboard-toggle'));

    // Wait for leaderboard table to appear
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    // Check entries
    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('95.0%')).toBeDefined();
    expect(screen.getByText('user1')).toBeDefined();
    expect(screen.getByText('87.0%')).toBeDefined();
  });

  it('should toggle open/close (content always mounted for smooth CSS animation)', async () => {
    renderWithProviders(<GameLeaderboard />);

    // LeaderboardContent is always mounted (for smooth CSS transition via maxHeight/opacity)
    // Initially closed — no entries fetched yet, so "leaderboard-empty" shows (not the table)
    expect(screen.getByTestId('leaderboard-empty')).toBeDefined();

    // Open — content becomes visible via CSS animation + fetches data
    fireEvent.click(screen.getByTestId('leaderboard-toggle'));
    await waitFor(() => {
      // After opening, entries are fetched and the leaderboard table renders
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    // Verify entries are loaded
    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('95.0%')).toBeDefined();

    // Close — content stays in DOM but is visually hidden (CSS transition hides it)
    fireEvent.click(screen.getByTestId('leaderboard-toggle'));
    // Verify the toggle worked by checking the button text changed to "Show"
    expect(screen.getByTestId('leaderboard-toggle').textContent).toBe(
      'Show Leaderboard'
    );
    // The table is still in the DOM (not unmounted) because LeaderboardContent keeps
    // its children always-mounted for a smooth CSS fade-out
    expect(screen.getByTestId('leaderboard-table')).toBeDefined();
  });

  it('should persist toggle button across parent re-renders (no flicker)', async () => {
    // Create a wrapper component that simulates parent re-renders
    // to reproduce the flicker from DrawCircleGame state changes
    const Wrapper = () => {
      return (
        <Provider store={store}>
          <I18nextProvider i18n={i18n}>
            <div>
              <GameLeaderboard />
              <button
                data-testid="force-render-button"
                onClick={() => {
                  // Dispatch same auth state to trigger Redux state change
                  // which changes useCallback function identities
                  store.dispatch(loginSuccess({
                    id: 1,
                    username: 'admin',
                    access: 'mock-admin-token',
                    refresh: 'mock-refresh-token',
                    is_staff: true,
                    is_superuser: true,
                    ...defaultAdminFields,
    }));
                }}
              >
                Force Re-render
              </button>
            </div>
          </I18nextProvider>
        </Provider>
      );
    };

    render(<Wrapper />);

    // Confirm toggle button is initially visible for admin
    expect(screen.getByTestId('leaderboard-toggle')).toBeDefined();

    // Open the leaderboard
    fireEvent.click(screen.getByTestId('leaderboard-toggle'));

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });
    expect(screen.getByText('admin')).toBeDefined();

    // Force re-render by clicking button (which dispatches login)
    fireEvent.click(screen.getByTestId('force-render-button'));

    // After re-render, leaderboard toggle and table should STILL be visible (no flicker)
    expect(screen.getByTestId('leaderboard-toggle')).toBeDefined();
    expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    expect(screen.getByText('admin')).toBeDefined();
  });
});