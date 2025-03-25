import { Component } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import tw from "twin.macro";
import { ApiGetService } from "../services/apiService";
import UserListItem from "./UserListItem";
import { withTranslation, WithTranslation } from "react-i18next";

const Card = tw.div`bg-white shadow-lg rounded-lg p-4`;
const CardHeader = tw.div`text-center border-b pb-2`;
const Title = tw.h3`text-xl font-semibold`;
const UserContainer = tw.div`mt-4 flex flex-col items-center gap-2 h-40 overflow-auto`;
const ButtonGroup = tw.div`flex justify-center mt-4 gap-2`;
const Button = tw.button`px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300`;
const Spinner = tw.div`w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin`;

export interface User {
  id: number;
  username: string;
  email: string;
  image?: string | null;
}

interface Page {
  content: User[];
  page: number;
  size: number;
  totalPages: number;
}

interface UserListPageProps extends WithTranslation {
  ApiGetService: ApiGetService;
  navigate: NavigateFunction; // Pass navigate function as a prop
}

interface UserListState {
  page: Page;
  loading: boolean;
  showSpinner: boolean;
}

class UserList extends Component<UserListPageProps, UserListState> {
  state: UserListState = {
    page: {
      content: [],
      page: 0,
      size: 3, // Default page size
      totalPages: 0,
    },
    loading: false,
    showSpinner: false,
  };

  componentDidMount() {
    this.fetchUsers(0);
  }

  fetchUsers = async (pageNumber: number) => {
    this.setState({ loading: true });

    // Delay the spinner activation by 300ms
    const spinnerTimeout = setTimeout(() => {
      this.setState({ showSpinner: true });
    }, 300);

    try {
      const response = await this.props.ApiGetService.get<Page>(
        `/api/1.0/users?page=${pageNumber}&size=${this.state.page.size}`
      );

      clearTimeout(spinnerTimeout); // Clear timeout if API is fast
      this.setState({ page: response, loading: false, showSpinner: false });
    } catch (error) {
      clearTimeout(spinnerTimeout);
      console.error("Error fetching users:", error);
      this.setState({ loading: false, showSpinner: false });
    }
  };

  handlePrevPage = () => {
    if (this.state.page.page > 0) {
      this.fetchUsers(this.state.page.page - 1);
    }
  };

  handleNextPage = () => {
    if (this.state.page.page < this.state.page.totalPages - 1) {
      this.fetchUsers(this.state.page.page + 1);
    }
  };

  handleUserClick = (id: number) => {
    this.props.navigate(`/user/${id}`); // Use navigate function from props
  };

  render() {
    const { t } = this.props;
    return (
      <Card>
        <CardHeader>
          <Title>{t("userlist.title")}</Title>
        </CardHeader>
        <UserContainer>
          {this.state.loading && this.state.showSpinner ? (
            <Spinner data-testid="spinner" />
          ) : this.state.page.content.length > 0 ? (
            this.state.page.content.map((user) => (
              <div key={user.id}>
                <UserListItem user={user} onClick={this.handleUserClick} />
              </div>
            ))
          ) : (
            <p>{t("userlist.emptyPageMessage")}</p>
          )}
        </UserContainer>
        <ButtonGroup>
          <Button
            data-testid="prev-button"
            onClick={this.handlePrevPage}
            disabled={this.state.page.page === 0 || this.state.loading}
          >
            {t("userlist.buttonPrevious")}
          </Button>
          <Button
            data-testid="next-button"
            onClick={this.handleNextPage}
            disabled={
              this.state.page.page >= this.state.page.totalPages - 1 ||
              this.state.loading
            }
          >
            {t("userlist.buttonNext")}
          </Button>
        </ButtonGroup>
      </Card>
    );
  }
}

// Wrapper component to inject `useNavigate` for class component
function UserListWithRouter(props: Omit<UserListPageProps, "navigate">) {
  const navigate = useNavigate(); // useNavigate hook to get navigation function
  return <UserList {...props} navigate={navigate} />; //Pass navigate as a prop
}

export default withTranslation()(UserListWithRouter);
