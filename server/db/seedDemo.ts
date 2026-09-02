import { closeDatabase } from './database';
import { runDemoSeeds } from './seed';

runDemoSeeds()
  .then(() => {
    console.log(JSON.stringify({ success: true, tenant: 'org-demo', resettable: true }));
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'demo_seed_failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
