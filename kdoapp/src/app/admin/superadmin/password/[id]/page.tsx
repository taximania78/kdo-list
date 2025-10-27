'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Key, Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
import { use, useState } from 'react';
import Snowflakes from '@/components/Snowflakes';
import { Mountains_of_Christmas, Atma } from 'next/font/google';

const theme = process.env.NEXT_PUBLIC_THEME || 'default';
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
  const searchParams = useSearchParams();
  const name = searchParams.get('name') || 'Utilisateur inconnu';
  const { id } = use(params);
  const userId = parseInt(id, 10);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingData, setPendingData] = useState<FormData | null>(null);

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
        `${ApiAdress}/api/modify-password-admin/${userId}/`,
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
      className={`
        min-h-screen
        flex
        items-center
        justify-center
        px-4
        sm:px-6
        lg:px-8
        relative
        overflow-hidden
        ${
          theme === 'christmas'
            ? 'bg-gradient-to-br from-red-700 via-green-800 to-red-900'
            : 'bg-gradient-to-br from-sky-400 via-indigo-500 to-violet-600'
        }
        animate-gradient
      `}
    >
      {/* Snowflakes for Christmas theme */}
      {theme === 'christmas' && <Snowflakes />}

      {/* Main card container with fade-in animation */}
      <div className="w-full max-w-md z-10 animate-fadeInUp">
        {/* Glassmorphism card */}
        <div
          className={`
            backdrop-blur-lg
            bg-white/10
            rounded-3xl
            shadow-2xl
            p-8
            border
            border-white/20
            ${theme === 'christmas' ? 'animate-glow' : ''}
          `}
        >
          {/* Header with icon */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Key className="w-16 h-16 text-white drop-shadow-lg" />
            </div>
            <h2
              className={`
                text-3xl
                font-bold
                text-white
                drop-shadow-lg
                ${
                  theme === 'christmas'
                    ? mountains_of_christmas.className
                    : knewave.className
                }
              `}
            >
              Réinitialiser le mot de passe
            </h2>
            <p className="mt-2 text-white/80 text-sm">
              Utilisateur : <span className="font-bold">{name}</span>
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Password input */}
            <div>
              <label htmlFor="newPassword" className="block text-white font-medium mb-2">
                Nouveau mot de passe
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/60" />
                </div>
                <input
                  {...form.register('newPassword')}
                  id="newPassword"
                  type="password"
                  className="
                    block
                    w-full
                    pl-12
                    pr-4
                    py-3
                    bg-white/20
                    backdrop-blur-sm
                    border
                    border-white/30
                    rounded-xl
                    text-white
                    placeholder-white/60
                    focus:outline-none
                    focus:ring-2
                    focus:ring-white/50
                    transition-all
                    duration-200
                  "
                  placeholder="Entrer le nouveau mot de passe"
                />
              </div>
              {form.formState.errors.newPassword && (
                <p className="mt-2 text-red-300 text-sm animate-shake backdrop-blur-sm bg-red-500/20 p-2 rounded-lg">
                  {form.formState.errors.newPassword.message}
                </p>
              )}
            </div>

            {/* Password requirements */}
            {password && (
              <div className="backdrop-blur-sm bg-white/10 p-4 rounded-xl border border-white/20">
                <p className="text-white font-medium mb-2 text-sm">
                  Exigences du mot de passe :
                </p>
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.minLength ? (
                      <CheckCircle className={`w-4 h-4 ${theme === 'christmas' ? 'text-green-300' : 'text-green-300'}`} />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-300" />
                    )}
                    <span className={passwordChecks.minLength ? 'text-white' : 'text-white/60'}>
                      Au moins 8 caractères
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.hasUpperCase ? (
                      <CheckCircle className={`w-4 h-4 ${theme === 'christmas' ? 'text-green-300' : 'text-green-300'}`} />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-300" />
                    )}
                    <span className={passwordChecks.hasUpperCase ? 'text-white' : 'text-white/60'}>
                      Une lettre majuscule
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.hasNumber ? (
                      <CheckCircle className={`w-4 h-4 ${theme === 'christmas' ? 'text-green-300' : 'text-green-300'}`} />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-300" />
                    )}
                    <span className={passwordChecks.hasNumber ? 'text-white' : 'text-white/60'}>
                      Un chiffre
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {passwordChecks.hasSpecialChar ? (
                      <CheckCircle className={`w-4 h-4 ${theme === 'christmas' ? 'text-green-300' : 'text-green-300'}`} />
                    ) : (
                      <XCircle className="w-4 h-4 text-red-300" />
                    )}
                    <span className={passwordChecks.hasSpecialChar ? 'text-white' : 'text-white/60'}>
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
                className="
                  flex-1
                  flex
                  items-center
                  justify-center
                  gap-2
                  py-3
                  px-4
                  rounded-xl
                  bg-white/20
                  hover:bg-white/30
                  text-white
                  font-semibold
                  transition-all
                  duration-200
                  backdrop-blur-sm
                  hover:scale-[1.02]
                  active:scale-[0.98]
                "
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
                    theme === 'christmas'
                      ? 'bg-gradient-to-r from-red-600 to-green-600 hover:from-red-700 hover:to-green-700 shadow-lg shadow-red-500/50'
                      : 'bg-gradient-to-r from-sky-500 to-indigo-600 hover:from-sky-600 hover:to-indigo-700 shadow-lg shadow-sky-500/50'
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
            className="fixed inset-0 bg-black/90 animate-overlayShow"
            onClick={handleCancelConfirm}
          />

          {/* Dialog content */}
          <div
            className={`
              relative
              max-w-md w-full
              backdrop-blur-lg
              ${
                theme === 'christmas'
                  ? 'bg-red-900/90'
                  : 'bg-indigo-900/90'
              }
              rounded-2xl
              p-8
              border border-white/20
              shadow-2xl
              animate-fadeInUp
            `}
          >
            <h3 className="text-xl font-bold text-white mb-4">
              Confirmer la modification
            </h3>
            <p className="text-white/80 mb-6">
              Êtes-vous sûr de vouloir modifier le mot de passe de{' '}
              <span className="font-bold text-white">&quot;{name}&quot;</span> ?
            </p>
            <div className="flex gap-4 justify-end">
              <button
                onClick={handleCancelConfirm}
                disabled={form.formState.isSubmitting}
                className="
                  px-6 py-2
                  rounded-lg
                  bg-white/20
                  hover:bg-white/30
                  text-white
                  transition-all duration-200
                  backdrop-blur-sm
                  disabled:opacity-50
                  disabled:cursor-not-allowed
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
                    theme === 'christmas'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-sky-600 hover:bg-sky-700'
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
