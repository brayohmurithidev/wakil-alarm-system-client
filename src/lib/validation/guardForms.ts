// Shared Zod schema pieces for the Control Center's Guard forms (Create
// Guard, Edit Guard) - same centralization reasoning as adminUserForms.ts,
// and reuses phoneFieldSchema (validation/phone.ts) rather than
// duplicating phone validation a third time.
//
// Email is deliberately lowercased here, unlike adminUserEmailSchema:
// AdminUser email is never normalized server-side (see that file's own
// comment), but Guard email now is - Guard Account Phase 3's
// lib/guardIdentity.ts (API repo) trims + lowercases every guard email at
// every write path. Matching that here means what the operator sees in
// this form is what will actually be stored, not a case-sensitive value
// the backend silently rewrites underneath them.
//
// The backend remains authoritative for uniqueness - this only improves
// the operator's immediate feedback; a duplicate email/phone still comes
// back as a 409 from the API regardless of what passes here.

import { z } from "zod";

import { phoneFieldSchema } from "./phone";

export const guardNameSchema = z
  .string()
  .trim()
  .min(1, "Name is required")
  .max(100, "Name is too long");

export const guardEmailSchema = z
  .string()
  .trim()
  .min(1, "Email is required")
  .email("Enter a valid email address")
  .toLowerCase();

export const guardRankSchema = z
  .string()
  .trim()
  .max(100, "Rank is too long")
  .optional()
  .or(z.literal(""));

export const guardCreateFormSchema = z.object({
  name: guardNameSchema,
  phone: phoneFieldSchema,
  email: guardEmailSchema,
});

export type GuardCreateFormValues = z.infer<typeof guardCreateFormSchema>;

export const guardEditFormSchema = z.object({
  name: guardNameSchema,
  phone: phoneFieldSchema,
  email: guardEmailSchema,
  rank: guardRankSchema,
});

export type GuardEditFormValues = z.infer<typeof guardEditFormSchema>;
