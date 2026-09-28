import { toListOptions } from '@/lib/lists';

describe('toListOptions', () => {
  it('maps API lists to form options', () => {
    expect(
      toListOptions([
        { slug: 'lea', label: 'Léa', owner_id: 2, owner_name: 'Léa', is_common: false, enabled: true },
        { slug: 'commune', label: 'Liste commune', owner_id: null, owner_name: null, is_common: true, enabled: true },
      ])
    ).toEqual([
      { value: 'lea', label: 'Léa', user: 'Léa' },
      { value: 'commune', label: 'Liste commune', user: null },
    ]);
  });
});
