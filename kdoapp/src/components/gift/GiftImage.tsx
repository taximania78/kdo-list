'use client';

import Image from 'next/image';
import { useState, type ReactNode } from 'react';
import { giftWord } from '@/lib/gifts';

const NO_IMAGE = 'unknown.jpg';
const TINTS = ['tint-1', 'tint-2', 'tint-3'] as const;

type GiftImageProps = {
  imageDisplay: string | null | undefined;
  name: string;
  /** Choisit la teinte du fond quand il n'y a pas d'image (l'id de l'idée : stable). */
  seed: number;
  sizes: string;
  compact?: boolean;
  /** Cadeau pris (par moi ou par quelqu'un d'autre) : la photo (ou le fond teinté) passe en noir et blanc ; le ruban, lui, reste en couleur par-dessus. */
  wrapped?: boolean;
  className?: string;
  children?: ReactNode;
};

export function GiftImage({ imageDisplay, name, seed, sizes, compact = false, wrapped = false, className = '', children }: GiftImageProps) {
  // On retient l'image qui a échoué : une nouvelle image réessaie automatiquement.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const showPhoto = !!imageDisplay && imageDisplay !== NO_IMAGE && failedSrc !== imageDisplay;

  return (
    <div className={`relative overflow-hidden rounded-[5px] ${compact ? 'is-compact' : ''} ${className}`}>
      {/* Fond teinté + photo/mot dans un conteneur séparé du ruban (children, ci-dessous) :
          le noir et blanc d'un cadeau pris ne doit filtrer que la photo/le fond, jamais le
          ruban qui reste par-dessus, en couleur. */}
      <div
        className={`absolute inset-0 ${TINTS[Math.abs(seed) % TINTS.length]} ${wrapped ? 'is-wrapped' : ''}`}
      >
        {showPhoto ? (
          <Image
            src={`/api/kdos/${imageDisplay}`}
            alt={name}
            fill
            sizes={sizes}
            className="object-contain"
            onError={() => setFailedSrc(imageDisplay)}
          />
        ) : (
          <span aria-hidden className="gift-word absolute inset-0 grid place-items-center">
            {giftWord(name)}
          </span>
        )}
      </div>
      {children}
    </div>
  );
}
