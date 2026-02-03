import tw from "twin.macro";
import UserList from "../components/UserList";
import { axiosApiServiceLoadUserList } from "../services/apiService";
import { withTranslation, WithTranslation } from "react-i18next";

const PageContainer = tw.div`min-h-screen bg-gray-50 dark:bg-dark-primary py-8`;
const ContentWrapper = tw.div`max-w-6xl mx-auto px-4 sm:px-6 lg:px-8`;
const PageHeader = tw.div`mb-8`;
const Title = tw.h1`text-3xl font-bold text-gray-900 dark:text-dark-text mb-2`;
const Subtitle = tw.p`text-gray-600 dark:text-gray-300`;

interface UserListPageProps extends WithTranslation {}

const UserListPage = ({ t }: UserListPageProps) => {
  return (
    <PageContainer data-testid="user-list-page">
      <ContentWrapper>
        <PageHeader>
          <Title>{t("userlist.title")}</Title>
          <Subtitle>{t("userlist.subtitle", "Manage and view all users in the system")}</Subtitle>
        </PageHeader>
        <UserList
          ApiGetService={axiosApiServiceLoadUserList}
        />
      </ContentWrapper>
    </PageContainer>
  );
};

export default withTranslation()(UserListPage);
