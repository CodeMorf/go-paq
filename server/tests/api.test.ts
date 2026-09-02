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
  if (!process.env.WEBHOOK_ENCRYPTION_KEY) process.env.WEBHOOK_ENCRYPTION_KEY = crypto.randomBytes(32).toString('hex');
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
      tenantSlug: 'gopaq-global',
      branchId: 'br-sdq-central'
    });
  assert(registerRes.status === 201 && registerRes.body.token && registerRes.body.user.branchId === 'br-sdq-central' && registerRes.body.user.branchName, 'POST /api/v1/auth/register persists CLIENT with the selected branch');

  // 4. Register: Duplicate Email Prevention
  const dupRegisterRes = await request(app)
    .post('/api/v1/auth/register')
    .send({
      email: testEmail,
      password: 'SecurePass123!',
      name: 'Cliente Duplicado',
      branchId: 'br-sdq-central'
    });
  assert(dupRegisterRes.status === 409, 'POST /api/v1/auth/register rejects duplicate email registration with 409');
  const registeredClient = queryOne<{ branch_id: string }>('SELECT branch_id FROM clients WHERE email = ?', [testEmail]);
  assert(registeredClient?.branch_id === 'br-sdq-central', 'CLIENT OWNERSHIP: registered client remains assigned to the selected branch in the database');
  const invalidBranchRegister = await request(app)
    .post('/api/v1/auth/register')
    .send({ email: `invalid_branch_${Date.now()}@example.com`, password: 'SecurePass123!', name: 'Sucursal inválida', branchId: 'branch-does-not-exist' });
  assert(invalidBranchRegister.status === 422, 'CLIENT OWNERSHIP: registration rejects a branch outside the public organization');
  const missingClientBranch = await request(app)
    .post('/api/v1/clients')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Cliente sin sucursal', email: `missing_branch_${Date.now()}@example.com`, phone: '8095550101' });
  assert(missingClientBranch.status === 422, 'CLIENT OWNERSHIP: administrative client creation requires an active branch');

  // Branch location management: only an authenticated tenant administrator can
  // persist verified coordinates used by the real public branch map.
  const branchLocationRes = await request(app)
    .patch('/api/v1/branches/br-sdq-central/location')
    .set('Authorization', `Bearer ${token}`)
    .send({ latitude: 18.4861, longitude: -69.9312 });
  assert(branchLocationRes.status === 200 && branchLocationRes.body.branch.latitude === 18.4861 && branchLocationRes.body.branch.longitude === -69.9312, 'BRANCH MAP: admin persists verified branch coordinates');
  const partialBranchLocation = await request(app)
    .patch('/api/v1/branches/br-sdq-central/location')
    .set('Authorization', `Bearer ${token}`)
    .send({ latitude: 18.4861, longitude: null });
  assert(partialBranchLocation.status === 422, 'BRANCH MAP: partial coordinates are rejected');
  const clientBranchLocation = await request(app)
    .patch('/api/v1/branches/br-sdq-central/location')
    .set('Authorization', `Bearer ${demoRes.body.token}`)
    .send({ latitude: 18.4861, longitude: -69.9312 });
  assert(clientBranchLocation.status === 403, 'BRANCH MAP RBAC: client cannot change branch coordinates');

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

  // 14. Global configuration center: tenant scope, RBAC and optimistic versioning
  const configurationRes = await request(app).get('/api/v1/configuration').set('Authorization', `Bearer ${token}`);
  const portalConfigurationRes = await request(app).get('/api/v1/configuration').set('Authorization', `Bearer ${demoRes.body.token}`);
  assert(configurationRes.status === 200 && configurationRes.body.categories?.includes('organization') && configurationRes.body.categories?.includes('developer') && configurationRes.body.settings?.services, 'CONFIGURATION: admin receives the complete tenant-scoped configuration center');
  assert(portalConfigurationRes.status === 403, 'CONFIGURATION RBAC: client cannot access global tenant configuration');
  const configurationUpdate = await request(app)
    .patch('/api/v1/configuration/operations')
    .set('Authorization', `Bearer ${token}`)
    .send({ expectedVersion: configurationRes.body.version, settings: { maxRouteStops: 75 }, reason: 'Prueba de configuración versionada' });
  const configurationConflict = await request(app)
    .patch('/api/v1/configuration/operations')
    .set('Authorization', `Bearer ${token}`)
    .send({ expectedVersion: configurationRes.body.version, settings: { maxRouteStops: 76 } });
  const disableLocalService = await request(app)
    .patch('/api/v1/configuration/services')
    .set('Authorization', `Bearer ${token}`)
    .send({ expectedVersion: configurationUpdate.body.version, settings: { local: false } });
  const disabledServiceQuote = await request(app)
    .post('/api/v1/quotes')
    .send({ serviceType: 'local', originCity: 'Santo Domingo', destCity: 'Santo Domingo', weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10 });
  const enableLocalService = await request(app)
    .patch('/api/v1/configuration/services')
    .set('Authorization', `Bearer ${token}`)
    .send({ expectedVersion: disableLocalService.body.version, settings: { local: true } });
  assert(configurationUpdate.status === 200 && configurationUpdate.body.version === Number(configurationRes.body.version) + 1 && configurationUpdate.body.settings.operations.maxRouteStops === 75, 'CONFIGURATION: operation policy persists with version and backend validation');
  assert(configurationConflict.status === 409, 'CONFIGURATION CONCURRENCY: stale version cannot overwrite newer settings');
  assert(disableLocalService.status === 200 && disabledServiceQuote.status === 409 && enableLocalService.status === 200, 'CONFIGURATION EFFECTIVE POLICY: disabling a service blocks its real quote until re-enabled');

  // 14b. Google Maps credential boundary: encrypted storage, RBAC and public browser contract
  const mapsClientWrite = await request(app)
    .patch('/api/v1/configuration/google-maps')
    .set('Authorization', `Bearer ${demoRes.body.token}`)
    .send({ expectedVersion: enableLocalService.body.version, apiKey: 'test-only-google-maps-key' });
  assert(mapsClientWrite.status === 403, 'GOOGLE MAPS RBAC: client cannot change the organization credential');
  const invalidMapsKey = await request(app)
    .patch('/api/v1/configuration/google-maps')
    .set('Authorization', `Bearer ${token}`)
    .send({ expectedVersion: enableLocalService.body.version, apiKey: 'invalid' });
  assert(invalidMapsKey.status === 422, 'GOOGLE MAPS VALIDATION: malformed key is rejected before persistence');
  const testMapsKey = `test-only-${crypto.randomBytes(24).toString('hex')}`;
  const mapsUpdate = await request(app)
    .patch('/api/v1/configuration/google-maps')
    .set('Authorization', `Bearer ${token}`)
    .send({ expectedVersion: enableLocalService.body.version, apiKey: testMapsKey, reason: 'Prueba de credencial cifrada' });
  const mapsAdminRead = await request(app).get('/api/v1/configuration').set('Authorization', `Bearer ${token}`);
  const publicMapsRead = await request(app).get('/api/v1/configuration/maps');
  assert(mapsUpdate.status === 200 && mapsUpdate.body.googleMaps?.configured === true, 'GOOGLE MAPS: admin can persist a credential through the versioned backend');
  assert(mapsAdminRead.status === 200 && mapsAdminRead.body.googleMaps?.keyHint && !mapsAdminRead.body.googleMaps?.apiKey && !mapsAdminRead.body.googleMaps?.encrypted_value, 'GOOGLE MAPS SECRET: authenticated configuration never returns the full key or ciphertext');
  assert(publicMapsRead.status === 200 && publicMapsRead.body.configured === true && publicMapsRead.body.apiKey === testMapsKey, 'GOOGLE MAPS PUBLIC CONTRACT: only the configured browser key is exposed to the public map client');
  const mapsClear = await request(app)
    .patch('/api/v1/configuration/google-maps')
    .set('Authorization', `Bearer ${token}`)
    .send({ expectedVersion: mapsUpdate.body.version, apiKey: null, reason: 'Limpieza de fixture de pruebas' });
  const publicMapsAfterClear = await request(app).get('/api/v1/configuration/maps');
  assert(mapsClear.status === 200 && publicMapsAfterClear.status === 200 && publicMapsAfterClear.body.status === 'NO CONFIGURADO' && !publicMapsAfterClear.body.apiKey, 'GOOGLE MAPS RESET: retirar la credencial deja el proveedor en NO CONFIGURADO');

  // 14c. Real branding and operational master-data writes: storage, RBAC,
  // tenant scope and audit/outbox persistence are exercised through HTTP.
  const publicBrandingBefore = await request(app).get('/api/v1/configuration/public');
  assert(publicBrandingBefore.status === 200 && publicBrandingBefore.body.branding?.logoUrl === '/assets/brand/gopaq-logo-lockup.png' && !publicBrandingBefore.body.branding?.settings, 'BRANDING PUBLIC CONTRACT: public endpoint exposes only safe visual configuration');
  const tinyPng = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
  const brandingUpdate = await request(app)
    .patch('/api/v1/configuration/branding')
    .set('Authorization', `Bearer ${token}`)
    .send({ expectedVersion: mapsClear.body.version, logo: tinyPng, reason: 'Prueba de identidad visual persistida' });
  const publicBrandingStored = await request(app).get('/api/v1/configuration/public');
  const publicBrandingAsset = await request(app).get('/api/v1/configuration/public/branding/logo');
  const brandingClientWrite = await request(app)
    .patch('/api/v1/configuration/branding')
    .set('Authorization', `Bearer ${demoRes.body.token}`)
    .send({ expectedVersion: brandingUpdate.body.version, favicon: tinyPng });
  assert(brandingUpdate.status === 200 && publicBrandingStored.body.branding?.logoUrl.includes('/configuration/public/branding/logo') && publicBrandingAsset.status === 200 && publicBrandingAsset.headers['content-type']?.startsWith('image/png'), 'BRANDING: PNG is stored outside business rows and served only after backend persistence');
  assert(brandingClientWrite.status === 403, 'BRANDING RBAC: client cannot change tenant identity');
  const brandingClear = await request(app)
    .patch('/api/v1/configuration/branding')
    .set('Authorization', `Bearer ${token}`)
    .send({ expectedVersion: brandingUpdate.body.version, logo: null, favicon: null, reason: 'Restaurar identidad oficial de fixture' });
  assert(brandingClear.status === 200, 'BRANDING RESET: administrator can restore the official transparent assets');

  const createdBranchCode = `TEST-${Date.now()}`;
  const createdBranch = await request(app)
    .post('/api/v1/branches')
    .set('Authorization', `Bearer ${token}`)
    .send({ code: createdBranchCode, name: 'Sucursal de prueba persistida', city: 'Santo Domingo', address: 'Calle de prueba 123', phone: '8095550199', isHub: false });
  const duplicateBranch = await request(app)
    .post('/api/v1/branches')
    .set('Authorization', `Bearer ${token}`)
    .send({ code: createdBranchCode.toLowerCase(), name: 'Duplicada', city: 'Santo Domingo', address: 'Calle de prueba 123' });
  const createdBranchRow = createdBranch.body.branch?.id ? await queryOneAsync<{ id: string; organization_id: string }>('SELECT id, organization_id FROM branches WHERE id = ?', [createdBranch.body.branch.id]) : null;
  const clientBranchCreate = await request(app)
    .post('/api/v1/branches')
    .set('Authorization', `Bearer ${demoRes.body.token}`)
    .send({ code: `CLIENT-${Date.now()}`, name: 'No autorizada', city: 'Santo Domingo', address: 'Calle no autorizada' });
  assert(createdBranch.status === 201 && createdBranchRow?.organization_id === 'org-gopaq' && duplicateBranch.status === 409, 'BRANCH MASTER DATA: admin creates a durable tenant branch and duplicate codes are rejected');
  assert(clientBranchCreate.status === 403, 'BRANCH MASTER DATA RBAC: client cannot create a branch');

  const createdDriver = await request(app)
    .post('/api/v1/drivers')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Conductor de prueba persistido', phone: '8095550188', licenseNumber: `LIC-${Date.now()}`, vehicleType: 'Van', vehiclePlate: `TEST-${Date.now()}`, branchId: createdBranch.body.branch?.id });
  const createdDriverRow = createdDriver.body.driver?.id ? await queryOneAsync<{ id: string; organization_id: string; branch_id: string }>('SELECT id, organization_id, branch_id FROM drivers WHERE id = ?', [createdDriver.body.driver.id]) : null;
  const clientDriverCreate = await request(app)
    .post('/api/v1/drivers')
    .set('Authorization', `Bearer ${demoRes.body.token}`)
    .send({ name: 'No autorizado', phone: '8095550177', licenseNumber: `CLIENT-LIC-${Date.now()}`, vehicleType: 'Van', vehiclePlate: `CLIENT-${Date.now()}`, branchId: createdBranch.body.branch?.id });
  assert(createdDriver.status === 201 && createdDriverRow?.organization_id === 'org-gopaq' && createdDriverRow?.branch_id === createdBranch.body.branch?.id, 'DRIVER MASTER DATA: admin creates a durable driver assigned to an owned branch');
  assert(clientDriverCreate.status === 403, 'DRIVER MASTER DATA RBAC: client cannot create operational drivers');

  const branchLogoUpdate = await request(app)
    .patch(`/api/v1/branches/${createdBranch.body.branch?.id}`)
    .set('Authorization', `Bearer ${token}`)
    .send({ logo: tinyPng, province: 'Distrito Nacional', sector: 'Centro', postalCode: '10101', branchType: 'agency' });
  const branchLogoAsset = await request(app)
    .get(`/api/v1/branches/${createdBranch.body.branch?.id}/logo`)
    .set('Authorization', `Bearer ${token}`);
  assert(branchLogoUpdate.status === 200 && branchLogoAsset.status === 200 && branchLogoAsset.headers['content-type']?.startsWith('image/png'), 'BRANCH BRANDING: logo and operational metadata persist outside the branch row blob');

  const clientDirectory = await request(app)
    .get('/api/v1/clients?q=Cliente&status=active&page=1&limit=10')
    .set('Authorization', `Bearer ${token}`);
  const supportSession = clientDirectory.body.clients?.find((client: any) => client.email === testEmail);
  const supportStart = supportSession ? await request(app).post(`/api/v1/clients/${supportSession.id}/support-session`).set('Authorization', `Bearer ${token}`) : { status: 0, body: {} };
  const supportRead = supportStart.body.token ? await request(app).get('/api/v1/clients').set('Authorization', `Bearer ${supportStart.body.token}`) : { status: 0, body: {} };
  const supportWrite = supportStart.body.token ? await request(app).post('/api/v1/shipments').set('Authorization', `Bearer ${supportStart.body.token}`).send({ serviceType: 'local', origin: { city: 'Santo Domingo', address: 'Calle A' }, destination: { city: 'Santo Domingo', address: 'Calle B' }, package: { weightKg: 1, lengthCm: 10, widthCm: 10, heightCm: 10 } }) : { status: 0, body: {} };
  assert(clientDirectory.status === 200 && clientDirectory.body.pagination?.total >= 1 && supportStart.status === 200 && supportStart.body.support?.readOnly === true && supportRead.status === 200 && supportRead.body.clients?.length === 1 && supportWrite.status === 403, 'CLIENT ADMIN: filtered directory, audited read-only support session and write protection work');

  const zoneCreate = await request(app)
    .post('/api/v1/dangerous-zones')
    .set('Authorization', `Bearer ${token}`)
    .send({ name: 'Zona de prueba geográfica', description: 'Prueba persistente', riskLevel: 'alto', country: 'DO', province: 'Distrito Nacional', city: 'Santo Domingo', sector: 'Ensanche', latitude: 18.4861, longitude: -69.9312, radiusM: 750, surchargeAmount: 85, restrictionPolicy: 'Requiere revisión', alertReason: 'Prueba de seguridad' });
  const zonesRead = await request(app).get('/api/v1/dangerous-zones').set('Authorization', `Bearer ${token}`);
  const clientZoneWrite = await request(app).post('/api/v1/dangerous-zones').set('Authorization', `Bearer ${demoRes.body.token}`).send({ name: 'No autorizada', riskLevel: 'alto', city: 'Santo Domingo', latitude: 18, longitude: -69, restrictionPolicy: 'x' });
  assert(zoneCreate.status === 201 && zonesRead.status === 200 && zonesRead.body.zones.some((zone: any) => zone.id === zoneCreate.body.zone?.id) && clientZoneWrite.status === 403, 'DANGEROUS ZONES: tenant-scoped point/radius management and RBAC persist correctly');

  const rateCreate = await request(app)
    .post('/api/v1/rates')
    .set('Authorization', `Bearer ${token}`)
    .send({ ruleCode: `TEST-RATE-${Date.now()}`, serviceType: 'local', originZone: '*', destZone: '*', baseRate: 150, minCharge: 150, pricingMode: 'hybrid', weightUnit: 'lb', includedWeight: 1, additionalWeightStep: 1, additionalWeightRate: 50, includedDistanceKm: 3, distanceRate: 25, tiers: [{ min: 0, max: 5, price: 250 }, { min: 6, max: 10, price: 400 }], surcharges: { night: { type: 'percent', value: 10 } } });
  const rateRead = await request(app).get('/api/v1/rates?serviceType=local').set('Authorization', `Bearer ${token}`);
  const rateSimulation = await request(app).post('/api/v1/rates/simulate').set('Authorization', `Bearer ${token}`).send({ serviceType: 'local', originCity: 'Santo Domingo', destCity: 'Santo Domingo', weightKg: 2, lengthCm: 20, widthCm: 20, heightCm: 10, distanceKm: 5 });
  assert(rateCreate.status === 201 && rateRead.status === 200 && rateRead.body.rates.some((rate: any) => rate.id === rateCreate.body.rate?.id) && rateSimulation.status === 200 && rateSimulation.body.quote?.ruleCode, 'RATES ENGINE: flexible rule persistence and backend tariff simulation return the applied rule');

  // 15. Real Quotes & Pricing Engine
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

  const specialKey = `special-${Date.now()}`;
  const movingOrder = await request(app).post('/api/v1/moving/orders').set('Authorization', `Bearer ${demoRes.body.token}`).set('Idempotency-Key', specialKey).send({ origin: { name: 'Origen Demo', address: 'Origen demo', city: 'Santo Domingo', country: 'DO' }, destination: { name: 'Destino Demo', address: 'Destino demo', city: 'Santo Domingo', country: 'DO' }, movingDate: '2026-12-15', volumeM3: 12, floors: 2, hasElevator: false, crewCount: 3, distanceKm: 18, inventory: [{ name: 'Caja', quantity: 2 }] });
  const movingReplay = await request(app).post('/api/v1/moving/orders').set('Authorization', `Bearer ${demoRes.body.token}`).set('Idempotency-Key', specialKey).send({ origin: { name: 'Origen Demo', address: 'Origen demo', city: 'Santo Domingo', country: 'DO' }, destination: { name: 'Destino Demo', address: 'Destino demo', city: 'Santo Domingo', country: 'DO' }, movingDate: '2026-12-15', volumeM3: 12, floors: 2, hasElevator: false, crewCount: 3, distanceKm: 18, inventory: [{ name: 'Caja', quantity: 2 }] });
  const heavyOrder = await request(app).post('/api/v1/heavy-cargo/orders').set('Authorization', `Bearer ${demoRes.body.token}`).set('Idempotency-Key', `heavy-${Date.now()}`).send({ cargoType: 'pallets', description: 'Carga demo para validación', palletsCount: 2, totalWeightKg: 1500, lengthM: 2, widthM: 1.2, heightM: 1.4, equipmentRequired: 'Montacargas', origin: { name: 'Origen Demo', address: 'Origen demo', city: 'Santo Domingo', country: 'DO' }, destination: { name: 'Destino Demo', address: 'Destino demo', city: 'Santo Domingo', country: 'DO' }, scheduledDate: '2026-12-16' });
  const demoAdmin = await request(app).post('/api/v1/auth/demo').send({ area: 'super-admin' });
  const specialRoute = await request(app).post('/api/v1/routes').set('Authorization', `Bearer ${demoAdmin.body.token}`).send({ name: 'Ruta especial demo', branchId: 'br-demo-central', driverId: 'drv-demo', jobIds: [movingOrder.body.order?.jobId, heavyOrder.body.order?.jobId] });
  const specialDispatch = specialRoute.body.route?.id ? await request(app).post(`/api/v1/routes/${specialRoute.body.route.id}/dispatch`).set('Authorization', `Bearer ${demoAdmin.body.token}`).send({}) : { status: 0, body: {} };
  const demoDriver = await request(app).post('/api/v1/auth/demo').send({ area: 'driver' });
  const specialManifest = specialRoute.body.route?.id ? await request(app).get('/api/v1/drivers/active-manifest').set('Authorization', `Bearer ${demoDriver.body.token}`) : { status: 0, body: {} };
  const specialStop = specialManifest.body.stops?.[0];
  const specialComplete = specialStop ? await request(app).post(`/api/v1/drivers/stops/${specialStop.id}/complete`).set('Authorization', `Bearer ${demoDriver.body.token}`).set('Idempotency-Key', `special-pod-${Date.now()}`).send({ pod: { recipientName: 'Receptor Demo', signatureUrl: 'storage://demo-signature' } }) : { status: 0, body: {} };
  const movingStatus = movingOrder.body.order?.jobId ? queryOne<{ status: string }>('SELECT status FROM logistics_jobs WHERE id = ?', [movingOrder.body.order.jobId]) : null;
  assert(movingOrder.status === 201 && movingReplay.status === 201 && movingOrder.body.order?.id === movingReplay.body.order?.id && heavyOrder.status === 201, 'SPECIAL SERVICES: moving and heavy-cargo bookings persist with idempotency');
  assert(specialRoute.status === 201 && specialDispatch.status === 200 && specialManifest.status === 200 && specialComplete.status === 200 && movingStatus?.status === 'completed', 'UNIFIED JOB FLOW: special service jobs can be dispatched and completed with real POD');
  const specialTracking = await request(app).get(`/api/v1/tracking/${movingOrder.body.order?.trackingNumber}`);
  assert(specialTracking.status === 200 && specialTracking.body.shipment.kind === 'logistics_job' && specialTracking.body.shipment.status === 'completed' && specialTracking.body.shipment.events.some((event: any) => event.status === 'completed'), 'CANONICAL TRACKING: special service completion is visible through the public tracking engine');

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
