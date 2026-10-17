const baseUrl = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export async function api(path, { body, ...options } = {}) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 15000);
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      ...options,
      signal: options.signal
        ? AbortSignal.any([options.signal, controller.signal])
        : controller.signal,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      const error = new Error(data?.message || 'Unable to reach the server. Please try again');
      error.status = response.status;
      error.fields = data?.errors;
      throw error;
    }
    if (data === null)
      throw new Error('The server returned an invalid response. Please try again.');
    return data;
  } catch (failure) {
    if (controller.signal.aborted)
      throw new Error('The server took too long to respond. Please check your connection.');
    if (failure instanceof TypeError)
      throw new Error('Unable to connect. Please check your internet connection and try again.');
    throw failure;
  } finally {
    clearTimeout(timeout);
  }
}
