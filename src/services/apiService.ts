import axios from "axios";
import i18n from "../locale/i18n";
import {
  LoginRequestBody,
  SignUpRequestBody,
  UserUpdateRequestBody,
} from "../utils/validationRules";
import store from "../store";

export interface ApiService<T = Record<string, any>> {
  post: <R>(url: string, body?: T) => Promise<R>;
}

export interface ApiPutService<T = Record<string, any>> {
  put: <R>(url: string, body?: T) => Promise<R>;
}

export interface ApiGetService {
  get: <T>(url: string) => Promise<T>;
}

export interface ApiDeleteService {
  delete: <R>(url: string) => Promise<R>;
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
      url, // This URL is dynamic, so it will be handled in the component
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
      // This URL is dynamic, so it will be handled in the component
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

// Axios implementation for load Userlist - Authorization aware
export const axiosApiServiceLoadUserList: ApiGetService = {
  get: async <T>(url: string): Promise<T> => {
    // Get authentication state from Redux store for authorization-aware user list
    const authState = store.getState().auth;
    const accessToken: string | null = authState.accessToken;

    // Build headers with basic requirements
    const baseHeaders = {
      "Accept-Language": i18n.language,
    };

    // Add authorization headers only if access token exists
    const authHeaders = accessToken
      ? {
          Authorization: `JWT ${accessToken}`,
        }
      : {};

    // Combine headers
    const headers = {
      ...baseHeaders,
      ...authHeaders,
    };

    const response = await axios.get<T>(url, { headers });
    return response.data;
  },
};

// fetch implementation for load Userlist (for MSW testing) - Authorization aware
export const fetchApiServiceLoadUserList: ApiGetService = {
  get: async <T>(url: string): Promise<T> => {
    // Get authentication state from Redux store for authorization-aware user list
    const authState = store.getState().auth;
    const accessToken: string | null = authState.accessToken;
    const authenticatedUserId: number | undefined = authState.user?.id;

    // Build headers with basic requirements
    const headers: Record<string, string> = {
      "Accept-Language": i18n.language,
    };

    // Add authorization headers only if access token exists
    if (accessToken) {
      headers["Authorization"] = `JWT ${accessToken}`;
      if (authenticatedUserId) {
        headers["X-Authenticated-User-Id"] = String(authenticatedUserId);
      }
    }

    const response = await fetch(url, {
      method: "GET",
      headers,
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
  get: async <T>(url: string): Promise<T> => {
    // Get authentication state from Redux store
    const authState = store.getState().auth;
    const accessToken: string | null = authState.accessToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get<T>(url, {
      // This URL is dynamic, so it will be handled in the component
      headers: {
        "Accept-Language": i18n.language,
        Authorization: `JWT ${accessToken}`,
      },
    });
    return response.data;
  },
};

// Fetch implementation for getUserById
export const fetchApiServiceGetUser: ApiGetService = {
  get: async <T>(url: string): Promise<T> => {
    // Get authentication state from Redux store
    const authState = store.getState().auth;
    const accessToken: string | null = authState.accessToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(url, {
      // This URL is dynamic, so it will be handled in the component
      headers: {
        "Accept-Language": i18n.language,
        Authorization: `JWT ${accessToken}`,
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

// Axios implementation for logout - Authorization aware
export const axiosApiServiceLogout: ApiService = {
  post: async <R>(url: string) => {
    // Get authentication state from Redux store for authorization
    const authState = store.getState().auth;
    const accessToken: string | null = authState.accessToken;
    const refreshToken: string | null = authState.refreshToken;

    const response = await axios.post<R>(
      url,
      { refresh: refreshToken }, // Send refresh token in body for blacklisting
      {
        headers: {
          "Accept-Language": i18n.language,
          Authorization: `JWT ${accessToken}`,
        },
      }
    );
    return response.data;
  },
};

// Fetch implementation for logout (for MSW testing) - Authorization aware
export const fetchApiServiceLogout: ApiService = {
  post: async <R>(url: string) => {
    // Get authentication state from Redux store for authorization
    const authState = store.getState().auth;
    const accessToken: string | null = authState.accessToken;
    const refreshToken: string | null = authState.refreshToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": i18n.language,
        Authorization: `JWT ${accessToken}`,
      },
      body: JSON.stringify({ refresh: refreshToken }), // Send refresh token for blacklisting
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw { response: { data: errorData } }; // Match Axios error format
    }

    return response.json() as R;
  },
};

// Axios implementation for user profile update
export const axiosApiServiceUpdateUser: ApiPutService<UserUpdateRequestBody> = {
  put: async <T>(url: string, body?: UserUpdateRequestBody): Promise<T> => {
    // Get token from Redux store
    const accessToken: string | null = store.getState().auth.accessToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.put(url, body, {
      // This URL is dynamic, so it will be handled in the component
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": i18n.language,
        Authorization: `JWT ${accessToken}`,
      },
    });

    return response.data;
  },
};

// Fetch implementation for user profile update (for MSW testing)
export const fetchApiServiceUpdateUser: ApiPutService<UserUpdateRequestBody> = {
  put: async <T>(url: string, body?: UserUpdateRequestBody): Promise<T> => {
    // Get token from Redux store
    const accessToken: string | null = store.getState().auth.accessToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(url, {
      // This URL is dynamic, so it will be handled in the component
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "Accept-Language": i18n.language,
        Authorization: `JWT ${accessToken}`,
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

// Axios implementation for delete user
export const axiosApiServiceDeleteUser: ApiDeleteService = {
  delete: async <R>(url: string): Promise<R> => {
    // Get token from Redux store
    const accessToken: string | null = store.getState().auth.accessToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.delete<R>(url, {
      // This URL is dynamic, so it will be handled in the component
      headers: {
        "Accept-Language": i18n.language,
        Authorization: `JWT ${accessToken}`,
      },
    });
    return response.data;
  },
};

// Fetch implementation for delete user (for MSW testing)
export const fetchApiServiceDeleteUser: ApiDeleteService = {
  delete: async <R>(url: string): Promise<R> => {
    // Get token from Redux store
    const accessToken: string | null = store.getState().auth.accessToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(url, {
      // This URL is dynamic, so it will be handled in the component
      method: "DELETE",
      headers: {
        "Accept-Language": i18n.language,
        Authorization: `JWT ${accessToken}`,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw errorData;
    }

    // Handle 204 No Content response
    if (response.status === 204) {
      return Promise.resolve() as Promise<R>;
    }

    return response.json() as Promise<R>;
  },
};
