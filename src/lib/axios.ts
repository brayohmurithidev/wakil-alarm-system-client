import axios from "axios";

import { apiUrl } from "@/config";
import {
  authDiagnostic,
  type SessionClearReason,
} from "@/lib/authDiagnostics";

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
let onUnauthorized: ((reason: SessionClearReason) => void) | null = null;

export function registerUnauthorizedHandler(
  handler: (reason: SessionClearReason) => void,
) {
  onUnauthorized = handler;
}

export function clearInvalidSession(reason: SessionClearReason): void {
  onUnauthorized?.(reason);
}

// Deduped via a module-level in-flight promise so multiple requests that
// 401 at the same moment (e.g. several widgets fetching in parallel) don't
// each fire their own refresh call — that would race and, since refresh
// tokens rotate on use, the losing calls would get "already rotated" and
// force an unnecessary hard logout.
let refreshPromise: Promise<string> | null = null;

export class InvalidSessionError extends Error {
  readonly reason: SessionClearReason;
  handled = false;

  constructor(reason: SessionClearReason) {
    super(reason);
    this.reason = reason;
  }
}

export function classifyRefreshFailure(error: unknown):
  | SessionClearReason
  | null {
  if (!axios.isAxiosError(error)) return null;
  if (error.response?.status === 403) return "ACCOUNT_DISABLED";
  if (error.response?.status !== 401) return null;

  return error.response.data?.error === "Refresh token expired"
    ? "REFRESH_TOKEN_EXPIRED"
    : "REFRESH_TOKEN_INVALID";
}

async function performRefresh(failedAccessToken: string | null): Promise<string> {
  const refreshUrl =
    apiUrl === "/" ? "/api/auth/refresh-token" : `${apiUrl}/api/auth/refresh-token`;

  const refreshUnderLock = async () => {
    const currentToken = localStorage.getItem("token");
    if (failedAccessToken && currentToken && currentToken !== failedAccessToken) {
      authDiagnostic("refresh_joined_cross_tab");
      return currentToken;
    }

    authDiagnostic("refresh_started", { requestType: "POST /api/auth/refresh-token" });
    try {
      const response = await axios.post(refreshUrl, {}, { withCredentials: true });
      const newToken = response.data.token as string;
      localStorage.setItem("token", newToken);
      authDiagnostic("refresh_success");
      return newToken;
    } catch (error) {
      const reason = classifyRefreshFailure(error);
      authDiagnostic("refresh_failure", {
        category: reason ?? "TRANSIENT",
      });
      if (reason) throw new InvalidSessionError(reason);
      throw error;
    }
  };

  // Web Locks coordinate refresh-token rotation across tabs. The token
  // comparison inside the lock lets a waiting tab reuse the winner's token.
  if (navigator.locks) {
    return navigator.locks.request("wakil-admin-token-refresh", refreshUnderLock);
  }
  return refreshUnderLock();
}

// Exported so the Socket.IO connection can reuse the same in-flight promise.
// A socket rejected for an expired token and an HTTP 401 are the same
// condition, and two independent refreshes would race — the loser replays an
// already-rotated refresh token and trips the backend's reuse detection,
// revoking every session for the operator.
export async function refreshAccessToken(
  failedAccessToken: string | null = localStorage.getItem("token"),
): Promise<string> {
  if (!refreshPromise) {
    refreshPromise = performRefresh(failedAccessToken)
      .finally(() => {
        refreshPromise = null;
      });
  } else {
    authDiagnostic("refresh_joined_existing_promise");
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
      authDiagnostic("api_401_received", { requestType: originalRequest.method ?? "unknown" });
      originalRequest._retry = true;

      try {
        const failedToken = String(originalRequest.headers.Authorization).replace(
          /^Bearer\s+/,
          "",
        );
        const newToken = await refreshAccessToken(failedToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        if (refreshError instanceof InvalidSessionError) {
          clearInvalidSession(refreshError.reason);
          refreshError.handled = true;
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
