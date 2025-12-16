'use client';

import { useEffect, useState } from 'react';

interface Snowflake {
  id: number;
  left: number;
  animationDuration: number;
  opacity: number;
  size: number;
}

export default function Snowflakes() {
  const [snowflakes, setSnowflakes] = useState<Snowflake[]>([]);

  useEffect(() => {
    // Generate 50 snowflakes with random properties
    const flakes: Snowflake[] = Array.from({ length: 250 }, (_, i) => ({
      id: i,
      left: Math.random() * 100, // Random horizontal position (0-100%)
      animationDuration: 3 + Math.random() * 7, // Random fall duration (3-10s)
      opacity: 0.9 + Math.random() * 0.1, // Random opacity (0.7-1)
      size: 2 + Math.random() * 4, // Random size (2-6px)
    }));

    setSnowflakes(flakes);
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {snowflakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute top-0 text-white animate-snowfall"
          style={{
            left: `${flake.left}%`,
            animationDuration: `${flake.animationDuration}s`,
            animationDelay: `${Math.random() * 5}s`,
            opacity: flake.opacity,
            fontSize: `${flake.size}px`,
          }}
        >
          ❄
        </div>
      ))}
    </div>
  );
}
