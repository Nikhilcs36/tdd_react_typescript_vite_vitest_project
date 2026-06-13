import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSelector } from "react-redux";
import tw from "twin.macro";
import {
  PageContainer,
  ContentWrapper,
  Card,
  GridLayout
} from "../components/common/Layout";
import DrawCircleGame from "../components/game/DrawCircleGame";
import type { RootState } from "../store";

// Reuse standardized components
const Title = tw.h2`text-2xl font-bold mb-4 dark:text-dark-text`;
const Message = tw.p`text-gray-600 dark:text-gray-400 text-lg mb-4`;
const FeatureCard = tw.div`bg-gray-50 dark:bg-dark-accent rounded-lg p-4 border border-gray-200 dark:border-dark-accent`;
const FeatureTitle = tw.h3`text-sm font-semibold text-gray-800 dark:text-dark-text mb-1`;
const FeatureDesc = tw.p`text-xs text-gray-600 dark:text-gray-400`;

// Game section styles — use standard card styling for consistency
const GameSectionTitle = tw.h2`text-lg font-semibold text-gray-800 dark:text-dark-text mb-1`;
const GameSectionTagline = tw.p`text-xs text-gray-600 dark:text-gray-400 mb-4`;

// Toggle button styles
const ToggleContainer = tw.div`flex gap-2 mb-6`;
const ToggleButtonBase = tw.button`px-6 py-2 rounded-full text-sm font-semibold transition-colors duration-200 cursor-pointer`;
const ToggleButtonActive = tw(ToggleButtonBase)`bg-blue-600 text-white dark:bg-blue-500`;
const ToggleButtonInactive = tw(ToggleButtonBase)`bg-gray-200 text-gray-700 dark:bg-dark-accent dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600`;

type ViewMode = 'features' | 'game';

const HomePage = () => {
  const { t } = useTranslation();
  const [viewMode, setViewMode] = useState<ViewMode>('features');

  const features = [
    { key: 'auth', title: t('homepage.features.auth'), desc: t('homepage.features.authDesc') },
    { key: 'profile', title: t('homepage.features.profile'), desc: t('homepage.features.profileDesc') },
    { key: 'userlist', title: t('homepage.features.userlist'), desc: t('homepage.features.userlistDesc') },
    { key: 'dashboard', title: t('homepage.features.dashboard'), desc: t('homepage.features.dashboardDesc') },
    { key: 'charts', title: t('homepage.features.charts'), desc: t('homepage.features.chartsDesc') },
    { key: 'admin', title: t('homepage.features.admin'), desc: t('homepage.features.adminDesc') },
    { key: 'multilang', title: t('homepage.features.multilang'), desc: t('homepage.features.multilangDesc') },
    { key: 'theme', title: t('homepage.features.theme'), desc: t('homepage.features.themeDesc') },
    { key: 'tdd', title: t('homepage.features.tdd'), desc: t('homepage.features.tddDesc') },
    { key: 'report', title: t('homepage.features.report'), desc: t('homepage.features.reportDesc') },
  ];

  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  return (
    <PageContainer data-testid="home-page">
      <ContentWrapper>
        <Card>
          <Title>{t("welcomeTitle")}</Title>
          <Message>{t("welcomeMessage")}</Message>
        </Card>

        {isAuthenticated && (
          <ToggleContainer>
            <ToggleButtonActive
              as={viewMode === 'features' ? ToggleButtonActive : ToggleButtonInactive}
              data-testid="view-features-btn"
              onClick={() => setViewMode('features')}
            >
              {t('homepage.toggle.features', 'Features')}
            </ToggleButtonActive>
            <ToggleButtonActive
              as={viewMode === 'game' ? ToggleButtonActive : ToggleButtonInactive}
              data-testid="view-game-btn"
              onClick={() => setViewMode('game')}
            >
              🎮 {t('homepage.toggle.game', 'Game')}
            </ToggleButtonActive>
          </ToggleContainer>
        )}

        {/* Unauthenticated: always show features grid + game-unauth card (existing behavior) */}
        {!isAuthenticated && (
          <Card>
            <Title>{t("homepage.featuresTitle")}</Title>
            <GridLayout data-testid="home-features-grid">
              {features.map((feature) => (
                <FeatureCard key={feature.key} data-testid={`feature-${feature.key}`}>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDesc>{feature.desc}</FeatureDesc>
                </FeatureCard>
              ))}

              <FeatureCard data-testid="feature-game" key="game-unauth">
                <FeatureTitle>🎮 {t('homepage.features.game')}</FeatureTitle>
                <FeatureDesc>{t('homepage.features.gameDesc')}</FeatureDesc>
              </FeatureCard>
            </GridLayout>
          </Card>
        )}

        {/* Authenticated: show features or game based on viewMode */}
        {isAuthenticated && viewMode === 'features' && (
          <Card>
            <Title>{t("homepage.featuresTitle")}</Title>
            <GridLayout data-testid="home-features-grid">
              {features.map((feature) => (
                <FeatureCard key={feature.key} data-testid={`feature-${feature.key}`}>
                  <FeatureTitle>{feature.title}</FeatureTitle>
                  <FeatureDesc>{feature.desc}</FeatureDesc>
                </FeatureCard>
              ))}
            </GridLayout>
          </Card>
        )}

        {isAuthenticated && viewMode === 'game' && (
          <Card>
            <GameSectionTitle>🎮 {t('homepage.features.game')}</GameSectionTitle>
            <GameSectionTagline>{t('homepage.gameSection.subtitle')}</GameSectionTagline>
            <hr className="mt-4 mb-3 border-t border-gray-200 dark:border-gray-700" />
            <DrawCircleGame />
          </Card>
        )}
      </ContentWrapper>
    </PageContainer>
  );
};

export default HomePage;