import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { SnowCap } from '@/components/decor/SnowCap';
import type { ApiList } from '@/lib/lists';

export function ListBand({ list }: { list: Pick<ApiList, 'slug' | 'label' | 'is_common'> }) {
  return (
    <Link
      href={`/list/${list.slug}`}
      className={`relative block shadow-paper transition-transform duration-200 hover:-translate-y-0.5 ${list.is_common ? 'is-common' : ''}`}
    >
      <SnowCap />
      <div className="relative grid min-h-[104px] content-center overflow-hidden rounded-lg bg-paper py-4 pl-5 pr-[110px] text-ink md:min-h-[124px] md:pl-7">
        <span className="font-display text-[44px] font-extrabold leading-[0.92] tracking-[-0.035em] break-words md:text-[58px]">
          {list.label}
        </span>
        <span className="mt-1.5 font-mono text-[13px] text-ink-muted">Voir les idées</span>
        <i aria-hidden className="band-ribbon" />
        <ArrowRight aria-hidden className="absolute right-5 top-1/2 size-5 -translate-y-1/2" />
      </div>
    </Link>
  );
}
