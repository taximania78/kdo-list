'use client';

import { createContext, useContext } from 'react';
import { DEFAULT_THEME, THEMES, type ThemeConfig, type ThemeName } from '@/lib/theme';

const ThemeContext = createContext<ThemeName>(DEFAULT_THEME);

export function ThemeProvider({ theme, children }: { theme: ThemeName; children: React.ReactNode }) {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): { name: ThemeName; config: ThemeConfig; isChristmas: boolean } {
  const name = useContext(ThemeContext);
  return { name, config: THEMES[name], isChristmas: name === 'christmas' };
}
