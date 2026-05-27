/**
 * Game Service Tests
 * Tests for the "Draw a Circle" game API service
 */
import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest';
import { http, HttpResponse } from 'msw';
import { server } from '../mocks/server';
import { API_ENDPOINTS } from '../../services/apiEndpoints';
import {
  saveGameScore,
  getMyGameScores,
  getGameLeaderboard,
  getGameLeaderboardPage,
} from '../../services/gameService';
import store from '../../store';
import { loginSuccess, logoutSuccess } from '../../store/actions';

// Helper to set auth state in Redux store
const setAuthState = (token: string | null, isStaff: boolean = false) => {
  if (token === null) {
    store.dispatch(logoutSuccess());
    return;
  }
  store.dispatch(loginSuccess({
    id: 1,
    username: 'testuser',
    access: token,
    refresh: 'mock-refresh-token',
    is_staff: isStaff,
    is_superuser: isStaff,
  }));
};

describe('Game Service', () => {
  beforeAll(() => {
    setAuthState('mock-access-token');
  });

  afterAll(() => {
    setAuthState(null);
  });

  afterEach(() => {
    server.resetHandlers();
  });

  describe('saveGameScore', () => {
    it('should save a game score successfully', async () => {
      const result = await saveGameScore({ score: 85 });

      expect(result).toBeDefined();
      expect(result.id).toBe(1);
      expect(result.score).toBe(85);
      expect(result.created_at).toBeDefined();
    });

    it('should throw error when unauthenticated', async () => {
      setAuthState(null);

      await expect(
        saveGameScore({ score: 85 })
      ).rejects.toThrow();

      // Restore auth for subsequent tests
      setAuthState('mock-access-token');
    });

    it('should throw error when game section is disabled', async () => {
      server.use(
        http.post(API_ENDPOINTS.GAME_SCORES, async () => {
          return HttpResponse.json(
            { detail: 'Game section is disabled' },
            { status: 403 }
          );
        })
      );

      await expect(
        saveGameScore({ score: 85 })
      ).rejects.toBeDefined();
    });
  });

  describe('getMyGameScores', () => {
    it('should return scores with best_score', async () => {
      const result = await getMyGameScores();

      expect(result).toBeDefined();
      expect(result.best_score).toBe(87);
      expect(result.count).toBe(3);
      expect(result.results).toHaveLength(3);
      expect(result.results[0].score).toBe(76);
    });

    it('should throw error when unauthenticated', async () => {
      setAuthState(null);

      await expect(getMyGameScores()).rejects.toThrow();

      // Restore auth
      setAuthState('mock-access-token');
    });
  });

  describe('getGameLeaderboard', () => {
    it('should return leaderboard entries for admin users', async () => {
      setAuthState('mock-admin-token', true);

      const result = await getGameLeaderboard();

      expect(result).toBeDefined();
      expect(result).toHaveLength(2);
      expect(result[0].username).toBe('admin');
      expect(result[0].score).toBe(95);
      expect(result[1].username).toBe('user1');
      expect(result[1].score).toBe(87);
    });

    it('should throw 403 for non-admin users', async () => {
      setAuthState('mock-access-token', false);

      await expect(getGameLeaderboard()).rejects.toBeDefined();
    });
  });

  describe('getGameLeaderboardPage', () => {
    it('should handle absolute URL next links (Docker hostname) by stripping to relative path', async () => {
      setAuthState('mock-admin-token', true);

      // Simulate a next page URL with an absolute Docker hostname
      const absoluteNextUrl = 'http://backend:8000/api/game/leaderboard/?page=2&size=10';

      // Override the MSW handler for the next page request
      // The frontend should strip the absolute URL to /api/game/leaderboard/?page=2&size=10
      // which will match this MSW handler
      server.use(
        http.get(API_ENDPOINTS.GAME_LEADERBOARD, ({ request }) => {
          const url = new URL(request.url);
          const page = Number(url.searchParams.get('page')) || 1;
          return HttpResponse.json({
            count: 5,
            next: null,
            previous: null,
            results: page === 1
              ? [{ username: 'user1', score: 90, created_at: '2026-01-01T00:00:00Z' }]
              : [{ username: 'user2', score: 80, created_at: '2026-01-02T00:00:00Z' }],
          });
        })
      );

      // First request: get first page
      const page1 = await getGameLeaderboardPage();
      expect(page1.results).toHaveLength(1);
      expect(page1.results[0].username).toBe('user1');

      // Second request: use absolute URL as next link (simulating Docker backend response)
      // This should work — the service should strip the host and use the relative path
      const page2 = await getGameLeaderboardPage(absoluteNextUrl);
      expect(page2.results).toHaveLength(1);
      expect(page2.results[0].username).toBe('user2');
    });
  });
});