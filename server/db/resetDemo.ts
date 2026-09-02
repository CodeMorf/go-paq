import { closeDatabase } from './database';
import { resetDemoTenant } from './seed';

resetDemoTenant()
  .then(() => {
    console.log(JSON.stringify({ success: true, tenant: 'org-demo', resettable: true }));
  })
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'demo_reset_failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
