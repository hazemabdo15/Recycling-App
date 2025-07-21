import axios from "axios";

const api = axios.create({
  baseURL: 'http://192.168.0.165:5000/api',
  withCredentials: true, // ✅ ensures cookies are sent with requests
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
      // Optional: redirect to login or show message
    }

    return Promise.reject(error);
  }
);

export default api;
