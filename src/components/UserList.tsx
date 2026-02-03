import { Component } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import tw from "twin.macro";
import { ApiGetService } from "../services/apiService";
import UserListItem from "./UserListItem";
import Pagination from "./Pagination";
import { withTranslation, WithTranslation, useTranslation } from "react-i18next";
import { API_ENDPOINTS } from "../services/apiEndpoints";
import { connect, ConnectedProps } from "react-redux";
import { RootState } from "../store";
import { useUserAuthorization } from "../utils/authorization";

const Card = tw.div`bg-white dark:bg-dark-secondary shadow-xl rounded-xl p-6 border border-gray-100 dark:border-dark-accent`;
const UserContainer = tw.div`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[200px]`;
const LoadingContainer = tw.div`flex items-center justify-center h-full py-12 col-span-full`;
const Spinner = tw.div`w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin`;
const EmptyState = tw.div`text-center py-12`;
const EmptyIcon = tw.div`w-16 h-16 mx-auto mb-4 text-gray-400 dark:text-dark-secondary`;
const EmptyTitle = tw.h4`text-lg font-medium text-gray-900 dark:text-dark-text mb-2`;
const EmptyMessage = tw.p`text-gray-600 dark:text-dark-secondary`;

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
      }>(API_ENDPOINTS.GET_USERS, pageNumber, this.state.page.size);

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
      });
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
          <EmptyState>
            <EmptyIcon>
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </EmptyIcon>
            <EmptyTitle>{t("userlist.loginRequiredTitle", "Authentication Required")}</EmptyTitle>
            <EmptyMessage>{t("userlist.loginRequiredMessage")}</EmptyMessage>
          </EmptyState>
        </Card>
      );
    }

    // Check admin access using the authorization hook
    // Since this is a class component, we need to use the hook in the wrapper
    // The wrapper component will handle the admin check
    return (
      <Card>
        <UserContainer>
          {this.state.showSpinner ? (
            <LoadingContainer>
              <Spinner data-testid="spinner" />
            </LoadingContainer>
          ) : this.state.page.results && this.state.page.results.length > 0 ? (
            this.state.page.results.map((user, index) => (
              <div key={user.id || `user-${index}`}>
                <UserListItem user={user} onClick={this.handleUserClick} />
              </div>
            ))
          ) : (
            <EmptyState>
              <EmptyIcon>
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </EmptyIcon>
              <EmptyTitle>{t("userlist.emptyTitle", "No Users Found")}</EmptyTitle>
              <EmptyMessage>{t("userlist.emptyPageMessage")}</EmptyMessage>
            </EmptyState>
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
  const { isAdmin } = useUserAuthorization(); // Check admin access
  const { t } = useTranslation(); // Get translation function

  // If user is authenticated but not an admin, show access denied message
  if (props.isAuthenticated && !isAdmin) {
    return (
      <Card>
        <EmptyState>
          <EmptyIcon>
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </EmptyIcon>
          <EmptyTitle>{t("userlist.accessDeniedTitle")}</EmptyTitle>
          <EmptyMessage>{t("userlist.accessDeniedMessage")}</EmptyMessage>
        </EmptyState>
      </Card>
    );
  }

  return <UserList {...props} navigate={navigate} />; //Pass navigate as a prop
}

export default connector(withTranslation()(UserListWithRouter));
