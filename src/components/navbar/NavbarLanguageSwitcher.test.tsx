import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { I18nextProvider } from "react-i18next";
import { Provider } from "react-redux";
import i18n from "../../locale/i18n";
import store from "../../store";
import App from "../../App";
import { act } from "react";

// Mock secure-ls for store initialization
vi.mock("secure-ls", () => ({
  default: vi.fn().mockImplementation(() => ({
    set: vi.fn(),
    get: vi.fn(),
    remove: vi.fn(),
  })),
}));

describe("Navbar Language Switcher", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    // Reset language to default before each test
    act(() => {
      i18n.changeLanguage("en");
    });
  });

  afterEach(() => {
    cleanup();
  });

  const setup = () => {
    render(
      <Provider store={store}>
        <I18nextProvider i18n={i18n}>
          <App />
        </I18nextProvider>
      </Provider>
    );
  };

  describe("Language Button Rendering", () => {
    it("renders all three language buttons", () => {
      setup();
      
      expect(screen.getByTestId("lang-en")).toBeInTheDocument();
      expect(screen.getByTestId("lang-ml")).toBeInTheDocument();
      expect(screen.getByTestId("lang-ar")).toBeInTheDocument();
    });

    it("displays correct button labels", () => {
      setup();
      
      expect(screen.getByTestId("lang-en")).toHaveTextContent("EN");
      expect(screen.getByTestId("lang-ml")).toHaveTextContent("ML");
      expect(screen.getByTestId("lang-ar")).toHaveTextContent("AR");
    });

    it("highlights active language button (English by default)", () => {
      setup();
      
      const enButton = screen.getByTestId("lang-en");
      const mlButton = screen.getByTestId("lang-ml");
      const arButton = screen.getByTestId("lang-ar");
      
      expect(enButton).toHaveClass("bg-white/30");
      expect(mlButton).not.toHaveClass("bg-white/30");
      expect(arButton).not.toHaveClass("bg-white/30");
    });
  });

  describe("Language Switching Functionality", () => {
    it("switches to Malayalam when ML button is clicked", async () => {
      setup();
      
      const mlButton = screen.getByTestId("lang-ml");
      await userEvent.click(mlButton);
      
      await waitFor(() => {
        expect(i18n.language).toBe("ml");
      });
      
      expect(mlButton).toHaveClass("bg-white/30");
      expect(screen.getByTestId("lang-en")).not.toHaveClass("bg-white/30");
    });

    it("switches to Arabic when AR button is clicked", async () => {
      setup();
      
      const arButton = screen.getByTestId("lang-ar");
      await userEvent.click(arButton);
      
      await waitFor(() => {
        expect(i18n.language).toBe("ar");
      });
      
      expect(arButton).toHaveClass("bg-white/30");
      expect(screen.getByTestId("lang-en")).not.toHaveClass("bg-white/30");
    });

    it("switches back to English when EN button is clicked from another language", async () => {
      setup();
      
      // First switch to Malayalam
      await userEvent.click(screen.getByTestId("lang-ml"));
      await waitFor(() => expect(i18n.language).toBe("ml"));
      
      // Then switch back to English
      await userEvent.click(screen.getByTestId("lang-en"));
      
      await waitFor(() => {
        expect(i18n.language).toBe("en");
      });
      
      expect(screen.getByTestId("lang-en")).toHaveClass("bg-white/30");
    });

    it("updates HTML document direction for Arabic (RTL)", async () => {
      setup();
      
      await userEvent.click(screen.getByTestId("lang-ar"));
      
      await waitFor(() => {
        expect(document.documentElement.dir).toBe("rtl");
      });
    });

    it("maintains LTR direction for English and Malayalam", async () => {
      setup();
      
      await userEvent.click(screen.getByTestId("lang-en"));
      await waitFor(() => {
        expect(document.documentElement.dir).toBe("ltr");
      });
      
      await userEvent.click(screen.getByTestId("lang-ml"));
      await waitFor(() => {
        expect(document.documentElement.dir).toBe("ltr");
      });
    });
  });

  describe("Content Translation Verification", () => {
    it("translates navbar content when language is switched", async () => {
      setup();
      
      // Verify English content initially
      expect(screen.getByText("Home")).toBeInTheDocument();
      
      // Switch to Malayalam
      await userEvent.click(screen.getByTestId("lang-ml"));
      
      await waitFor(() => {
        expect(screen.getByText("ഹോം")).toBeInTheDocument();
      });
      
      // Switch to Arabic
      await userEvent.click(screen.getByTestId("lang-ar"));
      
      await waitFor(() => {
        expect(screen.getByText("الرئيسية")).toBeInTheDocument();
      });
    });

    it("translates footer content correctly", async () => {
      setup();
      
      // Check English footer
      const currentYear = new Date().getFullYear();
      expect(screen.getByTestId("app-footer")).toHaveTextContent(`© ${currentYear} TDD Dashboard. All rights reserved.`);
      
      // Switch to Malayalam
      await userEvent.click(screen.getByTestId("lang-ml"));
      
      await waitFor(() => {
        expect(screen.getByTestId("app-footer")).toHaveTextContent(`© ${currentYear} TDD ഡാഷ്ബോർഡ്. എല്ലാ അവകാശങ്ങളും നിക്ഷിപ്തമാണ്.`);
      });
      
      // Switch to Arabic
      await userEvent.click(screen.getByTestId("lang-ar"));
      
      await waitFor(() => {
        expect(screen.getByTestId("app-footer")).toHaveTextContent(`© ${currentYear} TDD لوحة التحكم. جميع الحقوق محفوظة.`);
      });
    });
  });

  describe("Mobile Menu Language Switcher", () => {
    it("toggles mobile menu visibility", async () => {
      setup();
      
      const mobileToggle = screen.getByTestId("mobile-menu-toggle");
      await userEvent.click(mobileToggle);
      
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      
      await userEvent.click(mobileToggle);
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
    });

    it("switches language from mobile menu", async () => {
      setup();
      
      // Open mobile menu
      await userEvent.click(screen.getByTestId("mobile-menu-toggle"));
      
      // Switch to Malayalam from mobile menu
      const mobileMlButton = screen.getByText("മലയാളം");
      await userEvent.click(mobileMlButton);
      
      await waitFor(() => {
        expect(i18n.language).toBe("ml");
      });
      
      // Verify desktop button also reflects the change
      expect(screen.getByTestId("lang-ml")).toHaveClass("bg-white/30");
    });

    it("closes mobile menu after language selection", async () => {
      setup();
      
      // Open mobile menu
      await userEvent.click(screen.getByTestId("mobile-menu-toggle"));
      expect(screen.getByTestId("mobile-menu")).toBeInTheDocument();
      
      // Select language
      await userEvent.click(screen.getByText("English"));
      
      // Menu should be closed
      expect(screen.queryByTestId("mobile-menu")).not.toBeInTheDocument();
    });
  });

  describe("Error Handling", () => {
    it("handles invalid language gracefully", async () => {
      setup();
      
      // Test that switching to invalid language doesn't break the app
      // (the test should pass as long as no errors are thrown)
      expect(() => {
        act(() => {
          i18n.changeLanguage("invalid");
        });
      }).not.toThrow();
    });
  });
});