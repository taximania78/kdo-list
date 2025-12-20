'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Key, Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { use, useState, useEffect } from 'react';
import { Mountains_of_Christmas, Atma } from 'next/font/google';
import { isChristmas } from '@/lib/theme';

const ApiAdress = process.env.NEXT_PUBLIC_API_URL;

const mountains_of_christmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

const knewave = Atma({
  weight: '300',
  subsets: ['latin'],
});

const formSchema = z.object({
  newPassword: z
    .string()
    .min(8, { message: 'Le mot de passe doit contenir au moins 8 caractères.' })
    .regex(/[A-Z]/, {
      message: 'Le mot de passe doit contenir au moins une lettre majuscule.',
    })
    .regex(/\d/, {
      message: 'Le mot de passe doit contenir au moins un chiffre.',
    })
    .regex(/[\W_]/, {
      message: 'Le mot de passe doit contenir au moins un caractère spécial.',
    }),
});

type FormData = z.infer<typeof formSchema>;

export default function Password({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Utilisateur inconnu';
  const { id } = use(params);
  const userId = parseInt(id, 10);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('🚫 [RESET-PASSWORD] Not authenticated, redirecting to login');
        router.push('/');
      } else if (user && !user.isMegaAdmin && user.username !== 'Mathieu') {
        console.log('🚫 [RESET-PASSWORD] Not super admin, redirecting to admin');
        router.push('/admin');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const password = form.watch('newPassword');

  // Password validation checks
  const passwordChecks = {
    minLength: password?.length >= 8,
    hasUpperCase: /[A-Z]/.test(password || ''),
    hasNumber: /\d/.test(password || ''),
    hasSpecialChar: /[\W_]/.test(password || ''),
  };

  const onSubmit = async (data: FormData) => {
    setPendingData(data);
    setShowConfirmDialog(true);
  };

  const handleConfirmSubmit = async () => {
    if (!pendingData) return;

    try {
      const response = await api.patch(
        `${ApiAdress}/api/modify-password-admin/${userId}`,
        { password: pendingData.newPassword }
      );
      if (response.status < 200 || response.status >= 300) {
        throw new Error('La réponse réseau n\'était pas OK');
      }
      router.push('/admin/superadmin');
    } catch (err) {
      console.error('Erreur:', err);
    } finally {
      setShowConfirmDialog(false);
      setPendingData(null);
    }
  };

  const handleCancelConfirm = () => {
    setShowConfirmDialog(false);
    setPendingData(null);
  };

  return (
    <div
      className="
        flex
        items-center
        justify-center
        px-4
        sm:px-6
        lg:px-8
      "
    >
      {/* Main card container with fade-in animation */}
      <div className="w-full max-w-md z-10 animate-fadeInUp">
        {/* Card */}
        <div
          className="
            rounded-3xl
            shadow-xl
            p-8
            border
            surface-card
            border-[var(--border)]
          "
        >
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Key className={`w-16 h-16 ${isChristmas ? 'text-white drop-shadow-lg' : 'text-[var(--primary)]'}`} />
            </div>
            <h2
              className={`
                text-3xl
                font-bold
                ${
                  isChristmas
                    ? `text-white drop-shadow-lg ${mountains_of_christmas.className}`
                    : `text-[var(--text-primary)] ${knewave.className}`
                }
              `}
            >
              Réinitialiser le mot de passe
            </h2>
            <p className={`mt-2 text-sm ${isChristmas ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
              Utilisateur : <span className="font-bold">{name}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Password input */}
            <div>
              <label htmlFor="newPassword" className={`block font-medium mb-2 ${isChristmas ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]'}`} />
                </div>
                <input
                  {...form.register('newPassword')}
                  id="newPassword"
                  type="password"
                  className={`
                    block
                    w-full
                    pl-12
                    pr-4
                    py-3
                    rounded-xl
                    focus:outline-none
                    focus:ring-2
                    transition-all
                    duration-200
                    ${isChristmas
                      ? 'bg-white/20 backdrop-blur-sm border border-white/30 text-white placeholder-white/60 focus:ring-white/50'
                      : 'bg-[var(--input-bg)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:ring-[var(--input-focus)]'
                    }
                  `}
                  placeholder="Entrer le nouveau mot de passe"
                />
              </div>
              {form.formState.errors.newPassword && (
                <p className="mt-2 text-[var(--error)] text-sm animate-shake bg-[var(--error-bg)] p-2 rounded-lg">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Password requirements */}
            {password && (
              <div className={`p-4 rounded-xl border ${isChristmas ? 'backdrop-blur-sm bg-white/10 border-white/20' : 'bg-[var(--input-bg)] border-[var(--border)]'}`}>
                <p className={`font-medium mb-2 text-sm ${isChristmas ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                  Exigences du mot de passe :
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.minLength ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[var(--error)]" />
                    )}
                    <span className={passwordChecks.minLength ? (isChristmas ? 'text-white' : 'text-[var(--text-primary)]') : (isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]')}>
                      Au moins 8 caractères
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.hasUpperCase ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[var(--error)]" />
                    )}
                    <span className={passwordChecks.hasUpperCase ? (isChristmas ? 'text-white' : 'text-[var(--text-primary)]') : (isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]')}>
                      Une lettre majuscule
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.hasNumber ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[var(--error)]" />
                    )}
                    <span className={passwordChecks.hasNumber ? (isChristmas ? 'text-white' : 'text-[var(--text-primary)]') : (isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]')}>
                      Un chiffre
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.hasSpecialChar ? (
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-[var(--error)]" />
                    )}
                    <span className={passwordChecks.hasSpecialChar ? (isChristmas ? 'text-white' : 'text-[var(--text-primary)]') : (isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]')}>
                      Un caractère spécial
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <div className="flex gap-4 pt-2">
              <Link
                href="/admin/superadmin"
                className={`
                  flex-1
                  flex
                  items-center
                  justify-center
                  gap-2
                  py-3
                  px-4
                  rounded-xl
                  font-semibold
                  transition-all
                  duration-200
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  border
                  surface-card hover:bg-[var(--surface-hover)] text-[var(--text-secondary)] border-[var(--border)]
                `}
              >
                <ArrowLeft className="w-5 h-5" />
                Retour
              </Link>
              <button
                type="submit"
                disabled={form.formState.isSubmitting}
                className={`
                  flex-1
                  flex
                  items-center
                  justify-center
                  gap-2
                  py-3
                  px-4
                  rounded-xl
                  text-white
                  font-semibold
                  transition-all
                  duration-200
                  hover:scale-[1.02]
                  active:scale-[0.98]
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  disabled:hover:scale-100
                  ${
                    isChristmas
                      ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 shadow-lg'
                      : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)] shadow-[var(--shadow-primary)]'
                  }
                `}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Key className="w-5 h-5" />
                    Modifier
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          {/* Overlay */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-overlayShow"
            onClick={handleCancelConfirm}
          />

          {/* Dialog content */}
          <div
            className="
              relative
              z-50
              max-w-md w-full
              rounded-2xl
              p-8
              shadow-xl
              animate-fadeInUp
              dialog-surface
            "
          >
            <h3 className="text-xl font-bold mb-4 text-[var(--text-primary)]">
              Confirmer la modification
            </h3>
            <p className="mb-6 text-[var(--text-secondary)]">
              Êtes-vous sûr de vouloir modifier le mot de passe de{' '}
              <span className="font-bold text-[var(--text-primary)]">&quot;{name}&quot;</span> ?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleCancelConfirm}
                disabled={form.formState.isSubmitting}
                className="
                  px-6 py-2
                  rounded-lg
                  transition-all duration-200
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  bg-[var(--surface-hover)] hover:bg-[var(--surface-muted)] text-[var(--text-secondary)]
                "
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmSubmit}
                disabled={form.formState.isSubmitting}
                className={`
                  flex items-center gap-2
                  px-6 py-2
                  rounded-lg
                  text-white
                  transition-all duration-200
                  disabled:opacity-50
                  disabled:cursor-not-allowed
                  ${
                    isChristmas
                      ? 'bg-[var(--secondary)] hover:bg-[var(--secondary-hover)]'
                      : 'bg-[var(--primary)] hover:bg-[var(--primary-hover)]'
                  }
                `}
              >
                {form.formState.isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Modification...
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
