import React from 'react';
import { useTranslation } from 'react-i18next';
import { ScoreDisplay, RatingText } from './DrawCircleGame.styles';

interface GameAccuracyDisplayProps {
  score: number;
}

const getRating = (score: number): { key: string; color: string } => {
  if (score >= 90) return { key: 'game.rating.excellent', color: 'text-green-500 dark:text-green-400' };
  if (score >= 75) return { key: 'game.rating.good', color: 'text-blue-500 dark:text-blue-400' };
  if (score >= 50) return { key: 'game.rating.fair', color: 'text-yellow-500 dark:text-yellow-400' };
  return { key: 'game.rating.poor', color: 'text-red-500 dark:text-red-400' };
};

const GameAccuracyDisplay: React.FC<GameAccuracyDisplayProps> = ({ score }) => {
  const { t } = useTranslation();
  const rating = getRating(score);
  const roundedScore = Math.round(score);

  return (
    <div data-testid="game-accuracy-display">
      <ScoreDisplay
        data-testid="game-score-value"
        className={rating.color}
      >
        {roundedScore}%
      </ScoreDisplay>
      <RatingText
        data-testid="game-rating-text"
        className={rating.color}
      >
        {t(rating.key)}
      </RatingText>
    </div>
  );
};

export default GameAccuracyDisplay;