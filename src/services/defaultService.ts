import { vi } from "vitest";
import { ApiService } from "../services/apiService";

export const defaultService: ApiService = {
  post: vi.fn().mockResolvedValue({}), // Default no operation mock for tests
};
