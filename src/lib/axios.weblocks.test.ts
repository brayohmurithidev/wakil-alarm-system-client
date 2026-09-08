// Session Diagnostics Phase, Part 4 — the audit found that axios.test.ts
// stubs `navigator` as `{}` for every test (see the top-level
// vi.stubGlobal("navigator", {}) there), so the real
// `navigator.locks.request(...)` branch in performRefresh has never actually
// run in this suite. This file exercises that branch specifically, with a
// fake lock manager that behaves like the real Web Locks API closely enough
// to prove real coordination, not just "the mock returns what I told it to".
//
// Kept as its own file (rather than added to axios.test.ts) because it needs
// `navigator.locks` to genuinely exist, which the rest of that suite
// deliberately stubs away to test the no-Locks fallback path.
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "https://alarm-api.staging.wakilsecurity.com");
vi.stubEnv("VITE_ENVIRONMENT", "staging");

// Shared the way a real browser's Web Locks manager and same-origin
// localStorage are shared across tabs: one physical implementation, several
// independent module instances reaching it (see loadTabModule below).
const storage = new Map<string, string>();
vi.stubGlobal("localStorage", {
  getItem: (key: string) => storage.get(key) ?? null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
});

// A minimal but behaviorally-real navigator.locks.request: calls against the
// same lock name are serialized FIFO, matching the real Web Locks API's
// default exclusive mode (the only mode axios.ts requests) — the next
// queued callback does not start until the previous one's returned promise
// has settled, whether it resolved or rejected. A stub that just ran every
// callback immediately/in parallel would prove nothing about coordination.
function createFakeLockManager() {
  const chains = new Map<string, Promise<void>>();
  let callsInFlight = 0;
  let maxConcurrent = 0;
  return {
    manager: {
      request: (name: string, callback: () => Promise<unknown>) => {
        const prior = chains.get(name) ?? Promise.resolve();
        const runResult = prior.then(
          async () => {
            callsInFlight += 1;
            maxConcurrent = Math.max(maxConcurrent, callsInFlight);
            try {
              return await callback();
            } finally {
              callsInFlight -= 1;
            }
          },
          async () => {
            callsInFlight += 1;
            maxConcurrent = Math.max(maxConcurrent, callsInFlight);
            try {
              return await callback();
            } finally {
              callsInFlight -= 1;
            }
          },
        );
        // Swallow so a rejected callback still unblocks the next waiter —
        // this is what "failure releases the lock" means in the real API.
        chains.set(name, runResult.then(() => undefined, () => undefined));
        return runResult;
      },
    },
    getMaxConcurrent: () => maxConcurrent,
  };
}

let fakeLocks: ReturnType<typeof createFakeLockManager>;

// Loads axios.ts under a distinct module identity (via query string) so its
// module-level `refreshPromise` singleton is independent per call — the same
// isolation two real browser tabs have from each other, since each tab is
// its own JS realm. Its static imports (axios, @/config, authDiagnostics)
// still resolve through Vitest's normal shared module cache, so the axios
// library instance and navigator/localStorage stubs stay shared across
// "tabs" exactly like they would across real tabs (same-origin storage,
// OS-level Web Locks manager). Without this, two calls in one test file
// would dedupe on a single *same-tab* refreshPromise guard and never reach
// navigator.locks.request at all.
async function loadTabModule(tabId: string) {
  vi.stubGlobal("navigator", { locks: fakeLocks.manager });
  return import(/* @vite-ignore */ `./axios.ts?tab=${tabId}`);
}

