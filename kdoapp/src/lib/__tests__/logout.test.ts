import { logout } from '@/lib/logout';

describe('logout', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = jest.fn().mockResolvedValue({ status: 204 });
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete (navigator as unknown as { locks?: unknown }).locks;
  });

  it('logout runs under the kdo-refresh lock', async () => {
    localStorage.setItem('authToken', 'access');
    localStorage.setItem('refreshToken', 'refresh-abc');
    let insideLock = false;
    let fetchedInLock = false;
    let clearedInLock = false;
    fetchMock.mockImplementation(async () => {
      fetchedInLock = insideLock;
      return { status: 204 };
    });
    const request = jest.fn(async (_name: string, cb: () => Promise<unknown>) => {
      insideLock = true;
      try {
        return await cb();
      } finally {
        clearedInLock = localStorage.getItem('refreshToken') === null;
        insideLock = false;
      }
    });
    (navigator as unknown as { locks?: unknown }).locks = { request };

    await logout();

    expect(request).toHaveBeenCalledWith('kdo-refresh', expect.any(Function));
    expect(fetchedInLock).toBe(true);
    expect(clearedInLock).toBe(true);
  });

  it('logout clears storage when the request times out', async () => {
    localStorage.setItem('authToken', 'access');
    localStorage.setItem('refreshToken', 'refresh-abc');
    const signal = new AbortController().signal;
    const timeoutSpy = jest.spyOn(AbortSignal, 'timeout').mockReturnValue(signal);
    fetchMock.mockRejectedValue(new DOMException('The operation timed out.', 'AbortError'));

    await logout();

    expect(timeoutSpy).toHaveBeenCalledWith(5000);
    expect(fetchMock.mock.calls[0][1].signal).toBe(signal);
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('posts refresh token to /api/logout/ then clears storage', async () => {
    localStorage.setItem('authToken', 'access');
    localStorage.setItem('refreshToken', 'refresh-abc');

    await logout();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url).endsWith('/api/logout/')).toBe(true);
    expect(init.method).toBe('POST');
    expect(JSON.parse(init.body)).toEqual({ refresh_token: 'refresh-abc' });
    expect(init.headers.Authorization).toBeUndefined();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(localStorage.getItem('authToken')).toBeNull();
  });

  it('clears storage even when fetch rejects', async () => {
    localStorage.setItem('refreshToken', 'refresh-abc');
    fetchMock.mockRejectedValue(new Error('network'));

    await logout();

    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('does not call fetch when no refresh token', async () => {
    localStorage.setItem('authToken', 'access');

    await logout();

    expect(fetchMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('authToken')).toBeNull();
  });
});
