import React from 'react';
import { useTranslation } from 'react-i18next';
import { BestScoreDisplay } from './DrawCircleGame.styles';

interface GameBestScoreProps {
  bestScore: number | null;
}

const GameBestScore: React.FC<GameBestScoreProps> = ({ bestScore }) => {
  const { t } = useTranslation();

  if (bestScore === null || bestScore === undefined) {
    return (
      <BestScoreDisplay data-testid="game-best-score">
        {t('game.noBestScore')}
      </BestScoreDisplay>
    );
  }

  return (
    <BestScoreDisplay data-testid="game-best-score">
      {t('game.bestScore', { score: Math.round(bestScore) })}
    </BestScoreDisplay>
  );
};

export default GameBestScore;