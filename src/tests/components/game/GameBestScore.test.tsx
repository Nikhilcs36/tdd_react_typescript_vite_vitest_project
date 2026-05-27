import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../locale/i18n';
import GameBestScore from '../../../components/game/GameBestScore';

const renderWithI18n = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>
  );
};

describe('GameBestScore', () => {
  it('should display best score when available', () => {
    renderWithI18n(<GameBestScore bestScore={87} />);

    const element = screen.getByTestId('game-best-score');
    expect(element).toBeDefined();
    expect(element.textContent).toContain('87');
  });

  it('should display no best score message when null', () => {
    renderWithI18n(<GameBestScore bestScore={null} />);

    const element = screen.getByTestId('game-best-score');
    expect(element).toBeDefined();
    expect(element.textContent).not.toContain('87');
  });
});