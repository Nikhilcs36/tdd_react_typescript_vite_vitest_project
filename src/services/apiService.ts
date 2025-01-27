import axios from "axios";
import { vi } from "vitest";

export interface ApiService {
  post: (url: string, body: Record<string, any>) => Promise<any>;
}

export const defaultService = {
  post: vi.fn().mockResolvedValue({}), // Default no-op mock for tests
};

// Axios implementation
export const axiosApiService: ApiService = {
  post: async (url, body) => {
    const response = await axios.post(url, body);
    return response.data;
  },
};

// msw Fetch implementation
export const fetchApiService: ApiService = {
  post: async (url, body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    return response.json();
  },
};
