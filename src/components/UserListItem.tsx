import tw from "twin.macro";
import defaultProfileImage from "../assets/profile.png";
import { User } from "./UserList";

const ListItem = tw.div`flex items-center gap-3 cursor-pointer p-2 hover:bg-gray-100 rounded`;
const ProfileImage = tw.img`w-10 h-10 rounded-full border`;
const Username = tw.span`text-blue-600`;

interface UserListItemProps {
  user: Pick<User, "id" | "username" | "image">;
  onClick: (id: number) => void;
}

const UserListItem: React.FC<UserListItemProps> = ({ user, onClick }) => {
  return (
    <ListItem onClick={() => onClick(user.id)}>
      <ProfileImage src={user.image || defaultProfileImage} alt="Profile" />
      <Username>{user.username}</Username>
    </ListItem>
  );
};

export default UserListItem;
