import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../locale/i18n';
import GameControls from '../../../components/game/GameControls';

const renderWithI18n = (ui: React.ReactElement) => {
  return render(
    <I18nextProvider i18n={i18n}>
      {ui}
    </I18nextProvider>
  );
};

describe('GameControls', () => {
  it('should render clear and submit buttons when not submitted', () => {
    renderWithI18n(
      <GameControls
        onClear={vi.fn()}
        onSubmit={vi.fn()}
        canSubmit={true}
        isSubmitting={false}
        isSubmitted={false}
      />
    );

    expect(screen.getByTestId('game-clear-button')).toBeDefined();
    expect(screen.getByTestId('game-submit-button')).toBeDefined();
  });

  it('should render draw again button when submitted', () => {
    renderWithI18n(
      <GameControls
        onClear={vi.fn()}
        onSubmit={vi.fn()}
        canSubmit={true}
        isSubmitting={false}
        isSubmitted={true}
      />
    );

    expect(screen.getByTestId('game-draw-again-button')).toBeDefined();
    expect(() => screen.getByTestId('game-clear-button')).toThrow();
  });

  it('should call onClear when clear button is clicked', () => {
    const onClear = vi.fn();
    renderWithI18n(
      <GameControls
        onClear={onClear}
        onSubmit={vi.fn()}
        canSubmit={true}
        isSubmitting={false}
        isSubmitted={false}
      />
    );

    fireEvent.click(screen.getByTestId('game-clear-button'));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('should call onSubmit when submit button is clicked', () => {
    const onSubmit = vi.fn();
    renderWithI18n(
      <GameControls
        onClear={vi.fn()}
        onSubmit={onSubmit}
        canSubmit={true}
        isSubmitting={false}
        isSubmitted={false}
      />
    );

    fireEvent.click(screen.getByTestId('game-submit-button'));
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('should disable submit button when canSubmit is false', () => {
    renderWithI18n(
      <GameControls
        onClear={vi.fn()}
        onSubmit={vi.fn()}
        canSubmit={false}
        isSubmitting={false}
        isSubmitted={false}
      />
    );

    const submitButton = screen.getByTestId('game-submit-button') as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
  });

  it('should disable buttons when isSubmitting is true', () => {
    renderWithI18n(
      <GameControls
        onClear={vi.fn()}
        onSubmit={vi.fn()}
        canSubmit={true}
        isSubmitting={true}
        isSubmitted={false}
      />
    );

    const submitButton = screen.getByTestId('game-submit-button') as HTMLButtonElement;
    const clearButton = screen.getByTestId('game-clear-button') as HTMLButtonElement;
    expect(submitButton.disabled).toBe(true);
    expect(clearButton.disabled).toBe(true);
  });
});