// API Endpoints
export const API_ENDPOINTS = {
  SIGNUP: "/api/1.0/users",
  LOGIN: "/api/1.0/auth",
  ACTIVATE_ACCOUNT: (token: string) => `/api/1.0/users/token/${token}`,
  GET_USERS: "/api/1.0/users",
  GET_USER_BY_ID: (id: number) => `/api/1.0/users/${id}`,
  UPDATE_USER: (id: number) => `/api/1.0/users/${id}`,
  DELETE_USER: (id: number) => `/api/1.0/users/${id}`,
  LOGOUT: "/api/1.0/logout",
};
