import dotenv from 'dotenv';
import { checkDatabase, closeDatabase, runMigrations } from './db/database';

dotenv.config();

async function main() {
  if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL?.startsWith('postgres')) throw new Error('Production migrations require a PostgreSQL DATABASE_URL.');
  await runMigrations();
  const health = await checkDatabase();
  if (!health.ok) throw new Error(health.error || 'Database migration health check failed.');
  console.log(`GoPaq migrations applied (${health.engine}${health.postgisVersion ? ` / PostGIS ${health.postgisVersion}` : ''}).`);
}

main()
  .catch((error) => {
    console.error('GoPaq migration failed:', error instanceof Error ? error.message : 'unknown_error');
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
