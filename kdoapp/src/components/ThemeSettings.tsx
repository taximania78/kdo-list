'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import { THEME_NAMES, THEMES, type ThemeName } from '@/lib/theme';
import { Button } from '@/components/ui/Button';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export default function ThemeSettings() {
  const router = useRouter();
  const { name: activeTheme } = useTheme();
  const [selected, setSelected] = useState<ThemeName>(activeTheme);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<'success' | 'error' | null>(null);

  const handleApply = async () => {
    if (isSaving || selected === activeTheme) return;
    setIsSaving(true);
    setStatus(null);
    try {
      await api.put(`${ApiAdress}/api/settings/theme`, { theme: selected });
      setStatus('success');
      router.refresh();
    } catch (error) {
      console.error('Error updating theme:', error);
      setStatus('error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section aria-labelledby="theme-title" className="grid gap-4">
      <div>
        <h2 id="theme-title" className="font-display text-2xl font-bold tracking-[-0.02em]">
          Apparence
        </h2>
        <p className="text-sm text-on-bg-muted">Le thème s&apos;applique à toute la famille.</p>
      </div>

      <fieldset className="grid gap-3.5 md:grid-cols-2">
        <legend className="sr-only">Thème</legend>
        {THEME_NAMES.map((themeName) => {
          const theme = THEMES[themeName];
          const isSelected = selected === themeName;
          return (
            <label
              key={themeName}
              className={`grid cursor-pointer grid-cols-[96px_1fr] items-center gap-3.5 rounded-lg bg-paper p-3 text-ink ring-inset ${isSelected ? 'ring-[2.5px] ring-primary' : ''}`}
            >
              <span aria-hidden className="relative block h-18 overflow-hidden rounded-md" style={{ background: theme.preview.bg }}>
                <span className="absolute left-3.5 top-4 h-10 w-11 rounded-sm" style={{ background: theme.preview.paper }} />
                <span className="absolute left-8 top-4 h-10 w-[7px]" style={{ background: theme.preview.ribbon }} />
              </span>
              <span className="grid gap-0.5">
                <span className="flex items-center gap-2 font-display text-xl font-bold tracking-[-0.02em]">
                  <input
                    type="radio"
                    name="theme"
                    value={themeName}
                    checked={isSelected}
                    onChange={() => {
                      setSelected(themeName);
                      setStatus(null);
                    }}
                    className="accent-primary"
                  />
                  {theme.label}
                </span>
                <span className="text-[13px] text-ink-muted">{theme.description}</span>
                {themeName === activeTheme && (
                  <span className="font-mono text-[11px] uppercase tracking-[0.06em] text-mine">Actif</span>
                )}
              </span>
            </label>
          );
        })}
      </fieldset>

      <div role="status" className="text-sm font-semibold">
        {status === 'success' && <span className="w-fit rounded-md bg-paper px-3 py-2 text-mine">Thème mis à jour</span>}
        {status === 'error' && (
          <span className="w-fit rounded-md bg-paper px-3 py-2 text-error">
            Erreur : le thème n&apos;a pas pu être enregistré.
          </span>
        )}
      </div>

      <Button onClick={handleApply} pending={isSaving} disabled={selected === activeTheme} block className="md:w-fit">
        Appliquer à toute la famille
      </Button>
    </section>
  );
}
