// Shared phone-number validation/normalization for every Control Center
// form that accepts one (Create User, Edit User, Profile). The backend does
// not itself validate or normalize phone format at all - every
// AdminUser/Guard controller uses `z.string().min(1)` for phone, with no
// format or country constraint anywhere (see the User Form Refinement
// report's "Backend phone contract" section). This exists purely to give
// the operator useful client-side feedback and one consistent canonical
// value, not because the backend requires it - the backend remains
// authoritative and would accept any non-empty string regardless.
//
// Deliberately a plain E.164 structural check (leading +, no leading 0 on
// the country code, 7-15 digits total - the shape the ITU E.164 standard
// itself defines), not full libphonenumber-grade validation, which would
// additionally confirm the number falls in an actually-assigned range for
// its country. libphonenumber-js is not a dependency of this project today;
// see the report for why one wasn't added for this pass rather than
// silently deciding to.
//
// No country is assumed or silently prepended - Kenyan numbers use the
// same +254... shape shown in the placeholder, but any country's E.164
// number validates identically. The backend has no Kenya-only requirement
// to align with.

import { z } from "zod";

const E164_PATTERN = /^\+[1-9]\d{6,14}$/;

/**
 * Strips everything but a leading `+` and digits. Spaces, dashes,
 * parentheses, and dots are formatting a person might type while entering a
 * number, not part of its identity - "+254 712 345 678" and
 * "+254712345678" are the same number, and only the latter is what gets
 * submitted.
 */
export function normalizePhoneNumber(value: string): string {
  const trimmed = value.trim();
  const hasLeadingPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  return hasLeadingPlus ? `+${digitsOnly}` : digitsOnly;
}

export function isValidE164(value: string): boolean {
  return E164_PATTERN.test(value);
}

export const PHONE_PLACEHOLDER = "+254712345678";
export const PHONE_INVALID_MESSAGE = "Enter a valid phone number.";
export const PHONE_REQUIRED_MESSAGE = "Phone is required.";

/** The one Zod piece every form's phone field composes into its own
 * schema - normalizes on validation, so the value that ends up in
 * `handleSubmit`'s data (and therefore whatever gets submitted to the API)
 * is already canonical E.164, not whatever formatting the operator typed. */
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
