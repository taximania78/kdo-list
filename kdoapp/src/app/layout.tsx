import type { Metadata } from 'next';
import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import Snowflakes from '@/components/Snowflakes';
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

  return (
    <html lang="fr-FR" className={`${fontVariables} ${themeConfig.themeClass}`}>
      <body className="flex min-h-screen flex-col antialiased">
        <ThemeProvider theme={theme}>
          <Nav />
          <div className="relative z-10 flex flex-1 flex-col overflow-hidden">
            {themeConfig.showSnowflakes && <Snowflakes />}
            <main className="flex-1">{children}</main>
            {themeConfig.showSnowflakes && <div className="h-28" />}
          </div>
          <Footer />
        </ThemeProvider>
      </body>
    </html>
  );
}
