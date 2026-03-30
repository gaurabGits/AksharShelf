import axios from "axios";
import { isJwtExpired } from "../utils/jwt";

const defaultBaseURL = import.meta.env.DEV ? "http://localhost:3000/api" : "/api";
const baseURL = import.meta.env.VITE_API_BASE_URL || defaultBaseURL;

const API = axios.create({
  baseURL,
});

// Automatically send token with every request
API.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token && !isJwtExpired(token)) {
    config.headers.Authorization = `Bearer ${token}`;
  } else if (token) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }

  return config;
});

API.interceptors.response.use(
  (res) => res,
  (error) => {
    const status = error?.response?.status;
    const hadAuthHeader = Boolean(error?.config?.headers?.Authorization);
    const url = String(error?.config?.url || "");
    const message = String(error?.response?.data?.message || "");

    const isAuthEndpoint = url.includes("/auth/login") || url.includes("/auth/signup") || url.includes("/auth/register");
    const hasWindow = typeof window !== "undefined";
    const isAuthPage = hasWindow && String(window.location?.pathname || "").startsWith("/auth/");

    const looksLikeSessionProblem =
      status === 401 ||
      (status === 403 && /not authorized|token|blocked/i.test(message));

    if (hadAuthHeader && !isAuthEndpoint && looksLikeSessionProblem) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      if (hasWindow && !isAuthPage) {
        // Avoid redirect loops across multiple failing requests.
        if (!window.__authRedirecting) {
          window.__authRedirecting = true;
          window.location.assign("/auth/login");
        }
      }
    }

    return Promise.reject(error);
  }
);

export default API;
