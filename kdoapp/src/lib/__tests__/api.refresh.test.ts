import axios from 'axios';
import { refreshAccessToken } from '@/lib/api';

jest.mock('axios', () => {
  const instance = {
    interceptors: { request: { use: jest.fn() }, response: { use: jest.fn() } },
  };
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
const nav = navigator as unknown as { locks?: unknown };

describe('refreshAccessToken (verrou entre onglets)', () => {
  beforeEach(() => {
    localStorage.clear();
    postMock.mockReset();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    delete nav.locks;
  });

  it('skips network refresh when another tab already stored a fresh token', async () => {
    localStorage.setItem('authToken', makeJwt(10));
    localStorage.setItem('refreshToken', 'old-refresh');
    const fresh = makeJwt(30 * 60);
    const request = jest.fn(async (_name: string, cb: () => Promise<void>) => {
      // Un autre onglet a rafraîchi pendant l'attente du verrou
      localStorage.setItem('authToken', fresh);
      return cb();
    });
    nav.locks = { request };

    await refreshAccessToken();

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
});
