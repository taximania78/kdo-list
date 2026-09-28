/** Idée telle que renvoyée par /api/kdos/ */
export type Kdo = {
  id: number;
  name: string;
  price: number | null;
  user: string;
  url: string | null;
  comment: string | null;
  imageDisplay: string | null;
  availability: boolean;
  takenBy: string | null;
};

/** Idée telle que renvoyée par /api/kdos-admin/ */
export type AdminIdea = {
  id: number;
  name: string;
  price: number | null;
  user: string;
  url: string | null;
  comment: string | null;
  image: string | null;
  imageDisplay: string | null;
};

export type GiftState = 'free' | 'mine' | 'taken';
export type GiftFilter = 'all' | 'free' | 'mine';

export function giftState(kdo: Kdo, username: string | null): GiftState {
  if (kdo.availability) return 'free';
  return username !== null && kdo.takenBy === username ? 'mine' : 'taken';
}

export function filterGifts(kdos: Kdo[], filter: GiftFilter, username: string | null): Kdo[] {
  if (filter === 'all') return kdos;
  return kdos.filter((kdo) => giftState(kdo, username) === filter);
}

/** Mot affiché en gros quand l'idée n'a pas d'image. */
export function giftWord(name: string): string {
  const words = name
    .split(/\s+/)
    .map((w) => w.replace(/[^\p{L}\p{N}'’-]/gu, ''))
    .filter(Boolean);
  const word = words.find((w) => w.length >= 3) ?? words[0] ?? '?';
  return word.slice(0, 10);
}
