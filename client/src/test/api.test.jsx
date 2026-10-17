import { afterEach, describe, expect, it, vi } from 'vitest';
import { api } from '../api/client.js';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe('API failure handling', () => {
  it('sends cookies and serializes request bodies', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ success: true }) });
    vi.stubGlobal('fetch', fetch);
    expect(await api('/bookings', { method: 'POST', body: { guests: 2 } })).toEqual({
      success: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      '/api/bookings',
      expect.objectContaining({
        credentials: 'include',
        body: '{"guests":2}',
        signal: expect.any(AbortSignal),
      }),
    );
  });
  it('preserves API validation status and fields', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Invalid input', errors: { phone: ['Invalid phone'] } }),
      }),
    );
    await expect(api('/bookings')).rejects.toMatchObject({
      message: 'Invalid input',
      status: 400,
      fields: { phone: ['Invalid phone'] },
    });
  });
  it('provides a readable message when offline', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));
    await expect(api('/tours')).rejects.toThrow('Unable to connect');
  });
  it('rejects malformed success responses rather than passing empty data to pages', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => {
          throw new SyntaxError('Unexpected token');
        },
      }),
    );
    await expect(api('/tours')).rejects.toThrow('invalid response');
  });
  it('aborts stalled requests after fifteen seconds', async () => {
    vi.useFakeTimers();
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url, { signal }) =>
          new Promise((_resolve, reject) =>
            signal.addEventListener('abort', () =>
              reject(new DOMException('Aborted', 'AbortError')),
            ),
          ),
      ),
    );
    const pending = expect(api('/tours')).rejects.toThrow('took too long');
    await vi.advanceTimersByTimeAsync(15000);
    await pending;
    expect(vi.getTimerCount()).toBe(0);
  });
});
