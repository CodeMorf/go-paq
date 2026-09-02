import dotenv from 'dotenv';
import { initDatabaseAsync } from './db/database';
import { startWorkers } from './queue/worker';

dotenv.config();

async function main() {
  await initDatabaseAsync();
  const close = await startWorkers();
  console.log('GoPaq worker running with Redis queues and PostgreSQL outbox.');
  const shutdown = async (signal: string) => {
    console.log(`[GoPaq Worker] ${signal} received; draining workers.`);
    await close();
    process.exit(0);
  };
  process.once('SIGTERM', () => { void shutdown('SIGTERM'); });
  process.once('SIGINT', () => { void shutdown('SIGINT'); });
}

main().catch((error) => {
  console.error('GoPaq worker startup failed:', error instanceof Error ? error.message : 'unknown_error');
  process.exit(1);
});
