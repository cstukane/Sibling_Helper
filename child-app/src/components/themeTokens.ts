// Theme tokens for light and dark modes
export const themeTokens = {
  light: {
    // Background colors
    'bg.surface': '#ffffff',
    'bg.surface.overlay': '#f8fafc',
    'bg.surface.elevated': '#ffffff',
    
    // Text colors
    'text.primary': '#0f172a',
    'text.secondary': '#64748b',
    'text.tertiary': '#94a3b8',
    'text.inverse': '#f8fafc',
    
    // Accent colors
    'accent.primary': '#0ea5e9',
    'accent.hover': '#0284c7',
    'accent.disabled': '#93c5fd',
    
    // Border colors
    'border.default': '#cbd5e1',
    'border.muted': '#e2e8f0',
    
    // Status colors
    'state.success': '#10b981',
    'state.warn': '#f59e0b',
    'state.error': '#ef4444',
    
    // UI elements
    'ui.button.primary.bg': '#0ea5e9',
    'ui.button.primary.text': '#ffffff',
    'ui.button.secondary.bg': '#e2e8f0',
    'ui.button.secondary.text': '#0f172a',
  },
  
  dark: {
    // Background colors
    'bg.surface': '#0f172a',
    'bg.surface.overlay': '#1e293b',
    'bg.surface.elevated': '#1e293b',
    
    // Text colors
    'text.primary': '#f8fafc',
    'text.secondary': '#cbd5e1',
    'text.tertiary': '#94a3b8',
    'text.inverse': '#0f172a',
    
    // Accent colors
    'accent.primary': '#38bdf8',
    'accent.hover': '#7dd3fc',
    'accent.disabled': '#0c4a6e',
    
    // Border colors
    'border.default': '#334155',
    'border.muted': '#1e293b',
    
    // Status colors
    'state.success': '#34d399',
    'state.warn': '#fbbf24',
    'state.error': '#f87171',
    
    // UI elements
    'ui.button.primary.bg': '#38bdf8',
    'ui.button.primary.text': '#0c4a6e',
    'ui.button.secondary.bg': '#1e293b',
    'ui.button.secondary.text': '#f8fafc',
  }
};

// Helper function to get token value based on theme
type ThemeToken = keyof typeof themeTokens.light;

export const getTokenValue = (token: ThemeToken, isDark: boolean) => {
  return isDark ? themeTokens.dark[token] : themeTokens.light[token];
};

// CSS variables for the theme tokens
export const themeCSSVariables = {
  light: Object.entries(themeTokens.light).reduce((acc, [key, value]) => {
    acc[`--${key.replace(/\./g, '-')}`] = value;
    return acc;
  }, {} as Record<string, string>),
  
  dark: Object.entries(themeTokens.dark).reduce((acc, [key, value]) => {
    acc[`--${key.replace(/\./g, '-')}`] = value;
    return acc;
  }, {} as Record<string, string>)
};
