import { describe, expect, it, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import { LanguageTransition } from "./LanguageTransition";
import i18n from "../../locale/i18n";

describe("LanguageTransition", () => {
  beforeEach(async () => {
    await act(async () => {
      await i18n.changeLanguage("en");
    });
  });

  it("renders children", () => {
    render(
      <LanguageTransition>
        <div data-testid="lang-child">Content</div>
      </LanguageTransition>
    );
    expect(screen.getByTestId("lang-child")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
  });

  it("renders a div wrapper with styled-components class", () => {
    const { container } = render(
      <LanguageTransition>
        <div>Content</div>
      </LanguageTransition>
    );
    const wrapperDiv = container.firstChild as HTMLElement;
    expect(wrapperDiv.tagName).toBe("DIV");
    expect(wrapperDiv.className).toBeTruthy();
  });

  it("re-renders with animation when language changes", async () => {
    // Render with English
    const { rerender } = render(
      <div key="en">
        <LanguageTransition>
          <div data-testid="lang-content">Content</div>
        </LanguageTransition>
      </div>
    );

    expect(screen.getByTestId("lang-content")).toBeInTheDocument();

    // Change language
    await act(async () => {
      await i18n.changeLanguage("ml");
    });

    // Re-render with new key to simulate language change
    rerender(
      <div key="ml">
        <LanguageTransition>
          <div data-testid="lang-content">Content</div>
        </LanguageTransition>
      </div>
    );

    // Content should still be rendered
    expect(screen.getByTestId("lang-content")).toBeInTheDocument();
  });

  it("preserves the same DOM element when language changes (prevents scroll position reset)", async () => {
    // Render with English
    const { container } = render(
      <LanguageTransition>
        <div data-testid="lang-content">Content</div>
      </LanguageTransition>
    );

    // Get the actual FadeIn wrapper element (the LanguageTransition wrapper)
    const fadeInBefore = container.querySelector('[class*="FadeIn"]') as HTMLElement;
    expect(fadeInBefore).toBeTruthy();

    // Change language - this triggers a re-render of LanguageTransition
    // In the real app, i18n.changeLanguage() causes the component to re-render
    // with a new langKey value, but the DOM element should NOT be replaced
    await act(async () => {
      await i18n.changeLanguage("ml");
    });

    // Get the FadeIn element again after language change
    const fadeInAfter = container.querySelector('[class*="FadeIn"]') as HTMLElement;

    // The DOM element MUST be the same (not unmounted/remounted)
    // If the key prop on FadeIn causes remounting, these will differ
    expect(fadeInAfter).toBe(fadeInBefore);
    expect(screen.getByTestId("lang-content")).toBeInTheDocument();
  });
});
