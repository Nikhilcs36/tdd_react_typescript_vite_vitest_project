import tw from "twin.macro";
import defaultProfileImage from "../assets/profile.png";
import { User } from "./UserList";

const ListItem = tw.div`flex items-center gap-4 cursor-pointer p-4 hover:bg-gray-50 dark:hover:bg-dark-accent rounded-lg border border-gray-200 dark:border-dark-accent transition-all duration-200 hover:shadow-md`;
const ProfileImage = tw.img`w-12 h-12 rounded-full border-2 border-gray-200 dark:border-dark-secondary`;
const UserInfo = tw.div`flex-1 min-w-0`;
const Username = tw.h3`text-lg font-semibold text-gray-900 dark:text-dark-text truncate`;
const Email = tw.p`text-sm text-gray-600 dark:text-gray-300 truncate`;

interface UserListItemProps {
  user: Pick<User, "id" | "username" | "email" | "image">;
  onClick: (id: number) => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onClick }) => {
  return (
    <ListItem onClick={() => onClick(user.id)} data-testid={`user-item-${user.id}`}>
      <ProfileImage src={user.image || defaultProfileImage} alt={`${user.username} profile`} />
      <UserInfo>
        <Username>{user.username}</Username>
        <Email>{user.email}</Email>
      </UserInfo>
    </ListItem>
  );
};

export default UserListItem;
