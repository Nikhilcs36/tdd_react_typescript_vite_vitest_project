import axios from "axios";

export interface ApiService {
  post: (url: string, body: Record<string, any>) => Promise<any>;
}

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
