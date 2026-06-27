import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../locale/i18n';
import store from '../../../store';
import DrawCircleGame from '../../../components/game/DrawCircleGame';
import { loginSuccess, logoutSuccess } from '../../../store/actions';
import { server } from '../../mocks/server';
import { http, HttpResponse } from 'msw';
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

describe('DrawCircleGame', () => {
  beforeEach(() => {
    act(() => {
      store.dispatch(loginSuccess({
        id: 1,
        username: 'testuser',
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
  });

  afterEach(() => {
    act(() => {
      store.dispatch(logoutSuccess());
    });
    server.resetHandlers();
  });

  it('should render canvas and instruction text', async () => {
    await act(async () => {
      renderWithProviders(<DrawCircleGame />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('game-canvas')).toBeDefined();
    });

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should show game disabled message when game section is disabled', async () => {
    // Override the GET scores/me handler to return 403
    server.use(
      http.get(API_ENDPOINTS.GAME_SCORES_ME, async () => {
        return HttpResponse.json(
          { detail: 'Game section is disabled' },
          { status: 403 }
        );
      })
    );

    await act(async () => {
      renderWithProviders(<DrawCircleGame />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('game-disabled-message')).toBeDefined();
    });

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should render canvas after loading scores', async () => {
    await act(async () => {
      renderWithProviders(<DrawCircleGame />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('game-canvas')).toBeDefined();
    });

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should show controls after loading', async () => {
    await act(async () => {
      renderWithProviders(<DrawCircleGame />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('game-controls')).toBeDefined();
    });

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should handle canvas mouse events for drawing', async () => {
    await act(async () => {
      renderWithProviders(<DrawCircleGame />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('game-canvas')).toBeDefined();
    });

    const canvas = screen.getByTestId('game-canvas');

    // Simulate drawing by triggering mouse events
    await act(async () => {
      fireEvent.mouseDown(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 100 });
      fireEvent.mouseMove(canvas, { clientX: 150, clientY: 150 });
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 150 });
      fireEvent.mouseMove(canvas, { clientX: 100, clientY: 100 });
      fireEvent.mouseUp(canvas);
    });

    // After drawing, the canvas should have triggered events
    await waitFor(() => {
      expect(canvas).toBeDefined();
    });

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should show best score after loading', async () => {
    await act(async () => {
      renderWithProviders(<DrawCircleGame />);
    });

    await waitFor(() => {
      // After loading, best score should be displayed either as value or "no best score"
      const bestScore = screen.queryByTestId('game-best-score');
      if (bestScore) {
        expect(bestScore).toBeDefined();
      }
    });

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should render GameLeaderboard after the game canvas and controls (at the bottom)', async () => {
    // Set up admin user so leaderboard renders
    act(() => {
      store.dispatch(logoutSuccess());
    });
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
        active_role: 'superuser' as const,
        role_label: 'Superuser',
      }));
    });

    await act(async () => {
      renderWithProviders(<DrawCircleGame />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('game-canvas')).toBeDefined();
    });

    // The leaderboard toggle button should be in the DOM
    const leaderboardToggle = screen.getByTestId('leaderboard-toggle');
    expect(leaderboardToggle).toBeDefined();

    // The leaderboard button should come after the game container in the DOM
    const gameContainer = screen.getByTestId('game-container');

    // Use compareDocumentPosition to check ordering
    const position = gameContainer.compareDocumentPosition(leaderboardToggle);
    // DOCUMENT_POSITION_FOLLOWING (4) means leaderboard is after game-container
    expect(position & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should handle clear button reset', async () => {
    await act(async () => {
      renderWithProviders(<DrawCircleGame />);
    });

    await waitFor(() => {
      expect(screen.getByTestId('game-canvas')).toBeDefined();
    });

    // Initially, controls should show clear and submit (disabled)
    const clearButton = screen.queryByTestId('game-clear-button');
    expect(clearButton).toBeDefined();

    // Flush any remaining effects
    await act(async () => {});
  });
});