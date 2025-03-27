import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import UserPageWrapper from "./UserPage";
import { fetchApiServiceGetUser } from "../services/apiService";
import { describe, expect, it } from "vitest";

const Wrapper = ({ initialEntries }: { initialEntries: string }) => (
  <MemoryRouter initialEntries={[initialEntries]}>
    <Routes>
      <Route
        path="/user/:id"
        element={<UserPageWrapper ApiGetService={fetchApiServiceGetUser} />}
      />
    </Routes>
  </MemoryRouter>
);

describe("User Page", () => {
  it("displays user name when found", async () => {
    render(<Wrapper initialEntries="/user/1" />);
    await waitFor(() => {
      expect(screen.getByTestId("username")).toHaveTextContent("user1");
    });
  });

  it("shows spinner during loading", async () => {
    render(<Wrapper initialEntries="/user/1" />);
    expect(screen.getByTestId("spinner")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.queryByTestId("spinner")).not.toBeInTheDocument();
    });
  });

  it("shows error for missing user", async () => {
    render(<Wrapper initialEntries="/user/100" />);
    await waitFor(() => {
      expect(screen.getByTestId("error-message")).toHaveTextContent(
        "User not found"
      );
    });
  });

  describe("Profile Image Display", () => {
    it("shows default image when user has no profile image", async () => {
      render(<Wrapper initialEntries="/user/1" />);

      const profileImage = await screen.findByTestId("profile-image");
      expect(profileImage).toHaveAttribute(
        "src",
        expect.stringContaining("profile.png")
      );
    });

    it("shows user provided image when available", async () => {
      render(<Wrapper initialEntries="/user/2" />);

      const profileImage = await screen.findByTestId("profile-image");
      expect(profileImage).toHaveAttribute("src", "https://test.com/user1.jpg");
    });
  });
});
