import 'dotenv/config';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { connectDatabase } from '../src/config/database.js';
import User from '../src/models/User.js';

const input = z
  .object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email(),
    password: z
      .string()
      .min(12)
      .max(72)
      .refine((value) => Buffer.byteLength(value) <= 72),
  })
  .safeParse({
    name: process.env.STAFF_NAME,
    email: process.env.STAFF_EMAIL,
    password: process.env.STAFF_PASSWORD,
  });
if (!input.success)
  throw new Error(
    'Set STAFF_NAME, STAFF_EMAIL and STAFF_PASSWORD (12–72 bytes) in your environment',
  );
const closeDatabase = await connectDatabase();
try {
  if (await User.exists({ email: input.data.email }))
    throw new Error('This email already exists. No account was modified.');
  await User.create({
    ...input.data,
    password: await bcrypt.hash(input.data.password, 12),
    role: 'staff',
  });
  console.log('Staff account created. Remove STAFF_PASSWORD from your environment after use.');
} finally {
  await closeDatabase();
}
