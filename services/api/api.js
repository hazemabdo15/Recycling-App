import axios from "axios";
import { BASE_URLS } from './config';

const api = axios.create({
  baseURL: BASE_URLS.API,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
 console.log('📥 Sending request to', config.baseURL + config.url);
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
      console.warn("🔁 Unauthorized. You may need to log in again.");

    }

    return Promise.reject(error);
  }
);

export default api;
