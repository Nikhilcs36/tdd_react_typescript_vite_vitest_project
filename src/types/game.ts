/**
 * Game TypeScript Interfaces
 * Types for the "Draw a Circle" game feature
 */

// GameScore — matches backend GameScore model response
export interface GameScore {
  id: number;
  user: number;
  score: number;
  created_at: string;
}

// MyScoresResponse — GET /api/game/scores/me/ response
export interface MyScoresResponse {
  best_score: number | null;
  count: number;
  next: string | null;
  previous: string | null;
  results: GameScore[];
}

// LeaderboardEntry — best score per user (matches backend response)
export interface LeaderboardEntry {
  username: string;
  score: number;
  created_at: string;
}

// LeaderboardPageResponse — paginated GET /api/game/leaderboard/ response
export interface LeaderboardPageResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: LeaderboardEntry[];
}

// SaveScorePayload — POST /api/game/scores/ body
export interface SaveScorePayload {
  score: number;
}

// GameDrawState — tracks the current state of the game component
export type GameDrawState = 
  | 'idle'       // Initial state, waiting for user to draw
  | 'drawing'    // User is actively drawing on canvas
  | 'drawn'      // Drawing complete, ready to submit
  | 'scoring'    // Saving score to backend
  | 'scored'     // Score saved, showing result
  | 'error';     // API error occurred