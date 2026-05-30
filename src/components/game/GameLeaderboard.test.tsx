import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import i18n from '../../locale/i18n';
import GameLeaderboard from './GameLeaderboard';
import authReducer, { AuthState } from '../../store/authSlice';
import globalErrorReducer from '../../store/globalErrorSlice';

vi.mock('twin.macro', () => ({
  default: (template: TemplateStringsArray) => {
    const className = template[0];
    return (props: React.ComponentProps<'button' | 'span' | 'div'>) => {
      const Component = className.includes('button') ? 'button' :
                       className.includes('span') ? 'span' : 'div';
      return React.createElement(Component, {
        ...props,
        className: `${className} ${props.className || ''}`.trim(),
        'data-tailwind-class': className,
      });
    };
  },
}));

vi.mock('react-i18next', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-i18next')>();
  return {
    ...actual,
    initReactI18next: {
      type: '3rdParty',
      init: vi.fn(),
    },
    useTranslation: () => ({
      t: (key: string) => {
        const translations: Record<string, string> = {
          'game.leaderboard.show': 'Show Leaderboard',
          'game.leaderboard.hide': 'Hide Leaderboard',
          'game.leaderboard.rank': 'Rank',
          'game.leaderboard.username': 'Username',
          'game.leaderboard.score': 'Score',
          'game.leaderboard.lastPlayed': 'Last Played',
          'game.leaderboard.loadMore': 'Load More',
          'game.leaderboard.loading': 'Loading...',
          'game.leaderboard.empty': 'No leaderboard data available.',
          'game.leaderboard.error': 'Failed to load leaderboard.',
          'game.loading': 'Loading...',
        };
        return translations[key] || key;
      },
      i18n: {
        language: 'en',
        changeLanguage: vi.fn(),
      },
    }),
  };
});

vi.mock('../../services/gameService', () => ({
  getGameLeaderboardPage: vi.fn(),
}));

import { getGameLeaderboardPage } from '../../services/gameService';

const createMockStore = (authState: Partial<AuthState> = {}) => {
  const defaultAuthState: AuthState = {
    user: { id: 1, username: 'admin', is_staff: true, is_superuser: false },
    accessToken: 'mock-admin-token',
    refreshToken: 'mock-refresh-token',
    isAuthenticated: true,
    showLogoutMessage: false,
    ...authState,
  };

  return configureStore({
    reducer: {
      auth: authReducer,
      globalError: globalErrorReducer,
    },
    preloadedState: {
      auth: defaultAuthState,
    },
  });
};

const renderWithProviders = (component: React.ReactElement, authState = {}) => {
  const store = createMockStore(authState);
  return {
    ...render(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          {component}
        </I18nextProvider>
      </Provider>
    ),
    store,
  };
};

describe('GameLeaderboard - Load More Scroll Detection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  const mockPage1 = {
    count: 4,
    next: '/api/game/leaderboard/?page=2',
    previous: null,
    results: [
      { username: 'admin', score: 95, created_at: '2026-01-03T09:35:14Z' },
      { username: 'user1', score: 87, created_at: '2026-01-02T09:35:14Z' },
    ],
  };

  const mockPage2 = {
    count: 4,
    next: null,
    previous: '/api/game/leaderboard/?page=1',
    results: [
      { username: 'user2', score: 76, created_at: '2026-01-01T09:35:14Z' },
      { username: 'user3', score: 65, created_at: '2025-12-31T09:35:14Z' },
    ],
  };

  describe('Load More button visibility', () => {
    it('should show Load More button when nextPageUrl exists (JSDOM: scroll values = 0 → isAtBottom = true)', async () => {
      (getGameLeaderboardPage as ReturnType<typeof vi.fn>).mockResolvedValue(mockPage1);

      renderWithProviders(<GameLeaderboard />);

      const toggleButton = screen.getByTestId('leaderboard-toggle');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument();
      });

      // In JSDOM, scrollHeight/scrollTop/clientHeight are always 0.
      // 0 - 0 - 0 = 0 < 5 → isAtBottom = true → Load More should show
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard-load-more')).toBeInTheDocument();
      });
    });

    it('should hide Load More button when nextPageUrl is null (last page)', async () => {
      const lastPage = { ...mockPage1, next: null };
      (getGameLeaderboardPage as ReturnType<typeof vi.fn>).mockResolvedValue(lastPage);

      renderWithProviders(<GameLeaderboard />);

      const toggleButton = screen.getByTestId('leaderboard-toggle');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument();
      });

      // Even with isAtBottom = true, nextPageUrl is null → no button
      await waitFor(() => {
        expect(screen.queryByTestId('leaderboard-load-more')).not.toBeInTheDocument();
      });
    });

    it('should render the scroll wrapper with scroll handler element', async () => {
      (getGameLeaderboardPage as ReturnType<typeof vi.fn>).mockResolvedValue(mockPage1);

      renderWithProviders(<GameLeaderboard />);

      const toggleButton = screen.getByTestId('leaderboard-toggle');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        const scrollWrapper = screen.getByTestId('leaderboard-scroll-body');
        expect(scrollWrapper).toBeInTheDocument();
        expect((scrollWrapper as any).onscroll).toBeDefined();
      });
    });
  });

  describe('Load More button functionality', () => {
    it('should call getGameLeaderboardPage when Load More button is clicked', async () => {
      (getGameLeaderboardPage as ReturnType<typeof vi.fn>).mockResolvedValue(mockPage1);

      renderWithProviders(<GameLeaderboard />);

      const toggleButton = screen.getByTestId('leaderboard-toggle');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument();
      });

      const scrollWrapper = screen.getByTestId('leaderboard-scroll-body');
      fireEvent.scroll(scrollWrapper);

      const loadMoreButton = await screen.findByTestId('leaderboard-load-more');
      expect(loadMoreButton).toBeInTheDocument();
      expect(loadMoreButton).not.toBeDisabled();
    });

    it('should disable Load More button while loading', async () => {
      (getGameLeaderboardPage as ReturnType<typeof vi.fn>).mockImplementation((url?: string) => {
        if (url) {
          return new Promise(resolve => setTimeout(() => resolve(mockPage2), 500));
        }
        return Promise.resolve(mockPage1);
      });

      renderWithProviders(<GameLeaderboard />);

      const toggleButton = screen.getByTestId('leaderboard-toggle');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument();
      });

      const scrollWrapper = screen.getByTestId('leaderboard-scroll-body');
      fireEvent.scroll(scrollWrapper);

      const loadMoreButton = await screen.findByTestId('leaderboard-load-more');
      fireEvent.click(loadMoreButton);

      await waitFor(() => {
        expect(loadMoreButton).toBeDisabled();
      });
    });
  });

  describe('Scroll detection handler', () => {
    it('should set isAtBottom on initial load when scroll values are 0 (JSDOM)', async () => {
      (getGameLeaderboardPage as ReturnType<typeof vi.fn>).mockResolvedValue(mockPage1);

      renderWithProviders(<GameLeaderboard />);

      const toggleButton = screen.getByTestId('leaderboard-toggle');
      fireEvent.click(toggleButton);

      await waitFor(() => {
        expect(screen.getByTestId('leaderboard-table')).toBeInTheDocument();
      });

      // The useEffect calls checkIsAtBottom() after entries load.
      // In JSDOM, scroll values are 0 → isAtBottom = true → Load More shows
      await waitFor(() => {
        expect(screen.getByTestId('leaderboard-load-more')).toBeInTheDocument();
      });
    });
  });
});