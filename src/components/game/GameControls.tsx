import React from 'react';
import { useTranslation } from 'react-i18next';
import { ControlsContainer, GameButton } from './DrawCircleGame.styles';

interface GameControlsProps {
  onClear: () => void;
  onSubmit: () => void;
  canSubmit: boolean;
  isSubmitting: boolean;
  isSubmitted: boolean;
}

const GameControls: React.FC<GameControlsProps> = ({
  onClear,
  onSubmit,
  canSubmit,
  isSubmitting,
  isSubmitted,
}) => {
  const { t } = useTranslation();

  if (isSubmitted) {
    return (
      <ControlsContainer data-testid="game-controls">
        <GameButton
          $variant="primary"
          onClick={onClear}
          data-testid="game-draw-again-button"
        >
          {t('game.drawAgain')}
        </GameButton>
      </ControlsContainer>
    );
  }

  return (
    <ControlsContainer data-testid="game-controls">
      <GameButton
        $variant="secondary"
        onClick={onClear}
        disabled={isSubmitting}
        data-testid="game-clear-button"
      >
        {t('game.clear')}
      </GameButton>
      <GameButton
        $variant="primary"
        onClick={onSubmit}
        disabled={!canSubmit || isSubmitting}
        data-testid="game-submit-button"
      >
        {isSubmitting ? t('game.loading') : t('game.submit')}
      </GameButton>
    </ControlsContainer>
  );
};

export default GameControls;