'use client';

import FormModifyPwd from '@/components/FormModifyPwd';
import { Lock } from 'lucide-react';
import Snowflakes from '@/components/Snowflakes';

const theme = process.env.NEXT_PUBLIC_THEME || 'default';

export default function ChangePassword() {
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
        py-8
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

      <div className="w-full max-w-md z-10">
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
              <Lock className="w-16 h-16 text-white drop-shadow-lg" />
            </div>
            <h1 className="text-3xl font-bold text-white drop-shadow-lg">
              Modifier mon mot de passe
            </h1>
            <p className="mt-2 text-white/80 text-sm">
              Saisissez votre nouveau mot de passe
            </p>
          </div>

          {/* Form component */}
          <FormModifyPwd />
        </div>
      </div>
    </div>
  );
}
