import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { I18nextProvider } from 'react-i18next';
import { Provider } from 'react-redux';
import i18n from '../locale/i18n';
import store from '../store';
import HomePage from './HomePage';
import { loginSuccess, logoutSuccess } from "../store/authSlice";

// Mock DrawCircleGame since it makes API calls
vi.mock('../components/game/DrawCircleGame', () => ({
  default: () => <div data-testid="game-container">Draw Circle Game</div>,
}));

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <I18nextProvider i18n={i18n}>
        {ui}
      </I18nextProvider>
    </Provider>
  );
};

describe('HomePage', () => {
  afterEach(() => {
    act(() => {
      store.dispatch(logoutSuccess());
    });
  });

  it('should render page container', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByTestId('home-page')).toBeDefined();
  });

  it('should render welcome title and message', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByText('Login Tracking Dashboard')).toBeDefined();
    expect(
      screen.getByText(/Monitor login activity/)
    ).toBeDefined();
  });

  it('should render features grid', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByTestId('home-features-grid')).toBeDefined();
  });

  it('should render all feature cards', () => {
    renderWithProviders(<HomePage />);
    expect(screen.getByTestId('feature-auth')).toBeDefined();
    expect(screen.getByTestId('feature-profile')).toBeDefined();
    expect(screen.getByTestId('feature-userlist')).toBeDefined();
    expect(screen.getByTestId('feature-dashboard')).toBeDefined();
    expect(screen.getByTestId('feature-charts')).toBeDefined();
    expect(screen.getByTestId('feature-admin')).toBeDefined();
    expect(screen.getByTestId('feature-multilang')).toBeDefined();
    expect(screen.getByTestId('feature-theme')).toBeDefined();
    expect(screen.getByTestId('feature-tdd')).toBeDefined();
  });

  it('should render game feature card with correct test id', () => {
    renderWithProviders(<HomePage />);
    // For unauthenticated users, it should show a simple feature card
    expect(screen.getByTestId('feature-game')).toBeDefined();
  });

  it('should not render toggle buttons when unauthenticated', () => {
    renderWithProviders(<HomePage />);
    expect(screen.queryByTestId('view-features-btn')).toBeNull();
    expect(screen.queryByTestId('view-game-btn')).toBeNull();
  });

  describe('when authenticated', () => {
    beforeEach(() => {
      act(() => {
        store.dispatch(loginSuccess({
          id: 1,
          username: 'testuser',
          access: 'mock-access-token',
          refresh: 'mock-refresh-token',
          is_staff: false,
          is_superuser: false,
          logins_remaining_for_staff: 0,
          staff_access_granted: false,
          active_role: 'regular' as const,
          role_label: 'Regular',
        }));
      });
    });

    afterEach(() => {
      act(() => {
        store.dispatch(logoutSuccess());
      });
    });

    it('should render features/game toggle buttons when authenticated', async () => {
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      // Flush effects to resolve useSelector subscription re-renders
      await act(async () => {});
      expect(screen.getByTestId('view-features-btn')).toBeDefined();
      expect(screen.getByTestId('view-game-btn')).toBeDefined();
    });

    it('should show features grid by default when authenticated', async () => {
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      // Flush effects to resolve useSelector subscription re-renders
      await act(async () => {});
      // Features grid should be visible
      expect(screen.getByTestId('home-features-grid')).toBeDefined();
      // Game container should NOT be visible
      expect(screen.queryByTestId('game-container')).toBeNull();
      // The unauthenticated game feature card should not exist
      expect(screen.queryByTestId('feature-game')).toBeNull();
    });

    it('should switch to game section when game button is clicked', async () => {
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      // Flush effects to resolve useSelector subscription re-renders
      await act(async () => {});
      // Click on game toggle button
      await act(async () => {
        fireEvent.click(screen.getByTestId('view-game-btn'));
      });
      // Game container should now be visible
      expect(screen.getByTestId('game-container')).toBeDefined();
      // Features grid should NOT be visible
      expect(screen.queryByTestId('home-features-grid')).toBeNull();
    });

    it('should switch back to features when features button is clicked after switching to game', async () => {
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      // Flush effects to resolve useSelector subscription re-renders
      await act(async () => {});
      // Switch to game first
      await act(async () => {
        fireEvent.click(screen.getByTestId('view-game-btn'));
      });
      expect(screen.getByTestId('game-container')).toBeDefined();
      // Switch back to features
      await act(async () => {
        fireEvent.click(screen.getByTestId('view-features-btn'));
      });
      expect(screen.getByTestId('home-features-grid')).toBeDefined();
      expect(screen.queryByTestId('game-container')).toBeNull();
    });

    it('should render the game section title when game view is selected', async () => {
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      // Flush effects to resolve useSelector subscription re-renders
      await act(async () => {});
      await act(async () => {
        fireEvent.click(screen.getByTestId('view-game-btn'));
      });
      expect(screen.getByText(/🎮 Entertainment Zone/)).toBeDefined();
    });

    it('should render the game section tagline when game view is selected', async () => {
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      // Flush effects to resolve useSelector subscription re-renders
      await act(async () => {});
      await act(async () => {
        fireEvent.click(screen.getByTestId('view-game-btn'));
      });
      expect(
        screen.getByText(/Unlock entertainment/)
      ).toBeDefined();
    });

    it('should not show unauthenticated game feature card', async () => {
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      // Flush effects to resolve useSelector subscription re-renders
      await act(async () => {});
      expect(screen.queryByText(t => t.includes('game-unauth'))).toBeNull();
    });

    it('displays translated Features toggle button text in English', async () => {
      await act(async () => {
        await i18n.changeLanguage("en");
      });
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      await act(async () => {});
      const featuresBtn = screen.getByTestId('view-features-btn');
      expect(featuresBtn).toHaveTextContent('Features');
    });

    it('displays translated Features toggle button text in Malayalam', async () => {
      await act(async () => {
        await i18n.changeLanguage("ml");
      });
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      await act(async () => {});
      const featuresBtn = screen.getByTestId('view-features-btn');
      expect(featuresBtn).toHaveTextContent('സവിശേഷതകൾ');
    });

    it('displays translated Features toggle button text in Arabic', async () => {
      await act(async () => {
        await i18n.changeLanguage("ar");
      });
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      await act(async () => {});
      const featuresBtn = screen.getByTestId('view-features-btn');
      expect(featuresBtn).toHaveTextContent('الميزات');
    });

    it('displays translated Game toggle button text in English', async () => {
      await act(async () => {
        await i18n.changeLanguage("en");
      });
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      await act(async () => {});
      const gameBtn = screen.getByTestId('view-game-btn');
      expect(gameBtn).toHaveTextContent('Game');
    });

    it('displays translated Game toggle button text in Malayalam', async () => {
      await act(async () => {
        await i18n.changeLanguage("ml");
      });
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      await act(async () => {});
      const gameBtn = screen.getByTestId('view-game-btn');
      expect(gameBtn).toHaveTextContent('ഗെയിം');
    });

    it('displays translated Game toggle button text in Arabic', async () => {
      await act(async () => {
        await i18n.changeLanguage("ar");
      });
      await act(async () => {
        renderWithProviders(<HomePage />);
      });
      await act(async () => {});
      const gameBtn = screen.getByTestId('view-game-btn');
      expect(gameBtn).toHaveTextContent('لعبة');
    });
  });
});
