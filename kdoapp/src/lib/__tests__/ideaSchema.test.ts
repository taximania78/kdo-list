import { ideaSchema } from '@/lib/ideaSchema';

describe('ideaSchema', () => {
  it('asks to select a list with the original wording', () => {
    const result = ideaSchema.safeParse({ name: 'Vélo', list_slug: '' });
    expect(result.success).toBe(false);
    expect(result.error?.issues.find((i) => i.path[0] === 'list_slug')?.message).toBe('Sélectionnez une liste');
  });
});
