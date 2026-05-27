import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import {
  GameContainer,
  GameTitle,
  GameSubtitle,
  CanvasWrapper,
  GameCanvas,
  StatusContainer,
  LoadingSpinner,
  ErrorMessage,
  FeatureFlagMessage,
} from './DrawCircleGame.styles';
import GameAccuracyDisplay from './GameAccuracyDisplay';
import GameBestScore from './GameBestScore';
import GameControls from './GameControls';
import GameLeaderboard from './GameLeaderboard';
import { saveGameScore, getMyGameScores } from '../../services/gameService';
import { GameDrawState } from '../../types/game';

// Canvas dimensions
const CANVAS_SIZE = 600;

// Minimum number of points needed before allowing submit
const MIN_POINTS = 30;

interface Point {
  x: number;
  y: number;
}

/**
 * Calculate circle accuracy from drawn points
 * Using coefficient of variation method:
 * 1. Compute center (average of all points)
 * 2. Compute radius for each point from center
 * 3. Compute standard deviation of radii
 * 4. Score = max(0, 100 - (std/mean * 100))
 */
const calculateAccuracy = (points: Point[]): number => {
  if (points.length < 3) return 0;

  // Compute center
  const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
  const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;

  // Compute radii
  const radii = points.map((p) => {
    const dx = p.x - cx;
    const dy = p.y - cy;
    return Math.sqrt(dx * dx + dy * dy);
  });

  // Average radius
  const rAvg = radii.reduce((sum, r) => sum + r, 0) / radii.length;

  // *** BUG FIX: Reject drawings that are too small to be meaningful ***
  // A tiny cluster of points (e.g. all within a 5px area) can produce a
  // deceptively high score because the coefficient of variation is near zero.
  // Require a minimum average radius of 30px for the drawing to count as a
  // genuine circle attempt.
  if (rAvg < 30) return 0; // Too small — likely a scribble, not a real attempt

  // Standard deviation
  const variance = radii.reduce((sum, r) => sum + (r - rAvg) * (r - rAvg), 0) / radii.length;
  const std = Math.sqrt(variance);

  // Coefficient of variation as accuracy
  const cv = std / rAvg;
  const score = Math.max(0, Math.min(100, 100 - cv * 100));

  return Math.round(score * 10) / 10; // Round to 1 decimal
};

