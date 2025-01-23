import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, afterAll } from "vitest";
import { cleanup } from "@testing-library/react";
import "jest-styled-components";

// Import MSW server
import { server } from "../tests/mocks/server";

// Start the server before all tests
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

// Reset handlers after each test to avoid test state leakage
afterEach(() => {
  server.resetHandlers();
  cleanup();
});

// Close the server after all tests
afterAll(() => server.close());