import { useTranslation } from "react-i18next";
import tw from "twin.macro";

const Card = tw.div`bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-6`;
const Title = tw.h2`text-2xl font-bold mb-4 dark:text-dark-text`;
const Message = tw.p`text-gray-600 dark:text-gray-400 text-lg`;

const HomePage = () => {
  const { t } = useTranslation();

  return (
    <div data-testid="home-page">
      <Card>
        <Title>{t("home.welcomeTitle")}</Title>
        <Message>{t("home.welcomeMessage")}</Message>
      </Card>
    </div>
  );
};

export default HomePage;
