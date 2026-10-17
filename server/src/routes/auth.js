import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { cookieOptions, jwtSecret } from '../config/auth.js';

const router = Router();
const credentials = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  password: z
    .string()
    .min(8)
    .max(72)
    .refine(
      (value) => Buffer.byteLength(value, 'utf8') <= 72,
      'Password must be at most 72 UTF-8 bytes',
    ),
});
const registration = credentials.extend({ name: z.string().trim().min(2).max(80) });
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'test',
  message: { message: 'Too many attempts. Please try again later' },
});
function sendSession(response, user, status = 200) {
  const token = jwt.sign({}, jwtSecret, {
    subject: String(user._id),
    algorithm: 'HS256',
    expiresIn: '1d',
    issuer: 'wanderways',
    audience: 'wanderways-client',
  });
  response.cookie('wanderways_token', token, { ...cookieOptions, maxAge: 86400000 });
  return response
    .status(status)
    .json({ user: { id: user._id, name: user.name, email: user.email, role: user.role } });
}
const dummyHash = bcrypt.hashSync('timing-comparison-placeholder', 12);

router.post('/register', limiter, validate(registration), async (request, response) => {
  const { name, email, password } = request.body;
  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 12),
    role: 'customer',
  });
  sendSession(response, user, 201);
});
router.post('/login', limiter, validate(credentials), async (request, response) => {
  const user = await User.findOne({ email: request.body.email }).select('+password');
  const valid = await bcrypt.compare(request.body.password, user?.password || dummyHash);
  if (!user || !valid)
    return response.status(401).json({ message: 'Email or password is incorrect' });
  sendSession(response, user);
});
router.get('/me', authenticate, (request, response) => {
  const { _id: id, name, email, role } = request.user;
  response.json({ user: { id, name, email, role } });
});
router.post('/logout', (_request, response) => {
  response
    .clearCookie('wanderways_token', cookieOptions)
    .status(200)
    .json({ message: 'Logged out' });
});
export default router;
