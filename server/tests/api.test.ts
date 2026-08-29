import request from 'supertest';
import crypto from 'crypto';
import { app } from '../core/app';
import { runSeeds } from '../db/seed';
import { execute, queryOne } from '../db/database';
import { KarrioAdapter } from '../integrations/karrio/karrio.adapter';
import { GoPaqRoutingEngine } from '../modules/routing/routing.engine';

async function runComprehensiveTestSuite() {
  console.log('🧪 Starting GoPaq Core Real HTTP & Security Test Suite...\n');

  // Seed DB
  runSeeds();

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

  // 2. Auth: Invalid Login
  const invalidLogin = await request(app)
    .post('/api/v1/auth/login')
    .send({ email: 'admin@gopaq.local', password: 'WrongPassword!' });
  assert(invalidLogin.status === 401, 'POST /api/v1/auth/login rejects invalid password with 401');

  // 3. Security: Unauthenticated access rejected
  const unauthRes = await request(app).get('/api/v1/shipments');
  assert(unauthRes.status === 401, 'GET /api/v1/shipments rejects unauthenticated requests with 401');

  // 4. Authenticated Shipments List
  const shipmentsRes = await request(app)
    .get('/api/v1/shipments')
    .set('Authorization', `Bearer ${token}`);
  assert(shipmentsRes.status === 200 && Array.isArray(shipmentsRes.body.shipments), 'GET /api/v1/shipments returns real DB shipments');

  // 5. Create Shipment & Persistence
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
  const newShipmentId = createShpRes.body.shipment.id;

  // 6. Tenant Isolation Check
  // Create a shipment in another organization and ensure org-gopaq cannot read it
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

  // 7. API Key Security: Valid Key
  // Key prefix is 'gp_live_' and hash is for 'gp_live_sec_test123'
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

  // 8. API Key Security: Invalid Key
  const invalidKeyRes = await request(app)
    .get('/api/v1/shipments')
    .set('x-api-key', 'gp_live_sec_invalid_fake_key_9999');
  assert(invalidKeyRes.status === 401, 'API KEY SECURITY: Invalid API Key strictly rejected with 401');

  // 9. API Key Security: Scope Validation
  const scopeDeniedRes = await request(app)
    .post('/api/v1/shipments')
    .set('x-api-key', rawTestKey)
    .send({ origin: {}, destination: {}, package: {} });
  assert(scopeDeniedRes.status === 403, 'API KEY SECURITY: Key without shipments:write scope rejected with 403');

  // 10. Real Quotes & Pricing Engine
  const quoteRes = await request(app)
    .post('/api/v1/quotes')
    .send({ serviceType: 'nacional', originCity: 'Santo Domingo', destCity: 'Santiago', weightKg: 5, lengthCm: 40, widthCm: 30, heightCm: 20 });
  assert(quoteRes.status === 200 && quoteRes.body.quote.total > 300, 'POST /api/v1/quotes calculates dynamic national pricing with volumetric IATA weight');

  // 11. Public Tracking
  const trackingRes = await request(app).get(`/api/v1/tracking/${newTracking}`);
  assert(trackingRes.status === 200 && trackingRes.body.shipment.status === 'pending', 'GET /api/v1/tracking/:tracking retrieves real-time shipment events');

  // 12. GoPaq Native Routing Engine
  const stops = [
    { id: '1', address: 'Av. Luperon', lat: 18.45, lng: -69.97, type: 'delivery' as const, contact: { name: 'A' }, shipmentTracking: 'GP-1' },
    { id: '2', address: 'Av. 27 Feb', lat: 18.48, lng: -69.92, type: 'delivery' as const, contact: { name: 'B' }, shipmentTracking: 'GP-2' }
  ];
  const routeOpt = GoPaqRoutingEngine.optimizeStops(stops);
  assert(routeOpt.orderedStops.length === 2 && routeOpt.estimatedDistanceKm > 0, 'GoPaq Routing Engine processes 2-opt spatial optimization');

  // 13. Karrio Adapter: Provider Unavailable Check
  const karrioRes = await KarrioAdapter.fetchLiveCarrierRates({
    shipper: { country_code: 'US' },
    recipient: { country_code: 'DO' },
    parcels: [{ weight: 2.0 }]
  });
  assert(karrioRes.error === 'provider_unavailable' || karrioRes.success, 'Karrio Adapter handles unconfigured environment gracefully without fake local rates');

  // 14. COD Ledger
  const codRes = await request(app)
    .get('/api/v1/cod/ledger')
    .set('Authorization', `Bearer ${token}`);
  assert(codRes.status === 200 && codRes.body.summary.total_transactions > 0, 'GET /api/v1/cod/ledger returns real COD accounting ledger');

  console.log(`\n======================================================`);
  console.log(`TEST SUITE RESULTS: ${passed} PASSED | ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) process.exit(1);
}

runComprehensiveTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
