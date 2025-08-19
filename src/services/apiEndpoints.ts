// API Endpoints
export const API_ENDPOINTS = {
  SIGNUP: "/api/user/create/",
  LOGIN: "/api/user/token/",
  ME: "/api/user/me/",
  TOKEN_REFRESH: "/api/user/token/refresh/",
  LOGOUT: "/api/user/logout/",
  GET_USERS: "/api/user/users/",
  ACTIVATE_ACCOUNT: (token: string) => `/api/1.0/users/token/${token}`,
  GET_USER_BY_ID: (id: number) => `/api/user/users/${id}/`,
  UPDATE_USER: (id: number) => `/api/user/users/${id}/`,
  DELETE_USER: (id: number) => `/api/user/users/${id}/`,
};
