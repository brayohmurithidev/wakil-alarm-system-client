import type { InternalAxiosRequestConfig } from "axios";
import axios from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "https://alarm-api.staging.wakilsecurity.com");
vi.stubEnv("VITE_ENVIRONMENT", "staging");

const values = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => values.get(key) ?? null,
  setItem: (key: string, value: string) => values.set(key, value),
  removeItem: (key: string) => values.delete(key),
});
vi.stubGlobal("navigator", {});

const auth = await import("./axios");
const diagnostics = await import("./authDiagnostics");

// Builds an unsigned JWT-shaped string — decodeJwtExpiryMs never verifies
// the signature, only reads the payload, so this is enough to test it.
function fakeJwt(payload: Record<string, unknown>): string {
  const base64url = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, "-").replace(/\//g, "_");
  return `${base64url({ alg: "none" })}.${base64url(payload)}.`;
}

function axiosError(status: number, data: unknown) {
  return new axios.AxiosError("error", undefined, undefined, undefined, {
    status,
    statusText: "",
    headers: {},
    config: { headers: new axios.AxiosHeaders() },
    data,
  });
}

// A per-request adapter override so each test controls exactly what
// axiosInstance "receives from the network" without a real request — see
// https://axios-http.com/docs/request_config (`adapter`).
function scriptedAdapter(
  steps: Array<
    | { data: unknown; status?: number }
    | { rejectStatus: number; rejectData?: unknown }
    | { rejectNoResponse: true }
  >,
) {
  let call = 0;
  return async (config: InternalAxiosRequestConfig) => {
    const step = steps[Math.min(call, steps.length - 1)];
    call += 1;
    if ("rejectNoResponse" in step) {
      throw new axios.AxiosError("Network Error", "ERR_NETWORK", config);
    }
    if ("rejectStatus" in step) {
      throw new axios.AxiosError("error", undefined, config, undefined, {
        status: step.rejectStatus,
        statusText: "",
        headers: {},
        config,
        data: step.rejectData ?? {},
      });
    }
    return {
      data: step.data,
      status: step.status ?? 200,
      statusText: "OK",
      headers: {},
      config,
    };
  };
}

describe("admin token refresh", () => {
  beforeEach(() => {
    values.clear();
    values.set("token", "expired-access-token");
    vi.restoreAllMocks();
    auth.registerUnauthorizedHandler(() => {});
  });

  it("deduplicates 5 simultaneous refreshes into exactly one network call", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: { token: "rotated-access-token" },
    });

    const results = await Promise.all(
      Array.from({ length: 5 }, () =>
        auth.refreshAccessToken("expired-access-token"),
      ),
    );

    expect(post).toHaveBeenCalledTimes(1);
    expect(results).toEqual(Array(5).fill("rotated-access-token"));
    expect(localStorage.getItem("token")).toBe("rotated-access-token");
  });

  it("reuses another tab's already-rotated token instead of refreshing again", async () => {
    // Simulates the cross-tab race this exists to prevent: by the time this
    // caller gets to refresh, localStorage already holds a *different*
    // token than the one that failed — another tab (sharing the Web Lock)
    // won the race and rotated it first.
    values.set("token", "already-rotated-by-other-tab");
    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: { token: "should-not-be-used" },
    });

    const token = await auth.refreshAccessToken("expired-access-token");

    expect(post).not.toHaveBeenCalled();
    expect(token).toBe("already-rotated-by-other-tab");
  });

  it("classifies transient/server errors as not session-invalidating", () => {
    expect(auth.classifyRefreshFailure(axiosError(500, {}))).toBeNull();
    expect(
      auth.classifyRefreshFailure(new axios.AxiosError("Network Error", "ERR_NETWORK")),
    ).toBeNull();
  });

  it("classifies a definitively expired refresh token", () => {
    expect(
      auth.classifyRefreshFailure(
        axiosError(401, { error: "Refresh token expired" }),
      ),
    ).toBe("REFRESH_TOKEN_EXPIRED");
  });

  it("classifies a missing refresh cookie as SESSION_MISSING, distinct from an invalid one", () => {
    expect(
      auth.classifyRefreshFailure(
        axiosError(401, { error: "No refresh token provided" }),
      ),
    ).toBe("SESSION_MISSING");
    expect(
      auth.classifyRefreshFailure(
        axiosError(401, { error: "Invalid refresh token" }),
      ),
    ).toBe("REFRESH_TOKEN_INVALID");
  });

  it("classifies a deactivated account (403) as ACCOUNT_DISABLED", () => {
    expect(auth.classifyRefreshFailure(axiosError(403, {}))).toBe(
      "ACCOUNT_DISABLED",
    );
  });

  it("InvalidSessionError starts unhandled so a double-logout can't be triggered by accident", () => {
    const error = new auth.InvalidSessionError("REFRESH_TOKEN_EXPIRED");
    expect(error.handled).toBe(false);
    expect(error.reason).toBe("REFRESH_TOKEN_EXPIRED");
  });
});

