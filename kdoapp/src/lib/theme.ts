export const THEME_NAME = process.env.NEXT_PUBLIC_THEME || 'default';
export const isChristmas = THEME_NAME === 'christmas';

export const themeConfig = {
  bodyClass: isChristmas ? 'theme-christmas' : '',
  appTitle: isChristmas ? 'Liste de Noël' : "Liste d'anniversaire",
  titleEmoji: isChristmas ? '🎄' : '',
  showSnowflakes: isChristmas,
} as const;

export type ThemeName = 'default' | 'christmas';
