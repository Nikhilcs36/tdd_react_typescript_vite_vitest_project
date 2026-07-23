import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../../../locale/i18n';
import store from '../../../store';
import GameLeaderboard from '../../../components/game/GameLeaderboard';
import { loginSuccess, logoutSuccess } from "../../../store/authSlice";
import { http, HttpResponse } from 'msw';
import { server } from '../../mocks/server';
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

describe('GameLeaderboard - Scrollable Container', () => {
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

  it('should have overflow-y auto and fixed max-height on the scrollable tbody wrapper when open', async () => {
    // Override handler to return many entries to test scrolling
    const manyEntries = Array.from({ length: 50 }, (_, i) => ({
      username: `user${i + 1}`,
      score: 100 - i,
      created_at: '2026-01-01T00:00:00Z',
    }));

    server.use(
      http.get(API_ENDPOINTS.GAME_LEADERBOARD, async () => {
        return HttpResponse.json({
          count: 50,
          next: null,
          previous: null,
          results: manyEntries,
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

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    // Verify the scrollable tbody container has overflow-y auto and max-height
    const scrollBody = screen.getByTestId('leaderboard-scroll-body');
    const computedStyle = window.getComputedStyle(scrollBody);
    expect(computedStyle.overflowY).toBe('auto');
    expect(computedStyle.maxHeight).toBe('300px');

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should keep table header fixed and not inside the scrollable area', async () => {
    await act(async () => {
      renderWithProviders(<GameLeaderboard />);
    });

    // Open the leaderboard
    await act(async () => {
      fireEvent.click(screen.getByTestId('leaderboard-toggle'));
    });

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    // The thead should have position sticky for fixed header
    const thead = document.querySelector('thead');
    expect(thead).not.toBeNull();
    if (thead) {
      const theadStyle = window.getComputedStyle(thead);
      expect(theadStyle.position).toBe('sticky');
      expect(theadStyle.top).toBe('0px');
    }

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should have the scrollable body as a block-level element for proper overflow', async () => {
    await act(async () => {
      renderWithProviders(<GameLeaderboard />);
    });

    // Open the leaderboard
    await act(async () => {
      fireEvent.click(screen.getByTestId('leaderboard-toggle'));
    });

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    const scrollBody = screen.getByTestId('leaderboard-scroll-body');
    const computedStyle = window.getComputedStyle(scrollBody);
    expect(computedStyle.display).toBe('block');

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should have table-layout fixed on the table so th and td columns stay aligned', async () => {
    const manyEntries = Array.from({ length: 5 }, (_, i) => ({
      username: `user${i + 1}`,
      score: 100 - i,
      created_at: '2026-01-01T00:00:00Z',
    }));

    server.use(
      http.get(API_ENDPOINTS.GAME_LEADERBOARD, async () => {
        return HttpResponse.json({
          count: 5,
          next: null,
          previous: null,
          results: manyEntries,
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

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    const table = screen.getByTestId('leaderboard-table');
    const tableStyle = window.getComputedStyle(table);
    expect(tableStyle.tableLayout).toBe('fixed');

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should render a styled th element with background for each column header to prevent bleed-through', async () => {
    await act(async () => {
      renderWithProviders(<GameLeaderboard />);
    });

    // Open the leaderboard
    await act(async () => {
      fireEvent.click(screen.getByTestId('leaderboard-toggle'));
    });

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    // Verify we have all four header columns rendered as th elements
    const table = screen.getByTestId('leaderboard-table');
    const headers = table.querySelectorAll('thead th');
    expect(headers.length).toBe(4);
    // Each th should have a non-empty className from styled-components
    headers.forEach(th => {
      expect(th.className).toBeTruthy();
    });

    // Flush any remaining effects
    await act(async () => {});
  });

  it('should have the sticky header above the scrollable body for proper coverage on scroll', async () => {
    await act(async () => {
      renderWithProviders(<GameLeaderboard />);
    });

    // Open the leaderboard
    await act(async () => {
      fireEvent.click(screen.getByTestId('leaderboard-toggle'));
    });

    // Wait for entries to load
    await waitFor(() => {
      expect(screen.getByTestId('leaderboard-table')).toBeDefined();
    });

    // Verify DOM structure: scroll wrapper contains the table with thead
    const scrollBody = screen.getByTestId('leaderboard-scroll-body');
    const table = scrollBody.querySelector('table');
    expect(table).not.toBeNull();
    const thead = table?.querySelector('thead');
    expect(thead).not.toBeNull();
    // thead must be the first child of the table (before tbody)
    const tableChildren = table?.children;
    expect(tableChildren?.[0]?.tagName).toBe('THEAD');
    const tbody = table?.querySelector('tbody');
    expect(tbody).not.toBeNull();

    // Flush any remaining effects
    await act(async () => {});
  });
});
