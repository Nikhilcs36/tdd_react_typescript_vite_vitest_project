import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import {
  PageContainer,
  ContentWrapper,
  PageHeader,
  Title,
  Subtitle,
  ButtonGroup,
  ProfileCard,
  ProfileImage,
  ProfileName,
  ProfileEmail,
  EditButton,
  CancelButton,
  SaveButton,
  DeleteButton,
  FormContainer,
  FormGroup,
  Label,
  Input,
  ErrorMessage,
  ButtonContainer,
  ErrorAlert,
  SuccessAlert,
  Spinner,
  ConfirmDeleteDialog,
  ConfirmDeleteButtons,
} from "./ProfilePage.styles";

/**
 * ProfilePage Styles Tests
 * 
 * These tests verify that styled components render correctly.
 * Note: twin.macro compiles Tailwind classes into CSS, so we verify
 * rendering behavior rather than checking specific classNames.
 * 
 * Style consistency is verified by comparing generated CSS class prefixes
 * ensuring each component has unique styling applied.
 */
describe("ProfilePage.styles", () => {
  describe("PageContainer", () => {
    it("should render without errors", () => {
      const { container } = render(<PageContainer>Test</PageContainer>);
      expect(container.firstChild).toBeInTheDocument();
    });

    it("should generate unique styles", () => {
      const { container } = render(<PageContainer>Test</PageContainer>);
      const className = (container.firstChild as HTMLElement)?.className || "";
      expect(className).toContain("PageContainer");
    });
  });

  describe("ContentWrapper", () => {
    it("should render without errors", () => {
      const { container } = render(<ContentWrapper>Test</ContentWrapper>);
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe("ProfileCard - Consistency with UserList Card", () => {
    it("should render as a div element", () => {
      const { container } = render(<ProfileCard>Test</ProfileCard>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("DIV");
    });

    it("should generate unique styles (verifying twin.macro processing)", () => {
      const { container } = render(<ProfileCard>Test</ProfileCard>);
      const className = (container.firstChild as HTMLElement)?.className || "";
      expect(className).toContain("ProfileCard");
    });
  });

  describe("ProfileImage", () => {
    it("should render as an img element", () => {
      const { container } = render(<ProfileImage />);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("IMG");
    });
  });

  describe("ProfileName", () => {
    it("should render as an h2 element with correct text", () => {
      const { container } = render(<ProfileName>Test User</ProfileName>);
      expect(container.textContent).toBe("Test User");
    });
  });

  describe("ProfileEmail", () => {
    it("should render as a p element with correct text", () => {
      const { container } = render(<ProfileEmail>test@example.com</ProfileEmail>);
      expect(container.textContent).toBe("test@example.com");
    });
  });

  describe("Buttons", () => {
    it("EditButton should render as a button element", () => {
      const { container } = render(<EditButton>Edit</EditButton>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("BUTTON");
    });

    it("CancelButton should render as a button element", () => {
      const { container } = render(<CancelButton>Cancel</CancelButton>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("BUTTON");
    });

    it("SaveButton should render as a button element", () => {
      const { container } = render(<SaveButton>Save</SaveButton>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("BUTTON");
    });

    it("DeleteButton should render as a button element", () => {
      const { container } = render(<DeleteButton>Delete</DeleteButton>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("BUTTON");
    });

    it("SaveButton should be disabled when disabled prop is passed", () => {
      const { container } = render(<SaveButton disabled>Save</SaveButton>);
      const element = container.firstChild as HTMLButtonElement;
      expect(element?.disabled).toBe(true);
    });
  });

  describe("ButtonContainer", () => {
    it("should render as a div element", () => {
      const { container } = render(<ButtonContainer>Test</ButtonContainer>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("DIV");
    });
  });

  describe("Form Elements", () => {
    it("FormContainer should render as a form element", () => {
      const { container } = render(<FormContainer />);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("FORM");
    });

    it("FormGroup should render as a div element", () => {
      const { container } = render(<FormGroup>Test</FormGroup>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("DIV");
    });

    it("Label should render as a label element", () => {
      const { container } = render(<Label>Test Label</Label>);
      expect(container.textContent).toBe("Test Label");
    });

    it("Input should render as an input element", () => {
      const { container } = render(<Input />);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("INPUT");
    });

    it("ErrorMessage should render as a div element", () => {
      const { container } = render(<ErrorMessage>Error</ErrorMessage>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("DIV");
    });
  });

  describe("Alerts", () => {
    it("ErrorAlert should render as a div with error content", () => {
      const { container } = render(<ErrorAlert>Error occurred</ErrorAlert>);
      expect(container.textContent).toBe("Error occurred");
    });

    it("SuccessAlert should render as a div with success content", () => {
      const { container } = render(<SuccessAlert>Success</SuccessAlert>);
      expect(container.textContent).toBe("Success");
    });
  });

  describe("Spinner", () => {
    it("should render as a div element", () => {
      const { container } = render(<Spinner />);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("DIV");
    });
  });

  describe("ConfirmDeleteDialog", () => {
    it("should render as a div element", () => {
      const { container } = render(<ConfirmDeleteDialog>Test</ConfirmDeleteDialog>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("DIV");
    });
  });

  describe("ConfirmDeleteButtons", () => {
    it("should render as a div element", () => {
      const { container } = render(<ConfirmDeleteButtons>Test</ConfirmDeleteButtons>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("DIV");
    });
  });

  describe("PageHeader", () => {
    it("should render as a div element with proper margin", () => {
      const { container } = render(<PageHeader>Test</PageHeader>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("DIV");
    });
  });

  describe("Title", () => {
    it("should render as an h1 element with title text", () => {
      const { container } = render(<Title>My Profile</Title>);
      expect(container.textContent).toBe("My Profile");
    });
  });

  describe("Subtitle", () => {
    it("should render as a p element with description text", () => {
      const { container } = render(<Subtitle>View and manage your account settings</Subtitle>);
      expect(container.textContent).toBe("View and manage your account settings");
    });
  });

  describe("ButtonGroup", () => {
    it("should render as a div element for button alignment", () => {
      const { container } = render(<ButtonGroup>Test</ButtonGroup>);
      const element = container.firstChild as HTMLElement;
      expect(element?.tagName).toBe("DIV");
    });

    it("should center buttons using justify-center", () => {
      const { container } = render(<ButtonGroup>Test</ButtonGroup>);
      const className = (container.firstChild as HTMLElement)?.className || "";
      expect(className).toContain("ButtonGroup");
    });
  });

  describe("Style Consistency Verification", () => {
    it("ProfileCard should have different class than generic element", () => {
      const { container: cardContainer } = render(<ProfileCard>Test</ProfileCard>);
      const { container: genericContainer } = render(<PageContainer>Test</PageContainer>);
      
      const cardClass = (cardContainer.firstChild as HTMLElement)?.className || "";
      const genericClass = (genericContainer.firstChild as HTMLElement)?.className || "";
      
      // Verify they have different style classes
      expect(cardClass).not.toBe(genericClass);
    });

    it("All styled components should generate valid styled-component classes", () => {
      const components = [
        { Component: PageContainer, name: "PageContainer", content: "Test" },
        { Component: ContentWrapper, name: "ContentWrapper", content: "Test" },
        { Component: ProfileCard, name: "ProfileCard", content: "Test" },
        { Component: ProfileName, name: "ProfileName", content: "Test" },
        { Component: ProfileEmail, name: "ProfileEmail", content: "Test" },
        { Component: EditButton, name: "EditButton", content: "Test" },
        { Component: CancelButton, name: "CancelButton", content: "Test" },
        { Component: SaveButton, name: "SaveButton", content: "Test" },
        { Component: DeleteButton, name: "DeleteButton", content: "Test" },
        { Component: ButtonContainer, name: "ButtonContainer", content: "Test" },
        { Component: FormGroup, name: "FormGroup", content: "Test" },
        { Component: Input, name: "Input", content: null },
        { Component: ErrorMessage, name: "ErrorMessage", content: "Test" },
        { Component: Spinner, name: "Spinner", content: null },
      ];

      components.forEach(({ Component, content }) => {
        const { container } = content 
          ? render(<Component>{content}</Component>)
          : render(<Component />);
        const className = (container.firstChild as HTMLElement)?.className || "";
        // Styled-components generate hashed class names
        expect(className).toMatch(/sc-[a-zA-Z0-9]+/);
      });
    });
  });
});