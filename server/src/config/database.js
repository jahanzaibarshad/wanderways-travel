import mongoose from 'mongoose';
import { mkdtemp, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

export async function connectDatabase({ demo = false } = {}) {
  let demoDatabase;
  let demoPath;
  let uri = process.env.MONGODB_URI;
  try {
    if (demo) {
      if (process.env.NODE_ENV === 'production')
        throw new Error('Demo mode is unavailable in production');
      const { MongoMemoryReplSet } = await import('mongodb-memory-server');
      demoPath = await mkdtemp(join(process.env.DEMO_DB_ROOT || tmpdir(), 'wanderways-demo-'));
      demoDatabase = await MongoMemoryReplSet.create({
        instanceOpts: [{ dbPath: demoPath }],
        replSet: { count: 1, storageEngine: 'wiredTiger' },
      });
      uri = demoDatabase.getUri('wanderways_demo');
      console.warn('DEMO MODE: temporary MongoDB. Records are removed when this process stops.');
    }
    if (!uri)
      throw new Error(
        'Set MONGODB_URI in server/.env, or use npm run dev:demo for a temporary local database',
      );
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 10000 });
    const { default: User } = await import('../models/User.js');
    const { default: Tour } = await import('../models/Tour.js');
    const { default: Booking } = await import('../models/Booking.js');
    await Promise.all([User.init(), Tour.init(), Booking.init()]);
    return async () => {
      await mongoose.disconnect();
      if (demoDatabase) await demoDatabase.stop();
      if (demoPath) await rm(demoPath, { recursive: true, force: true });
    };
  } catch (error) {
    await mongoose.disconnect();
    if (demoDatabase) await demoDatabase.stop();
    if (demoPath) await rm(demoPath, { recursive: true, force: true });
    throw error;
  }
}
