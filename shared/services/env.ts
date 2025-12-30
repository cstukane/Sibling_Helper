type EnvConfig = {
  ENABLE_SYNC: boolean;
  API_BASE_URL: string;
};

let cachedEnv: EnvConfig | null = null;

function readEnvRecord(): Record<string, string | undefined> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const env: any = (typeof import.meta !== 'undefined' && (import.meta as any).env) || {};
    return env as Record<string, string | undefined>;
  } catch {
    return {};
  }
}

function normalizeBaseUrl(raw?: string): string {
  return (raw || '').toString().trim().replace(/\/+$/, '');
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function getEnv(): EnvConfig {
  if (cachedEnv) return cachedEnv;

  const env = readEnvRecord();
  const enableRaw = String(env.VITE_ENABLE_SYNC || '').toLowerCase();
  const enableSync = enableRaw === 'true';
  let apiBaseUrl = normalizeBaseUrl(env.VITE_API_BASE_URL);

  if (apiBaseUrl && !isValidUrl(apiBaseUrl)) {
    console.warn('[env] VITE_API_BASE_URL is not a valid URL:', apiBaseUrl);
    apiBaseUrl = '';
  }

  let finalEnable = enableSync;
  if (finalEnable && !apiBaseUrl) {
    console.warn('[env] VITE_ENABLE_SYNC is true but VITE_API_BASE_URL is missing; disabling sync.');
    finalEnable = false;
  }

  cachedEnv = { ENABLE_SYNC: finalEnable, API_BASE_URL: apiBaseUrl };
  return cachedEnv;
}
