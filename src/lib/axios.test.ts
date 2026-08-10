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

describe("admin token refresh", () => {
  beforeEach(() => {
    values.clear();
    values.set("token", "expired-access-token");
    vi.restoreAllMocks();
  });

  it("deduplicates simultaneous refreshes and stores the rotated access token", async () => {
    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: { token: "rotated-access-token" },
    });

    const [first, second, third] = await Promise.all([
      auth.refreshAccessToken("expired-access-token"),
      auth.refreshAccessToken("expired-access-token"),
      auth.refreshAccessToken("expired-access-token"),
    ]);

    expect(post).toHaveBeenCalledTimes(1);
    expect([first, second, third]).toEqual([
      "rotated-access-token",
      "rotated-access-token",
      "rotated-access-token",
    ]);
    expect(localStorage.getItem("token")).toBe("rotated-access-token");
  });

  it("classifies only terminal 401/403 responses as invalid sessions", () => {
    expect(
      auth.classifyRefreshFailure(
        new axios.AxiosError("down", undefined, undefined, undefined, {
          status: 500,
          statusText: "Server Error",
          headers: {},
          config: { headers: new axios.AxiosHeaders() },
          data: {},
        }),
      ),
    ).toBeNull();

    expect(
      auth.classifyRefreshFailure(
        new axios.AxiosError("expired", undefined, undefined, undefined, {
          status: 401,
          statusText: "Unauthorized",
          headers: {},
          config: { headers: new axios.AxiosHeaders() },
          data: { error: "Refresh token expired" },
        }),
      ),
    ).toBe("REFRESH_TOKEN_EXPIRED");
  });
});
