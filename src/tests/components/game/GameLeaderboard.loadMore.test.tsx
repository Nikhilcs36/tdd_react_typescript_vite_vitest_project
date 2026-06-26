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
import { defaultAuthFields } from '../../testAuthHelpers';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    </Provider>
  );
};

// Generate mock entries for pagination testing
const generateMockEntries = (count: number, startIndex: number = 0) => {
  return Array.from({ length: count }, (_, i) => ({
    username: `player${startIndex + i + 1}`,
    score: Math.round((95 - (startIndex + i) * 1.5) * 10) / 10,
    created_at: '2026-01-0' + ((startIndex + i) % 9 + 1) + 'T09:35:14Z',
  }));
};

const PAGE_SIZE = 10;
const TOTAL_ENTRIES = 25;
const API_BASE = '/api/game/leaderboard/';

describe('GameLeaderboard - load more pagination', () => {
  beforeEach(() => {
    act(() => {
      store.dispatch(loginSuccess({
        id: 1,
        username: 'admin',
        access: 'mock-admin-token',
        refresh: 'mock-refresh-token',
        is_staff: true,
        is_superuser: true,
        ...defaultAuthFields,
      }));
    });
  });

  afterEach(() => {
    act(() => {
      store.dispatch(logoutSuccess());
    });
    server.resetHandlers();
  });

  it('should show only first page on initial load and display Load More button', async () => {
    server.use(
      http.get(API_ENDPOINTS.GAME_LEADERBOARD, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page')) || 1;
        const startIndex = (page - 1) * PAGE_SIZE;
        const results = generateMockEntries(Math.min(PAGE_SIZE, TOTAL_ENTRIES - startIndex), startIndex);
        const totalPages = Math.ceil(TOTAL_ENTRIES / PAGE_SIZE);
        return HttpResponse.json({
          count: TOTAL_ENTRIES,
          next: page < totalPages ? `${API_BASE}?page=${page + 1}&size=${PAGE_SIZE}` : null,
          previous: page > 1 ? `${API_BASE}?page=${page - 1}&size=${PAGE_SIZE}` : null,
          results,
        });
      })
    );

    renderWithProviders(<GameLeaderboard />);
    fireEvent.click(screen.getByTestId('leaderboard-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    const rows = screen.getAllByTestId(/leaderboard-row-/);
    expect(rows).toHaveLength(10);
    expect(screen.getByText('player1')).toBeDefined();
    expect(screen.getByText('player10')).toBeDefined();
    expect(screen.queryByText('player11')).toBeNull();
    expect(screen.getByTestId('leaderboard-load-more')).toBeDefined();
  });

  it('should load next page and append entries when Load More is clicked', async () => {
    server.use(
      http.get(API_ENDPOINTS.GAME_LEADERBOARD, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page')) || 1;
        const startIndex = (page - 1) * PAGE_SIZE;
        const results = generateMockEntries(Math.min(PAGE_SIZE, TOTAL_ENTRIES - startIndex), startIndex);
        const totalPages = Math.ceil(TOTAL_ENTRIES / PAGE_SIZE);
        return HttpResponse.json({
          count: TOTAL_ENTRIES,
          next: page < totalPages ? `${API_BASE}?page=${page + 1}&size=${PAGE_SIZE}` : null,
          previous: page > 1 ? `${API_BASE}?page=${page - 1}&size=${PAGE_SIZE}` : null,
          results,
        });
      })
    );

    renderWithProviders(<GameLeaderboard />);
    fireEvent.click(screen.getByTestId('leaderboard-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    expect(screen.getAllByTestId(/leaderboard-row-/)).toHaveLength(10);

    fireEvent.click(screen.getByTestId('leaderboard-load-more'));

    await waitFor(() => {
      const rows = screen.getAllByTestId(/leaderboard-row-/);
      expect(rows).toHaveLength(20);
    });

    expect(screen.getByText('player11')).toBeDefined();
    expect(screen.getByText('player20')).toBeDefined();
    expect(screen.getByTestId('leaderboard-load-more')).toBeDefined();
  });

  it('should hide Load More button when all entries are loaded', async () => {
    const SMALL_TOTAL = 12;
    server.use(
      http.get(API_ENDPOINTS.GAME_LEADERBOARD, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page')) || 1;
        const startIndex = (page - 1) * PAGE_SIZE;
        const results = generateMockEntries(Math.min(PAGE_SIZE, SMALL_TOTAL - startIndex), startIndex);
        const totalPages = Math.ceil(SMALL_TOTAL / PAGE_SIZE);
        return HttpResponse.json({
          count: SMALL_TOTAL,
          next: page < totalPages ? `${API_BASE}?page=${page + 1}&size=${PAGE_SIZE}` : null,
          previous: page > 1 ? `${API_BASE}?page=${page - 1}&size=${PAGE_SIZE}` : null,
          results,
        });
      })
    );

    renderWithProviders(<GameLeaderboard />);
    fireEvent.click(screen.getByTestId('leaderboard-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });
    expect(screen.getAllByTestId(/leaderboard-row-/)).toHaveLength(10);
    expect(screen.getByTestId('leaderboard-load-more')).toBeDefined();

    fireEvent.click(screen.getByTestId('leaderboard-load-more'));

    await waitFor(() => {
      const rows = screen.getAllByTestId(/leaderboard-row-/);
      expect(rows).toHaveLength(12);
    });

    expect(screen.queryByTestId('leaderboard-load-more')).toBeNull();
  });

  it('should disable Load More button while loading', async () => {
    server.use(
      http.get(API_ENDPOINTS.GAME_LEADERBOARD, ({ request }) => {
        const url = new URL(request.url);
        const page = Number(url.searchParams.get('page')) || 1;
        const startIndex = (page - 1) * PAGE_SIZE;
        const results = generateMockEntries(Math.min(PAGE_SIZE, TOTAL_ENTRIES - startIndex), startIndex);
        const totalPages = Math.ceil(TOTAL_ENTRIES / PAGE_SIZE);
        return HttpResponse.json({
          count: TOTAL_ENTRIES,
          next: page < totalPages ? `${API_BASE}?page=${page + 1}&size=${PAGE_SIZE}` : null,
          previous: page > 1 ? `${API_BASE}?page=${page - 1}&size=${PAGE_SIZE}` : null,
          results,
        });
      })
    );

    renderWithProviders(<GameLeaderboard />);
    fireEvent.click(screen.getByTestId('leaderboard-toggle'));

    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    const loadMoreButton = screen.getByTestId('leaderboard-load-more');
    fireEvent.click(loadMoreButton);

    expect(loadMoreButton).toBeDisabled();
    expect(loadMoreButton.textContent).toBe('Loading...');

    await waitFor(() => {
      const rows = screen.getAllByTestId(/leaderboard-row-/);
      expect(rows).toHaveLength(20);
    });

    expect(screen.getByTestId('leaderboard-load-more')).not.toBeDisabled();
  });
});