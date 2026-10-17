import express from 'express';
import { existsSync } from 'node:fs';
import { extname, join } from 'node:path';

export function mountFrontend(app, directory) {
  const index = join(directory, 'index.html');
  if (!existsSync(index))
    throw new Error('Client build missing. Run npm run build before starting production.');
  app.use(
    '/assets',
    express.static(join(directory, 'assets'), { index: false, immutable: true, maxAge: '1y' }),
  );
  app.use(
    express.static(directory, {
      index: false,
      maxAge: '1h',
      setHeaders(response, path) {
        if (path.endsWith('index.html')) response.setHeader('Cache-Control', 'no-cache');
      },
    }),
  );
  app.get('/{*path}', (request, response, next) => {
    const path = request.path;
    if (
      path === '/api' ||
      path.startsWith('/api/') ||
      path.startsWith('/assets/') ||
      path.startsWith('/images/') ||
      extname(path) ||
      path.split('/').some((part) => part.startsWith('.')) ||
      !request.accepts('html')
    )
      return next();
    response.set('Cache-Control', 'no-cache');
    response.sendFile(index);
  });
}
