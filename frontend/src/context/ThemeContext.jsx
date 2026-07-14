import { createContext, useContext, useEffect, useState } from 'react';

export const THEMES = [
  { id: 'light', label: 'Light', swatch: '#4f46e5' },
  { id: 'dark', label: 'Dark', swatch: '#818cf8' },
  { id: 'ocean', label: 'Ocean', swatch: '#0891b2' },
  { id: 'sunset', label: 'Sunset', swatch: '#ea580c' },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
