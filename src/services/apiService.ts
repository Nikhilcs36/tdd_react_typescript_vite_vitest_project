import axios from "axios";
import i18n from "../locale/i18n";
import { LoginRequestBody, SignUpRequestBody } from "../utils/validationRules";

export interface ApiService<T = Record<string, any>> {
  post: <R>(url: string, body?: T) => Promise<R>;
}

export interface ApiGetService {
  get: <T>(url: string) => Promise<T>;
}

// Axios implementation signup
export const axiosApiServiceSignUp: ApiService<SignUpRequestBody> = {
  post: async <T>(url: string, body?: Record<string, any>) => {
    const response = await axios.post<T>(url, body, {
      headers: {
        "Accept-Language": i18n.language, // Attach the current language header
      },
    });
    return response.data;
  },
};

// Fetch implementation signup (for MSW testing)
export const fetchApiServiceSignUp: ApiService<SignUpRequestBody> = {
  post: async <T>(url: string, body?: Record<string, any>) => {
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
    return response.json() as T;
  },
};

// Axios implementation for account activation
export const axiosApiServiceActivation: ApiService = {
  post: async <T>(url: string) => {
    const response = await axios.post<T>(
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
  post: async <T>(url: string) => {
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
    return response.json() as T;
  },
};

// Axios implementation for load Userlist
export const axiosApiServiceLoadUserList: ApiGetService = {
  get: async <T>(url: string) => {
    const response = await axios.get<T>(url);
    return response.data;
  },
};

// fetch implementation for load Userlist (for MSW testing)
export const fetchApiServiceLoadUserList: ApiGetService = {
  get: async <T>(url: string) => {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "Accept-Language": i18n.language, // Attach the current language header
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }

    return response.json() as T;
  },
};

// Axios implementation for getUserById
export const axiosApiServiceGetUser: ApiGetService = {
  get: async <T>(url: string) => {
    const response = await axios.get<T>(url, {
      headers: {
        "Accept-Language": i18n.language,
      },
    });
    return response.data;
  },
};

// Fetch implementation for getUserById
export const fetchApiServiceGetUser: ApiGetService = {
  get: async <T>(url: string) => {
    const response = await fetch(url, {
      headers: {
        "Accept-Language": i18n.language,
      },
    });
    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }
    return response.json() as T;
  },
};

// Axios implementation for login
export const axiosApiServiceLogin: ApiService<LoginRequestBody> = {
  post: async <R>(url: string, body?: LoginRequestBody) => {
    const response = await axios.post<R>(url, body, {
      headers: {
        "Accept-Language": i18n.language,
      },
    });
    return response.data;
  },
};

// Fetch implementation for login
export const fetchApiServiceLogin: ApiService<LoginRequestBody> = {
  post: async <R>(url: string, body?: LoginRequestBody) => {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": i18n.language,
      },
      body: JSON.stringify(body),
    });

    const responseData = await response.json();

    if (!response.ok) {
      throw { response: { data: responseData } }; // Match Axios error format
    }

    return responseData as R;
  },
};
