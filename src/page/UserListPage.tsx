import UserList from "../components/UserList";
import { axiosApiServiceLoadUserList } from "../services/apiService";
import { withTranslation, WithTranslation } from "react-i18next";
import {
  PageContainer,
  ContentWrapper,
  PageHeader,
  Title,
  Subtitle
} from "./UserListPage.styles";

const UserListPage = ({ t }: WithTranslation) => {
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

const TranslatedUserListPage = withTranslation()(UserListPage);
export default TranslatedUserListPage;
