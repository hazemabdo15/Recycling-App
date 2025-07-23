import axios from "axios";
import { BASE_URLS } from './config';

const api = axios.create({
  baseURL: BASE_URLS.API,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (!original) {
      return Promise.reject(error);
    }

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !original.url.includes("/auth/refresh")
    ) {
      original._retry = true;
    }

    return Promise.reject(error);
  }
);

export default api;
