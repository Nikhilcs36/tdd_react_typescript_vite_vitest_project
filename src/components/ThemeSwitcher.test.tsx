import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ThemeSwitcher } from "./ThemeSwitcher";
import { I18nextProvider } from "react-i18next";
import i18n from "../locale/i18n";

describe("ThemeSwitcher", () => {
  const setup = (theme: "light" | "dark", lng = "en") => {
    i18n.changeLanguage(lng);
    return render(
      <I18nextProvider i18n={i18n}>
        <ThemeSwitcher onClick={() => {}} theme={theme} />
      </I18nextProvider>
    );
  };
  it("displays the sun icon when the theme is light", () => {
    render(<ThemeSwitcher onClick={() => {}} theme="light" />);
    const themeSwitcher = screen.getByTestId("theme-switcher");
    const sunIcon = themeSwitcher.querySelector("svg");
    expect(sunIcon).toBeInTheDocument();
  });

  it("displays the moon icon when the theme is dark", () => {
    setup("dark");
    const themeSwitcher = screen.getByTestId("theme-switcher");
    const moonIcon = themeSwitcher.querySelector("svg");
    expect(moonIcon).toBeInTheDocument();
  });

  it("triggers the onClick callback when clicked", () => {
    const handleClick = vi.fn();
    render(<ThemeSwitcher onClick={handleClick} theme="light" />);
    fireEvent.click(screen.getByTestId("theme-switcher"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  describe("theme and language direction combinations", () => {
    it.each([
      {
        theme: "light",
        lng: "en",
        dir: "ltr",
        expectedTransform: "translateX(0)",
      },
      {
        theme: "dark",
        lng: "en",
        dir: "ltr",
        expectedTransform: "translateX(calc(100% + 4px))",
      },
      {
        theme: "light",
        lng: "ml",
        dir: "ltr",
        expectedTransform: "translateX(0)",
      },
      {
        theme: "dark",
        lng: "ml",
        dir: "ltr",
        expectedTransform: "translateX(calc(100% + 4px))",
      },
      {
        theme: "light",
        lng: "ar",
        dir: "rtl",
        expectedTransform: "translateX(0)",
      },
      {
        theme: "dark",
        lng: "ar",
        dir: "rtl",
        expectedTransform: "translateX(calc(-100% - 4px))",
      },
    ])(
      "handles $theme theme with $lng ($dir)",
      ({ theme, lng, expectedTransform }) => {
        setup(theme as "light" | "dark", lng);
        const iconContainer = screen.getByTestId("theme-switcher").firstChild;
        expect(iconContainer).toHaveStyle({ transform: expectedTransform });
      }
    );
  });
});
