import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type ThemeMode = 'system' | 'light' | 'dark';

interface ThemeContextType {
  mode: ThemeMode;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

type ThemeProviderProps = {
  children: ReactNode;
};

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>('system');
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Load saved theme preference
    const savedMode = localStorage.getItem('themeMode') as ThemeMode | null;
    if (savedMode) {
      setMode(savedMode);
    }
    
    // Apply theme
    applyTheme(savedMode || 'system');
    
    // Listen for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      if (mode === 'system') {
        applyTheme('system');
      }
    };
    
    // Add both addEventListener and addListener for broader browser support
    mediaQuery.addEventListener('change', handleChange);
    if (mediaQuery.addListener) {
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      mediaQuery.removeEventListener('change', handleChange);
      if (mediaQuery.removeListener) {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [mode]);

  const applyTheme = (newMode: ThemeMode) => {
    let darkMode = false;
    
    if (newMode === 'system') {
      darkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;
    } else {
      darkMode = newMode === 'dark';
    }
    
    setIsDark(darkMode);
    
    // Apply CSS class to document
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Apply CSS variables
    const root = document.documentElement;
    if (darkMode) {
      root.style.setProperty('--bg-surface', '#0f172a');
      root.style.setProperty('--bg-surface-overlay', '#1e293b');
      root.style.setProperty('--bg-surface-elevated', '#1e293b');
      root.style.setProperty('--text-primary', '#f8fafc');
      root.style.setProperty('--text-secondary', '#cbd5e1');
      root.style.setProperty('--text-tertiary', '#94a3b8');
      root.style.setProperty('--text-inverse', '#0f172a');
      root.style.setProperty('--accent-primary', '#38bdf8');
      root.style.setProperty('--accent-hover', '#7dd3fc');
      root.style.setProperty('--accent-disabled', '#0c4a6e');
      root.style.setProperty('--border-default', '#334155');
      root.style.setProperty('--border-muted', '#1e293b');
      root.style.setProperty('--state-success', '#34d399');
      root.style.setProperty('--state-warn', '#fbbf24');
      root.style.setProperty('--state-error', '#f87171');
      root.style.setProperty('--ui-button-primary-bg', '#38bdf8');
      root.style.setProperty('--ui-button-primary-text', '#0c4a6e');
      root.style.setProperty('--ui-button-secondary-bg', '#1e293b');
      root.style.setProperty('--ui-button-secondary-text', '#f8fafc');
    } else {
      root.style.setProperty('--bg-surface', '#ffffff');
      root.style.setProperty('--bg-surface-overlay', '#f8fafc');
      root.style.setProperty('--bg-surface-elevated', '#ffffff');
      root.style.setProperty('--text-primary', '#0f172a');
      root.style.setProperty('--text-secondary', '#64748b');
      root.style.setProperty('--text-tertiary', '#94a3b8');
      root.style.setProperty('--text-inverse', '#f8fafc');
      root.style.setProperty('--accent-primary', '#0ea5e9');
      root.style.setProperty('--accent-hover', '#0284c7');
      root.style.setProperty('--accent-disabled', '#93c5fd');
      root.style.setProperty('--border-default', '#cbd5e1');
      root.style.setProperty('--border-muted', '#e2e8f0');
      root.style.setProperty('--state-success', '#10b981');
      root.style.setProperty('--state-warn', '#f59e0b');
      root.style.setProperty('--state-error', '#ef4444');
      root.style.setProperty('--ui-button-primary-bg', '#0ea5e9');
      root.style.setProperty('--ui-button-primary-text', '#ffffff');
      root.style.setProperty('--ui-button-secondary-bg', '#e2e8f0');
      root.style.setProperty('--ui-button-secondary-text', '#0f172a');
    }
  };

  const updateMode = (newMode: ThemeMode) => {
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
    applyTheme(newMode);
  };

  return (
    <ThemeContext.Provider value={{ mode, isDark, setMode: updateMode }}>
      {children}
    </ThemeContext.Provider>
  );
};