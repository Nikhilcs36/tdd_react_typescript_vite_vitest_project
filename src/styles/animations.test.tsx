import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { FadeIn, SlideInUp, PageTransitionWrapper } from "./animations";

describe("Animation keyframes and components", () => {
  it("FadeIn renders children", () => {
    render(
      <FadeIn>
        <div data-testid="fade-child">Content</div>
      </FadeIn>
    );
    expect(screen.getByTestId("fade-child")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("FadeIn is a styled.div component", () => {
    const { container } = render(
      <FadeIn>
        <div>Content</div>
      </FadeIn>
    );
    const firstChild = container.firstChild as HTMLElement;
    expect(firstChild).toBeInTheDocument();
    // Verify it's a div with styled-components generated class
    expect(firstChild.tagName).toBe("DIV");
    expect(firstChild.className).toBeTruthy();
  });

  it("SlideInUp renders children", () => {
    render(
      <SlideInUp>
        <div data-testid="slide-child">Content</div>
      </SlideInUp>
    );
    expect(screen.getByTestId("slide-child")).toBeInTheDocument();
  });

  it("SlideInUp is a styled.div component", () => {
    const { container } = render(
      <SlideInUp>
        <div>Content</div>
      </SlideInUp>
    );
    const firstChild = container.firstChild as HTMLElement;
    expect(firstChild.tagName).toBe("DIV");
    expect(firstChild.className).toBeTruthy();
  });

  it("PageTransitionWrapper renders children", () => {
    render(
      <PageTransitionWrapper>
        <div data-testid="page-child">Content</div>
      </PageTransitionWrapper>
    );
    expect(screen.getByTestId("page-child")).toBeInTheDocument();
  });

  it("PageTransitionWrapper is a styled.div component", () => {
    const { container } = render(
      <PageTransitionWrapper>
        <div>Content</div>
      </PageTransitionWrapper>
    );
    const firstChild = container.firstChild as HTMLElement;
    expect(firstChild.tagName).toBe("DIV");
    expect(firstChild.className).toBeTruthy();
  });
});