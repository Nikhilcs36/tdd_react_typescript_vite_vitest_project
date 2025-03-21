import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import UserListItem from "../components/UserListItem";
import defaultProfileImage from "../assets/profile.png";
import { describe, expect, it, vi } from "vitest";
import { User } from "./UserList";

// Helper function to render UserListItem
const setup = (user: User) => {
  const mockOnClick = vi.fn();
  render(<UserListItem user={user} onClick={mockOnClick} />);
  return { mockOnClick };
};

describe("UserListItem", () => {
  it("renders default profile image when user has no image (unit tests)", () => {
    const mockUser = {
      id: 1,
      username: "user1",
      email: "user1@mail.com",
      image: null, // No profile image
    };

    setup(mockUser);

    const profileImage = screen.getByAltText("Profile") as HTMLImageElement;
    expect(profileImage).toBeInTheDocument();
    expect(profileImage.src).toContain(defaultProfileImage);
  });

  it("renders user profile image when available (unit tests)", () => {
    const mockUser = {
      id: 2,
      username: "user2",
      email: "user2@mail.com",
      image: "https://test.com/user2.jpg",
    };

    setup(mockUser);

    const profileImage = screen.getByAltText("Profile") as HTMLImageElement;
    expect(profileImage).toBeInTheDocument();
    expect(profileImage.src).toBe(mockUser.image);
  });

  it("calls onClick when clicked (unit tests)", async () => {
    const mockUser = {
      id: 3,
      username: "user3",
      email: "user3@mail.com",
      image: null,
    };

    const { mockOnClick } = setup(mockUser);

    const listItem = screen.getByText(mockUser.username);
    await userEvent.click(listItem);

    expect(mockOnClick).toHaveBeenCalledTimes(1);
    expect(mockOnClick).toHaveBeenCalledWith(mockUser.id);
  });
});
