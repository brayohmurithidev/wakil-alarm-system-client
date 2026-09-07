// Shared phone-number validation/normalization for every Control Center
// form that accepts one (Create User, Edit User, Profile, Create Guard,
// Edit Guard). Guard Onboarding Acceptance Fix (Failure 1): this used to be
// a plain E.164-shape check with no understanding of local-format input at
// all - "0786839604" normalized to itself (no leading +) and was then
// rejected as invalid, blocking a completely ordinary Kenyan admin from
// creating a guard. Confirmed by physical staging testing.
//
// Now uses libphonenumber-js with Kenya as the default country - the exact
// same library and default country as the API's own lib/phone.ts
// (normalizePhoneNumber), so "what this form accepts" and "what the
// backend would itself normalize the value to" are provably the same
// numbers, not two independently-maintained heuristics that can drift
// apart. A number that already carries its own country code (a leading +,
// or an unambiguous bare calling-code prefix like "254...") is parsed by
// that code, not forced into Kenya - the backend has no Kenya-only
// requirement, and neither does this.

import { type CountryCode, parsePhoneNumberFromString } from "libphonenumber-js";
import { z } from "zod";

const DEFAULT_COUNTRY: CountryCode = "KE";

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

/**
 * Parses local Kenyan format ("0786839604"), a bare country-code prefix
 * ("254786839604"), or already-canonical E.164 ("+254786839604") - all
 * three normalize to the same "+254786839604". Formatting characters
 * (spaces, dashes, parentheses, dots) are stripped as part of parsing, the
 * same way libphonenumber-js already does server-side.
 *
 * Falls back to the previous best-effort digit-stripping when the input
 * can't be parsed as a real number at all (garbage text, too short, too
 * long) - the value returned here is never trusted on its own; it's always
 * checked by isValidE164 (structurally) below, so a failed parse still
 * ends up correctly rejected rather than silently accepted or thrown.
 */
export function normalizePhoneNumber(value: string): string {
  const trimmed = value.trim();
  const parsed = parsePhoneNumberFromString(trimmed, DEFAULT_COUNTRY);

  if (parsed?.isValid()) {
    return parsed.format("E.164");
  }

  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

export function isValidE164(value: string): boolean {
  return E164_PATTERN.test(value);
}

export const PHONE_PLACEHOLDER = "0786839604";
export const PHONE_INVALID_MESSAGE = "Enter a valid phone number.";
export const PHONE_REQUIRED_MESSAGE = "Phone is required.";

/** The one Zod piece every form's phone field composes into its own
 * schema - normalizes on validation, so the value that ends up in
 * `handleSubmit`'s data (and therefore whatever gets submitted to the API)
 * is already canonical E.164, not whatever formatting (or local format)
 * the operator typed. */
export const phoneFieldSchema = z
  .string()
  .trim()
  .min(1, PHONE_REQUIRED_MESSAGE)
  .transform(normalizePhoneNumber)
  .refine(isValidE164, { message: PHONE_INVALID_MESSAGE });

/** Spread onto every phone `<input>` in the Control Center - see the
 * report's "Phone-field audit" section for why type="tel" alone (the
 * pre-existing state on most of these fields) isn't the full contract. */
export const PHONE_INPUT_PROPS = {
  type: "tel" as const,
  inputMode: "tel" as const,
  autoComplete: "tel" as const,
  placeholder: PHONE_PLACEHOLDER,
};
