'use client';

import { Mountains_of_Christmas } from 'next/font/google';
import { Heart, Gift, Sparkles } from 'lucide-react';

const mountains_of_christmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

const theme = process.env.NEXT_PUBLIC_THEME || 'default';

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      className={`
        mt-auto
        w-full
        backdrop-blur-md
        bg-white/50
        border-t
        ${
          theme === 'christmas'
            ? 'border-red-200/50 shadow-lg shadow-red-100/20'
            : 'border-sky-200/50 shadow-lg shadow-sky-100/20'
        }
        transition-all
        duration-300
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Christmas special message */}
        {theme === 'christmas' && (
          <div
            className={`text-center mb-6 ${mountains_of_christmas.className}`}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Gift className="w-8 h-8 text-red-600 animate-bounce" />
              <h3 className="text-4xl font-bold text-red-600 drop-shadow-lg">
                Joyeux Noël !
              </h3>
              <Gift
                className="w-8 h-8 text-green-600 animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
          </div>
        )}

        {/* Main footer content */}
        <div className="text-center space-y-3">
          {/* Made with love message */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <span
              className={
                theme === 'christmas' ? 'text-red-700' : 'text-sky-700'
              }
            >
              Créé avec
            </span>
            <Heart
              className={`
                w-4
                h-4
                fill-current
                animate-pulse
                ${theme === 'christmas' ? 'text-red-500' : 'text-sky-500'}
              `}
            />
          </div>

          {/* Copyright */}
          <div
            className={`
              text-xs
              ${theme === 'christmas' ? 'text-red-600/70' : 'text-sky-600/70'}
            `}
          >
            © {currentYear} - Liste de cadeaux
          </div>

          {/* Decorative icons */}
          <div className="flex items-center justify-center gap-4 pt-2">
            {theme === 'christmas' ? (
              <>
                <span
                  className="text-2xl animate-bounce"
                  style={{ animationDelay: '0s' }}
                >
                  🎄
                </span>
                <span
                  className="text-2xl animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                >
                  🎁
                </span>
                <span
                  className="text-2xl animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                >
                  ⭐
                </span>
                <span
                  className="text-2xl animate-bounce"
                  style={{ animationDelay: '0.3s' }}
                >
                  🎅
                </span>
                <span
                  className="text-2xl animate-bounce"
                  style={{ animationDelay: '0.4s' }}
                >
                  ❄️
                </span>
              </>
            ) : (
              <>
                <Sparkles
                  className="w-5 h-5 text-sky-500 animate-pulse"
                  style={{ animationDelay: '0s' }}
                />
                <Gift
                  className="w-5 h-5 text-indigo-500 animate-pulse"
                  style={{ animationDelay: '0.2s' }}
                />
                <Heart
                  className="w-5 h-5 text-violet-500 animate-pulse fill-current"
                  style={{ animationDelay: '0.4s' }}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};
