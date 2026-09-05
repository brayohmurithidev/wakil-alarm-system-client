import { describe, expect, it } from "vitest";

import { isValidE164, normalizePhoneNumber, PHONE_INPUT_PROPS, phoneFieldSchema } from "./phone";

describe("PHONE_INPUT_PROPS", () => {
  it("is a real telephone input, never type=number - phone numbers are identifiers, not quantities", () => {
    expect(PHONE_INPUT_PROPS.type).toBe("tel");
  });

  it("uses inputMode=tel so mobile keyboards show the right layout", () => {
    expect(PHONE_INPUT_PROPS.inputMode).toBe("tel");
  });

  it("uses autoComplete=tel", () => {
    expect(PHONE_INPUT_PROPS.autoComplete).toBe("tel");
  });
});

describe("normalizePhoneNumber", () => {
  it("strips spaces while preserving the leading +", () => {
    expect(normalizePhoneNumber("+254 712 345 678")).toBe("+254712345678");
  });

  it("strips dashes and parentheses", () => {
    expect(normalizePhoneNumber("+1 (415) 555-2671")).toBe("+14155552671");
  });

  it("leaves an already-canonical number unchanged", () => {
    expect(normalizePhoneNumber("+254712345678")).toBe("+254712345678");
  });

  it("does not invent a leading + for a number that never had one", () => {
    expect(normalizePhoneNumber("0712345678")).toBe("0712345678");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizePhoneNumber("  +254712345678  ")).toBe("+254712345678");
  });
});

describe("isValidE164", () => {
  it("accepts a canonical Kenyan number", () => {
    expect(isValidE164("+254712345678")).toBe(true);
  });

  it("accepts a canonical US number", () => {
    expect(isValidE164("+14155552671")).toBe(true);
  });

  it("rejects a number with no leading +", () => {
    expect(isValidE164("254712345678")).toBe(false);
  });

  it("rejects a country code starting with 0", () => {
    expect(isValidE164("+0712345678")).toBe(false);
  });

  it("rejects something that clearly isn't a phone number", () => {
    expect(isValidE164("not-a-phone-number")).toBe(false);
  });

  it("rejects a number that's too short to be real", () => {
    expect(isValidE164("+123")).toBe(false);
  });

  it("rejects more than 15 total digits (E.164's own maximum)", () => {
    expect(isValidE164("+1234567890123456")).toBe(false);
  });
});

describe("phoneFieldSchema", () => {
  it("rejects an empty value with a required message", () => {
    const result = phoneFieldSchema.safeParse("");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Phone is required.");
  });

  it("rejects free text with a useful message, not a generic 'Invalid string'", () => {
    const result = phoneFieldSchema.safeParse("call me maybe");
    expect(result.success).toBe(false);
    expect(result.error?.issues[0]?.message).toBe("Enter a valid phone number.");
  });

  it("accepts a formatted number and normalizes it to canonical E.164 as the parsed value", () => {
    const result = phoneFieldSchema.safeParse("+254 712 345 678");
    expect(result.success).toBe(true);
    expect(result.data).toBe("+254712345678");
  });

  it("accepts an already-canonical number unchanged", () => {
    const result = phoneFieldSchema.safeParse("+14155552671");
    expect(result.success).toBe(true);
    expect(result.data).toBe("+14155552671");
  });
});
