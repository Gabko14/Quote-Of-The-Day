import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { getSetting, setSetting } from '../db/settings';

// Color palette
const colors = {
  light: {
    background: '#f5f5f5',
    surface: '#ffffff',
    text: '#333333',
    textSecondary: '#666666',
    textMuted: '#999999',
    border: '#dddddd',
    borderLight: '#eeeeee',
    primary: '#007AFF',
    danger: '#ff3b30',
    categoryBadge: '#e8f4fd',
    categoryText: '#007AFF',
  },
  dark: {
    background: '#121212',
    surface: '#1e1e1e',
    text: '#e0e0e0',
    textSecondary: '#b0b0b0',
    textMuted: '#808080',
    border: '#333333',
    borderLight: '#2a2a2a',
    primary: '#0a84ff',
    danger: '#ff453a',
    categoryBadge: '#1a2a3a',
    categoryText: '#0a84ff',
  },
};

type ThemeColors = typeof colors.light;

interface ThemeContextType {
  isDark: boolean;
  colors: ThemeColors;
  toggleTheme: () => void;
  setDarkMode: (dark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState(true); // Default to dark

  useEffect(() => {
    // Load saved preference
    const loadTheme = async () => {
      const value = await getSetting('darkMode');
      // Default to true (dark mode) if not set
      setIsDark(value !== 'false');
    };
    loadTheme();
  }, []);

  const setDarkMode = useCallback(async (dark: boolean) => {
    setIsDark(dark);
    await setSetting('darkMode', dark.toString());
  }, []);

  const toggleTheme = useCallback(() => {
    setDarkMode(!isDark);
  }, [isDark, setDarkMode]);

  const value: ThemeContextType = {
    isDark,
    colors: isDark ? colors.dark : colors.light,
    toggleTheme,
    setDarkMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
