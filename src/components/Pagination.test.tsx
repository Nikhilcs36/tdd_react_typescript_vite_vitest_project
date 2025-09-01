import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import Pagination from "./Pagination";
import { DjangoPaginationProps } from "../types/djangoPagination";

// Mock the withTranslation HOC and provide proper t function
vi.mock("react-i18next", () => ({
  withTranslation: () => (Component: React.ComponentType) => {
    // Add the t function to the component props
    return (props: any) => <Component {...props} t={(key: string, options?: any) => {
      if (key === "userlist.pageInfo") {
        return `Page ${options?.current} of ${options?.total} (${options?.count} users)`;
      }
      if (key === "userlist.buttonPrevious") return "Previous";
      if (key === "userlist.buttonNext") return "Next";
      return key;
    }} />;
  },
}));

// Mock twin.macro to avoid CSS-in-JS issues in tests
vi.mock("twin.macro", () => ({
  default: {
    div: "div",
    button: "button",
    span: "span",
  },
}));

/**
 * Test setup function for Pagination component
 * Creates mock props and renders the component
 */
const setup = (props: Partial<DjangoPaginationProps> = {}) => {
  const defaultProps: DjangoPaginationProps = {
    next: null,
    previous: null,
    count: 0,
    currentPage: 1,
    pageSize: 10,
    onPageChange: vi.fn(),
    loading: false,
  };

  const mergedProps = { ...defaultProps, ...props };
  
  render(<Pagination {...mergedProps} />);
  
  return {
    onPageChange: mergedProps.onPageChange,
  };
};

