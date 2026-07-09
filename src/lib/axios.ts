import axios from "axios";

import { apiUrl } from "@/config";

const axiosInstance = axios.create({
  baseURL: apiUrl,
  headers: {
    "Content-Type": "application/json",
  },
  // Lets the browser send the httpOnly admin_refresh_token cookie on
  // refresh/logout calls to this API's origin.
  withCredentials: true,
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

// Deduped via a module-level in-flight promise so multiple requests that
// 401 at the same moment (e.g. several widgets fetching in parallel) don't
// each fire their own refresh call — that would race and, since refresh
// tokens rotate on use, the losing calls would get "already rotated" and
// force an unnecessary hard logout.
let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(
        `${apiUrl}/api/auth/refresh-token`,
        {},
        { withCredentials: true }
      )
      .then((response) => {
        const newToken = response.data.token as string;
        localStorage.setItem("token", newToken);
        return newToken;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }

  return refreshPromise;
}

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only treat this as "your session is no longer valid" if the failed
    // request actually carried a token — otherwise this fires on the
    // login endpoint's own "wrong password" 401, which has nothing to do
    // with an existing session.
    const hadToken = !!originalRequest?.headers?.Authorization;

    if (error.response?.status === 401 && hadToken && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch {
        localStorage.removeItem("token");
        localStorage.removeItem("adminUser");
        onUnauthorized?.();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
