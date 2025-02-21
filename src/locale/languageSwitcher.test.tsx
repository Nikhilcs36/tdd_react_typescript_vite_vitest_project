import { beforeEach, describe, expect, it } from "vitest";
import LanguageSwitcher from "./languageSwitcher";
import { render, screen } from "@testing-library/react";

describe("LanguageSwitcher Style Test", () => {
  let container: HTMLElement;

  beforeEach(() => {
    const { container: cont } = render(<LanguageSwitcher />);
    // The LanguageSwitcher container is the first child.
    container = cont.firstChild as HTMLElement;
  });

  // Verify that the container is rendered.
  it("renders container", () => {
    expect(container).toBeInTheDocument();
  });

  // Test container style rules using test.each.
  const containerStyleRules: Array<[string, string]> = [
    ["position", "fixed"],
    ["z-index", "50"],
    ["bottom", "1rem"],
    ["right", "1rem"],
  ];

  it.each(containerStyleRules)(
    "container should have %s with value %s",
    (property, value) => {
      expect(container).toHaveStyleRule(property, value);
    }
  );

  // Define button test cases for each language button.
  const buttonTestCases = [
    {
      name: "English",
      expected: {
        "padding-left": "0.75rem", // Tailwind px-3
        "padding-right": "0.75rem",
        "padding-top": "0.25rem", // Tailwind py-1
        "padding-bottom": "0.25rem",
        "font-size": "0.875rem", // text-sm
        color: "rgb(30 64 175 / var(--tw-text-opacity, 1))", // text-blue-800
        "background-color": "rgb(219 234 254 / var(--tw-bg-opacity, 1))", // bg-blue-100
      },
    },
    {
      name: "മലയാളം",
      expected: {
        "padding-left": "0.75rem",
        "padding-right": "0.75rem",
        "padding-top": "0.25rem",
        "padding-bottom": "0.25rem",
        "font-size": "0.875rem",
        color: "rgb(22 101 52 / var(--tw-text-opacity, 1))", // text-green-800
        "background-color": "rgb(220 252 231 / var(--tw-bg-opacity, 1))", // bg-green-100
      },
    },
    {
      name: "العربية",
      expected: {
        "padding-left": "0.75rem",
        "padding-right": "0.75rem",
        "padding-top": "0.25rem",
        "padding-bottom": "0.25rem",
        "font-size": "0.875rem",
        color: "rgb(154 52 18 / var(--tw-text-opacity, 1))", // text-orange-800
        "background-color": "rgb(255 237 213 / var(--tw-bg-opacity, 1))", // bg-orange-100
      },
    },
  ];

  // Test each button's style using test.each.
  it.each(buttonTestCases)(
    "$name button has correct style",
    ({ name, expected }) => {
      const button = screen.getByRole("button", { name });
      expect(button).toBeInTheDocument();
      for (const [prop, value] of Object.entries(expected)) {
        expect(button).toHaveStyleRule(prop, value);
      }
    }
  );
});
