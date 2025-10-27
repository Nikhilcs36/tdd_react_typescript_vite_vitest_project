import { Component } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import tw from "twin.macro";
import { ApiGetService } from "../services/apiService";
import UserListItem from "./UserListItem";
import Pagination from "./Pagination";
import { withTranslation, WithTranslation } from "react-i18next";
import { API_ENDPOINTS } from "../services/apiEndpoints";
import { connect, ConnectedProps } from "react-redux";
import { RootState } from "../store";
import ErrorDisplay from "./ErrorDisplay";
import { logError } from "../services/loggingService";

const Card = tw.div`bg-white dark:bg-dark-secondary shadow-lg rounded-lg p-4`;
const CardHeader = tw.div`text-center border-b pb-2 dark:border-dark-accent`;
const Title = tw.h3`text-xl font-semibold dark:text-dark-text`;
const UserContainer = tw.div`mt-4 flex flex-col items-center gap-2 h-40 overflow-auto`;
const Spinner = tw.div`w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin`;

export interface User {
  id: number;
  username: string;
  email: string;
  image?: string | null;
}

interface Page {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
  currentPage: number;
  size: number;
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
  error: any | null;
}

class UserList extends Component<UserListPageProps, UserListState> {
  state: UserListState = {
    page: {
      count: 0,
      next: null,
      previous: null,
      results: [],
      currentPage: 1,
      size: 3, // Default page size
    },
    loading: false,
    showSpinner: false,
    showButtonDisabled: false,
    error: null,
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
      this.fetchUsers(this.state.page.currentPage);
    }
  };

  fetchUsers = async (pageNumber: number) => {
    this.setState({
      loading: true,
      showSpinner: false,
      showButtonDisabled: false,
      error: null,
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
        count: number;
        next: string | null;
        previous: string | null;
        results: User[];
      }>(
        API_ENDPOINTS.GET_USERS,
        pageNumber,
        this.state.page.size
      );

      // Clear timeouts if request completes before delay
      clearTimeout(this.spinnerTimeout);
      clearTimeout(this.buttonTimeout);

      this.setState({
        page: {
          count: response.count,
          next: response.next,
          previous: response.previous,
          results: response.results,
          currentPage: pageNumber,
          size: this.state.page.size,
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
        error: error,
      });
      logError(error);
    }
  };

  handlePrevPage = () => {
    if (!this.state.loading && this.state.page.previous) {
      this.fetchUsers(this.state.page.currentPage - 1);
    }
  };

  handleNextPage = () => {
    if (!this.state.loading && this.state.page.next) {
      this.fetchUsers(this.state.page.currentPage + 1);
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

    // Display error if there is one
    if (this.state.error) {
      return (
        <Card>
          <CardHeader>
            <Title>{t("userlist.title")}</Title>
          </CardHeader>
          <UserContainer>
            <ErrorDisplay
              error={this.state.error}
              onRetry={() => this.fetchUsers(this.state.page.currentPage)}
              title={t("userlist.title")}
            />
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
          ) : this.state.page.results && this.state.page.results.length > 0 ? (
            this.state.page.results.map((user, index) => (
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
        <Pagination
          next={this.state.page.next}
          previous={this.state.page.previous}
          count={this.state.page.count}
          pageSize={this.state.page.size}
          currentPage={this.state.page.currentPage}
          onPageChange={this.fetchUsers}
          loading={this.state.loading}
        />
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
