import { optionalPrice, optionalUrl } from '@/lib/optionalFields';

describe('optionalUrl', () => {
  it('accepts a valid URL', () => {
    expect(optionalUrl.safeParse('https://example.com').success).toBe(true);
  });

  it('treats an empty string as null (the API refuses an empty URL)', () => {
    const result = optionalUrl.safeParse('');
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBeNull();
  });

  it('rejects an invalid URL with a French message', () => {
    const result = optionalUrl.safeParse('pas une url');
    expect(result.success).toBe(false);
    const messages = result.success ? [] : result.error.issues.map((i) => i.message);
    expect(messages).toContain("L'URL n'est pas valide.");
  });
});

describe('optionalPrice', () => {
  it('treats NaN (empty numeric field) as null', () => {
    const result = optionalPrice.safeParse(NaN);
    expect(result.success).toBe(true);
    expect(result.success && result.data).toBeNull();
  });

  it('accepts a positive price', () => {
    expect(optionalPrice.safeParse(12.5).success).toBe(true);
  });
});
