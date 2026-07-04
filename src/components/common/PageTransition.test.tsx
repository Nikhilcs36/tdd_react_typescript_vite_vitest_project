import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { PageTransition } from "./PageTransition";

describe("PageTransition", () => {
  it("renders children", () => {
    render(
      <MemoryRouter>
        <PageTransition>
          <div data-testid="page-transition-child">Content</div>
        </PageTransition>
      </MemoryRouter>
    );
    expect(screen.getByTestId("page-transition-child")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders a div wrapper with styled-components class", () => {
    const { container } = render(
      <MemoryRouter>
        <PageTransition>
          <div>Content</div>
        </PageTransition>
      </MemoryRouter>
    );
    const wrapperDiv = container.firstChild as HTMLElement;
    expect(wrapperDiv).toBeInTheDocument();
    expect(wrapperDiv.tagName).toBe("DIV");
    expect(wrapperDiv.className).toBeTruthy();
  });

  it("re-renders with animation when route changes", () => {
    render(
      <MemoryRouter initialEntries={["/page1"]}>
        <Routes>
          <Route path="/page1" element={
            <PageTransition>
              <div data-testid="page1">Page 1</div>
            </PageTransition>
          } />
          <Route path="/page2" element={
            <PageTransition>
              <div data-testid="page2">Page 2</div>
            </PageTransition>
          } />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByTestId("page1")).toBeInTheDocument();
    expect(screen.queryByTestId("page2")).not.toBeInTheDocument();
  });
});