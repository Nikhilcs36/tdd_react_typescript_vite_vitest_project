import { useTranslation } from "react-i18next";
import tw from "twin.macro";
import {
  PageContainer,
  ContentWrapper,
  Card,
  GridLayout
} from "../components/common/Layout";

// Reuse standardized components
const Title = tw.h2`text-2xl font-bold mb-4 dark:text-dark-text`;
const Message = tw.p`text-gray-600 dark:text-gray-400 text-lg mb-4`;
const FeatureCard = tw.div`bg-gray-50 dark:bg-dark-accent rounded-lg p-4 border border-gray-200 dark:border-dark-accent`;
const FeatureTitle = tw.h3`text-sm font-semibold text-gray-800 dark:text-dark-text mb-1`;
const FeatureDesc = tw.p`text-xs text-gray-600 dark:text-gray-400`;

const HomePage = () => {
  const { t } = useTranslation();

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
  ];

  return (
    <PageContainer data-testid="home-page">
      <ContentWrapper>
        <Card>
          <Title>{t("welcomeTitle")}</Title>
          <Message>{t("welcomeMessage")}</Message>
        </Card>

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
      </ContentWrapper>
    </PageContainer>
  );
};

export default HomePage;
