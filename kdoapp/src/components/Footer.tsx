'use client';

import { Mountains_of_Christmas } from 'next/font/google';
import { Heart, Gift, Sparkles } from 'lucide-react';
import { isChristmas } from '@/lib/theme';

const mountainsOfChristmas = Mountains_of_Christmas({
  weight: '700',
  subsets: ['latin'],
});

export const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto w-full bg-[var(--footer-bg)] border-t border-[var(--border-light)] shadow-[var(--shadow-sm)] transition-all duration-300 relative">
      {/* Wavy snow border for Christmas theme */}
      {isChristmas && <ChristmasSnowDecoration />}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Christmas special message */}
        {isChristmas && (
          <div className={`text-center mb-6 ${mountainsOfChristmas.className}`}>
            <div className="flex items-center justify-center gap-3 mb-2">
              <Gift className="w-8 h-8 text-[var(--danger)] animate-bounce" />
              <h3 className="text-4xl font-bold text-[var(--danger)] drop-shadow-lg">
                Joyeux Noël !
              </h3>
              <Gift
                className="w-8 h-8 text-[var(--success)] animate-bounce"
                style={{ animationDelay: '0.2s' }}
              />
            </div>
          </div>
        )}

        {/* Main footer content */}
        <div className="text-center space-y-3">
          {/* Made with love message */}
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-[var(--footer-text)]">Créé avec</span>
            <Heart className="w-4 h-4 fill-current animate-pulse text-[var(--primary)]" />
          </div>

          {/* Copyright */}
          <div className="text-xs text-[var(--footer-text-muted)]">
            © {currentYear} - Liste de cadeaux
          </div>

          {/* Decorative icons */}
          <div className="flex items-center justify-center gap-4 pt-2">
            {isChristmas ? (
              <>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0s' }}>🎄</span>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>🎁</span>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0.2s' }}>⭐</span>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0.3s' }}>🎅</span>
                <span className="text-2xl animate-bounce" style={{ animationDelay: '0.4s' }}>❄️</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 text-[var(--primary)] animate-pulse" style={{ animationDelay: '0s' }} />
                <Gift className="w-5 h-5 text-[var(--primary)] animate-pulse" style={{ animationDelay: '0.2s' }} />
                <Heart className="w-5 h-5 text-[var(--primary-hover)] animate-pulse fill-current" style={{ animationDelay: '0.4s' }} />
              </>
            )}
          </div>
        </div>
      </div>
    </footer>
  );
};

function ChristmasSnowDecoration() {
  return (
    <div className="absolute top-0 left-0 w-full overflow-hidden leading-none -translate-y-[99%]">
      <svg
        className="relative block w-full h-20 md:h-24"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 1200 120"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="snowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#f0f9ff', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#ffffff', stopOpacity: 1 }} />
          </linearGradient>
          <filter id="snowShadow">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#e0e7ff" floodOpacity="0.4" />
          </filter>
        </defs>
        <path
          d="M0,0 C120,70 240,20 360,50 C480,80 600,30 720,60 C840,90 960,40 1080,65 C1140,80 1200,75 1200,75 L1200,120 L0,120 Z"
          fill="url(#snowGradient)"
          filter="url(#snowShadow)"
        />
        <path
          d="M0,10 C100,60 200,15 300,45 C400,75 500,25 600,50 C700,80 800,35 900,55 C1000,75 1100,40 1200,60 L1200,120 L0,120 Z"
          fill="#ffffff"
          opacity="0.9"
        />
      </svg>

      {/* Christmas decorations on the snow pile */}
      <div className="absolute inset-0 w-full h-full pointer-events-none">
        {/* Snowmen */}
        <span className="absolute text-2xl md:text-3xl" style={{ left: '15%', top: '28%' }}>⛄</span>
        <span className="absolute text-3xl md:text-4xl" style={{ left: '38%', top: '22%' }}>⛄</span>
        <span className="absolute text-2xl md:text-3xl" style={{ left: '62%', top: '30%' }}>⛄</span>
        <span className="absolute text-2xl md:text-3xl hidden sm:block" style={{ left: '88%', top: '25%' }}>⛄</span>

        {/* Christmas trees */}
        <span className="absolute text-3xl md:text-4xl" style={{ left: '5%', top: '32%' }}>🎄</span>
        <span className="absolute text-2xl md:text-3xl" style={{ left: '10%', top: '20%' }}>🎄</span>
        <span className="absolute text-3xl md:text-4xl" style={{ left: '22%', top: '25%' }}>🎄</span>
        <span className="absolute text-2xl md:text-3xl" style={{ left: '30%', top: '35%' }}>🎄</span>
        <span className="absolute text-3xl md:text-4xl" style={{ left: '45%', top: '18%' }}>🎄</span>
        <span className="absolute text-2xl md:text-3xl" style={{ left: '52%', top: '30%' }}>🎄</span>
        <span className="absolute text-3xl md:text-4xl" style={{ left: '58%', top: '20%' }}>🎄</span>
        <span className="absolute text-2xl md:text-3xl" style={{ left: '68%', top: '28%' }}>🎄</span>
        <span className="absolute text-3xl md:text-4xl" style={{ left: '75%', top: '22%' }}>🎄</span>
        <span className="absolute text-2xl md:text-3xl hidden sm:block" style={{ left: '82%', top: '33%' }}>🎄</span>
        <span className="absolute text-3xl md:text-4xl hidden sm:block" style={{ left: '90%', top: '18%' }}>🎄</span>
        <span className="absolute text-2xl md:text-3xl hidden md:block" style={{ left: '95%', top: '28%' }}>🎄</span>
        <span className="absolute text-xl md:text-2xl hidden md:block" style={{ left: '3%', top: '22%' }}>🎄</span>
        <span className="absolute text-xl md:text-2xl hidden lg:block" style={{ left: '48%', top: '35%' }}>🎄</span>
      </div>
    </div>
  );
}
