import 'dotenv/config';
import { connectDatabase } from '../src/config/database.js';
import { seedTours } from '../src/data/seed.js';

const closeDatabase = await connectDatabase();
try {
  console.log(
    `Inserted ${await seedTours()} sample tours. Existing tours and bookings were preserved.`,
  );
} finally {
  await closeDatabase();
}
