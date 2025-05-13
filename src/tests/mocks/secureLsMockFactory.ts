import { vi } from "vitest";

// This file only contains the factory function for creating the mock
// It doesn't import or reference any other modules to avoid circular dependencies

export default function createSecureLSMock(mockData: {
  setCalls: { key: string; value: any }[];
  removeCalls: string[];
  getReturnValue: any;
}) {
  return {
    default: vi.fn().mockImplementation(() => ({
      set: vi.fn().mockImplementation((key, value) => {
        mockData.setCalls.push({ key, value });
      }),
      get: vi.fn().mockImplementation((_key) => {
        return mockData.getReturnValue;
      }),
      remove: vi.fn().mockImplementation((key) => {
        mockData.removeCalls.push(key);
      }),
    })),
  };
}
