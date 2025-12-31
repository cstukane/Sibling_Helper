const CONTROL_CHARS = /[\u0000-\u001f\u007f]/g;

export const sanitizeText = (value: string, maxLength: number) => {
  return value.replace(CONTROL_CHARS, '').trim().slice(0, maxLength);
};

export const sanitizeOptionalText = (value?: string | null, maxLength = 200): string | null => {
  if (value == null) return null;
  const sanitized = sanitizeText(value, maxLength);
  return sanitized.length > 0 ? sanitized : null;
};

export const clampNumber = (value: number, min: number, max: number) => {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
};
