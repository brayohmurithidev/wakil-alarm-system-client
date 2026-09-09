// Root-cause audit (2026-09-09), Phase 2 — production configuration
// validation. config.ts already failed fast on a missing VITE_API_URL;
// this proves the same now holds for VITE_GOOGLE_MAPS_API_KEY (previously
// read directly in App.tsx with a silent `?? ""` fallback — see
// config.ts's own comment on googleMapsApiKey), and that a normally
// fully-configured environment still loads without throwing.
import { beforeEach, describe, expect, it, vi } from "vitest";

async function loadConfig() {
  vi.resetModules();
  return import("./config");
}

describe("config.ts environment contract", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("loads normally when every required VITE_* variable is present", async () => {
    vi.stubEnv("VITE_ENVIRONMENT", "production");
    vi.stubEnv("VITE_API_URL", "https://alarm-api.wakilsecurity.com");
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key-not-a-real-secret");

    const config = await loadConfig();
    expect(config.apiUrl).toBe("https://alarm-api.wakilsecurity.com");
    expect(config.googleMapsApiKey).toBe("test-key-not-a-real-secret");
    expect(config.environment).toBe("production");
  });

  it("fails fast when VITE_API_URL is missing (pre-existing behavior, reconfirmed)", async () => {
    vi.stubEnv("VITE_ENVIRONMENT", "production");
    vi.stubEnv("VITE_API_URL", "");
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "test-key-not-a-real-secret");

    await expect(loadConfig()).rejects.toThrow(/VITE_API_URL is not configured/);
  });

  it("fails fast when VITE_GOOGLE_MAPS_API_KEY is missing, instead of silently building with an empty key", async () => {
    vi.stubEnv("VITE_ENVIRONMENT", "production");
    vi.stubEnv("VITE_API_URL", "https://alarm-api.wakilsecurity.com");
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");

    await expect(loadConfig()).rejects.toThrow(
      /VITE_GOOGLE_MAPS_API_KEY is not configured/,
    );
  });

  it("the failure message never includes any key/secret value, whatever it was", async () => {
    vi.stubEnv("VITE_ENVIRONMENT", "staging");
    vi.stubEnv("VITE_API_URL", "https://alarm-api.staging.wakilsecurity.com");
    vi.stubEnv("VITE_GOOGLE_MAPS_API_KEY", "");

    try {
      await loadConfig();
      expect.unreachable("expected loadConfig() to throw");
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      expect(message).not.toMatch(/AIza/);
      expect(message).toContain("staging");
    }
  });
});
