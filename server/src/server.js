import 'dotenv/config';
import app from './app.js';
import { connectDatabase } from './config/database.js';
import { seedTours } from './data/seed.js';
import { seedDemoStaff } from './data/demo-staff.js';

const demo = process.argv.includes('--demo');
const closeDatabase = await connectDatabase({ demo });
if (demo) {
  await seedTours();
  await seedDemoStaff();
}
const port = Number(process.env.PORT) || 5000;
const server = app.listen(port, () => {
  console.log(`WanderWays API listening on http://localhost:${port}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Closing the HTTP server...`);
  server.close(async () => {
    await closeDatabase();
    process.exit(0);
  });
}

server.on('error', async (error) => {
  console.error(error.message);
  await closeDatabase();
  process.exit(1);
});

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
