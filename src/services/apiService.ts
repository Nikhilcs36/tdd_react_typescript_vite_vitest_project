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
  get: <T>(url: string, page?: number, page_size?: number) => Promise<T>;
}

export interface ApiDeleteService {
  delete: <R>(url: string) => Promise<R>;
}

// Axios implementation signup (Django compatible)
export const axiosApiServiceSignUp: ApiService<SignUpRequestBody> = {
  post: async <T>(url: string, body?: Record<string, any>) => {
    try {
      const response = await axios.post<T>(url, body, {
        headers: {
          "Accept-Language": i18n.language, // Attach the current language header
        },
      });
      return response.data;
    } catch (error: any) {
      // Handle Django error response format
      if (error.response?.status === 400) {
        const djangoErrors = error.response.data;
        // Convert Django array format to object format expected by frontend
        const validationErrors: Record<string, string> = {};
        Object.keys(djangoErrors).forEach((key) => {
          if (
            Array.isArray(djangoErrors[key]) &&
            djangoErrors[key].length > 0
          ) {
            validationErrors[key] = djangoErrors[key][0]; // Take first error message
          } else {
            validationErrors[key] = djangoErrors[key];
          }
        });
        throw { response: { data: { validationErrors } } };
      }
      throw error;
    }
  },
};

// Fetch implementation signup (for MSW testing) - Django compatible
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
      // Handle Django error response format
      if (response.status === 400) {
        const djangoErrors = errorData;
        // Convert Django array format to object format expected by frontend
        const validationErrors: Record<string, string> = {};
        Object.keys(djangoErrors).forEach((key) => {
          if (
            Array.isArray(djangoErrors[key]) &&
            djangoErrors[key].length > 0
          ) {
            validationErrors[key] = djangoErrors[key][0]; // Take first error message
          } else {
            validationErrors[key] = djangoErrors[key];
          }
        });
        throw { response: { data: { validationErrors } } };
      }
      throw { response: { data: errorData } };
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

// Axios implementation for load Userlist - Authorization aware (Django compatible)
export const axiosApiServiceLoadUserList: ApiGetService = {
  get: async <T>(
    url: string,
    page?: number,
    page_size?: number
  ): Promise<T> => {
    // Get authentication state from Redux store for authorization-aware user list
    const authState = store.getState().auth;
    const accessToken: string | null = authState.accessToken;

    // Require authentication for user list access
    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    // Build headers with basic requirements
    const baseHeaders = {
      "Accept-Language": i18n.language,
    };

    // Add authorization headers
    const authHeaders = {
      Authorization: `JWT ${accessToken}`,
    };

    // Combine headers
    const headers = {
      ...baseHeaders,
      ...authHeaders,
    };

    // Django expects snake_case parameters for pagination
    const params = { page, page_size };

    const response = await axios.get<T>(url, { headers, params });
    return response.data;
  },
};

// fetch implementation for load Userlist (for MSW testing) - Authorization aware (Django compatible)
export const fetchApiServiceLoadUserList: ApiGetService = {
  get: async <T>(
    url: string,
    page?: number,
    page_size?: number
  ): Promise<T> => {
    // Get authentication state from Redux store for authorization-aware user list
    const authState = store.getState().auth;
    const accessToken: string | null = authState.accessToken;
    const authenticatedUserId: number | undefined = authState.user?.id;

    // Require authentication for user list access
    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    // Build headers with basic requirements
    const headers: Record<string, string> = {
      "Accept-Language": i18n.language,
      Authorization: `JWT ${accessToken}`,
    };

    // Add authenticated user ID header if available
    if (authenticatedUserId) {
      headers["X-Authenticated-User-Id"] = String(authenticatedUserId);
    }

    // Django expects snake_case parameters for pagination
    // Handle both absolute and relative URLs
    let finalUrl = url;
    if (page !== undefined || page_size !== undefined) {
      const urlObj = new URL(url, window.location.origin);
      if (page !== undefined) urlObj.searchParams.set("page", page.toString());
      if (page_size !== undefined)
        urlObj.searchParams.set("page_size", page_size.toString());
      finalUrl = urlObj.toString();
    }

    const response = await fetch(finalUrl, {
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

// Axios implementation for getCurrentUser (me endpoint)
export const axiosApiServiceGetCurrentUser: ApiGetService = {
  get: async <T>(url: string): Promise<T> => {
    // Get authentication state from Redux store
    const authState = store.getState().auth;
    const accessToken: string | null = authState.accessToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.get<T>(url, {
      headers: {
        "Accept-Language": i18n.language,
        Authorization: `JWT ${accessToken}`,
      },
    });
    return response.data;
  },
};

// Fetch implementation for getCurrentUser (me endpoint)
export const fetchApiServiceGetCurrentUser: ApiGetService = {
  get: async <T>(url: string): Promise<T> => {
    // Get authentication state from Redux store
    const authState = store.getState().auth;
    const accessToken: string | null = authState.accessToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(url, {
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

// Axios implementation for user profile update with file upload
export const axiosApiServiceUpdateUserWithFile: ApiPutService<FormData> = {
  put: async <T>(url: string, body?: FormData): Promise<T> => {
    // Get token from Redux store
    const accessToken: string | null = store.getState().auth.accessToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await axios.put(url, body, {
      headers: {
        "Content-Type": "multipart/form-data",
        "Accept-Language": i18n.language,
        Authorization: `JWT ${accessToken}`,
      },
    });

    return response.data;
  },
};

// Fetch implementation for user profile update with file upload (for MSW testing)
export const fetchApiServiceUpdateUserWithFile: ApiPutService<FormData> = {
  put: async <T>(url: string, body?: FormData): Promise<T> => {
    // Get token from Redux store
    const accessToken: string | null = store.getState().auth.accessToken;

    if (!accessToken) {
      throw new Error("Authentication token not found");
    }

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        "Accept-Language": i18n.language,
        Authorization: `JWT ${accessToken}`,
        // Note: Don't set Content-Type for FormData, browser will set it automatically
        // with the correct boundary parameter for multipart/form-data
      },
      body: body,
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
