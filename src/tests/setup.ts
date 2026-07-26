import "@testing-library/jest-dom/vitest";
import { afterEach, beforeAll, afterAll, vi } from "vitest";
import "jest-styled-components";

// Import MSW server
import { server } from "../tests/mocks/server";

// Polyfill crypto.subtle for jsdom environment using Node.js Web Crypto API
if (!globalThis.crypto?.subtle) {
  const { webcrypto } = await import('node:crypto');
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: true,
    configurable: true,
  });
}

// Polyfill ResizeObserver for jsdom environment
class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}
window.ResizeObserver = ResizeObserverMock as any;

// Mock window.scrollTo for jsdom (used by ScrollToTop component)
window.scrollTo = vi.fn() as any;

// Start the server before all tests
beforeAll(() => server.listen());

// Reset any runtime request handlers we may add during the tests
afterEach(() => server.resetHandlers());

// Close the server once tests are done
afterAll(() => server.close());