describe("Pagination Component", () => {
  describe("Page Info Display", () => {
    it("should display correct page info for first page with multiple pages", () => {
      setup({
        count: 25,
        currentPage: 1,
        pageSize: 10,
        next: "?page=2",
        previous: null,
      });

      const pageInfo = screen.getByTestId("page-info");
      expect(pageInfo).toBeInTheDocument();
      expect(pageInfo).toHaveTextContent("Page 1 of 3 (25 users)");
    });

    it("should display correct page info for middle page", () => {
      setup({
        count: 25,
        currentPage: 2,
        pageSize: 10,
        next: "?page=3",
        previous: "?page=1",
      });

      const pageInfo = screen.getByTestId("page-info");
      expect(pageInfo).toBeInTheDocument();
      expect(pageInfo).toHaveTextContent("Page 2 of 3 (25 users)");
    });

    it("should display correct page info for last page", () => {
      setup({
        count: 25,
        currentPage: 3,
        pageSize: 10,
        next: null,
        previous: "?page=2",
      });

      const pageInfo = screen.getByTestId("page-info");
      expect(pageInfo).toBeInTheDocument();
      expect(pageInfo).toHaveTextContent("Page 3 of 3 (25 users)");
    });

    it("should display correct page info for single page", () => {
      setup({
        count: 5,
        currentPage: 1,
        pageSize: 10,
        next: null,
        previous: null,
      });

      const pageInfo = screen.getByTestId("page-info");
      expect(pageInfo).toBeInTheDocument();
      expect(pageInfo).toHaveTextContent("Page 1 of 1 (5 users)");
    });

    it("should display correct page info when count is zero", () => {
      setup({
        count: 0,
        currentPage: 1,
        pageSize: 10,
        next: null,
        previous: null,
      });

      const pageInfo = screen.getByTestId("page-info");
      expect(pageInfo).toBeInTheDocument();
      expect(pageInfo).toHaveTextContent("Page 1 of 0 (0 users)");
    });

    it("should handle fractional page counts correctly", () => {
      setup({
        count: 15,
        currentPage: 2,
        pageSize: 10,
        next: null,
        previous: "?page=1",
      });

      const pageInfo = screen.getByTestId("page-info");
      expect(pageInfo).toBeInTheDocument();
      expect(pageInfo).toHaveTextContent("Page 2 of 2 (15 users)");
    });
  });

  describe("Button States", () => {
    it("should disable previous button on first page", () => {
      setup({
        count: 25,
        currentPage: 1,
        pageSize: 10,
        next: "?page=2",
        previous: null,
      });

      const prevButton = screen.getByTestId("prev-button");
      const nextButton = screen.getByTestId("next-button");

      expect(prevButton).toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });

    it("should disable next button on last page", () => {
      setup({
        count: 25,
        currentPage: 3,
        pageSize: 10,
        next: null,
        previous: "?page=2",
      });

      const prevButton = screen.getByTestId("prev-button");
      const nextButton = screen.getByTestId("next-button");

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("should disable both buttons when loading", () => {
      setup({
        count: 25,
        currentPage: 2,
        pageSize: 10,
        next: "?page=3",
        previous: "?page=1",
        loading: true,
      });

      const prevButton = screen.getByTestId("prev-button");
      const nextButton = screen.getByTestId("next-button");

      expect(prevButton).toBeDisabled();
      expect(nextButton).toBeDisabled();
    });

    it("should enable both buttons on middle page when not loading", () => {
      setup({
        count: 25,
        currentPage: 2,
        pageSize: 10,
        next: "?page=3",
        previous: "?page=1",
        loading: false,
      });

      const prevButton = screen.getByTestId("prev-button");
      const nextButton = screen.getByTestId("next-button");

      expect(prevButton).not.toBeDisabled();
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe("Button Click Handlers", () => {
    it("should call onPageChange with previous page when prev button is clicked", () => {
      const { onPageChange } = setup({
        count: 25,
        currentPage: 2,
        pageSize: 10,
        next: "?page=3",
        previous: "?page=1",
      });

      const prevButton = screen.getByTestId("prev-button");
      prevButton.click();

      expect(onPageChange).toHaveBeenCalledWith(1);
    });

    it("should call onPageChange with next page when next button is clicked", () => {
      const { onPageChange } = setup({
        count: 25,
        currentPage: 2,
        pageSize: 10,
        next: "?page=3",
        previous: "?page=1",
      });

      const nextButton = screen.getByTestId("next-button");
      nextButton.click();

      expect(onPageChange).toHaveBeenCalledWith(3);
    });

    it("should not call onPageChange when prev button is disabled", () => {
      const { onPageChange } = setup({
        count: 25,
        currentPage: 1,
        pageSize: 10,
        next: "?page=2",
        previous: null,
      });

      const prevButton = screen.getByTestId("prev-button");
      prevButton.click();

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should not call onPageChange when next button is disabled", () => {
      const { onPageChange } = setup({
        count: 25,
        currentPage: 3,
        pageSize: 10,
        next: null,
        previous: "?page=2",
      });

      const nextButton = screen.getByTestId("next-button");
      nextButton.click();

      expect(onPageChange).not.toHaveBeenCalled();
    });

    it("should not call onPageChange when loading", () => {
      const { onPageChange } = setup({
        count: 25,
        currentPage: 2,
        pageSize: 10,
        next: "?page=3",
        previous: "?page=1",
        loading: true,
      });

      const prevButton = screen.getByTestId("prev-button");
      const nextButton = screen.getByTestId("next-button");

      prevButton.click();
      nextButton.click();

      expect(onPageChange).not.toHaveBeenCalled();
    });
  });

  describe("Edge Cases", () => {
    it("should handle very large count values", () => {
      setup({
        count: 1000000,
        currentPage: 50,
        pageSize: 100,
        next: "?page=51",
        previous: "?page=49",
      });

      const pageInfo = screen.getByTestId("page-info");
      expect(pageInfo).toBeInTheDocument();
      expect(pageInfo).toHaveTextContent("Page 50 of 10000 (1000000 users)");
    });

    it("should handle pageSize of 1", () => {
      setup({
        count: 5,
        currentPage: 3,
        pageSize: 1,
        next: "?page=4",
        previous: "?page=2",
      });

      const pageInfo = screen.getByTestId("page-info");
      expect(pageInfo).toBeInTheDocument();
      expect(pageInfo).toHaveTextContent("Page 3 of 5 (5 users)");
    });

    it("should handle currentPage greater than totalPages gracefully", () => {
      // This shouldn't happen in practice, but we should test the component's resilience
      setup({
        count: 10,
        currentPage: 5, // This would be beyond the actual total pages (which is 1)
        pageSize: 10,
        next: null,
        previous: null,
      });

      const pageInfo = screen.getByTestId("page-info");
      expect(pageInfo).toBeInTheDocument();
      expect(pageInfo).toHaveTextContent("Page 5 of 1 (10 users)");
    });
  });
});
