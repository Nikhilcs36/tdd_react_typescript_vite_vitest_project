/**
 * Game Service
 * API service functions for the "Draw a Circle" game feature
 * Integrated with centralized error handling system
 */
import { handleApiError } from './errorService';
import { API_ENDPOINTS } from './apiEndpoints';
import store from '../store';
import i18n from '../locale/i18n';
import {
  GameScore,
  MyScoresResponse,
  LeaderboardEntry,
  LeaderboardPageResponse,
  SaveScorePayload
} from '../types/game';

// Common function to build headers with authentication
const buildHeaders = () => {
  const authState = store.getState().auth;
  const accessToken: string | null = authState.accessToken;

  if (!accessToken) {
    throw handleApiError(
      { message: 'Authentication token not found' },
      { operation: 'get' }
    );
  }

  return {
    'Accept-Language': i18n.language,
    Authorization: `JWT ${accessToken}`,
  };
};

// Axios implementation for game service
export const axiosGameApiService = {
  get: async <T>(url: string): Promise<T> => {
    try {
      const headers = buildHeaders();
      const { default: axios } = await import('axios');
      const response = await axios.get<T>(url, { headers });
      return response.data;
    } catch (error) {
      throw handleApiError(error, { endpoint: url, operation: 'get' });
    }
  },
  post: async <T>(url: string, body: Record<string, unknown>): Promise<T> => {
    try {
      const headers = buildHeaders();
      const { default: axios } = await import('axios');
      const response = await axios.post<T>(url, body, { headers });
      return response.data;
    } catch (error) {
      throw handleApiError(error, { endpoint: url, operation: 'post' });
    }
  },
};

// Fetch implementation for game service (for MSW testing)
export const fetchGameApiService = {
  get: async <T>(url: string): Promise<T> => {
    const headers = buildHeaders();

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw handleApiError(
          { response: { status: response.status, data: errorData } },
          { endpoint: url, operation: 'get' }
        );
      }

      return response.json() as T;
    } catch (error) {
      throw handleApiError(error, { endpoint: url, operation: 'get' });
    }
  },
  post: async <T>(url: string, body: Record<string, unknown>): Promise<T> => {
    const headers = buildHeaders();

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...headers,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw handleApiError(
          { response: { status: response.status, data: errorData } },
          { endpoint: url, operation: 'post' }
        );
      }

      return response.json() as T;
    } catch (error) {
      throw handleApiError(error, { endpoint: url, operation: 'post' });
    }
  },
};

const gameApi = import.meta.env.VITEST ? fetchGameApiService : axiosGameApiService;

// Specific service functions for each endpoint
export const gameService = {
  // Save a game score
  saveGameScore: async (payload: SaveScorePayload): Promise<GameScore> => {
    return gameApi.post<GameScore>(API_ENDPOINTS.GAME_SCORES, payload as unknown as Record<string, unknown>);
  },

  // Get own game scores with best score
  getMyGameScores: async (): Promise<MyScoresResponse> => {
    return gameApi.get<MyScoresResponse>(API_ENDPOINTS.GAME_SCORES_ME);
  },

  // Get leaderboard page (admin only) — returns paginated response with count, next, results
  // Accepts an optional URL parameter to fetch subsequent pages
  // Automatically handles absolute URLs (e.g. "http://backend:8000/api/game/leaderboard/?page=2")
  // by stripping the host and only using the path + query string, so requests go through
  // the browser's configured proxy (localhost:5173) instead of trying to resolve Docker hostnames.
  getGameLeaderboardPage: async (url?: string): Promise<LeaderboardPageResponse> => {
    let endpoint = url || API_ENDPOINTS.GAME_LEADERBOARD;
    // If the URL is absolute (starts with http), extract just the path + query string
    if (endpoint.startsWith('http')) {
      try {
        const parsed = new URL(endpoint);
        endpoint = parsed.pathname + parsed.search;
      } catch {
        // If parsing fails, use the URL as-is
      }
    }
    const data = await gameApi.get<LeaderboardEntry[] | LeaderboardPageResponse>(endpoint);
    // If the response is a plain array, wrap it in a paginated format
    if (Array.isArray(data)) {
      return {
        count: data.length,
        next: null,
        previous: null,
        results: data,
      };
    }
    return data;
  },

  // Get leaderboard (admin only) — returns all entries from first page
  // Handles both plain array responses [] and paginated Django responses { count, results }
  getGameLeaderboard: async (): Promise<LeaderboardEntry[]> => {
    const page = await gameService.getGameLeaderboardPage();
    return page.results;
  },
};

// Export individual functions for easier testing
export const {
  saveGameScore,
  getMyGameScores,
  getGameLeaderboard,
  getGameLeaderboardPage,
} = gameService;