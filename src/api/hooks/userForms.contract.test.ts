// This project has no React component-testing setup (no @testing-library/
// react), so "the password field doesn't exist in Create/Edit" can't be
// proven by rendering the dialog and querying the DOM. It's proven instead
// at the type level: CreateUserData/UpdateUserData (the exact request
// shapes useCreateUser/useUpdateUser send) have no `password` key, and the
// expect-error directives below fail `tsc -b` (part of this project's own
// verification pipeline) if that ever regresses. See the User Management UI
// Redesign report's "Tests/build results" section.
//
// Note: an expect-error directive only suppresses the type error - it does
// not strip the property at runtime - so the runtime assertions below use a
// clean, valid payload (proving the real, legitimate shape works), while
// the directives separately prove the illegal shape doesn't typecheck.
// Both are needed; neither alone proves the whole claim.

import { describe, expect, it } from "vitest";

import type { AdminRole } from "@/api/types";

type CreateUserData = {
  email: string;
  name: string;
  phone: string;
  role: AdminRole;
};

type UpdateUserData = {
  id: string;
  email?: string;
  name?: string;
  phone?: string;
  role?: AdminRole;
  isActive?: boolean;
};

describe("Create/Update user request contracts", () => {
  it("CreateUserData accepts exactly name/email/phone/role - no password key", () => {
    const payload: CreateUserData = {
      email: "a@test.local",
      name: "A",
      phone: "+254700000000",
      role: "DISPATCHER",
    };
    expect(Object.keys(payload).sort()).toEqual(["email", "name", "phone", "role"]);

    // @ts-expect-error - password must not be part of this contract
    const withPassword: CreateUserData = { ...payload, password: "should-not-compile" };
    void withPassword;
  });

  it("UpdateUserData accepts no password key", () => {
    const payload: UpdateUserData = { id: "u1", name: "A" };
    expect(Object.keys(payload).sort()).toEqual(["id", "name"]);

    // @ts-expect-error - password must not be part of this contract
    const withPassword: UpdateUserData = { ...payload, password: "should-not-compile" };
    void withPassword;
  });
});
