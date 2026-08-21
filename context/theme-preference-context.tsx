import React, { createContext, useContext, useEffect, useState } from 'react';

import { colorScheme as nativeWindColorScheme } from 'nativewind';

import { getPreference, setPreference } from '@/lib/preferences-store';

export type ThemePreference = 'light' | 'dark' | 'system';

const THEME_PREFERENCE_KEY = 'theme_preference';

type ThemePreferenceContextValue = {
  preference: ThemePreference;
  setThemePreference: (preference: ThemePreference) => void;
};

const ThemePreferenceContext = createContext<ThemePreferenceContextValue | undefined>(undefined);

export function ThemePreferenceProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>('system');

  useEffect(() => {
    getPreference(THEME_PREFERENCE_KEY).then((stored) => {
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setPreferenceState(stored);
        nativeWindColorScheme.set(stored);
      }
    });
  }, []);

  function setThemePreference(next: ThemePreference) {
    setPreferenceState(next);
    nativeWindColorScheme.set(next);
    setPreference(THEME_PREFERENCE_KEY, next);
  }

  return (
    <ThemePreferenceContext.Provider value={{ preference, setThemePreference }}>
      {children}
    </ThemePreferenceContext.Provider>
  );
}

export function useThemePreference(): ThemePreferenceContextValue {
  const context = useContext(ThemePreferenceContext);
  if (context === undefined) {
    throw new Error('useThemePreference must be used within a ThemePreferenceProvider');
  }
  return context;
}
