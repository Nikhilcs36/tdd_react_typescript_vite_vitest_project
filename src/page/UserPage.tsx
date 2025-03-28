import { Component } from "react";
import { useParams } from "react-router-dom";
import tw from "twin.macro";
import { ApiGetService } from "../services/apiService";
import defaultProfileImage from "../assets/profile.png";

const PageContainer = tw.div`p-4 max-w-2xl mx-auto`;
const SpinnerContainer = tw.div`text-center py-8`;
const Spinner = tw.div`w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto`;
const ErrorAlert = tw.div` bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mt-4 text-center mx-auto max-w-md w-full`;
const ProfileCardContainer = tw.div`bg-white rounded-lg shadow-md p-6`;
const ProfileImage = tw.img`w-32 h-32 rounded-full mx-auto mb-4`;
const ProfileName = tw.h2`text-2xl font-bold text-center mb-2`;
const ProfileEmail = tw.p`text-gray-600 text-center`;

interface UserPageProps {
  id: string;
  ApiGetService: ApiGetService;
}

interface User {
  id: number;
  username: string;
  email: string;
  image?: string | null;
}

interface UserPageState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

class UserPage extends Component<UserPageProps, UserPageState> {
  state: UserPageState = {
    user: null,
    loading: false,
    error: null,
  };

  componentDidMount() {
    this.loadUser();
  }

  componentDidUpdate(prevProps: UserPageProps) {
    if (prevProps.id !== this.props.id) {
      this.loadUser();
    }
  }

  loadUser = async () => {
    this.setState({ loading: true, error: null });
    try {
      const user = await this.props.ApiGetService.get<User>(
        `/api/1.0/users/${this.props.id}`
      );
      this.setState({ user, loading: false });
    } catch (error: any) {
      this.setState({
        error: error.response?.data?.message || error.message,
        loading: false,
      });
    }
  };

  renderProfileCard() {
    const { user } = this.state;
    if (!user) return null;

    return (
      <ProfileCardContainer>
        <ProfileImage
          src={user.image || defaultProfileImage} // Fallback to default image
          alt={user.username}
          data-testid="profile-image"
        />
        <ProfileName data-testid="username">{user.username}</ProfileName>
        <ProfileEmail data-testid="email">{user.email}</ProfileEmail>
      </ProfileCardContainer>
    );
  }

  renderContent() {
    const { loading, error } = this.state;

    if (loading) {
      return (
        <SpinnerContainer>
          <Spinner data-testid="spinner" />
        </SpinnerContainer>
      );
    }

    if (error) {
      return <ErrorAlert data-testid="error-message">{error}</ErrorAlert>;
    }

    return this.renderProfileCard();
  }

  render() {
    return (
      <PageContainer data-testid="user-page">
        {this.renderContent()}
      </PageContainer>
    );
  }
}

// Functional wrapper for routing
export const UserPageWrapper = (props: { ApiGetService: ApiGetService }) => {
  const { id } = useParams<{ id: string }>();
  return <UserPage {...props} id={id || ""} />;
};

export default UserPageWrapper;
