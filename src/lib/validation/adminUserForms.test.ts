import { describe, expect, it } from "vitest";

import { adminUserFormSchema, updateProfileFormSchema } from "./adminUserForms";

const validPayload = {
  name: "Jordan Rivera",
  email: "jordan@example.com",
  phone: "+254712345678",
  role: "DISPATCHER" as const,
};

describe("adminUserFormSchema (shared by Create User and Edit User)", () => {
  it("accepts a fully valid payload", () => {
    expect(adminUserFormSchema.safeParse(validPayload).success).toBe(true);
  });

  it("requires name", () => {
    const result = adminUserFormSchema.safeParse({ ...validPayload, name: "" });
    expect(result.success).toBe(false);
  });

  it("rejects an invalid email", () => {
    const result = adminUserFormSchema.safeParse({ ...validPayload, email: "not-an-email" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid email", () => {
    const result = adminUserFormSchema.safeParse({ ...validPayload, email: "a.b+c@sub.example.co.ke" });
    expect(result.success).toBe(true);
  });

  it("rejects an invalid phone number", () => {
    const result = adminUserFormSchema.safeParse({ ...validPayload, phone: "call me maybe" });
    expect(result.success).toBe(false);
  });

  it("accepts a valid phone number and normalizes it to canonical E.164", () => {
    const result = adminUserFormSchema.safeParse({ ...validPayload, phone: "+254 712 345 678" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.phone).toBe("+254712345678");
  });

  it("requires role to be one of the valid AdminRole values", () => {
    expect(adminUserFormSchema.safeParse({ ...validPayload, role: "SUPER_ADMIN" }).success).toBe(false);
    expect(adminUserFormSchema.safeParse({ ...validPayload, role: undefined }).success).toBe(false);
  });

  it("accepts each real AdminRole value", () => {
    for (const role of ["DISPATCHER", "SUPERVISOR", "ADMIN"] as const) {
      expect(adminUserFormSchema.safeParse({ ...validPayload, role }).success).toBe(true);
    }
  });
});

describe("updateProfileFormSchema (Profile / Account settings)", () => {
  it("applies the identical phone contract as Create/Edit User - same rejection", () => {
    const result = updateProfileFormSchema.safeParse({ ...validPayload, password: "" });
    expect(adminUserFormSchema.shape.phone).toBe(updateProfileFormSchema.shape.phone); // literally the same schema instance
    expect(result.success).toBe(true);
  });

  it("rejects an invalid phone number the same way Create/Edit User does", () => {
    const result = updateProfileFormSchema.safeParse({ ...validPayload, phone: "not a phone", password: "" });
    expect(result.success).toBe(false);
  });

  it("treats an empty password as 'leave unchanged' (valid)", () => {
    expect(updateProfileFormSchema.safeParse({ ...validPayload, password: "" }).success).toBe(true);
  });

  it("rejects a too-short new password", () => {
    expect(updateProfileFormSchema.safeParse({ ...validPayload, password: "abc" }).success).toBe(false);
  });

  it("accepts a valid new password", () => {
    expect(updateProfileFormSchema.safeParse({ ...validPayload, password: "a-real-password" }).success).toBe(true);
  });
});
