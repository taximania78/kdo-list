export const THEME_NAMES = ['default', 'christmas'] as const;
export type ThemeName = (typeof THEME_NAMES)[number];

export type ThemeConfig = {
  label: string;
  description: string;
  /** Classe posée sur <html> ; globals.css y redéfinit les jetons. */
  themeClass: string;
  appTitle: string;
  showSnowflakes: boolean;
  /** Miniature du sélecteur de thème : copie littérale des jetons de DESIGN.md. */
  preview: { bg: string; paper: string; ribbon: string };
};

export const DEFAULT_THEME: ThemeName = 'default';

export const THEMES: Record<ThemeName, ThemeConfig> = {
  default: {
    label: 'Anniversaire',
    description: 'Papier kraft, ruban vermillon',
    themeClass: '',
    appTitle: "Liste d'anniversaire",
    showSnowflakes: false,
    preview: { bg: '#F2E4C9', paper: '#FFFBF2', ribbon: '#D8432B' },
  },
  christmas: {
    label: 'Noël',
    description: 'Sapin de nuit, 250 flocons',
    themeClass: 'theme-christmas',
    appTitle: 'Liste de Noël',
    showSnowflakes: true,
    preview: { bg: '#10291F', paper: '#F6EEDD', ribbon: '#C21F3A' },
  },
};

export function isThemeName(value: unknown): value is ThemeName {
  return typeof value === 'string' && (THEME_NAMES as readonly string[]).includes(value);
}
