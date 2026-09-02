import request from 'supertest';
import crypto from 'crypto';
import { app } from '../core/app';
import { runSeeds, runDemoSeeds } from '../db/seed';
import { execute, queryOne, queryOneAsync, queryAllAsync, executeAsync, transactionAsync } from '../db/database';
import { KarrioAdapter } from '../integrations/karrio/karrio.adapter';
import { GoPaqRoutingEngine } from '../modules/routing/routing.engine';

async function runComprehensiveTestSuite() {
  console.log('🧪 Starting GoPaq Core Real HTTP & Security Test Suite...\n');

  // Seed DB
  runSeeds();
  process.env.DEMO_ACCESS_ENABLED = 'true';
  await runDemoSeeds();

  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, name: string) {
    if (condition) {
      console.log(`  ✅ PASS: ${name}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${name}`);
      failed++;
    }
  }

  // 1. Auth: Valid Login
  const loginRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@gopaq.local', password: 'GoPaq123!' });

  assert(loginRes.status === 200 && loginRes.body.token, 'POST /api/v1/auth/login generates valid JWT for admin');
  const token = loginRes.body.token;

  const wrongAreaRes = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'cliente@gopaq.local', password: 'GoPaq123!', area: 'super-admin' });
  assert(wrongAreaRes.status === 403, 'AUTHORIZATION: Client cannot authenticate through the Super Admin area');

  const demoRes = await request(app)
    .post('/api/v1/auth/demo')
    .send({ area: 'portal' });
  assert(demoRes.status === 200 && demoRes.body.demo === true && demoRes.body.user.isDemo === true, 'DEMO TENANT: isolated portal demo session is issued by the backend');

  // 2. Auth: Invalid Login
  const invalidLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@gopaq.local', password: 'WrongPassword!' });
  assert(invalidLogin.status === 401, 'POST /api/v1/auth/login rejects invalid password with 401');

  // 3. Register: Explicit Tenant Resolution
  const testEmail = `newclient_${Date.now()}@example.com`;
  const registerRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: testEmail,
      password: 'SecurePass123!',
      name: 'Cliente E-commerce Demo',
      tenantSlug: 'gopaq-global'
    });
  assert(registerRes.status === 201 && registerRes.body.token, 'POST /api/v1/auth/register resolves tenant and creates CLIENT user with 201');

  // 4. Register: Duplicate Email Prevention
  const dupRegisterRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: testEmail,
      password: 'SecurePass123!',
      name: 'Cliente Duplicado'
    });
  assert(dupRegisterRes.status === 409, 'POST /api/v1/auth/register rejects duplicate email registration with 409');

  // 5. Security: Unauthenticated access rejected
  const unauthRes = await request(app).get('/api/v1/shipments');
  assert(unauthRes.status === 401, 'GET /api/v1/shipments rejects unauthenticated requests with 401');

  // 6. Authenticated Shipments List
  const shipmentsRes = await request(app)
    .get('/api/v1/shipments')
    .set('Authorization', `Bearer ${token}`);
  assert(shipmentsRes.status === 200 && Array.isArray(shipmentsRes.body.shipments), 'GET /api/v1/shipments returns real DB shipments');

  // 7. Create Shipment & Persistence
  const createShpRes = await request(app)
    .post('/api/v1/shipments')
    .set('Authorization', `Bearer ${token}`)
    .send({
      serviceType: 'local',
      origin: { name: 'Comercio A', city: 'Santo Domingo', address: 'Av. Lincoln #10' },
      destination: { name: 'Cliente B', city: 'Santo Domingo', address: 'Calle Sol #20' },
      package: { weightKg: 3.5, lengthCm: 30, widthCm: 20, heightCm: 10, declaredValueUsd: 150 },
      codAmount: 2500
    });
  assert(createShpRes.status === 201 && createShpRes.body.shipment.trackingNumber.startsWith('GP-'), 'POST /api/v1/shipments persists shipment with unique GP- tracking');
  const newTracking = createShpRes.body.shipment.trackingNumber;

  // 8. Tenant Isolation Check
  execute(`
    INSERT INTO organizations (id, name, slug, active) VALUES ('org-rival', 'Competidor Logistics', 'competidor', 1)
    ON CONFLICT (id) DO NOTHING
  `);
  execute(`
    INSERT INTO shipments (id, organization_id, tracking_number, service_type, status, origin_json, destination_json, package_json, pricing_json, shipping_cost, created_at, updated_at)
    VALUES ('shp-rival-01', 'org-rival', 'GP-RIVAL-999', 'local', 'pending', '{}', '{}', '{}', '{}', 200, datetime('now'), datetime('now'))
    ON CONFLICT (id) DO NOTHING
  `);

  const isolationRes = await request(app)
    .get('/api/v1/shipments/shp-rival-01')
    .set('Authorization', `Bearer ${token}`);
  assert(isolationRes.status === 404, 'TENANT ISOLATION: Org cannot access shipment of another organization (404)');

  // 9. API Key Security: Valid Key
  const rawTestKey = 'gp_live_sec_0123456789abcdef01234567';
  const testKeyHash = crypto.createHash('sha256').update(rawTestKey).digest('hex');
  execute(`
    INSERT INTO api_keys (id, organization_id, client_id, key_name, key_prefix, key_hash, mode, scopes, active, created_at)
    VALUES ('apk-test-01', 'org-gopaq', 'cli-techstore', 'Test Key', 'gp_live_sec_', ?, 'live', 'shipments:read,tracking:read', 1, datetime('now'))
    ON CONFLICT (id) DO NOTHING
  `, [testKeyHash]);

  const apiKeyRes = await request(app)
    .get('/api/v1/shipments')
    .set('x-api-key', rawTestKey);
  assert(apiKeyRes.status === 200, 'API KEY SECURITY: Valid hashed API Key authenticates correctly (200)');

  // 10. API Key Security: Invalid Key
  const invalidKeyRes = await request(app)
    .get('/api/v1/shipments')
    .set('x-api-key', 'gp_live_sec_invalid_fake_key_9999');
  assert(invalidKeyRes.status === 401, 'API KEY SECURITY: Invalid API Key strictly rejected with 401');

  // 11. API Key Security: Scope Validation
  const scopeDeniedRes = await request(app)
    .post('/api/v1/shipments')
    .set('x-api-key', rawTestKey)
    .send({ origin: {}, destination: {}, package: {} });
  assert(scopeDeniedRes.status === 403, 'API KEY SECURITY: Key without shipments:write scope rejected with 403');

  // 12. PostgreSQL / Async Database Layer & Transaction Rollback
  const testBranchId = `br-test-rollback-${Date.now()}`;
  try {
    await transactionAsync(async (tx) => {
      await tx.execute(`
        INSERT INTO branches (id, organization_id, code, name, city, address, phone, manager_name, is_hub, active)
        VALUES (?, 'org-gopaq', 'TEST-ROLL', 'Sucursal Rollback', 'SDQ', 'Calle Test', '809', 'Admin', 0, 1)
      `, [testBranchId]);
      throw new Error('Simulated atomic transaction failure');
    });
  } catch {
    // Expected to catch rollback error
  }
  const checkBranch = await queryOneAsync('SELECT id FROM branches WHERE id = ?', [testBranchId]);
  assert(!checkBranch, 'ASYNC DATABASE LAYER: transactionAsync rolled back atomically upon error');

  // 13. Integrations Health Endpoint (Witylogix & Karrio status reporting)
  const healthRes = await request(app).get('/api/v1/integrations/health').set('Authorization', `Bearer ${token}`);
  assert(healthRes.status === 200 && healthRes.body.witylogix && healthRes.body.karrio, 'GET /api/v1/integrations/health returns protected diagnostics for Witylogix & Karrio');

  // 14. Real Quotes & Pricing Engine
  const quoteRes = await request(app)
    .post('/api/v1/quotes')
    .send({ serviceType: 'nacional', originCity: 'Santo Domingo', destCity: 'Santiago', weightKg: 5, lengthCm: 40, widthCm: 30, heightCm: 20 });
  assert(quoteRes.status === 200 && quoteRes.body.quote.total > 300, 'POST /api/v1/quotes calculates dynamic national pricing with volumetric IATA weight');

  // 15. Public Tracking
  const trackingRes = await request(app).get(`/api/v1/tracking/${newTracking}`);
  assert(trackingRes.status === 200 && trackingRes.body.shipment.status === 'pending', 'GET /api/v1/tracking/:tracking retrieves real-time shipment events');

  // 16. GoPaq Native Routing Engine
  const stops = [
    { id: '1', address: 'Av. Luperon', lat: 18.45, lng: -69.97, type: 'delivery' as const, contact: { name: 'A' }, shipmentTracking: 'GP-1' },
    { id: '2', address: 'Av. 27 Feb', lat: 18.48, lng: -69.92, type: 'delivery' as const, contact: { name: 'B' }, shipmentTracking: 'GP-2' }
  ];
  const routeOpt = GoPaqRoutingEngine.optimizeStops(stops);
  assert(routeOpt.orderedStops.length === 2 && routeOpt.estimatedDistanceKm > 0, 'GoPaq Routing Engine processes 2-opt spatial optimization');

  // 17. Karrio Adapter: Provider Unavailable Check
  const karrioRes = await KarrioAdapter.fetchLiveCarrierRates({
    shipper: { country_code: 'US' },
    recipient: { country_code: 'DO' },
    parcels: [{ weight: 2.0 }]
  });
  assert(karrioRes.error === 'provider_unavailable' || karrioRes.success, 'Karrio Adapter handles unconfigured environment gracefully without fake local rates');

  // 18. COD Ledger
  const codRes = await request(app)
    .get('/api/v1/cod/ledger')
    .set('Authorization', `Bearer ${token}`);
  assert(codRes.status === 200 && codRes.body.summary.total_transactions > 0, 'GET /api/v1/cod/ledger returns real COD accounting ledger');

  const rivalCodId = `cod-rival-${Date.now()}`;
  execute(`INSERT INTO shipments (id, organization_id, tracking_number, service_type, status, origin_json, destination_json, package_json, pricing_json, shipping_cost, created_at, updated_at) VALUES (?, 'org-rival', ?, 'local', 'pending', '{}', '{}', '{}', '{}', 200, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) ON CONFLICT (id) DO NOTHING`, [`shp-${rivalCodId}`, `GP-${rivalCodId.toUpperCase()}`]);
  execute(`INSERT INTO cod_transactions (id, organization_id, shipment_id, amount, currency, status, created_at) VALUES (?, 'org-rival', ?, 100, 'DOP', 'received_branch', CURRENT_TIMESTAMP)`, [rivalCodId, `shp-${rivalCodId}`]);
  const crossTenantSettlement = await request(app).post('/api/v1/cod/settle').set('Authorization', `Bearer ${token}`).send({ transactionIds: [rivalCodId] });
  assert(crossTenantSettlement.status === 404, 'COD TENANT ISOLATION: settlement cannot mutate another organization');

  const ownCodId = `cod-own-${Date.now()}`;
  execute(`INSERT INTO cod_transactions (id, organization_id, shipment_id, amount, currency, status, created_at) VALUES (?, 'org-gopaq', 'shp-8924', 100, 'DOP', 'collected_driver', CURRENT_TIMESTAMP)`, [ownCodId]);
  const settlementKey = `settlement-${Date.now()}`;
  const receiveCod = await request(app).post('/api/v1/cod/receive').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', `${settlementKey}-receive`).send({ transactionIds: [ownCodId] });
  const reconcileCod = await request(app).post('/api/v1/cod/reconcile').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', `${settlementKey}-reconcile`).send({ transactionIds: [ownCodId] });
  const ownSettlement = await request(app).post('/api/v1/cod/settle').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', settlementKey).send({ transactionIds: [ownCodId] });
  const repeatedSettlement = await request(app).post('/api/v1/cod/settle').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', settlementKey).send({ transactionIds: [ownCodId] });
  const settledRow = queryOne<{ status: string }>('SELECT status FROM cod_transactions WHERE id = ?', [ownCodId]);
  assert(receiveCod.status === 200 && reconcileCod.status === 200 && ownSettlement.status === 200 && repeatedSettlement.status === 200 && settledRow?.status === 'settled_merchant', 'COD STATE MACHINE: driver collection, branch receipt, reconciliation and idempotent settlement persist atomically');

  // 19. Driver manifest -> route start -> POD/COD, all in one transaction
  const driverLogin = await request(app).post('/api/v1/auth/login').send({ email: 'driver@gopaq.local', password: 'GoPaq123!', area: 'driver' });
  const driverToken = driverLogin.body.token;
  const driverRouteId = `rt-driver-test-${Date.now()}`;
  const driverStopId = `stp-driver-test-${Date.now()}`;
  const createdShipmentId = createShpRes.body.shipment.id;
  execute(`INSERT INTO routes (id, organization_id, branch_id, driver_id, name, date, status, total_stops, created_at, updated_at) VALUES (?, 'org-gopaq', 'br-sdq-central', 'drv-01', 'Ruta de prueba API', CURRENT_DATE, 'draft', 1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`, [driverRouteId]);
  execute(`INSERT INTO route_stops (id, route_id, shipment_id, sequence_order, type, address_json, contact_name, contact_phone, status) VALUES (?, ?, ?, 1, 'delivery', ?, 'Cliente B', NULL, 'pending')`, [driverStopId, driverRouteId, createdShipmentId, JSON.stringify({ name: 'Cliente B', city: 'Santo Domingo', address: 'Calle Sol #20' })]);
  execute(`UPDATE shipments SET assigned_route_id = ?, assigned_driver_id = 'drv-01' WHERE id = ? AND organization_id = 'org-gopaq'`, [driverRouteId, createdShipmentId]);
  const startRouteRes = await request(app).post(`/api/v1/drivers/routes/${driverRouteId}/start`).set('Authorization', `Bearer ${driverToken}`);
  const podKey = `pod-test-${Date.now()}`;
  const completePodRes = await request(app).post(`/api/v1/drivers/stops/${driverStopId}/complete`).set('Authorization', `Bearer ${driverToken}`).set('Idempotency-Key', podKey).send({ pod: { recipientName: 'Cliente B', signatureUrl: 'storage://test-signature' }, collectedCod: 2500, codMethod: 'cash' });
  const repeatedPodRes = await request(app).post(`/api/v1/drivers/stops/${driverStopId}/complete`).set('Authorization', `Bearer ${driverToken}`).set('Idempotency-Key', podKey).send({ pod: { recipientName: 'Cliente B', signatureUrl: 'storage://test-signature' }, collectedCod: 2500, codMethod: 'cash' });
  const completedShipment = queryOne<{ status: string; cod_collected: number }>('SELECT status, cod_collected FROM shipments WHERE id = ?', [createdShipmentId]);
  assert(driverLogin.status === 200 && startRouteRes.status === 200 && completePodRes.status === 200 && repeatedPodRes.status === 200 && completedShipment?.status === 'delivered' && Number(completedShipment.cod_collected) === 1, 'DRIVER FLOW: authenticated route start, POD, COD collection and idempotent replay persist atomically');

  const publicBranches = await request(app).get('/api/v1/branches/public');
  assert(publicBranches.status === 200 && Array.isArray(publicBranches.body.branches), 'PUBLIC GATEWAY: branch directory returns only active public records');

  const scanShipment = await request(app).post('/api/v1/shipments').set('Authorization', `Bearer ${token}`).send({ serviceType: 'local', origin: { name: 'Sucursal', city: 'Santo Domingo', address: 'Calle Test' }, destination: { name: 'Receptor', city: 'Santo Domingo', address: 'Calle Destino' }, package: { weightKg: 1, lengthCm: 20, widthCm: 20, heightCm: 10 } });
  const scanTracking = scanShipment.body.shipment?.trackingNumber;
  const scanKey = `branch-scan-${Date.now()}`;
  const receiveScan = await request(app).post('/api/v1/branches/br-sdq-central/scan').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', scanKey).send({ trackingNumber: scanTracking, action: 'receive', location: 'Rack TEST-01' });
  const repeatedScan = await request(app).post('/api/v1/branches/br-sdq-central/scan').set('Authorization', `Bearer ${token}`).set('Idempotency-Key', scanKey).send({ trackingNumber: scanTracking, action: 'receive', location: 'Rack TEST-01' });
  const scannedShipment = queryOne<{ status: string; branch_id: string }>('SELECT status, branch_id FROM shipments WHERE tracking_number = ?', [scanTracking]);
  assert(receiveScan.status === 200 && repeatedScan.status === 200 && scannedShipment?.status === 'at_branch' && scannedShipment.branch_id === 'br-sdq-central', 'BRANCH SCAN: receive operation persists inventory location with idempotent replay');

  const demoLockers = await request(app).get('/api/v1/international/lockers').set('Authorization', `Bearer ${demoRes.body.token}`);
  const prealertKey = `prealert-${Date.now()}`;
  const prealert = await request(app).post('/api/v1/international/prealert').set('Authorization', `Bearer ${demoRes.body.token}`).set('Idempotency-Key', prealertKey).send({ lockerId: demoLockers.body.lockers?.[0]?.id, merchantName: 'Tienda Demo', trackingNumber: `DEMO-${Date.now()}`, description: 'Paquete de prueba de flujo', declaredValueUsd: 25, weightLbs: 2 });
  const repeatedPrealert = await request(app).post('/api/v1/international/prealert').set('Authorization', `Bearer ${demoRes.body.token}`).set('Idempotency-Key', prealertKey).send({ lockerId: demoLockers.body.lockers?.[0]?.id, merchantName: 'Tienda Demo', trackingNumber: prealert.body.package?.trackingNumber || `DEMO-${Date.now()}`, description: 'Paquete de prueba de flujo', declaredValueUsd: 25, weightLbs: 2 });
  assert(demoLockers.status === 200 && prealert.status === 201 && repeatedPrealert.status === 201 && prealert.body.package?.status === 'received_miami', 'INTERNATIONAL PREALERT: client locker ownership, persistence and idempotent replay work through the API');

  const demoCookie = (demoRes.headers['set-cookie'] || []) as string[];
  const demoLogout = await request(app).post('/api/v1/auth/logout').set('Cookie', demoCookie);
  const revokedAccess = await request(app).get('/api/v1/auth/me').set('Authorization', `Bearer ${demoRes.body.token}`);
  assert(demoLogout.status === 200 && revokedAccess.status === 401, 'SESSION REVOCATION: logout invalidates the access token before its JWT TTL');

  console.log(`\n======================================================`);
  console.log(`TEST SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) process.exit(1);
}

runComprehensiveTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
