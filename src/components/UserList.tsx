import { Component } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import tw from "twin.macro";
import { ApiGetService } from "../services/apiService";
import UserListItem from "./UserListItem";
import { withTranslation, WithTranslation } from "react-i18next";
import { API_ENDPOINTS } from "../services/apiEndpoints";
import { connect, ConnectedProps } from "react-redux";
import { RootState } from "../store";

const Card = tw.div`bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-4`;
const CardHeader = tw.div`text-center border-b pb-2 dark:border-dark-accent`;
const Title = tw.h3`text-xl font-semibold dark:text-dark-text`;
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

interface UserListPageProps extends WithTranslation, PropsFromRedux {
  ApiGetService: ApiGetService;
  navigate: NavigateFunction; // Pass navigate function as a prop
}

interface UserListState {
  page: Page;
  loading: boolean;
  showSpinner: boolean;
  showButtonDisabled: boolean;
}

class UserList extends Component<UserListPageProps, UserListState> {
  state: UserListState = {
    page: {
      content: [],
      page: 1,
      size: 3, // Default page size
      totalPages: 0,
    },
    loading: false,
    showSpinner: false,
    showButtonDisabled: false,
  };

  // Browser-compatible timeout IDs
  private spinnerTimeout = 0;
  private buttonTimeout = 0;

  componentDidMount() {
    // Only fetch users if authenticated, otherwise show appropriate message
    if (this.props.isAuthenticated) {
      this.fetchUsers(1);
    }

    // Listen for user list refresh events (triggered after logout)
    window.addEventListener("userListRefresh", this.handleUserListRefresh);
  }

  componentDidUpdate(prevProps: UserListPageProps) {
    // If authentication status changes from unauthenticated to authenticated, fetch users
    if (!prevProps.isAuthenticated && this.props.isAuthenticated) {
      this.fetchUsers(1);
    }
  }

  componentWillUnmount() {
    // Cleanup timeouts on component unmount
    clearTimeout(this.spinnerTimeout);
    clearTimeout(this.buttonTimeout);

    // Remove event listener to prevent memory leaks
    window.removeEventListener("userListRefresh", this.handleUserListRefresh);
  }

  /**
   * Handles user list refresh events
   * Triggered when user logs out to refresh the list and show the previously authenticated user
   */
  handleUserListRefresh = () => {
    // Refresh the current page to show updated user list (without authenticated user filtering)
    // Only fetch if authenticated
    if (this.props.isAuthenticated) {
      this.fetchUsers(this.state.page.page);
    }
  };

  fetchUsers = async (pageNumber: number) => {
    this.setState({
      loading: true,
      showSpinner: false,
      showButtonDisabled: false,
    });

    // Set up delayed UI states
    this.spinnerTimeout = window.setTimeout(() => {
      this.setState({ showSpinner: true });
    }, 300);

    this.buttonTimeout = window.setTimeout(() => {
      this.setState({ showButtonDisabled: true });
    }, 300);

    try {
      const response = await this.props.ApiGetService.get<{
        results: User[];
        count: number;
      }>(
        `${API_ENDPOINTS.GET_USERS}?page=${pageNumber}&size=${this.state.page.size}`
      );

      // Clear timeouts if request completes before delay
      clearTimeout(this.spinnerTimeout);
      clearTimeout(this.buttonTimeout);

      this.setState({
        page: {
          content: response.results,
          page: pageNumber,
          size: this.state.page.size,
          totalPages: Math.ceil(response.count / this.state.page.size),
        },
        loading: false,
        showSpinner: false,
        showButtonDisabled: false,
      });
    } catch (error) {
      clearTimeout(this.spinnerTimeout);
      clearTimeout(this.buttonTimeout);
      this.setState({
        loading: false,
        showSpinner: false,
        showButtonDisabled: false,
      });
      console.error("Error fetching users:", error);
    }
  };

  handlePrevPage = () => {
    if (!this.state.loading && this.state.page.page > 1) {
      this.fetchUsers(this.state.page.page - 1);
    }
  };

  handleNextPage = () => {
    if (
      !this.state.loading &&
      this.state.page.page < this.state.page.totalPages
    ) {
      this.fetchUsers(this.state.page.page + 1);
    }
  };

  handleUserClick = (id: number) => {
    this.props.navigate(`/user/${id}`); // Use navigate function from props
  };

  render() {
    const { t, isAuthenticated } = this.props;

    if (!isAuthenticated) {
      return (
        <Card>
          <CardHeader>
            <Title>{t("userlist.title")}</Title>
          </CardHeader>
          <UserContainer>
            <p>{t("userlist.loginRequiredMessage")}</p>
          </UserContainer>
        </Card>
      );
    }

    return (
      <Card>
        <CardHeader>
          <Title>{t("userlist.title")}</Title>
        </CardHeader>
        <UserContainer>
          {this.state.showSpinner ? (
            <Spinner data-testid="spinner" />
          ) : this.state.page.content && this.state.page.content.length > 0 ? (
            this.state.page.content.map((user, index) => (
              <div key={user.id || `user-${index}`}>
                <UserListItem user={user} onClick={this.handleUserClick} />
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500">
              {t("userlist.emptyPageMessage")}
            </div>
          )}
        </UserContainer>
        <ButtonGroup>
          <Button
            data-testid="prev-button"
            onClick={this.handlePrevPage}
            disabled={
              this.state.page.page === 1 || this.state.showButtonDisabled
            }
          >
            {t("userlist.buttonPrevious")}
          </Button>
          <Button
            data-testid="next-button"
            onClick={this.handleNextPage}
            disabled={
              this.state.page.page >= this.state.page.totalPages ||
              this.state.showButtonDisabled
            }
          >
            {t("userlist.buttonNext")}
          </Button>
        </ButtonGroup>
      </Card>
    );
  }
}

// Connect to Redux store
const mapStateToProps = (state: RootState) => ({
  isAuthenticated: state.auth.isAuthenticated,
});

const connector = connect(mapStateToProps);
type PropsFromRedux = ConnectedProps<typeof connector>;

// Wrapper component to inject `useNavigate` for class component
function UserListWithRouter(props: Omit<UserListPageProps, "navigate">) {
  const navigate = useNavigate(); // useNavigate hook to get navigation function
  return <UserList {...props} navigate={navigate} />; //Pass navigate as a prop
}

export default connector(withTranslation()(UserListWithRouter));
