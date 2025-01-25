import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, afterAll } from "vitest";
import "jest-styled-components";

// Import MSW server
import { server } from "../tests/mocks/server";

// Start the server before all tests
beforeAll(() => server.listen());

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers());

// Close the server once tests are done
afterAll(() => server.close());