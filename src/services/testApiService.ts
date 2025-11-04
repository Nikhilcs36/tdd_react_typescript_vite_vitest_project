import axios from 'axios';

/**
 * Creates a new Axios instance without any global interceptors.
 * This is useful for testing component-level error handling without
 * triggering the global error handling logic.
 */
export const createTestApiService = () => {
  return axios.create();
};
