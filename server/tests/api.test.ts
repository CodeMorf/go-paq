import { runSeeds } from '../db/seed';
import { queryOne, queryAll } from '../db/database';
import { calculatePricing } from '../modules/pricing/pricing.engine';
import { comparePassword, generateToken } from '../auth/jwt';
import { WitylogixAdapter } from '../integrations/witylogix/witylogix.adapter';
import { KarrioAdapter } from '../integrations/karrio/karrio.adapter';

async function runTests() {
  console.log('🧪 Starting GoPaq Core Automated Test Suite...\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Database & Seed
  try {
    runSeeds();
    const org = queryOne('SELECT * FROM organizations WHERE id = ?', ['org-gopaq']);
    assert(!!org && org.slug === 'gopaq-global', 'Database seeded with default organization');
  } catch (e: any) {
    assert(false, `Database seed failed: ${e.message}`);
  }

  // 2. Auth & RBAC
  try {
    const admin = queryOne('SELECT * FROM users WHERE email = ?', ['admin@gopaq.local']);
    assert(!!admin && comparePassword('GoPaq123!', admin.password_hash), 'Admin user password verified with bcrypt');
    assert(admin.role === 'SUPER_ADMIN', 'Admin role is SUPER_ADMIN');

    const token = generateToken({
      userId: admin.id,
      organizationId: admin.organization_id,
      email: admin.email,
      role: admin.role,
      name: admin.name
    });
    assert(typeof token === 'string' && token.length > 20, 'JWT token generated successfully');
  } catch (e: any) {
    assert(false, `Auth test failed: ${e.message}`);
  }

  // 3. Pricing Engine
  try {
    const quote = calculatePricing({
      serviceType: 'local',
      originCity: 'Santo Domingo',
      destCity: 'Santo Domingo',
      weightKg: 2,
      lengthCm: 25,
      widthCm: 20,
      heightCm: 15,
      codAmount: 1000
    });
    assert(quote.total > 0 && quote.currency === 'DOP', 'Pricing Engine calculated local shipment with COD');
    assert(quote.billableWeightKg >= 2, 'Volumetric and billable weight calculated properly');
  } catch (e: any) {
    assert(false, `Pricing Engine test failed: ${e.message}`);
  }

  // 4. Shipments in DB
  try {
    const shipments = queryAll('SELECT * FROM shipments');
    assert(shipments.length >= 4, `Found ${shipments.length} persistent shipments in DB`);
    assert(shipments[0].tracking_number.startsWith('GP-'), 'Shipment has valid tracking number format');
  } catch (e: any) {
    assert(false, `Shipment test failed: ${e.message}`);
  }

  // 5. Witylogix Adapter
  try {
    const stops: any[] = [
      { id: '1', lat: 18.47, lng: -69.94, address: 'Stop 1' },
      { id: '2', lat: 18.49, lng: -69.86, address: 'Stop 2' }
    ];
    const opt = WitylogixAdapter.optimizeRoute(stops);
    assert(opt.orderedStops.length === 2 && opt.estimatedDistanceKm > 0, 'Witylogix Route Optimizer processed stops');
  } catch (e: any) {
    assert(false, `Witylogix adapter test failed: ${e.message}`);
  }

  // 6. Karrio Adapter
  try {
    const rates = await KarrioAdapter.getCarrierRates('US', 'DO', 3.5);
    assert(rates.length >= 3 && rates[0].carrier === 'gopaq_express', 'Karrio Multi-Carrier aggregator fetched rates');
  } catch (e: any) {
    assert(false, `Karrio adapter test failed: ${e.message}`);
  }

  // 7. COD Ledger
  try {
    const codTx = queryAll('SELECT * FROM cod_transactions');
    assert(codTx.length > 0, `COD ledger contains ${codTx.length} persistent transaction records`);
  } catch (e: any) {
    assert(false, `COD ledger test failed: ${e.message}`);
  }

  console.log(`\n========================================`);
  console.log(`RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`========================================\n`);

  if (failed > 0) process.exit(1);
}

runTests();
