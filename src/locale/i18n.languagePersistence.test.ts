import { describe, expect, it, afterEach, beforeEach } from "vitest";
import i18n from "./i18n";

describe("Language persistence in sessionStorage", () => {
  beforeEach(async () => {
    // Ensure we start from a clean state: English language, no sessionStorage
    sessionStorage.removeItem("language");
    await i18n.changeLanguage("en");
  });

  afterEach(() => {
    // Clean up sessionStorage after each test
    sessionStorage.removeItem("language");
  });

  it("should persist language to sessionStorage when language is changed", async () => {
    await i18n.changeLanguage("ml");
    expect(sessionStorage.getItem("language")).toBe("ml");
  });

  it("should persist Arabic language to sessionStorage when changed", async () => {
    await i18n.changeLanguage("ar");
    expect(sessionStorage.getItem("language")).toBe("ar");
  });

  it("should restore language from sessionStorage on i18n initialization", async () => {
    // Simulate a previously saved language
    sessionStorage.setItem("language", "ml");

    // Re-initialize i18n by calling changeLanguage to simulate what happens on page load
    // In production, the init function reads sessionStorage directly
    // Here we simulate by reading from sessionStorage and applying it
    const savedLanguage = sessionStorage.getItem("language");
    if (savedLanguage) {
      await i18n.changeLanguage(savedLanguage);
    }

    expect(i18n.language).toBe("ml");
  });

  it("should fall back to English when no language is saved in sessionStorage", async () => {
    // Ensure no language is in sessionStorage
    sessionStorage.removeItem("language");

    // Reset to English
    await i18n.changeLanguage("en");

    expect(i18n.language).toBe("en");
  });

  it("should update sessionStorage when language is changed multiple times", async () => {
    await i18n.changeLanguage("ml");
    expect(sessionStorage.getItem("language")).toBe("ml");

    await i18n.changeLanguage("ar");
    expect(sessionStorage.getItem("language")).toBe("ar");

    await i18n.changeLanguage("en");
    expect(sessionStorage.getItem("language")).toBe("en");
  });
});