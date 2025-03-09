import UserList from "../components/UserList";
import { axiosApiServiceLoadUserList } from "../services/apiService";

const HomePage = () => {
  return (
    <div data-testid="home-page">
      <UserList ApiGetService={axiosApiServiceLoadUserList} />
    </div>
  );
};

export default HomePage;