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
      } else if (user && !user.isMegaAdmin && user.username !== 'Mathieu') {
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
              <UserPlus className="w-16 h-16 text-white drop-shadow-lg" />
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
              Nouvel utilisateur
            </h2>
            <p className="mt-2 text-white/80 text-sm">
              Créer un nouveau compte utilisateur
            </p>
          </div>

          {/* Form */}
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Username input */}
            <div>
              <label htmlFor="username" className="block text-white font-medium mb-2">
                Nom d&apos;utilisateur
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-white/60" />
                </div>
                <input
                  {...form.register('username')}
                  id="username"
                  type="text"
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
                  placeholder="Entrer un nom d'utilisateur"
                />
              </div>
              {form.formState.errors.username && (
                <p className="mt-2 text-red-300 text-sm animate-shake backdrop-blur-sm bg-red-500/20 p-2 rounded-lg">
                  {form.formState.errors.username.message}
                </p>
              )}
            </div>

            {/* Password input */}
            <div>
              <label htmlFor="userPassword" className="block text-white font-medium mb-2">
                Mot de passe temporaire
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-white/60" />
                </div>
                <input
                  {...form.register('userPassword')}
                  id="userPassword"
                  type="text"
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
                  placeholder="Entrer un mot de passe temporaire"
                />
              </div>
              {form.formState.errors.userPassword && (
                <p className="mt-2 text-red-300 text-sm animate-shake backdrop-blur-sm bg-red-500/20 p-2 rounded-lg">
                  {form.formState.errors.userPassword.message}
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
