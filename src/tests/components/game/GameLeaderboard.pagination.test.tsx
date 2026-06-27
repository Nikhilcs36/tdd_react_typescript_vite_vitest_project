import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
import i18n from '../../../locale/i18n';
import store from '../../../store';
import GameLeaderboard from '../../../components/game/GameLeaderboard';
import { loginSuccess, logoutSuccess } from '../../../store/actions';
import { API_ENDPOINTS } from '../../../services/apiEndpoints';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    </Provider>
  );
};

describe('GameLeaderboard - response format handling', () => {
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
    server.resetHandlers();
  });

  it('should handle paginated Django response format with count/results wrapper', async () => {
    // Simulate Django ListAPIView with DefaultPagination returning:
    // { count: 2, results: [...], next: null, previous: null }
    server.use(
      http.get(API_ENDPOINTS.GAME_LEADERBOARD, async () => {
        return HttpResponse.json({
          count: 2,
          next: null,
          previous: null,
          results: [
            {
              username: 'admin',
              score: 95,
              created_at: '2026-01-03T09:35:14Z',
            },
            {
              username: 'user1',
              score: 87,
              created_at: '2026-01-02T09:35:14Z',
            },
          ],
        });
      })
    );

    await act(async () => {
      renderWithProviders(<GameLeaderboard />);
    });

    // Open the leaderboard
    await act(async () => {
      fireEvent.click(screen.getByTestId('leaderboard-toggle'));
    });

    // Wait for the table to render with data
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    // Verify entries are displayed
    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('95.0%')).toBeDefined();
    expect(screen.getByText('user1')).toBeDefined();
    expect(screen.getByText('87.0%')).toBeDefined();

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should handle plain array response format (current MSW mock format)', async () => {
    // This is the existing format from MSW mocks
    server.use(
      http.get(API_ENDPOINTS.GAME_LEADERBOARD, async () => {
        return HttpResponse.json([
          {
            username: 'admin',
            score: 95,
            created_at: '2026-01-03T09:35:14Z',
          },
          {
            username: 'user1',
            score: 87,
            created_at: '2026-01-02T09:35:14Z',
          },
        ]);
      })
    );

    await act(async () => {
      renderWithProviders(<GameLeaderboard />);
    });

    // Open the leaderboard
    await act(async () => {
      fireEvent.click(screen.getByTestId('leaderboard-toggle'));
    });

    // Wait for the table to render with data
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    // Verify entries are displayed
    expect(screen.getByText('admin')).toBeDefined();
    expect(screen.getByText('95.0%')).toBeDefined();
    expect(screen.getByText('user1')).toBeDefined();
    expect(screen.getByText('87.0%')).toBeDefined();

    // Flush any remaining effects
    await act(async () => {});
  });
});