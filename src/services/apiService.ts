import axios from "axios";
import i18n from "../locale/i18n";

export interface ApiService {
  post: (url: string, body?: Record<string, any>) => Promise<any>;
}

// Axios implementation signup
export const axiosApiServiceSignUp: ApiService = {
  post: async (url, body) => {
    const response = await axios.post(url, body, {
      headers: {
        "Accept-Language": i18n.language, // Attach the current language header
      },
    });
    return response.data;
  },
};

// Fetch implementation signup (for MSW testing)
export const fetchApiServiceSignUp: ApiService = {
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

// Axios implementation for account activation
export const axiosApiServiceActivation: ApiService = {
  post: async (url) => {
    const response = await axios.post(
      url,
      {},
      {
        headers: {
          "Accept-Language": i18n.language,
        },
      }
    );
    return response.data;
  },
};

// Fetch implementation for account activation (for MSW testing)
export const fetchApiServiceActivation: ApiService = {
  post: async (url) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Accept-Language": i18n.language,
      },
    });
    if (!response.ok) {
      const errorData = await response.json(); // Extract the actual error message
      throw errorData; // Throw the full error object
    }
    return response.json();
  },
};