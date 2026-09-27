/**
 * @jest-environment node
 */
import { fetchTheme } from '@/lib/theme.server';

const originalEnv = process.env;

function mockFetchResolved(body: unknown, ok = true) {
  global.fetch = jest.fn().mockResolvedValue({
    ok,
    json: async () => body,
  }) as unknown as typeof fetch;
}

describe('fetchTheme', () => {
  beforeEach(() => {
    process.env = { ...originalEnv, INTERNAL_API_URL: 'http://fastapi:8000' };
    delete process.env.NEXT_PUBLIC_API_URL;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('returns the theme sent by the API, without cache', async () => {
    mockFetchResolved({ theme: 'christmas' });
    await expect(fetchTheme()).resolves.toBe('christmas');
    expect(global.fetch).toHaveBeenCalledWith(
      'http://fastapi:8000/api/settings/theme',
      expect.objectContaining({ cache: 'no-store', signal: expect.anything() }),
    );
  });

  it('falls back to NEXT_PUBLIC_API_URL when INTERNAL_API_URL is missing', async () => {
    delete process.env.INTERNAL_API_URL;
    process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';
    mockFetchResolved({ theme: 'default' });
    await fetchTheme();
    expect(global.fetch).toHaveBeenCalledWith('http://localhost:8000/api/settings/theme', expect.anything());
  });

  it('returns default without calling fetch when no API URL is configured', async () => {
    delete process.env.INTERNAL_API_URL;
    global.fetch = jest.fn() as unknown as typeof fetch;
    await expect(fetchTheme()).resolves.toBe('default');
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('returns default for an unknown theme value', async () => {
    mockFetchResolved({ theme: 'halloween' });
    await expect(fetchTheme()).resolves.toBe('default');
  });

  it('returns default on a non-2xx response', async () => {
    mockFetchResolved({ detail: 'boom' }, false);
    await expect(fetchTheme()).resolves.toBe('default');
  });

  it('returns default on network error or timeout', async () => {
    global.fetch = jest.fn().mockRejectedValue(new DOMException('timeout', 'TimeoutError')) as unknown as typeof fetch;
    await expect(fetchTheme()).resolves.toBe('default');
  });
});
