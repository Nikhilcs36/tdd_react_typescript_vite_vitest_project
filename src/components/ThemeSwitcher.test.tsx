import { render, fireEvent, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ThemeSwitcher } from "./ThemeSwitcher";

describe("ThemeSwitcher", () => {
  it("renders sun icon with light theme", () => {
    render(<ThemeSwitcher onClick={() => {}} theme="light" />);
    const themeSwitcher = screen.getByTestId("theme-switcher");
    const sunIcon = themeSwitcher.querySelector("svg");
    expect(sunIcon).toBeInTheDocument();
  });

  it("renders moon icon with dark theme", () => {
    render(<ThemeSwitcher onClick={() => {}} theme="dark" />);
    const themeSwitcher = screen.getByTestId("theme-switcher");
    const moonIcon = themeSwitcher.querySelector("svg");
    expect(moonIcon).toBeInTheDocument();
  });

  it("calls onClick when clicked", () => {
    const handleClick = vi.fn();
    render(<ThemeSwitcher onClick={handleClick} theme="light" />);
    fireEvent.click(screen.getByTestId("theme-switcher"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
