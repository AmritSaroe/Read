import { useState, useEffect, useMemo } from 'react';

const STORAGE_KEY = 'theme_mode';

function getSystemTheme() {
  if (typeof window === 'undefined') return 'light';
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/**
 * Two-variable theme system — spec §4.1–4.4
 *
 * theme_mode:    "auto" | "light" | "dark" | "sepia"  — user-controlled, persisted
 * resolved_theme: "light" | "dark" | "sepia"           — computed, drives colors
 */
export function useTheme() {
  const [themeMode, setThemeModeState] = useState(() => {
    return localStorage.getItem(STORAGE_KEY) || 'auto';
  });

  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  // Listen for OS theme changes (relevant only when mode == 'auto')
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => setSystemTheme(e.matches ? 'dark' : 'light');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  // resolved_theme: if auto → use OS; otherwise use explicit mode
  const resolvedTheme = useMemo(() => {
    if (themeMode === 'auto') return systemTheme;
    return themeMode; // 'light' | 'dark' | 'sepia'
  }, [themeMode, systemTheme]);

  // Apply to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', resolvedTheme);
  }, [resolvedTheme]);

  // Persist mode on change
  const setThemeMode = (mode) => {
    localStorage.setItem(STORAGE_KEY, mode);
    setThemeModeState(mode);
  };

  // Subtext line — spec §4.3
  const themeSubtext = themeMode === 'auto'
    ? `Matching system · ${resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1)}`
    : resolvedTheme.charAt(0).toUpperCase() + resolvedTheme.slice(1);

  return { themeMode, resolvedTheme, setThemeMode, themeSubtext };
}
