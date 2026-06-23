import axios from "axios";

import { apiUrl } from "@/config";

const axiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// AuthContext registers itself here on mount so a 401 anywhere clears
// in-memory state too, not just localStorage — without this, the dashboard
// keeps rendering as "logged in" (stale isAuthenticated) until something
// else happens to reload the page.
let onUnauthorized: (() => void) | null = null;

export function registerUnauthorizedHandler(handler: () => void) {
  onUnauthorized = handler;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only treat this as "your session is no longer valid" if the failed
    // request actually carried a token — otherwise this fires on the
    // login endpoint's own "wrong password" 401, which has nothing to do
    // with an existing session.
    const hadToken = !!error.config?.headers?.Authorization;

    if (error.response?.status === 401 && hadToken) {
      localStorage.removeItem("token");
      localStorage.removeItem("adminUser");
      onUnauthorized?.();
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
