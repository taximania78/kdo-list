import axios from 'axios';
import { refreshAccessToken } from '@/lib/api';

jest.mock('axios', () => {
  const instance = Object.assign(jest.fn().mockResolvedValue({ data: 'retried' }), {
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  });
  return {
    __esModule: true,
    default: { create: jest.fn(() => instance), post: jest.fn() },
  };
});

function makeJwt(expInSeconds: number): string {
  const b64 = (o: object) => Buffer.from(JSON.stringify(o)).toString('base64url');
  const exp = Math.floor(Date.now() / 1000) + expInSeconds;
  return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64({ sub: 1, username: 'u', exp })}.sig`;
}

const postMock = axios.post as jest.Mock;
const instance = (axios.create as jest.Mock).mock.results[0].value;
const onResponseError = instance.interceptors.response.use.mock.calls[0][1] as (e: unknown) => Promise<unknown>;
const nav = navigator as unknown as { locks?: unknown };

describe('refreshAccessToken (verrou entre onglets)', () => {
  beforeEach(() => {
    localStorage.clear();
    postMock.mockReset();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete nav.locks;
  });

  it('skips network refresh when another tab already stored a fresh token', async () => {
    const oldToken = makeJwt(10);
    localStorage.setItem('authToken', oldToken);
    localStorage.setItem('refreshToken', 'old-refresh');
    const fresh = makeJwt(30 * 60);
    const request = jest.fn(async (_name: string, cb: () => Promise<void>) => {
      // Un autre onglet a rafraîchi pendant l'attente du verrou
      localStorage.setItem('authToken', fresh);
      return cb();
    });
    nav.locks = { request };

    await refreshAccessToken(oldToken);

    expect(request).toHaveBeenCalledWith('kdo-refresh', expect.any(Function));
    expect(postMock).not.toHaveBeenCalled();
    expect(localStorage.getItem('authToken')).toBe(fresh);
  });

  it('refreshes normally when navigator.locks is unavailable', async () => {
    expect(nav.locks).toBeUndefined();
    localStorage.setItem('authToken', makeJwt(10));
    localStorage.setItem('refreshToken', 'old-refresh');
    const newAccess = makeJwt(30 * 60);
    postMock.mockResolvedValue({ data: { access_token: newAccess, refresh_token: 'new-refresh' } });

    await refreshAccessToken();

    expect(postMock).toHaveBeenCalledTimes(1);
    expect(String(postMock.mock.calls[0][0]).endsWith('/api/refresh/')).toBe(true);
    expect(postMock.mock.calls[0][1]).toEqual({ refresh_token: 'old-refresh' });
    expect(localStorage.getItem('authToken')).toBe(newAccess);
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });

  it('sends the refresh under the lock when no other tab refreshed', async () => {
    const token = makeJwt(10);
    localStorage.setItem('authToken', token);
    localStorage.setItem('refreshToken', 'old-refresh');
    const newAccess = makeJwt(30 * 60);
    postMock.mockResolvedValue({ data: { access_token: newAccess, refresh_token: 'new-refresh' } });
    const request = jest.fn(async (_name: string, cb: () => Promise<void>) => cb());
    nav.locks = { request };

    await refreshAccessToken(token);

    expect(request).toHaveBeenCalledWith('kdo-refresh', expect.any(Function));
    expect(postMock).toHaveBeenCalledTimes(1);
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh');
  });

  describe('401 response interceptor', () => {
    const validToken = () => makeJwt(30 * 60);
    const error401 = (token: string) => ({
      response: { status: 401 },
      config: { headers: { Authorization: `Bearer ${token}` } },
    });

    it('refreshes on 401 even when the token does not look expired', async () => {
      const token = validToken();
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', 'old-refresh');
      const newAccess = validToken();
      postMock.mockResolvedValue({ data: { access_token: newAccess, refresh_token: 'new-refresh' } });

      await onResponseError(error401(token));

      expect(postMock).toHaveBeenCalledTimes(1);
      expect(String(postMock.mock.calls[0][0]).endsWith('/api/refresh/')).toBe(true);
      expect(localStorage.getItem('authToken')).toBe(newAccess);
    });

    it('clears storage when the refresh fails after a 401', async () => {
      const token = validToken();
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', 'old-refresh');
      postMock.mockRejectedValue(new Error('revoked'));

      // refreshAccessToken gère l'échec lui-même (nettoyage + redirection vers /)
      await onResponseError(error401(token));

      expect(postMock).toHaveBeenCalledTimes(1);
      expect(localStorage.getItem('authToken')).toBeNull();
      expect(localStorage.getItem('refreshToken')).toBeNull();
    });

    it('clears storage inside the lock when the refresh fails', async () => {
      const token = validToken();
      localStorage.setItem('authToken', token);
      localStorage.setItem('refreshToken', 'old-refresh');
      postMock.mockRejectedValue(new Error('revoked'));
      let clearedInLock = false;
      nav.locks = {
        request: async (_n: string, cb: () => Promise<void>) => {
          try {
            return await cb();
          } finally {
            clearedInLock = localStorage.getItem('refreshToken') === null;
          }
        },
      };

      await refreshAccessToken(token);

      expect(clearedInLock).toBe(true);
    });
  });
});
