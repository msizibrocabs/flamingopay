/**
 * Flamingo Pay — South-African phone helpers.
 *
 * Every ZA number in the system should be stored in strict E.164 form
 * (`+27821234567` — no spaces) and displayed in the conventional
 * mobile grouping (`+27 82 123 4567`). The raw `phone` field on
 * MerchantApplication is sometimes stored with inconsistent spacing
 * (legacy seed data), and buyer-side lookups (`getMerchantByPhone`)
 * already strip non-digits before comparison — this module
 * centralises all of that.
 *
 * Usage:
 *   normalizePhoneZA("082 123 4567")   // "+27821234567"
 *   normalizePhoneZA("+27 82 123 4567") // "+27821234567"
 *   formatPhoneZA("+27821234567")      // "+27 82 123 4567"
 *   formatPhoneZA("082 123 4567")      // "+27 82 123 4567"
 *
 * Rules:
 *   - ZA mobile numbers are 9 digits after the "27" country code
 *     (e.g. "82 123 4567"). A leading "0" is equivalent to "+27".
 *   - If the input can't be resolved to a recognisable ZA number, the
 *     helpers return the original string untouched rather than crashing,
 *     so they're safe to use in list rendering.
 */

export type PhoneFormatOptions = {
  /** Return "-" instead of the raw input when the number can't be parsed. */
  fallbackDash?: boolean;
};

/**
 * Collapse any ZA phone input to strict E.164 (`+27XXXXXXXXX`).
 * Returns the original string if the digits don't look like a ZA number.
 */
export function normalizePhoneZA(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (!digits) return raw;

  // "27XXXXXXXXX" — already has country code
  if (digits.length === 11 && digits.startsWith("27")) {
    return `+${digits}`;
  }
  // "0XXXXXXXXX" — local format
  if (digits.length === 10 && digits.startsWith("0")) {
    return `+27${digits.slice(1)}`;
  }
  // "XXXXXXXXX" — bare subscriber number (9 digits)
  if (digits.length === 9) {
    return `+27${digits}`;
  }
  // Unrecognised — return original (non-destructive).
  return raw;
}

/**
 * Render a ZA phone number as "+27 82 123 4567".
 * Falls back to the original input if it isn't a recognisable ZA number.
 */
export function formatPhoneZA(raw: string | null | undefined, opts: PhoneFormatOptions = {}): string {
  if (!raw) return opts.fallbackDash ? "-" : "";
  const e164 = normalizePhoneZA(raw);
  if (!e164.startsWith("+27") || e164.length !== 12) {
    return opts.fallbackDash ? "-" : raw;
  }
  const subscriber = e164.slice(3); // 9 digits, e.g. "821234567"
  return `+27 ${subscriber.slice(0, 2)} ${subscriber.slice(2, 5)} ${subscriber.slice(5)}`;
}

/**
 * Extract the digits-only form of a phone number for comparison.
 * Stable across display variants ("+27 82 …", "082 …", "27 82 …").
 */
export function phoneDigits(raw: string | null | undefined): string {
  if (!raw) return "";
  const digits = raw.replace(/\D/g, "");
  if (digits.length === 10 && digits.startsWith("0")) return `27${digits.slice(1)}`;
  if (digits.length === 9) return `27${digits}`;
  return digits;
}

/** Rough validity check — returns true if the input normalises to +27 + 9 digits. */
export function isValidPhoneZA(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const e164 = normalizePhoneZA(raw);
  return e164.startsWith("+27") && e164.length === 12;
}
