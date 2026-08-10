import { beforeAll, describe, expect, it, vi } from "vitest";

vi.stubEnv("VITE_API_URL", "https://alarm-api.staging.wakilsecurity.com");
vi.stubEnv("VITE_ENVIRONMENT", "staging");

let resolveMediaUrl: typeof import("./mediaUrl").resolveMediaUrl;

beforeAll(async () => {
  ({ resolveMediaUrl } = await import("./mediaUrl"));
});

describe("resolveMediaUrl", () => {
  it("leaves full HTTPS URLs and cache-busting queries unchanged", () => {
    const url = "https://media.example.test/photo.jpeg?v=profile-photos%2F1.jpeg";
    expect(resolveMediaUrl(url)).toBe(url);
  });

  it("prepends the API origin to relative API media paths exactly once", () => {
    expect(resolveMediaUrl("/api/uploads/alarm/123")).toBe(
      "https://alarm-api.staging.wakilsecurity.com/api/uploads/alarm/123",
    );
  });

  it("does not guess how to expose a private storage key", () => {
    expect(resolveMediaUrl("profile-photos/guard-id/photo.jpeg")).toBeNull();
  });

  it("returns null for missing images", () => {
    expect(resolveMediaUrl(null)).toBeNull();
    expect(resolveMediaUrl("  ")).toBeNull();
  });
});
