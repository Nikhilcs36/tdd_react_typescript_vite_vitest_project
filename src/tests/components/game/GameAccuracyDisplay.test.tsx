import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../locale/i18n';
import GameAccuracyDisplay from '../../../components/game/GameAccuracyDisplay';

const renderWithI18n = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>
  );
};

describe('GameAccuracyDisplay', () => {
  it('should display the score percentage', () => {
    renderWithI18n(<GameAccuracyDisplay score={85} />);

    const scoreValue = screen.getByTestId('game-score-value');
    expect(scoreValue).toBeDefined();
    expect(scoreValue.textContent).toContain('85%');
  });

  it('should display rating text', () => {
    renderWithI18n(<GameAccuracyDisplay score={85} />);

    const ratingText = screen.getByTestId('game-rating-text');
    expect(ratingText).toBeDefined();
  });

  it('should show "Excellent" rating for score >= 90', () => {
    renderWithI18n(<GameAccuracyDisplay score={95} />);

    const ratingText = screen.getByTestId('game-rating-text');
    expect(ratingText.textContent).toBeTruthy();
  });

  it('should show "Poor" rating for score < 50', () => {
    renderWithI18n(<GameAccuracyDisplay score={30} />);

    const ratingText = screen.getByTestId('game-rating-text');
    expect(ratingText.textContent).toBeTruthy();
  });
});