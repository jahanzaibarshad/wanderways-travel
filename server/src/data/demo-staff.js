import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export async function seedDemoStaff() {
  if (process.env.NODE_ENV === 'production')
    throw new Error('Demo accounts cannot be created in production');
  const email = 'staff@wanderways.example';
  if (!(await User.exists({ email }))) {
    await User.create({
      name: 'Demo Staff',
      email,
      password: await bcrypt.hash('WanderWays-Staff42!', 12),
      role: 'staff',
    });
  }
}