describe("cross-tab refresh coordination via navigator.locks", () => {
  beforeEach(() => {
    storage.clear();
    storage.set("token", "expired-access-token");
    fakeLocks = createFakeLockManager();
    // Each test's `vi.spyOn(axios, "post")` must start from a clean slate —
    // without this, later tests' call counts include earlier tests' calls,
    // since spying on the same method again just re-wraps the prior spy
    // rather than resetting its history.
    vi.restoreAllMocks();
  });

  it("coordinates two simultaneous tabs into exactly one refresh request", async () => {
    const tabA = await loadTabModule("a1");
    const tabB = await loadTabModule("b1");

    const axios = (await import("axios")).default;
    const post = vi.spyOn(axios, "post").mockImplementation(async () => {
      // Real network latency, so both tabs are genuinely in flight at once
      // rather than accidentally serialized by microtask ordering alone.
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { data: { token: "rotated-by-lock-winner" } };
    });

    const [tokenA, tokenB] = await Promise.all([
      tabA.refreshAccessToken("expired-access-token"),
      tabB.refreshAccessToken("expired-access-token"),
    ]);

    // The core Web Locks guarantee: even though two independent tabs both
    // raced to refresh, the network was only hit once.
    expect(post).toHaveBeenCalledTimes(1);
    expect(fakeLocks.getMaxConcurrent()).toBe(1);
    expect(tokenA).toBe("rotated-by-lock-winner");
    expect(tokenB).toBe("rotated-by-lock-winner");
    expect(storage.get("token")).toBe("rotated-by-lock-winner");
  });

  it("the losing tab consumes the winner's new token rather than replaying the old refresh cookie", async () => {
    const tabA = await loadTabModule("a2");
    const tabB = await loadTabModule("b2");

    const axios = (await import("axios")).default;
    const post = vi.spyOn(axios, "post").mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 5));
      return { data: { token: "rotated-by-lock-winner" } };
    });

    await Promise.all([
      tabA.refreshAccessToken("expired-access-token"),
      tabB.refreshAccessToken("expired-access-token"),
    ]);

    // Only one POST /refresh-token ever went out — the loser's turn under
    // the lock found localStorage already holding a different token than
    // the one it failed on, and returned that instead of making its own
    // request (which would have sent the already-rotated refresh cookie and
    // tripped the backend's reuse detector, per adminMultiDeviceSession.test.ts
    // in the API repo).
    expect(post).toHaveBeenCalledTimes(1);
  });

  it("releases the lock on failure so a later call is not deadlocked", async () => {
    const tabA = await loadTabModule("a3");

    const axios = (await import("axios")).default;
    const post = vi
      .spyOn(axios, "post")
      .mockRejectedValueOnce(
        Object.assign(new axios.AxiosError("error"), {
          response: {
            status: 401,
            data: { error: "Invalid refresh token", code: "REFRESH_TOKEN_INVALID" },
          },
        }),
      )
      .mockResolvedValueOnce({ data: { token: "second-attempt-token" } });

    await expect(
      tabA.refreshAccessToken("expired-access-token"),
    ).rejects.toThrow();

    // A second, later call (module-level refreshPromise having reset via
    // its .finally) must still be able to acquire the same named lock — if
    // the fake (or real) lock manager failed to release on a rejected
    // callback, this would hang until the test times out.
    const token = await tabA.refreshAccessToken("expired-access-token");
    expect(token).toBe("second-attempt-token");
    expect(post).toHaveBeenCalledTimes(2);
    expect(fakeLocks.getMaxConcurrent()).toBe(1);
  });

  it("falls back to unlocked coordination when navigator.locks does not exist", async () => {
    // Distinct from axios.test.ts's blanket `vi.stubGlobal("navigator", {})`
    // — asserted explicitly here, alongside the with-Locks tests above, so
    // the "environments without Web Locks keep working" requirement is
    // proven in the same file as the branch it's a fallback for.
    vi.stubGlobal("navigator", {});
    vi.resetModules();
    // A template literal (not a plain string literal) here for the same
    // reason as loadTabModule above — a literal specifier is statically
    // resolved by tsc against the filesystem and fails to find a file
    // literally named "axios.ts?tab=no-locks"; the interpolated form is
    // opaque to the type checker and left to Vite's runtime resolution.
    const tab = await import(/* @vite-ignore */ `./axios.ts?tab=${"no-locks"}`);

    const axios = (await import("axios")).default;
    const post = vi.spyOn(axios, "post").mockResolvedValue({
      data: { token: "rotated-without-locks" },
    });

    const token = await tab.refreshAccessToken("expired-access-token");

    expect(post).toHaveBeenCalledTimes(1);
    expect(token).toBe("rotated-without-locks");
  });
});
