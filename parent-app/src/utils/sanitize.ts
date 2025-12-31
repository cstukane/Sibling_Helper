const CONTROL_CHARS = /[^\x20-\x7E]/g;

export function sanitizeText(value: string, maxLength = 120): string {
  const cleaned = value.replace(CONTROL_CHARS, '').trim();
  return cleaned.slice(0, maxLength);
}

export function sanitizeOptionalText(value: string, maxLength = 240): string {
  const cleaned = sanitizeText(value, maxLength);
  return cleaned.length > 0 ? cleaned : '';
}

export function sanitizeNumber(value: string, min: number, max: number, fallback: number): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return fallback;
  const rounded = Math.floor(parsed);
  return Math.min(max, Math.max(min, rounded));
}

export function sanitizePinInput(value: string, length = 4): string {
  return value.replace(/\D/g, '').slice(0, length);
}

export function isValidPin(value: string, length = 4): boolean {
  const re = new RegExp(`^\\d{${length}}$`);
  return re.test(value);
}
