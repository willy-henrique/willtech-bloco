import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { ThemePreference } from '../types';
import { readJSON, writeJSON } from '../lib/storage';

interface ThemeContextValue {
  preference: ThemePreference;
  resolved: 'light' | 'dark';
  setPreference: (value: ThemePreference) => void;
  cycle: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);
const THEME_KEY = 'willtech.v2:theme';

function resolveTheme(preference: ThemePreference): 'light' | 'dark' {
  if (preference === 'system') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  return preference;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readJSON<ThemePreference>(THEME_KEY, 'system'),
  );
  const [resolved, setResolved] = useState<'light' | 'dark'>(() =>
    typeof window === 'undefined' ? 'dark' : resolveTheme(preference),
  );

  useEffect(() => {
    const apply = () => {
      const next = resolveTheme(preference);
      setResolved(next);
      document.documentElement.classList.toggle('dark', next === 'dark');
      document.documentElement.style.colorScheme = next;
      writeJSON(THEME_KEY, preference);
    };
    apply();

    if (preference !== 'system') return;
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => apply();
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [preference]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      preference,
      resolved,
      setPreference: setPreferenceState,
      cycle: () =>
        setPreferenceState((prev) =>
          prev === 'light' ? 'dark' : prev === 'dark' ? 'system' : 'light',
        ),
    }),
    [preference, resolved],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
