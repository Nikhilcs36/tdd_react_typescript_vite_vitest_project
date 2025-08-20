// API Endpoints
export const API_ENDPOINTS = {
  SIGNUP: "/api/user/create/",
  LOGIN: "/api/user/token/",
  ME: "/api/user/me/",
  TOKEN_REFRESH: "/api/user/token/refresh/",
  LOGOUT: "/api/user/logout/",
  GET_USERS: "/api/user/users/",
  // USER_BY_ID A string literal with a placeholder for MSW handlers.
  USER_BY_ID: "/api/user/users/:id/",
  //GET_USER_BY_ID A function to generate a specific user URL for application code.
  GET_USER_BY_ID: (id: number) => `/api/user/users/${id}/`,
  UPDATE_USER: (id: number) => `/api/user/users/${id}/`,
  DELETE_USER: (id: number) => `/api/user/users/${id}/`,
  ACTIVATE_ACCOUNT: (token: string) => `/api/1.0/users/token/${token}`,
};
