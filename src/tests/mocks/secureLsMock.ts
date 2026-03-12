import { vi } from "vitest";

// Create the mock data object without hoisting
export const mockSecureLS = {
  setCalls: [] as { key: string; value: unknown }[],
  removeCalls: [] as string[],
  getReturnValue: undefined as unknown,
};

// Helper to reset mock data between tests
export const resetSecureLSMock = () => {
  mockSecureLS.setCalls = [];
  mockSecureLS.removeCalls = [];
  mockSecureLS.getReturnValue = undefined;
  vi.clearAllMocks();
};
