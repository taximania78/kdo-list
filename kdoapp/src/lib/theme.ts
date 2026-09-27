export const THEME_NAMES = ['default', 'christmas'] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export type ThemeConfig = {
  label: string;
  bodyClass: string;
  appTitle: string;
  titleEmoji: string;
  showSnowflakes: boolean;
  swatches: string[]; // aperçu dans l'admin (primaire, secondaire, fond)
};

export const DEFAULT_THEME: ThemeName = 'default';

export const THEMES: Record<ThemeName, ThemeConfig> = {
  default: {
    label: 'Anniversaire',
    bodyClass: '',
    appTitle: "Liste d'anniversaire",
    titleEmoji: '',
    showSnowflakes: false,
    swatches: ['#F28482', '#84A59D', '#F7EDE2'],
  },
  christmas: {
    label: 'Noël',
    bodyClass: 'theme-christmas',
    appTitle: 'Liste de Noël',
    titleEmoji: '🎄',
    showSnowflakes: true,
    swatches: ['#B91C1C', '#15803D', '#166534'],
  },
};

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEME_NAMES as readonly string[]).includes(value);
}
