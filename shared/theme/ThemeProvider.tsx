import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { themeCSSVariables } from './themeTokens';

export type ThemeMode = 'system' | 'light' | 'dark';

type ThemeContextValue = {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const STORAGE_KEY = 'themeMode';
const LEGACY_KEY = 'darkMode';
const BORDER_KEY = 'borderColor';

const hasWindow = () => typeof window !== 'undefined';
const hasStorage = () => hasWindow() && typeof window.localStorage !== 'undefined';

const getStoredMode = (): ThemeMode => {
  if (!hasStorage()) return 'system';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  if (saved === 'light' || saved === 'dark' || saved === 'system') {
    return saved;
  }
  const legacy = window.localStorage.getItem(LEGACY_KEY);
  if (legacy === 'true') {
    window.localStorage.setItem(STORAGE_KEY, 'dark');
    return 'dark';
  }
  if (legacy === 'false') {
    window.localStorage.setItem(STORAGE_KEY, 'light');
    return 'light';
  }
  return 'system';
};

const prefersDark = () =>
  hasWindow() && window.matchMedia?.('(prefers-color-scheme: dark)').matches;

const applyCssVariables = (isDark: boolean) => {
  if (!hasWindow()) return;
  const root = document.documentElement;
  const vars = isDark ? themeCSSVariables.dark : themeCSSVariables.light;
  Object.entries(vars).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
};

const applyFrameBorder = (isDark: boolean) => {
  if (!hasStorage()) return;
  const savedBorder = window.localStorage.getItem(BORDER_KEY);
  const fallback = isDark ? '#000000' : '#ffffff';
  const value = savedBorder && savedBorder !== 'system' ? savedBorder : fallback;
  document.documentElement.style.setProperty('--frame-border', value);
};

const applyDocumentTheme = (isDark: boolean) => {
  if (!hasWindow()) return;
  document.documentElement.classList.toggle('dark', isDark);
  document.body?.classList.toggle('dark', isDark);
  applyCssVariables(isDark);
  applyFrameBorder(isDark);
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [mode, setModeState] = useState<ThemeMode>(() => getStoredMode());
  const [isDark, setIsDark] = useState(() => (mode === 'dark' ? true : mode === 'light' ? false : prefersDark()));

  const applyTheme = (nextMode: ThemeMode) => {
    const dark = nextMode === 'system' ? prefersDark() : nextMode === 'dark';
    setIsDark(dark);
    applyDocumentTheme(dark);
    if (hasStorage()) {
      window.localStorage.setItem(LEGACY_KEY, String(dark));
    }
  };

  useEffect(() => {
    applyTheme(mode);
  }, [mode]);

  useEffect(() => {
    if (!hasWindow() || mode !== 'system') return;
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme('system');
    mediaQuery.addEventListener?.('change', handleChange);
    mediaQuery.addListener?.(handleChange);
    return () => {
      mediaQuery.removeEventListener?.('change', handleChange);
      mediaQuery.removeListener?.(handleChange);
    };
  }, [mode]);

  useEffect(() => {
    if (!hasWindow()) return;
    const handleStorage = (event: StorageEvent) => {
      if (event.key === STORAGE_KEY) {
        const next = (event.newValue as ThemeMode) || 'system';
        if (next === 'light' || next === 'dark' || next === 'system') {
          setModeState(next);
        }
      }
      if (event.key === LEGACY_KEY && !window.localStorage.getItem(STORAGE_KEY)) {
        const legacy = event.newValue;
        if (legacy === 'true') setModeState('dark');
        if (legacy === 'false') setModeState('light');
      }
      if (event.key === BORDER_KEY) {
        applyFrameBorder(isDark);
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [isDark]);

  const setMode = (nextMode: ThemeMode) => {
    setModeState(nextMode);
    if (hasStorage()) {
      window.localStorage.setItem(STORAGE_KEY, nextMode);
    }
  };

  const value = useMemo(
    () => ({ mode, isDark, setMode }),
    [mode, isDark]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
