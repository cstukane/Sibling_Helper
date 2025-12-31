import { isValidPin } from '../utils/sanitize';

const PIN_HASH_KEY = 'parent_pin_hash';
const PIN_SALT_KEY = 'parent_pin_salt';
const LEGACY_PIN_KEY = 'parent_pin';
const DEFAULT_PIN = '1234';

function hasCryptoSupport(): boolean {
  return typeof crypto !== 'undefined' && !!crypto.subtle && typeof TextEncoder !== 'undefined';
}

function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

async function hashPin(pin: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${pin}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

class PinManager {
  async setPin(pin: string): Promise<boolean> {
    if (!isValidPin(pin)) return false;
    if (!hasCryptoSupport()) {
      localStorage.setItem(LEGACY_PIN_KEY, pin);
      return true;
    }
    const saltBytes = crypto.getRandomValues(new Uint8Array(16));
    const salt = bytesToHex(saltBytes);
    const hash = await hashPin(pin, salt);
    localStorage.setItem(PIN_SALT_KEY, salt);
    localStorage.setItem(PIN_HASH_KEY, hash);
    localStorage.removeItem(LEGACY_PIN_KEY);
    return true;
  }

  isPinSet(): boolean {
    return !!localStorage.getItem(PIN_HASH_KEY) || !!localStorage.getItem(LEGACY_PIN_KEY);
  }

  async validatePin(pin: string): Promise<boolean> {
    if (!isValidPin(pin)) return false;
    const hash = localStorage.getItem(PIN_HASH_KEY);
    const salt = localStorage.getItem(PIN_SALT_KEY);
    if (hash && salt && hasCryptoSupport()) {
      const candidate = await hashPin(pin, salt);
      return constantTimeEqual(hash, candidate);
    }
    const legacyPin = localStorage.getItem(LEGACY_PIN_KEY);
    if (legacyPin) {
      const match = legacyPin === pin;
      if (match) {
        await this.setPin(pin);
      }
      return match;
    }
    return false;
  }

  clearPin(): void {
    localStorage.removeItem(PIN_HASH_KEY);
    localStorage.removeItem(PIN_SALT_KEY);
    localStorage.removeItem(LEGACY_PIN_KEY);
  }

  async initializeDefaultPin(): Promise<void> {
    if (!this.isPinSet()) {
      await this.setPin(DEFAULT_PIN);
    }
  }
}

export const pinManager = new PinManager();
