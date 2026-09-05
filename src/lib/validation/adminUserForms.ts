// Shared Zod schema pieces for every Control Center admin-account form
// (Create User, Edit User, Profile) - see the User Form Refinement report's
// "Existing form architecture" section for why these were centralized
// rather than left as three parallel sets of validation rules.
//
// Bounds below (name/email max length) are frontend-only sanity limits, not
// backend constraints - AdminUser.name/email are unbounded Postgres TEXT
// columns and the backend's own Zod schemas (createUser.ts, updateUser.ts,
// updateProfile.ts) impose no maximum at all. These exist only to catch
// obviously-wrong input before it reaches the network, generous enough to
// never reject a real name or email. Frontend validation improves UX here;
// it does not replace or tighten what the backend enforces.

import { z } from "zod";

import { phoneFieldSchema } from "./phone";

export const adminUserNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name is too long");

export const adminUserEmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address");
// Deliberately not lowercased: the backend's own create/login controllers
// never normalize AdminUser email casing either (confirmed by inspection -
// see the report), so silently lowercasing here would diverge from what
// the backend actually treats as the account's identity.

export const adminUserRoleSchema = z.enum(["DISPATCHER", "SUPERVISOR", "ADMIN"]);

/**
 * Shared by Create User and Edit User - both accept exactly this shape
 * (name/email/phone/role) and must apply identical validation, phone
 * included, rather than maintaining two schemas that could quietly drift
 * apart. Role's *selectable options* still come from
 * assignableRoles(actor) in adminUserManagementPermissions.ts - this schema
 * only checks that the submitted value is one of the three valid roles,
 * not who may assign which one (that's an authorization question, not a
 * validation one, and the backend remains authoritative for it regardless).
 */
export const adminUserFormSchema = z.object({
  name: adminUserNameSchema,
  email: adminUserEmailSchema,
  phone: phoneFieldSchema,
  role: adminUserRoleSchema,
});

export type AdminUserFormValues = z.infer<typeof adminUserFormSchema>;

/**
 * Profile is self-service and optionally changes the caller's own password
 * (unrelated to, and not touched by, the Phase C admin-management password
 * removal) - otherwise identical name/email/phone rules to the schema
 * above. An empty string means "leave the password unchanged", matching
 * updateProfileController's existing `if (password) { ... }` behavior.
 */
export const updateProfileFormSchema = z.object({
  name: adminUserNameSchema,
  email: adminUserEmailSchema,
  phone: phoneFieldSchema,
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
});

export type UpdateProfileFormValues = z.infer<typeof updateProfileFormSchema>;
