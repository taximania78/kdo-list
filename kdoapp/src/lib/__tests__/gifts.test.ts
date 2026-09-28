import { formatPrice } from '@/lib/format';
import { filterGifts, giftState, giftWord, type Kdo } from '@/lib/gifts';

const kdo = (over: Partial<Kdo>): Kdo => ({
  id: 1,
  name: 'Vélo',
  price: null,
  user: 'Paul',
  url: null,
  comment: null,
  imageDisplay: 'unknown.jpg',
  availability: true,
  takenBy: null,
  ...over,
});

describe('formatPrice', () => {
  it('formats euros the French way', () => {
    expect(formatPrice(120)).toMatch(/^120,00\s€$/);
    expect(formatPrice(24.9)).toMatch(/^24,90\s€$/);
  });
});

describe('giftState', () => {
  it('tells free, mine and taken apart', () => {
    expect(giftState(kdo({}), 'marie')).toBe('free');
    expect(giftState(kdo({ availability: false, takenBy: 'marie' }), 'marie')).toBe('mine');
    expect(giftState(kdo({ availability: false, takenBy: 'paul' }), 'marie')).toBe('taken');
    expect(giftState(kdo({ availability: false, takenBy: 'marie' }), null)).toBe('taken');
  });
});

describe('filterGifts', () => {
  const list = [
    kdo({ id: 1 }),
    kdo({ id: 2, availability: false, takenBy: 'marie' }),
    kdo({ id: 3, availability: false, takenBy: 'paul' }),
  ];

  it('keeps everything, the free ones, or mine', () => {
    expect(filterGifts(list, 'all', 'marie').map((k) => k.id)).toEqual([1, 2, 3]);
    expect(filterGifts(list, 'free', 'marie').map((k) => k.id)).toEqual([1]);
    expect(filterGifts(list, 'mine', 'marie').map((k) => k.id)).toEqual([2]);
  });
});

describe('giftWord', () => {
  it('picks the first meaningful word, trimmed to 10 letters', () => {
    expect(giftWord('Casque audio sans fil')).toBe('Casque');
    expect(giftWord('Le Petit Prince, édition illustrée')).toBe('Petit');
    expect(giftWord('Un')).toBe('Un');
    expect(giftWord('Anticonstitutionnellement')).toBe('Anticonsti');
    expect(giftWord('   ')).toBe('?');
  });
});
