import axios from "axios";

const envBaseUrl = import.meta?.env?.VITE_API_BASE_URL;
const defaultBaseUrl = typeof window !== "undefined" && window.location.hostname === "localhost"
  ? "http://localhost:5000"
  : "https://api.qrfolio.net";

const apiBaseUrl = (envBaseUrl || defaultBaseUrl).replace(/\/$/, "");

const api = axios.create({
  baseURL: `${apiBaseUrl}/api`,
  // withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      try {
        localStorage.removeItem("token");
        localStorage.removeItem("qr_folio_user");
      } catch { }
      if (typeof window !== 'undefined' && window.location && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
