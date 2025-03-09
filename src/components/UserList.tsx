import tw from "twin.macro";
import { Component } from "react";
import { ApiGetService } from "../services/apiService";

const Card = tw.div`bg-white shadow-lg rounded-lg p-4`;
const CardHeader = tw.div`text-center border-b pb-2`;
const Title = tw.h3`text-xl font-semibold`;
const UserContainer = tw.div`mt-4 flex flex-col items-center gap-2`;

interface User {
  id: number;
  username: string;
  email: string;
}

interface Page {
  content: User[];
  page: number;
  size: number;
  totalPages: number;
}

interface UserListPageProps {
  ApiGetService: ApiGetService;
}

interface UserListState {
  page: Page;
}

class UserList extends Component<UserListPageProps, UserListState> {
  state: UserListState = {
    page: {
      content: [],
      page: 0,
      size: 0,
      totalPages: 0,
    },
  };

  async componentDidMount() {
    try {
      const response = await this.props.ApiGetService.get("/api/1.0/users");
      this.setState({ page: response }); // Correctly set the state after fetching
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  }

  render() {
    return (
      <Card>
        <CardHeader>
          <Title>User List</Title>
        </CardHeader>
        <UserContainer>
          {this.state.page.content.length > 0 ? (
            this.state.page.content.map((user) => (
              <span key={user.id}>{user.username}</span>
            ))
          ) : (
            <p>Loading users...</p>
          )}
        </UserContainer>
      </Card>
    );
  }
}

export default UserList;
