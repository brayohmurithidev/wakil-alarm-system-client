import { describe, expect, it } from "vitest";

import { guardCreateFormSchema, guardEditFormSchema, guardEmailSchema } from "./guardForms";

describe("guardEmailSchema", () => {
  it("trims and lowercases, matching the backend's normalizeGuardEmail", () => {
    expect(guardEmailSchema.parse("  Guard@Example.com  ")).toBe("guard@example.com");
  });

  it("rejects an empty value", () => {
    expect(guardEmailSchema.safeParse("").success).toBe(false);
  });

  it("rejects a malformed address", () => {
    expect(guardEmailSchema.safeParse("not-an-email").success).toBe(false);
  });
});

describe("guardCreateFormSchema", () => {
  it("accepts a valid create payload and strips phone formatting characters", () => {
    const result = guardCreateFormSchema.safeParse({
      name: "Test Guard",
      phone: "+254 712 345 678",
      email: "Guard@Example.com",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.phone).toBe("+254712345678");
      expect(result.data.email).toBe("guard@example.com");
    }
  });

  it("rejects a missing name", () => {
    const result = guardCreateFormSchema.safeParse({
      name: "",
      phone: "+254712345678",
      email: "guard@example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("guardEditFormSchema", () => {
  it("accepts an optional blank rank", () => {
    const result = guardEditFormSchema.safeParse({
      name: "Test Guard",
      phone: "+254712345678",
      email: "guard@example.com",
      rank: "",
    });
    expect(result.success).toBe(true);
  });

  it("accepts a provided rank", () => {
    const result = guardEditFormSchema.safeParse({
      name: "Test Guard",
      phone: "+254712345678",
      email: "guard@example.com",
      rank: "Corporal",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.rank).toBe("Corporal");
  });
});
