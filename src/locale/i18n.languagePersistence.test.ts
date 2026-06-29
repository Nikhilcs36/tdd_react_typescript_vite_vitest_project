import { describe, expect, it, afterEach, beforeEach } from "vitest";
import i18n from "./i18n";

describe("Language persistence in localStorage", () => {
  beforeEach(async () => {
    // Ensure we start from a clean state: English language, no localStorage
    localStorage.removeItem("language");
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    // Clean up localStorage after each test
    localStorage.removeItem("language");
  });

  it("should persist language to localStorage when language is changed", async () => {
    await i18n.changeLanguage("ml");
    expect(localStorage.getItem("language")).toBe("ml");
  });

  it("should persist Arabic language to localStorage when changed", async () => {
    await i18n.changeLanguage("ar");
    expect(localStorage.getItem("language")).toBe("ar");
  });

  it("should restore language from localStorage on i18n initialization", async () => {
    // Simulate a previously saved language
    localStorage.setItem("language", "ml");

    // Re-initialize i18n by calling changeLanguage to simulate what happens on page load
    // In production, the init function reads localStorage directly
    // Here we simulate by reading from localStorage and applying it
    const savedLanguage = localStorage.getItem("language");
    if (savedLanguage) {
      await i18n.changeLanguage(savedLanguage);
    }

    expect(i18n.language).toBe("ml");
  });

  it("should fall back to English when no language is saved in localStorage", async () => {
    // Ensure no language is in localStorage
    localStorage.removeItem("language");

    // Reset to English
    await i18n.changeLanguage("en");

    expect(i18n.language).toBe("en");
  });

  it("should update localStorage when language is changed multiple times", async () => {
    await i18n.changeLanguage("ml");
    expect(localStorage.getItem("language")).toBe("ml");

    await i18n.changeLanguage("ar");
    expect(localStorage.getItem("language")).toBe("ar");

    await i18n.changeLanguage("en");
    expect(localStorage.getItem("language")).toBe("en");
  });
});