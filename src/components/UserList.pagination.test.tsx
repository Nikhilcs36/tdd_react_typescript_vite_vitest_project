import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import { Provider } from "react-redux";
import store from "../store";
import UserList from "./UserList";
import { fetchApiServiceLoadUserList } from "../services/apiService";
import { server } from "../tests/mocks/server";
import { http, HttpResponse } from "msw";
import { API_ENDPOINTS } from "../services/apiEndpoints";
import { loginSuccess } from "../store/actions";
import userEvent from "@testing-library/user-event";

describe("UserList Pagination with 1-based indexing", () => {
  const setup = () => {
    let request: Request | undefined;
    server.use(
      http.get(API_ENDPOINTS.GET_USERS, async ({ request: req }) => {
        request = req;
        const url = new URL(req.url);
        const page = url.searchParams.get("page");
        if (page === "1") {
          return HttpResponse.json({
            results: [
              { id: 1, username: "user1", email: "user1@mail.com" },
              { id: 2, username: "user2", email: "user2@mail.com" },
              { id: 3, username: "user3", email: "user3@mail.com" },
            ],
            count: 6,
          });
        } else if (page === "2") {
          return HttpResponse.json({
            results: [
              { id: 4, username: "user4", email: "user4@mail.com" },
              { id: 5, username: "user5", email: "user5@mail.com" },
              { id: 6, username: "user6", email: "user6@mail.com" },
            ],
            count: 6,
          });
        }
        return HttpResponse.json({
          results: [],
          count: 0,
        });
      })
    );

    store.dispatch(
      loginSuccess({
        id: 10, // A user not in the list
        username: "testuser",
        access: "mock-access-token",
        refresh: "mock-refresh-token",
      })
    );

    render(
      <Provider store={store}>
        <MemoryRouter>
          <UserList ApiGetService={fetchApiServiceLoadUserList} />
        </MemoryRouter>
      </Provider>
    );

    return {
      getRequest: () => request,
    };
  };

  it("should fetch page 1 on initial load", async () => {
    const { getRequest } = setup();

    await screen.findByText("user1");

    await waitFor(() => {
      const request = getRequest();
      expect(request).toBeDefined();
      const url = new URL(request!.url);
      expect(url.searchParams.get("page")).toBe("1");
    });
  });

  it("fetches next page when Next button is clicked", async () => {
    const { getRequest } = setup();
    await screen.findByText("user1");

    userEvent.click(screen.getByTestId("next-button"));

    await screen.findByText("user4");
    await waitFor(() => {
      const request = getRequest();
      expect(request).toBeDefined();
      const url = new URL(request!.url);
      expect(url.searchParams.get("page")).toBe("2");
    });
  });

  it("fetches previous page when Previous button is clicked", async () => {
    const { getRequest } = setup();
    await screen.findByText("user1");

    userEvent.click(screen.getByTestId("next-button"));
    await screen.findByText("user4");

    userEvent.click(screen.getByTestId("prev-button"));
    await screen.findByText("user1");

    await waitFor(() => {
      const request = getRequest();
      expect(request).toBeDefined();
      const url = new URL(request!.url);
      expect(url.searchParams.get("page")).toBe("1");
    });
  });
});
