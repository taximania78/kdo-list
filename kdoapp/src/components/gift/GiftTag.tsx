import { Gift } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { SnowCap } from '@/components/decor/SnowCap';
import { Bow } from '@/components/gift/Bow';
import { GiftImage } from '@/components/gift/GiftImage';
import { formatPrice } from '@/lib/format';
import type { GiftState, Kdo } from '@/lib/gifts';

type GiftTagProps = {
  kdo: Kdo;
  state: GiftState;
  canRelease: boolean;
  tying?: boolean;
  untying?: boolean;
  onTake: () => void;
  onRelease: () => void;
};

export function GiftTag({
  kdo,
  state,
  canRelease,
  tying = false,
  untying = false,
  onTake,
  onRelease,
}: GiftTagProps) {
  const classes = [
    'gift-tag',
    state !== 'free' && 'is-wrapped',
    state === 'mine' && 'is-mine',
    tying && 'is-tying',
    untying && 'is-untying',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <article className={classes} data-state={state} aria-label={kdo.name}>
      <svg className="gift-string" viewBox="0 0 30 44" aria-hidden>
        <path d="M15 38 C 6 26, 24 16, 15 0" fill="none" stroke="var(--foil)" strokeWidth="2" />
      </svg>
      <SnowCap />
      <div className="gift-paper">
        <span className="gift-hole" aria-hidden />
        <GiftImage
          imageDisplay={kdo.imageDisplay}
          name={kdo.name}
          seed={kdo.id}
          sizes="(min-width: 720px) 300px, 40vw"
          wrapped={state !== 'free'}
          className="gift-img"
        >
          {state !== 'free' && (
            <div className="gift-wrap" aria-hidden>
              <i className="rib-h" />
              <i className="rib-v" />
              <Bow className="gift-bow" />
              <span className="gift-stamp">{state === 'mine' ? 'Pris par toi' : 'Déjà pris'}</span>
            </div>
          )}
        </GiftImage>
        <div className="min-w-0">
          <h3 className="font-display text-[19px] font-bold leading-[1.12] tracking-[-0.02em] break-words md:text-[21px]">
            {kdo.name}
          </h3>
          {(kdo.price != null || kdo.url) && (
            <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm">
              {kdo.price != null && <span className="font-mono">{formatPrice(kdo.price)}</span>}
              {kdo.url && (
                <a
                  href={kdo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="tap-y font-semibold text-primary underline decoration-[1.5px] underline-offset-[3px]"
                >
                  Voir le produit<span aria-hidden> ↗</span>
                </a>
              )}
            </p>
          )}
          {kdo.comment && <p className="mt-1 text-sm text-ink-muted break-words">{kdo.comment}</p>}
        </div>
        {/* Mobile : toute la largeur de l'étiquette, sous l'image et le texte ; md : sous le texte. */}
        <div className="gift-action pt-3.5 md:pt-4">
          <GiftAction kdo={kdo} state={state} canRelease={canRelease} onTake={onTake} onRelease={onRelease} />
        </div>
      </div>
    </article>
  );
}

function GiftAction({ kdo, state, canRelease, onTake, onRelease }: Omit<GiftTagProps, 'tying' | 'untying'>) {
  if (state === 'free') {
    return (
      <Button block onClick={onTake} className="py-2 text-sm">
        <Gift className="size-4" aria-hidden />
        Je prends !
      </Button>
    );
  }
  if (state === 'mine') {
    return (
      <>
        <p className="gift-note mb-1.5 font-hand text-[21px] font-semibold leading-none text-mine">
          chut… c&apos;est toi qui l&apos;offres
        </p>
        <Button variant="ghost" block onClick={onRelease} className="py-2 text-sm">
          Je ne prends plus
        </Button>
      </>
    );
  }
  return (
    <>
      <p className="font-mono text-xs text-ink-muted">
        {kdo.takenBy ? `Pris par ${kdo.takenBy}` : 'Déjà pris'}
      </p>
      {canRelease && (
        <Button variant="ghost" block onClick={onRelease} className="mt-2 py-2 text-sm">
          Libérer la réservation
        </Button>
      )}
    </>
  );
}
