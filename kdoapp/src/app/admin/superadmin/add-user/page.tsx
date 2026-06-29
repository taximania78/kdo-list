'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { UserPlus, User, Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import api from '@/lib/api';
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
  username: z.string().min(3, {
    message: "Le nom d'utilisateur doit contenir au moins 3 caractères.",
  }),
  userPassword: z
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

export default function Password() {
  const router = useRouter();
  const { isAuthenticated, user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        console.log('🚫 [ADD-USER] Not authenticated, redirecting to login');
        router.push('/');
      } else if (user && !user.isMegaAdmin) {
        console.log('🚫 [ADD-USER] Not super admin, redirecting to admin');
        router.push('/admin');
      }
    }
  }, [isAuthenticated, user, isLoading, router]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const password = form.watch('userPassword');

  // Password validation checks
  const passwordChecks = {
    minLength: password?.length >= 8,
    hasUpperCase: /[A-Z]/.test(password || ''),
    hasNumber: /\d/.test(password || ''),
    hasSpecialChar: /[\W_]/.test(password || ''),
  };

  const onSubmit = async (data: FormData) => {
    try {
      const response = await api.post(`${ApiAdress}/api/create-user/`, {
        name: data.username,
        password: data.userPassword,
      });
      if (response.status < 200 || response.status >= 300) {
        throw new Error('La réponse réseau n\'était pas OK');
      }
      router.push('/admin/superadmin');
    } catch (err) {
      console.error('Erreur:', err);
    }
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
              <UserPlus className={`w-16 h-16 ${isChristmas ? 'text-white drop-shadow-lg' : 'text-[var(--primary)]'}`} />
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
              Nouvel utilisateur
            </h2>
            <p className={`mt-2 text-sm ${isChristmas ? 'text-white/80' : 'text-[var(--text-muted)]'}`}>
              Créer un nouveau compte utilisateur
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Username input */}
            <div>
              <label htmlFor="username" className={`block font-medium mb-2 ${isChristmas ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                Nom d&apos;utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className={`h-5 w-5 ${isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]'}`} />
                </div>
                <input
                  {...form.register('username')}
                  id="username"
                  type="text"
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
                  placeholder="Entrer un nom d'utilisateur"
                />
              </div>
              {form.formState.errors.username && (
                <p className="mt-2 text-[var(--error)] text-sm animate-shake bg-[var(--error-bg)] p-2 rounded-lg">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="userPassword" className={`block font-medium mb-2 ${isChristmas ? 'text-white' : 'text-[var(--text-secondary)]'}`}>
                Mot de passe temporaire
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className={`h-5 w-5 ${isChristmas ? 'text-white/60' : 'text-[var(--text-muted)]'}`} />
                </div>
                <input
                  {...form.register('userPassword')}
                  id="userPassword"
                  type="text"
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
                  placeholder="Entrer un mot de passe temporaire"
                />
              </div>
              {form.formState.errors.userPassword && (
                <p className="mt-2 text-[var(--error)] text-sm animate-shake bg-[var(--error-bg)] p-2 rounded-lg">
                  {form.formState.errors.userPassword.message}
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
                    Création...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Ajouter
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
