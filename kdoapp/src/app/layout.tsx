import type { Metadata } from 'next';
import { AppHeader } from '@/components/AppHeader';
import { TabBar } from '@/components/TabBar';
import Snowfall from '@/components/decor/Snowfall';
import UnwrapIntro from '@/components/decor/UnwrapIntro';
import { ThemeProvider } from '@/components/ThemeProvider';
import { fontVariables } from '@/lib/fonts';
import { THEMES } from '@/lib/theme';
import { getTheme } from '@/lib/theme.server';
import './globals.css';

// Le thème est lu en base à chaque requête : aucune page ne doit être figée au build.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const theme = await getTheme();
  return {
    title: THEMES[theme].appTitle,
    description: 'Les listes de cadeaux de la famille',
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const theme = await getTheme();
  const themeConfig = THEMES[theme];

  // Couches : grain (body::before, z-0) → neige arrière (z-0) → contenu (z-10)
  // → neige avant (z-30) → en-tête et onglets (z-40) → panneaux (z-50) → ouverture (z-100).
  return (
    <html lang="fr-FR" className={`${fontVariables} ${themeConfig.themeClass}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <ThemeProvider theme={theme}>
          {themeConfig.showSnowflakes && <Snowfall />}
          <UnwrapIntro />
          <AppHeader />
          <main className="relative z-10 flex-1">{children}</main>
          <TabBar />
        </ThemeProvider>
      </body>
    </html>
  );
}
