import { randomBytes } from 'node:crypto';

const configuredSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && (!configuredSecret || configuredSecret.length < 32)) {
  throw new Error('Production JWT_SECRET must contain at least 32 characters');
}
export const jwtSecret = configuredSecret || randomBytes(48).toString('hex');
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax',
  path: '/api',
};
