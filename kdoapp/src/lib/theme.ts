export const THEME_NAMES = ['default', 'christmas'] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export type ThemeConfig = {
  label: string;
  bodyClass: string;
  appTitle: string;
  titleEmoji: string;
  showSnowflakes: boolean;
};

export const DEFAULT_THEME: ThemeName = 'default';

export const THEMES: Record<ThemeName, ThemeConfig> = {
  default: {
    label: 'Anniversaire',
    bodyClass: '',
    appTitle: "Liste d'anniversaire",
    titleEmoji: '',
    showSnowflakes: false,
  },
  christmas: {
    label: 'Noël',
    bodyClass: 'theme-christmas',
    appTitle: 'Liste de Noël',
    titleEmoji: '🎄',
    showSnowflakes: true,
  },
};

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEME_NAMES as readonly string[]).includes(value);
}
