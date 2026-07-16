import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, act, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, Link } from "react-router-dom";
import { ScrollToTop } from "./ScrollToTop";

describe("ScrollToTop", () => {
  beforeEach(() => {
    vi.spyOn(window, "scrollTo").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing (returns null)", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(container.innerHTML).toBe("");
  });

  it("calls window.scrollTo(0, 0) on initial mount", () => {
    render(
      <MemoryRouter initialEntries={["/"]}>
        <ScrollToTop />
      </MemoryRouter>
    );
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);
  });

  it("calls window.scrollTo when navigating to a different route via Link click", () => {
    const NavigationTest = () => (
      <MemoryRouter initialEntries={["/page1"]}>
        <ScrollToTop />
        <nav>
          <Link to="/page2" data-testid="nav-link">Go to Page 2</Link>
        </nav>
        <Routes>
          <Route path="/page1" element={<div>Page 1</div>} />
          <Route path="/page2" element={<div>Page 2</div>} />
        </Routes>
      </MemoryRouter>
    );

    render(<NavigationTest />);

    // Should have been called on initial mount
    expect(window.scrollTo).toHaveBeenCalledTimes(1);
    expect(window.scrollTo).toHaveBeenCalledWith(0, 0);

    // Click the link to navigate to page2
    act(() => {
      fireEvent.click(screen.getByTestId("nav-link"));
    });

    // Should have been called again after navigation
    expect(window.scrollTo).toHaveBeenCalledTimes(2);
    expect(window.scrollTo).toHaveBeenLastCalledWith(0, 0);
  });
});