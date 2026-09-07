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

  // Guard Onboarding Acceptance Fix (Failure 1): this used to assert the
  // opposite - "0712345678" normalized to itself, with no leading +, which
  // is exactly what made isValidE164 reject every Kenyan local-format
  // number an admin would actually type. Confirmed by physical staging
  // testing against "0786839604". Kenya is the default country (matches
  // the API's own lib/phone.ts) precisely so a local-format number IS
  // resolved to its real E.164 form here, not left as bare digits.
  it("resolves Kenyan local format (leading 0) to canonical E.164", () => {
    expect(normalizePhoneNumber("0712345678")).toBe("+254712345678");
  });

  it("resolves a bare country-code prefix (no leading +) to canonical E.164", () => {
    expect(normalizePhoneNumber("254712345678")).toBe("+254712345678");
  });

  it("resolves the exact acceptance-test number (0786839604) to +254786839604", () => {
    expect(normalizePhoneNumber("0786839604")).toBe("+254786839604");
  });

  it("resolves a Kenyan 01xx number the same way as 07xx", () => {
    expect(normalizePhoneNumber("0112345678")).toBe("+254112345678");
  });

  it("does not force a non-Kenyan E.164 number into Kenya - a number with its own + and country code is parsed as itself", () => {
    expect(normalizePhoneNumber("+14155552671")).toBe("+14155552671");
  });

  it("trims surrounding whitespace", () => {
    expect(normalizePhoneNumber("  +254712345678  ")).toBe("+254712345678");
  });

  it("falls back to best-effort digit-stripping for input that cannot be parsed as a real number, rather than throwing", () => {
    expect(normalizePhoneNumber("not-a-phone-number")).toBe("");
    expect(normalizePhoneNumber("12345")).toBe("12345");
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

  // Guard Onboarding Acceptance Fix (Failure 1) - the required Kenyan
  // formats, exercised through the actual schema every Guard/User form
  // uses, not just the normalizer in isolation.
  describe("Kenyan formats (Failure 1 acceptance criteria)", () => {
    it("accepts local-format 07xx (the exact number physical staging testing rejected)", () => {
      const result = phoneFieldSchema.safeParse("0786839604");
      expect(result.success).toBe(true);
      expect(result.data).toBe("+254786839604");
    });

    it("accepts local-format 01xx", () => {
      const result = phoneFieldSchema.safeParse("0112345678");
      expect(result.success).toBe(true);
      expect(result.data).toBe("+254112345678");
    });

    it("accepts a bare 254... prefix with no leading +", () => {
      const result = phoneFieldSchema.safeParse("254786839604");
      expect(result.success).toBe(true);
      expect(result.data).toBe("+254786839604");
    });

    it("accepts already-canonical +254...", () => {
      const result = phoneFieldSchema.safeParse("+254786839604");
      expect(result.success).toBe(true);
      expect(result.data).toBe("+254786839604");
    });

    it("all four representations of the same number normalize identically", () => {
      const variants = ["0786839604", "+254786839604", "254786839604", "0786 839 604"];
      const normalized = variants.map((v) => phoneFieldSchema.safeParse(v));
      expect(normalized.every((r) => r.success)).toBe(true);
      const values = new Set(normalized.map((r) => (r.success ? r.data : null)));
      expect(values.size).toBe(1);
      expect([...values][0]).toBe("+254786839604");
    });
  });

  describe("invalid / too-short / too-long values are still rejected", () => {
    it("rejects a too-short local number", () => {
      const result = phoneFieldSchema.safeParse("0712");
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Enter a valid phone number.");
    });

    it("rejects a too-long local number", () => {
      const result = phoneFieldSchema.safeParse("07123456789012345");
      expect(result.success).toBe(false);
      expect(result.error?.issues[0]?.message).toBe("Enter a valid phone number.");
    });

    it("rejects a too-short E.164 number", () => {
      const result = phoneFieldSchema.safeParse("+123");
      expect(result.success).toBe(false);
    });

    it("rejects a too-long E.164 number", () => {
      const result = phoneFieldSchema.safeParse("+1234567890123456789");
      expect(result.success).toBe(false);
    });

    it("rejects a malformed country code (0 immediately after +)", () => {
      const result = phoneFieldSchema.safeParse("+0786839604");
      expect(result.success).toBe(false);
    });
  });
});
