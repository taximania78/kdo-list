import { logout } from '@/lib/logout';

describe('logout', () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    localStorage.clear();
    fetchMock = jest.fn().mockResolvedValue({ status: 204 });
    global.fetch = fetchMock as unknown as typeof fetch;
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => jest.restoreAllMocks());

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
