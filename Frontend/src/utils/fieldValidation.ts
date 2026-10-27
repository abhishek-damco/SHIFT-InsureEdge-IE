// AI_GENERATED | HUMAN_VALIDATION_REQUIRED
// Shared field rules from the QA "Common Standard Rules" (§2). Every form should build its
// messages and checks from here so the wording and limits can't drift between screens.

export type Errors = Record<string, string>;

export const CANADA = 'Canada';

export const required = (label: string) => `Provide ${label} to continue`;
export const invalid = (label: string) => `Provide valid ${label} to continue`;

export const stateLabel = (country?: string) => (country === CANADA ? 'Province' : 'State');
export const zipLabel = (country?: string) => (country === CANADA ? 'Postal Code' : 'Zip Code');

export const isBlank = (v?: string | number | null) => v === undefined || v === null || String(v).trim() === '';
export const digitsOnly = (v: string, max: number) => v.replace(/\D/g, '').slice(0, max);

// Client phone values are stored as a 10-digit national number, while older rows
// may still include the North American +1 prefix. Keep legacy values readable
// without treating the calling code as part of the national number.
export function normalizeNorthAmericanPhone(raw?: string | null): string {
  const digits = (raw ?? '').replace(/\D/g, '');
  return digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
}

// ── Formatting ─────────────────────────────────────────────────────────────────
export function formatPhone(raw?: string | null): string {
  const d = normalizeNorthAmericanPhone(raw).slice(0, 10);
  if (!d) return '';
  if (d.length <= 3) return `(${d}`;
  if (d.length <= 6) return `(${d.slice(0, 3)}) ${d.slice(3)}`;
  return `(${d.slice(0, 3)}) ${d.slice(3, 6)}-${d.slice(6)}`;
}

// Masks typed input as MM-DD-YYYY.
export function formatDateInput(raw: string): string {
  const d = digitsOnly(raw, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}-${d.slice(2)}`;
  return `${d.slice(0, 2)}-${d.slice(2, 4)}-${d.slice(4)}`;
}

// MM-DD-YYYY → YYYY-MM-DD (API format); '' when not a real calendar date.
export function mmddyyyyToIso(value: string): string {
  const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(value);
  if (!m) return '';
  const [, mm, dd, yyyy] = m;
  const date = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  const real = date.getFullYear() === Number(yyyy) && date.getMonth() === Number(mm) - 1 && date.getDate() === Number(dd);
  return real ? `${yyyy}-${mm}-${dd}` : '';
}

// YYYY-MM-DD (optionally with a time part) → MM-DD-YYYY.
export function isoToMmddyyyy(value?: string | null): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(value ?? '');
  return m ? `${m[2]}-${m[3]}-${m[1]}` : '';
}

export function todayMmDdYyyy(): string {
  const d = new Date();
  return `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}-${d.getFullYear()}`;
}

// ── Checks ─────────────────────────────────────────────────────────────────────
const US_ZIP = /^\d{5}(-\d{4})?$/;
// First letter never D F I O Q U W Z; later letters never D F I O Q U.
const CA_POSTAL = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z] \d[ABCEGHJ-NPRSTV-Z]\d$/;
const NAME_CHARS = /^[A-Za-z0-9\-'‘’. áéíóúñüçÁÉÍÓÚÑÜÇ]+$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidZip = (zip: string, country?: string) =>
  country === CANADA ? CA_POSTAL.test(zip) : US_ZIP.test(zip);
export const isValidName = (name: string) => name.length <= 50 && !name.startsWith(' ') && NAME_CHARS.test(name);
export const isValidEmail = (email: string) => email.length <= 50 && EMAIL.test(email);
export const isValidPhone = (phone: string) => normalizeNorthAmericanPhone(phone).length === 10;
export const isValidExtension = (ext: string | number) => /^\d{1,6}$/.test(String(ext));

// Inclusive range check on an MM-DD-YYYY string.
export function isValidDate(value: string, min?: string, max?: string): boolean {
  const iso = mmddyyyyToIso(value);
  if (!iso) return false;
  if (min && iso < (mmddyyyyToIso(min) || min)) return false;
  if (max && iso > (mmddyyyyToIso(max) || max)) return false;
  return true;
}

// ── Common field-group checks (keys are the caller's field names) ─────────────
// Optional phone/email/extension: validate format only when filled; required: also check presence.
export function checkPhone(e: Errors, key: string, value: string | undefined, label: string, isRequired = false) {
  if (isBlank(value)) { if (isRequired) e[key] = required(label); }
  else if (!isValidPhone(value!)) e[key] = invalid(label);
}

export function checkEmail(e: Errors, key: string, value: string | undefined, label = 'Email ID', isRequired = false) {
  if (isBlank(value)) { if (isRequired) e[key] = required(label); }
  else if (!isValidEmail(value!.trim())) e[key] = invalid(label);
}

export function checkExtension(e: Errors, key: string, value: string | number | undefined | null, label = 'Extension') {
  if (!isBlank(value) && !isValidExtension(value!)) e[key] = invalid(label);
}

export function checkZip(e: Errors, key: string, value: string | undefined, country?: string, isRequired = true) {
  const label = zipLabel(country);
  if (isBlank(value)) { if (isRequired) e[key] = required(label); }
  else if (!isValidZip(value!.trim(), country)) e[key] = invalid(label);
}

// Server returns 400 { error } (or { message }); surface it instead of a generic message.
export function apiErrorMessage(err: unknown, fallback: string): string {
  const e = err as { response?: { data?: { error?: string; message?: string } } };
  return e.response?.data?.error ?? e.response?.data?.message ?? fallback;
}
