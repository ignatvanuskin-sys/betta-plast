/**
 * Kazakh phone number handling. Everything is stored in a single canonical
 * form (+7XXXXXXXXXX) so that de-duplication, search and rate limiting work.
 */

/** Returns the canonical +7XXXXXXXXXX form, or null when the input is invalid. */
export function normalizePhone(input: string): string | null {
  if (typeof input !== 'string') return null;
  const digits = input.replace(/\D/g, '');
  let local: string | null = null;

  if (digits.length === 11 && (digits.startsWith('7') || digits.startsWith('8'))) {
    local = digits.slice(1);
  } else if (digits.length === 10) {
    local = digits;
  } else if (digits.length === 12 && digits.startsWith('77')) {
    local = digits.slice(2);
  }

  if (!local) return null;
  // Kazakhstan subscriber numbers start with 6 or 7 (mobile) for the ranges we serve.
  if (!/^[67]\d{9}$/.test(local)) return null;
  return `+7${local}`;
}

export function isValidPhone(input: string): boolean {
  return normalizePhone(input) !== null;
}

/** +77001074927 → +7 700 107 49 27 */
export function formatPhone(normalized: string): string {
  const match = /^\+7(\d{3})(\d{3})(\d{2})(\d{2})$/.exec(normalized);
  if (!match) return normalized;
  return `+7 ${match[1]} ${match[2]} ${match[3]} ${match[4]}`;
}

/** Masks a phone for logs and non-essential notifications. */
export function maskPhone(input: string): string {
  const normalized = normalizePhone(input);
  if (!normalized) return '***';
  return `${normalized.slice(0, 5)}***${normalized.slice(-2)}`;
}

/** wa.me expects digits only, without the leading plus. */
export function toWaNumber(normalized: string): string {
  return normalized.replace(/\D/g, '');
}
