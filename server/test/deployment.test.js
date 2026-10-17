import { describe, test, expect } from '@jest/globals';
import request from 'supertest';
import { fileURLToPath } from 'node:url';
import { createApp } from '../src/app.js';

const clientDirectory = fileURLToPath(new URL('./fixtures/site/', import.meta.url));
const options = {
  production: true,
  clientUrl: 'https://wanderways.example',
  clientDirectory,
  trustProxy: '1',
};
const app = createApp(options);

describe('Production single-origin hosting', () => {
  test.each([
    '/',
    '/tours',
    '/tours/123',
    '/bookings',
    '/bookings/123/confirmation',
    '/staff',
    '/photo-credits',
  ])('serves React on direct navigation to %s', async (path) => {
    const response = await request(app).get(path).set('Accept', 'text/html');
    expect(response.status).toBe(200);
    expect(response.text).toContain('WanderWays production frontend');
    expect(response.headers['cache-control']).toBe('no-cache');
  });
  test('serves hashed JS assets with immutable caching', async () => {
    const response = await request(app).get('/assets/app.js');
    expect(response.status).toBe(200);
    expect(response.headers['content-type']).toContain('javascript');
    expect(response.headers['cache-control']).toContain('immutable');
  });
  test.each(['/api/not-real', '/assets/missing.js', '/images/missing.webp', '/.env'])(
    'does not return the SPA for API, missing assets or private paths: %s',
    async (path) => {
      const response = await request(app).get(path).set('Accept', 'text/html');
      expect(response.status).toBe(404);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.text).not.toContain('production frontend');
    },
  );
  test('keeps API route authorization and foreign-origin rejection', async () => {
    expect((await request(app).get('/api/bookings/mine')).status).toBe(401);
    expect(
      (await request(app).post('/api/auth/login').set('Origin', 'https://evil.example').send({}))
        .status,
    ).toBe(403);
  });
  test('accepts same-origin writes and returns validation errors instead of HTML', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .set('Origin', options.clientUrl)
      .send({});
    expect(response.status).toBe(400);
    expect(response.headers['content-type']).toContain('application/json');
  });
  test('reports unavailable database to the hosting health checker', async () => {
    const response = await request(app).get('/api/health');
    expect(response.status).toBe(503);
    expect(response.body.success).toBe(false);
    expect(response.body.database).toBe('disconnected');
  });
  test('configures only the explicit proxy hop count', () => {
    expect(app.get('trust proxy')).toBe(1);
    expect(() => createApp({ ...options, trustProxy: 'true' })).toThrow('TRUST_PROXY');
  });
  test('rejects missing frontend builds and insecure production origins', () => {
    expect(() => createApp({ ...options, clientDirectory: clientDirectory + 'missing' })).toThrow(
      'Client build missing',
    );
    expect(() => createApp({ ...options, clientUrl: 'http://wanderways.example' })).toThrow(
      'HTTPS origin',
    );
  });
});
