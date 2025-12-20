'use client';

import { FiGift } from 'react-icons/fi';

interface LogoProps {
  size?: number;
  className?: string;
}

export const Logo = ({ size = 50, className = '' }: LogoProps) => {
  const iconSize = size * 0.6;

  return (
    <div
      className={`relative flex items-center justify-center rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-110 ${className}`}
      style={{
        width: size,
        height: size,
        background: 'linear-gradient(135deg, var(--logo-from) 0%, var(--logo-to) 100%)',
      }}
    >
      <FiGift
        size={iconSize}
        className="text-white drop-shadow-sm"
        style={{
          transform: 'rotate(-12deg)',
        }}
        strokeWidth={1.5}
      />
    </div>
  );
};