const DrawCircleGame: React.FC = () => {
  const { t } = useTranslation();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [points, setPoints] = useState<Point[]>([]);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawState, setDrawState] = useState<GameDrawState>('idle');
  const [currentScore, setCurrentScore] = useState<number | null>(null);
  const [bestScore, setBestScore] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [gameDisabled, setGameDisabled] = useState(false);
  const [loadingScores, setLoadingScores] = useState(true);
  const [themeVersion, setThemeVersion] = useState(0);

  // Watch for theme changes to re-draw canvas with correct colors
  useEffect(() => {
    const observer = new MutationObserver(() => {
      setThemeVersion((v) => v + 1);
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  // Load best score on mount
  useEffect(() => {
    if (!isAuthenticated) {
      setLoadingScores(false);
      return;
    }

    const loadScores = async () => {
      setLoadingScores(true);
      try {
        const data = await getMyGameScores();
        setBestScore(data.best_score);
        setGameDisabled(false);
      } catch (err: unknown) {
        const errorObj = err as { response?: { status?: number; data?: { detail?: string } } };
        if (errorObj?.response?.status === 403) {
          setGameDisabled(true);
        }
        setBestScore(null);
      } finally {
        setLoadingScores(false);
      }
    };

    loadScores();
  }, [isAuthenticated]);

  // Draw on canvas whenever points change
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Detect dark mode — use dark background in dark mode
    const isDark = document.documentElement.classList.contains('dark');
    ctx.fillStyle = isDark ? '#1a202c' : '#ffffff';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Draw subtle grid (darker in dark mode)
    ctx.strokeStyle = isDark ? '#2d3748' : '#f0f0f0';
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_SIZE; i += 50) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_SIZE);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_SIZE, i);
      ctx.stroke();
    }

    if (points.length < 2) return;

    // Draw the user's drawn path
    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();

    // If scored, overlay a perfect circle for comparison
    if (drawState === 'scored' && currentScore !== null) {
      const cx = points.reduce((sum, p) => sum + p.x, 0) / points.length;
      const cy = points.reduce((sum, p) => sum + p.y, 0) / points.length;
      const radii = points.map((p) => {
        const dx = p.x - cx;
        const dy = p.y - cy;
        return Math.sqrt(dx * dx + dy * dy);
      });
      const rAvg = radii.reduce((sum, r) => sum + r, 0) / radii.length;

      // Draw perfect circle overlay in green
      ctx.strokeStyle = 'rgba(34, 197, 94, 0.6)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 5]);
      ctx.beginPath();
      ctx.arc(cx, cy, rAvg, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Draw center point
      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.arc(cx, cy, 4, 0, Math.PI * 2);
      ctx.fill();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, drawState, currentScore, themeVersion]);

  // Redraw whenever points change
  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Handle mouse/touch start
  const handleStart = (clientX: number, clientY: number) => {
    if (drawState === 'scored' || drawState === 'scoring' || gameDisabled) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    setIsDrawing(true);
    setDrawState('drawing');
    setPoints([{ x, y }]);
    setError(null);
  };

  // Handle mouse/touch move
  const handleMove = (clientX: number, clientY: number) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    setPoints((prev) => [...prev, { x, y }]);
  };

  // Handle mouse/touch end
  const handleEnd = () => {
    if (!isDrawing) return;
    setIsDrawing(false);

    if (points.length >= MIN_POINTS) {
      setDrawState('drawn');
    } else {
      setDrawState('idle');
      setPoints([]);
    }
  };

  // Mouse event handlers
  const onMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleStart(e.clientX, e.clientY);
  };
  const onMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    handleMove(e.clientX, e.clientY);
  };
  const onMouseUp = () => {
    handleEnd();
  };
  const onMouseLeave = () => {
    if (isDrawing) handleEnd();
  };

  // Touch event handlers
  const onTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleStart(touch.clientX, touch.clientY);
  };
  const onTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const touch = e.touches[0];
    handleMove(touch.clientX, touch.clientY);
  };
  const onTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    handleEnd();
  };

  // Clear canvas
  const handleClear = () => {
    setPoints([]);
    setDrawState('idle');
    setCurrentScore(null);
    setError(null);
  };

  // Submit score
  const handleSubmit = async () => {
    if (points.length < MIN_POINTS) return;

    const score = calculateAccuracy(points);
    setCurrentScore(score);
    setDrawState('scoring');
    setError(null);

    try {
      await saveGameScore({ score });

      // Refresh best score
      const data = await getMyGameScores();
      setBestScore(data.best_score);
      setDrawState('scored');
    } catch {
      setError(t('game.error'));
      // Still show the score even if save failed
      setDrawState('scored');
    }
  };

  // Get the main game content (single container wrapping all states)
  const renderGameContent = () => (
    <GameContainer data-testid="game-container">
      <GameTitle>{t('game.title')}</GameTitle>

      {loadingScores && (
        <StatusContainer>
          <LoadingSpinner />
        </StatusContainer>
      )}

      {!loadingScores && gameDisabled && (
        <FeatureFlagMessage data-testid="game-disabled-message">
          {t('game.disabled')}
        </FeatureFlagMessage>
      )}

      {!loadingScores && !gameDisabled && (
        <>
          <GameSubtitle>{t('game.instruction')}</GameSubtitle>

          <CanvasWrapper>
            <GameCanvas
              ref={canvasRef}
              width={CANVAS_SIZE}
              height={CANVAS_SIZE}
              data-testid="game-canvas"
              onMouseDown={onMouseDown}
              onMouseMove={onMouseMove}
              onMouseUp={onMouseUp}
              onMouseLeave={onMouseLeave}
              onTouchStart={onTouchStart}
              onTouchMove={onTouchMove}
              onTouchEnd={onTouchEnd}
            />
          </CanvasWrapper>

          <GameControls
            onClear={handleClear}
            onSubmit={handleSubmit}
            canSubmit={drawState === 'drawn'}
            isSubmitting={drawState === 'scoring'}
            isSubmitted={drawState === 'scored'}
          />

          {error && (
            <ErrorMessage data-testid="game-error">
              {error}
            </ErrorMessage>
          )}

          {drawState === 'scoring' && (
            <StatusContainer>
              <LoadingSpinner />
            </StatusContainer>
          )}

          {drawState === 'scored' && currentScore !== null && (
            <StatusContainer data-testid="game-result">
              <GameAccuracyDisplay score={currentScore} />
              <GameBestScore bestScore={bestScore} />
            </StatusContainer>
          )}
        </>
      )}

      <GameLeaderboard />
    </GameContainer>
  );
  return renderGameContent();
};

export default DrawCircleGame;