import { render, screen } from "@testing-library/react";
import UserList from "./UserList";
import { describe, expect, it } from "vitest";
import { fetchApiServiceLoadUserList } from "../services/apiService";

describe("User List", () => {
  it("displays three users in list", async () => {
    render(<UserList ApiGetService={fetchApiServiceLoadUserList} />);

    const users = await screen.findAllByText(/user\d/); // uses a regex to match "user1", "user2", "user3"
    expect(users).toHaveLength(3);
  });
});
