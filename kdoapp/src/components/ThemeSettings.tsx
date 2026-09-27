'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Palette, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '@/lib/api';
import { useTheme } from '@/components/ThemeProvider';
import { THEME_NAMES, THEMES, type ThemeName } from '@/lib/theme';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

export default function ThemeSettings() {
  const router = useRouter();
  const { name: activeTheme, isChristmas } = useTheme();
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
    <div
      className="
        rounded-2xl
        shadow-xl
        border
        overflow-hidden
        animate-fadeInUp
        surface-card
        border-[var(--border)]
        mt-6
      "
      style={{ animationDelay: '0.3s' }}
    >
      <div className="p-6 sm:p-8 border-b border-[var(--border)]">
        <div className="flex items-center gap-3">
          <Palette className={`w-6 h-6 ${isChristmas ? 'text-white' : 'text-[var(--primary)]'}`} />
          <h2 className={`text-xl font-bold ${isChristmas ? 'text-white' : 'text-[var(--text-primary)]'}`}>
            Apparence
          </h2>
        </div>
        <p className="mt-1 text-sm text-[var(--text-muted)]">Thème de l&apos;application (visible par tous)</p>
      </div>

      <fieldset className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
        <legend className="sr-only">Thème</legend>
        {THEME_NAMES.map((themeName) => {
          const theme = THEMES[themeName];
          const isSelected = selected === themeName;
          return (
            <label
              key={themeName}
              className={`
                flex flex-col gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors
                ${isSelected ? 'border-[var(--primary)]' : 'border-[var(--border)] hover:bg-[var(--surface-hover)]'}
              `}
            >
              <span className="flex items-center gap-2 font-medium text-[var(--text-primary)]">
                <input
                  type="radio"
                  name="theme"
                  value={themeName}
                  checked={isSelected}
                  onChange={() => {
                    setSelected(themeName);
                    setStatus(null);
                  }}
                  className="accent-[var(--primary)]"
                />
                {theme.titleEmoji ? `${theme.titleEmoji} ` : ''}
                {theme.label}
              </span>
              <span className="flex gap-2" aria-hidden="true">
                {theme.swatches.map((color) => (
                  <span key={color} className="w-8 h-8 rounded-full border border-[var(--border)]" style={{ background: color }} />
                ))}
              </span>
              {themeName === activeTheme && (
                <span className="flex items-center gap-1 text-sm text-[var(--success)]">
                  <CheckCircle2 className="w-4 h-4" />
                  Actif
                </span>
              )}
            </label>
          );
        })}
      </fieldset>

      <div className="px-6 pb-6 sm:px-8 sm:pb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="text-sm" role="status">
          {status === 'success' && (
            <span className="flex items-center gap-1 text-[var(--success)]">
              <CheckCircle2 className="w-4 h-4" /> Thème mis à jour
            </span>
          )}
          {status === 'error' && (
            <span className="flex items-center gap-1 text-[var(--error)]">
              <XCircle className="w-4 h-4" /> Erreur : le thème n&apos;a pas pu être enregistré.
            </span>
          )}
        </div>
        <button
          onClick={handleApply}
          disabled={isSaving || selected === activeTheme}
          className="flex items-center justify-center gap-2 py-2 px-6 rounded-lg text-white font-semibold bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50"
        >
          {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
          Appliquer
        </button>
      </div>
    </div>
  );
}