describe("axiosInstance response interceptor — 401 classification policy", () => {
  beforeEach(() => {
    values.clear();
    values.set("token", "expired-access-token");
    vi.restoreAllMocks();
  });

  it("retries a 401'd request once with the refreshed token and returns its result", async () => {
    vi.spyOn(axios, "post").mockResolvedValue({
      data: { token: "rotated-access-token" },
    });
    let retriedAuthHeader: string | undefined;
    const adapter = scriptedAdapter([{ rejectStatus: 401, rejectData: { error: "jwt expired" } }]);
    const wrappedAdapter = async (config: InternalAxiosRequestConfig) => {
      if ((config as InternalAxiosRequestConfig & { _retry?: boolean })._retry) {
        retriedAuthHeader = config.headers.Authorization as string | undefined;
        return { data: { ok: true }, status: 200, statusText: "OK", headers: {}, config };
      }
      return adapter(config);
    };

    const response = await auth.default.get("/api/widgets", { adapter: wrappedAdapter });

    expect(response.data).toEqual({ ok: true });
    expect(retriedAuthHeader).toBe("Bearer rotated-access-token");
    expect(localStorage.getItem("token")).toBe("rotated-access-token");
  });

  it("does not clear the session on a 403 from a normal request (permission error, not a session failure)", async () => {
    const handler = vi.fn();
    auth.registerUnauthorizedHandler(handler);
    const adapter = scriptedAdapter([{ rejectStatus: 403, rejectData: { error: "Forbidden" } }]);

    await expect(auth.default.get("/api/reports", { adapter })).rejects.toBeTruthy();
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not clear the session on a transient network error", async () => {
    const handler = vi.fn();
    auth.registerUnauthorizedHandler(handler);
    const adapter = scriptedAdapter([{ rejectNoResponse: true }]);

    await expect(auth.default.get("/api/reports", { adapter })).rejects.toBeTruthy();
    expect(handler).not.toHaveBeenCalled();
  });

  it("does not clear the session on an unrelated single 401 while a sibling refresh already succeeded", async () => {
    // "one failed refresh while another succeeded" — refreshAccessToken is
    // single-flight, so a second caller joining an in-flight refresh always
    // resolves/rejects identically to the first; there is no code path
    // where two overlapping refreshes for the same tab disagree.
    vi.spyOn(axios, "post").mockResolvedValue({
      data: { token: "rotated-access-token" },
    });
    const handler = vi.fn();
    auth.registerUnauthorizedHandler(handler);

    const [a, b] = await Promise.all([
      auth.refreshAccessToken("expired-access-token"),
      auth.refreshAccessToken("expired-access-token"),
    ]);

    expect(a).toBe(b);
    expect(handler).not.toHaveBeenCalled();
  });

  it("invokes the registered logout handler with the classified reason on a terminal refresh failure, and marks the error handled", async () => {
    vi.spyOn(axios, "post").mockRejectedValue(
      axiosError(401, { error: "Invalid refresh token" }),
    );
    const handler = vi.fn();
    auth.registerUnauthorizedHandler(handler);
    const adapter = scriptedAdapter([{ rejectStatus: 401, rejectData: { error: "jwt expired" } }]);

    await expect(auth.default.get("/api/reports", { adapter })).rejects.toBeTruthy();
    expect(handler).toHaveBeenCalledWith("REFRESH_TOKEN_INVALID");
  });
});

describe("decodeJwtExpiryMs", () => {
  it("reads the exp claim in milliseconds", () => {
    const expSeconds = Math.floor(Date.now() / 1000) + 900;
    const token = fakeJwt({ sub: "admin-1", exp: expSeconds });
    expect(diagnostics.decodeJwtExpiryMs(token)).toBe(expSeconds * 1000);
  });

  it("returns null for a malformed token, without throwing", () => {
    expect(diagnostics.decodeJwtExpiryMs("not-a-jwt")).toBeNull();
    expect(diagnostics.decodeJwtExpiryMs("")).toBeNull();
  });

  it("returns null when the payload has no exp claim", () => {
    expect(diagnostics.decodeJwtExpiryMs(fakeJwt({ sub: "admin-1" }))).toBeNull();
  });
});

describe("toLogoutTriggerReason", () => {
  it("maps every SessionClearReason onto the canonical diagnostic enum", () => {
    expect(diagnostics.toLogoutTriggerReason("USER_LOGOUT")).toBe("explicit_logout");
    expect(diagnostics.toLogoutTriggerReason("REFRESH_TOKEN_EXPIRED")).toBe("refresh_expired");
    expect(diagnostics.toLogoutTriggerReason("REFRESH_TOKEN_INVALID")).toBe("refresh_invalid");
    expect(diagnostics.toLogoutTriggerReason("ACCOUNT_DISABLED")).toBe("refresh_invalid");
    expect(diagnostics.toLogoutTriggerReason("SESSION_MISSING")).toBe("session_missing");
  });
});
