import axios from "axios";
import i18n from "../locale/i18n";

export interface ApiService {
  post: (url: string, body: Record<string, any>) => Promise<any>;
}

// Axios implementation
export const axiosApiService: ApiService = {
  post: async (url, body) => {
    const response = await axios.post(url, body, {
      headers: {
        "Accept-Language": i18n.language, // Attach the current language header
      },
    });
    return response.data;
  },
};

// msw Fetch implementation
export const fetchApiService: ApiService = {
  post: async (url, body) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": i18n.language, // Attach the current language header
      },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    return response.json();
  },
};
