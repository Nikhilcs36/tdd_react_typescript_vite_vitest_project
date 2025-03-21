import { Component } from "react";
import { NavigateFunction, useNavigate } from "react-router-dom";
import tw from "twin.macro";
import { ApiGetService } from "../services/apiService";
import UserListItem from "./UserListItem";

const Card = tw.div`bg-white shadow-lg rounded-lg p-4`;
const CardHeader = tw.div`text-center border-b pb-2`;
const Title = tw.h3`text-xl font-semibold`;
const UserContainer = tw.div`mt-4 flex flex-col items-center gap-2 h-40 overflow-auto`;
const ButtonGroup = tw.div`flex justify-center mt-4 gap-2`;
const Button = tw.button`px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300`;

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

interface UserListPageProps {
  ApiGetService: ApiGetService;
  navigate: NavigateFunction; // Pass navigate function as a prop
}

interface UserListState {
  page: Page;
  loading: boolean;
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
  };

  componentDidMount() {
    this.fetchUsers(0);
  }

  fetchUsers = async (pageNumber: number) => {
    this.setState({ loading: true });

    try {
      const response = await this.props.ApiGetService.get<Page>(
        `/api/1.0/users?page=${pageNumber}&size=${this.state.page.size}`
      );
      this.setState({ page: response, loading: false });
    } catch (error) {
      console.error("Error fetching users:", error);
      this.setState({ loading: false });
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
    return (
      <Card>
        <CardHeader>
          <Title>User List</Title>
        </CardHeader>
        <UserContainer>
          {this.state.page.content.length > 0 ? (
            this.state.page.content.map((user) => (
              <div key={user.id}>
                <UserListItem user={user} onClick={this.handleUserClick} />
              </div>
            ))
          ) : (
            <p>No users found</p>
          )}
        </UserContainer>
        <ButtonGroup>
          <Button
            data-testid="prev-button"
            onClick={this.handlePrevPage}
            disabled={this.state.page.page === 0 || this.state.loading}
          >
            Previous
          </Button>
          <Button
            data-testid="next-button"
            onClick={this.handleNextPage}
            disabled={
              this.state.page.page >= this.state.page.totalPages - 1 ||
              this.state.loading
            }
          >
            Next
          </Button>
        </ButtonGroup>
      </Card>
    );
  }
}
// Wrapper component to inject `useNavigate` for class component
export default function UserListWithRouter(
  props: Omit<UserListPageProps, "navigate">
) {
  const navigate = useNavigate(); // useNavigate hook to get navigation function
  return <UserList {...props} navigate={navigate} />; //Pass navigate as a prop
}
