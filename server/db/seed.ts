import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { initDatabase, initDatabaseAsync, execute, queryOne, executeAsync, queryOneAsync, transactionAsync } from './database';
import { hashPassword } from '../auth/jwt';

export function runSeeds() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('El seed histórico solo está permitido para desarrollo/pruebas. Producción usa seed:production y nunca carga datos fixture.');
  }
  initDatabase();

  const orgCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM organizations');
  if (orgCount && orgCount.count > 0) {
    console.log('Database already initialized with seed data.');
    return;
  }

  console.log('Seeding GoPaq Logistics Platform Database...');

  const passwordHash = bcrypt.hashSync('GoPaq123!', 10);
  const now = new Date().toISOString();

  // 1. Organization
  execute(`
    INSERT INTO organizations (id, name, slug, tax_id, phone, email, currency, country, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `, ['org-gopaq', 'GoPaq Logistics & Courier Global', 'gopaq-global', '131-98765-4', '+1 (809) 555-0100', 'contact@gopaq.com', 'DOP', 'DO', now]);

  // 2. Branches
  const branches = [
    { id: 'br-sdq-central', code: 'SDQ-01', name: 'Sucursal Central Piantini', city: 'Santo Domingo', address: 'Av. Winston Churchill #1099, Piantini', phone: '(809) 555-0101', manager: 'Carlos Mendoza', lat: 18.4735, lng: -69.9405, is_hub: 1 },
    { id: 'br-sdq-oriental', code: 'SDQ-02', name: 'Sucursal Santo Domingo Este', city: 'Santo Domingo Este', address: 'Av. San Vicente de Paúl #45', phone: '(809) 555-0102', manager: 'Ana Rosario', lat: 18.4901, lng: -69.8601, is_hub: 0 },
    { id: 'br-sti-hub', code: 'STI-01', name: 'Hub Cibao Santiago', city: 'Santiago de los Caballeros', address: 'Autopista Duarte Km 2.5', phone: '(809) 555-0103', manager: 'Luis Gómez', lat: 19.4517, lng: -70.6970, is_hub: 1 },
    { id: 'br-puj-express', code: 'PUJ-01', name: 'Agencia Bávaro - Punta Cana', city: 'Punta Cana', address: 'Boulevard Turístico del Este #12', phone: '(809) 555-0104', manager: 'Elena Duarte', lat: 18.5601, lng: -68.3725, is_hub: 0 },
    { id: 'br-mia-hub', code: 'MIA-01', name: 'Hub Internacional Miami (Lockers)', city: 'Miami, FL', address: '8400 NW 25th St, Suite 100, Doral, FL 33198', phone: '+1 (305) 555-0199', manager: 'Robert Miller', lat: 25.7985, lng: -80.3344, is_hub: 1 },
  ];

  for (const b of branches) {
    execute(`
      INSERT INTO branches (id, organization_id, code, name, city, address, phone, manager_name, latitude, longitude, is_hub, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [b.id, 'org-gopaq', b.code, b.name, b.city, b.address, b.phone, b.manager, b.lat, b.lng, b.is_hub, now]);
  }

  // 3. Warehouses & Zones
  const warehouses = [
    { id: 'wh-sdq-main', branch_id: 'br-sdq-central', code: 'W-SDQ', name: 'Almacén Central Santo Domingo', country: 'DO', city: 'Santo Domingo', address: 'Av. Luperón Zona Industrial', cap: 5000 },
    { id: 'wh-mia-main', branch_id: 'br-mia-hub', code: 'W-MIA', name: 'Almacén Internacional Doral Lockers', country: 'US', city: 'Miami', address: '8400 NW 25th St, Doral, FL', cap: 10000 },
  ];

  for (const w of warehouses) {
    execute(`
      INSERT INTO warehouses (id, organization_id, branch_id, code, name, country, city, address, capacity_m3, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [w.id, 'org-gopaq', w.branch_id, w.code, w.name, w.country, w.city, w.address, w.cap, now]);
  }

  // 4. Users (Multi-tenant RBAC)
  const users = [
    { id: 'usr-admin', email: 'admin@gopaq.local', name: 'Ing. Alejandro Tavares', role: 'SUPER_ADMIN', branch_id: 'br-sdq-central', phone: '(809) 555-9001' },
    { id: 'usr-sucursal', email: 'sucursal@gopaq.local', name: 'Mariana Peralta (Cajera Mostrador)', role: 'COUNTER', branch_id: 'br-sdq-central', phone: '(809) 555-9002' },
    { id: 'usr-cliente', email: 'cliente@gopaq.local', name: 'Lic. Roberto Castillo (TechStore RD)', role: 'CLIENT', branch_id: 'br-sdq-central', phone: '(809) 555-9003' },
    { id: 'usr-driver', email: 'driver@gopaq.local', name: 'Ramón Valdez (Chofer Pro)', role: 'DRIVER', branch_id: 'br-sdq-central', phone: '(809) 555-9004' },
    { id: 'usr-dispatcher', email: 'dispatch@gopaq.local', name: 'Fernando Silva (Despacho)', role: 'DISPATCHER', branch_id: 'br-sdq-central', phone: '(809) 555-9005' },
  ];

  for (const u of users) {
    execute(`
      INSERT INTO users (id, organization_id, branch_id, email, password_hash, name, role, phone, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [u.id, 'org-gopaq', u.branch_id, u.email, passwordHash, u.name, u.role, u.phone, now]);
  }

  // 5. Clients
  const clients = [
    { id: 'cli-techstore', name: 'TechStore Dominicana SRL', company: 'TechStore RD', email: 'compras@techstore.do', phone: '(809) 555-3344', rnc: '130-45678-9', tier: 'VIP Gold', credit: 250000, bal: 14500, cod_bal: 48200 },
    { id: 'cli-farmaplus', name: 'Distribuidora FarmaPlus', company: 'FarmaPlus Nacional', email: 'logistica@farmaplus.com.do', phone: '(809) 555-8899', rnc: '131-22334-1', tier: 'Corporativo Platinum', credit: 500000, bal: 42000, cod_bal: 112500 },
    { id: 'cli-boutique', name: 'Boutique Bella Moda', company: 'Bella Moda SRL', email: 'bellamoda@gmail.com', phone: '(829) 555-1212', rnc: '132-77889-0', tier: 'Standard', credit: 50000, bal: 0, cod_bal: 18500 },
  ];

  for (const c of clients) {
    execute(`
      INSERT INTO clients (id, organization_id, branch_id, name, company_name, email, phone, rnc_tax_id, tier, credit_limit, balance, cod_pending_balance, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [c.id, 'org-gopaq', 'br-sdq-central', c.name, c.company, c.email, c.phone, c.rnc, c.tier, c.credit, c.bal, c.cod_bal, now]);
  }

  // 6. Drivers & Vehicles
  const drivers = [
    { id: 'drv-01', user_id: 'usr-driver', name: 'Ramón Valdez', phone: '(809) 555-9004', license: 'LIC-DO-88910', vtype: 'Motocicleta Express', plate: 'K-092384', lat: 18.4735, lng: -69.9405, status: 'en_route', rating: 4.9 },
    { id: 'drv-02', user_id: null, name: 'Héctor Jiménez', phone: '(809) 555-9011', license: 'LIC-DO-77231', vtype: 'Furgoneta 1.5T', plate: 'L-304912', lat: 18.4850, lng: -69.9320, status: 'available', rating: 4.8 },
    { id: 'drv-03', user_id: null, name: 'Danilo Almonte', phone: '(809) 555-9012', license: 'LIC-DO-55412', vtype: 'Camión 3.5T', plate: 'L-119284', lat: 18.4610, lng: -69.9150, status: 'available', rating: 4.95 },
  ];

  for (const d of drivers) {
    execute(`
      INSERT INTO drivers (id, organization_id, branch_id, user_id, name, phone, license_number, vehicle_type, vehicle_plate, status, current_lat, current_lng, speed, heading, battery, rating, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 35, 90, 92, ?, 1, ?)
    `, [d.id, 'org-gopaq', 'br-sdq-central', d.user_id, d.name, d.phone, d.license, d.vtype, d.plate, d.status, d.lat, d.lng, d.rating, now]);
  }

  // 7. Dangerous Zones
  const zones = [
    { id: 'dz-capotillo', name: 'Capotillo / 42', city: 'Santo Domingo', risk: 'high', surcharge: 150, policy: 'Requiere escolta o entrega solo en horario diurno (08:00 - 16:00)' },
    { id: 'dz-guandules', name: 'Los Guandules Ribera', city: 'Santo Domingo', risk: 'medium', surcharge: 75, policy: 'Punto de entrega seguro en avenida principal' },
    { id: 'dz-cienegas', name: 'La Ciénaga Sur', city: 'Santo Domingo', risk: 'high', surcharge: 150, policy: 'Solo pagos digitales o entregas en punto comercial' },
  ];

  for (const z of zones) {
    execute(`
      INSERT INTO dangerous_zones (id, organization_id, name, city, risk_level, surcharge_amount, restriction_policy, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?)
    `, [z.id, 'org-gopaq', z.name, z.city, z.risk, z.surcharge, z.policy, now]);
  }

  // 8. Rates Matrix
  const rates = [
    { id: 'rate-local', stype: 'local', oz: 'SDQ_METRO', dz: 'SDQ_METRO', base: 175, per_kg: 25, per_vol: 35, min: 175 },
    { id: 'rate-nacional', stype: 'nacional', oz: 'SDQ_METRO', dz: 'CIBAO_CENTRAL', base: 320, per_kg: 45, per_vol: 55, min: 320 },
    { id: 'rate-express', stype: 'express', oz: 'SDQ_METRO', dz: 'SDQ_METRO', base: 290, per_kg: 35, per_vol: 45, min: 290 },
    { id: 'rate-intl-air', stype: 'internacional', oz: 'MIA_USA', dz: 'SDQ_METRO', base: 450, per_kg: 180, per_vol: 220, min: 450 },
    { id: 'rate-moving', stype: 'mudanza', oz: 'SDQ_METRO', dz: 'SDQ_METRO', base: 4500, per_kg: 0, per_vol: 850, min: 4500 },
    { id: 'rate-heavy', stype: 'carga_pesada', oz: 'SDQ_METRO', dz: 'CIBAO_CENTRAL', base: 8500, per_kg: 18, per_vol: 500, min: 8500 },
  ];

  for (const r of rates) {
    execute(`
      INSERT INTO rates_matrix (id, organization_id, service_type, origin_zone, dest_zone, base_rate, per_kg_rate, per_vol_rate, min_charge, currency, active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'DOP', 1, ?)
    `, [r.id, 'org-gopaq', r.stype, r.oz, r.dz, r.base, r.per_kg, r.per_vol, r.min, now]);
  }

  // 9. Initial Real Shipments
  const shipments = [
    {
      id: 'shp-8924',
      tracking: 'GP-892410',
      stype: 'local',
      status: 'out_for_delivery',
      origin: { name: 'TechStore Dominicana', phone: '(809) 555-3344', address: 'Av. 27 de Febrero #200', city: 'Santo Domingo', sector: 'Naco' },
      dest: { name: 'Dra. María Elena Vargas', phone: '(829) 555-8912', address: 'Calle Andrés Julio Aybar #42, Apt 4B', city: 'Santo Domingo', sector: 'Piantini' },
      pkg: { weightKg: 1.8, lengthCm: 25, widthCm: 15, heightCm: 10, category: 'Electrónica', declaredValueUsd: 350 },
      pricing: { base: 175, weightCost: 45, insurance: 50, total: 270 },
      cost: 270,
      cod: 4850,
      cod_curr: 'DOP',
      driver_id: 'drv-01',
    },
    {
      id: 'shp-8925',
      tracking: 'GP-892520',
      stype: 'nacional',
      status: 'in_transit',
      origin: { name: 'Distribuidora FarmaPlus', phone: '(809) 555-8899', address: 'Av. Luperón #88', city: 'Santo Domingo', sector: 'Herrera' },
      dest: { name: 'Farmacia La Unión', phone: '(809) 555-7711', address: 'Calle del Sol #102', city: 'Santiago', sector: 'Centro' },
      pkg: { weightKg: 12.5, lengthCm: 50, widthCm: 40, heightCm: 30, category: 'Medicamentos', declaredValueUsd: 1200 },
      pricing: { base: 320, weightCost: 450, insurance: 150, total: 920 },
      cost: 920,
      cod: 18400,
      cod_curr: 'DOP',
      driver_id: 'drv-02',
    },
    {
      id: 'shp-8926',
      tracking: 'GP-892630',
      stype: 'express',
      status: 'picked_up',
      origin: { name: 'Boutique Bella Moda', phone: '(829) 555-1212', address: 'Agora Mall, Nivel 2', city: 'Santo Domingo', sector: 'Ensanche La Fe' },
      dest: { name: 'Lic. Pamela Guzmán', phone: '(809) 555-6677', address: 'Av. Anacaona #75, Torre Bella Vista 12A', city: 'Santo Domingo', sector: 'Bella Vista' },
      pkg: { weightKg: 0.8, lengthCm: 20, widthCm: 15, heightCm: 5, category: 'Ropa / Moda', declaredValueUsd: 140 },
      pricing: { base: 290, weightCost: 0, insurance: 30, total: 320 },
      cost: 320,
      cod: 3200,
      cod_curr: 'DOP',
      driver_id: 'drv-01',
    },
    {
      id: 'shp-8927',
      tracking: 'GP-892740',
      stype: 'internacional',
      status: 'customs',
      origin: { name: 'Amazon Warehouse MIA', phone: '+1 (305) 555-0100', address: '8400 NW 25th St', city: 'Miami', country: 'US' },
      dest: { name: 'Lic. Roberto Castillo (TechStore)', phone: '(809) 555-3344', address: 'Casillero GP-10482, Piantini', city: 'Santo Domingo', country: 'DO' },
      pkg: { weightKg: 4.2, lengthCm: 35, widthCm: 25, heightCm: 15, category: 'Courier USA', declaredValueUsd: 499 },
      pricing: { base: 450, weightCost: 650, customs: 380, total: 1480 },
      cost: 1480,
      cod: 0,
      cod_curr: 'DOP',
      driver_id: null,
    }
  ];

  for (const s of shipments) {
    execute(`
      INSERT INTO shipments (
        id, organization_id, branch_id, client_id, tracking_number, service_type, status,
        origin_json, destination_json, package_json, pricing_json, shipping_cost, currency,
        cod_amount, cod_currency, cod_collected, assigned_driver_id, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'DOP', ?, ?, 0, ?, ?, ?)
    `, [
      s.id, 'org-gopaq', 'br-sdq-central', 'cli-techstore', s.tracking, s.stype, s.status,
      JSON.stringify(s.origin), JSON.stringify(s.dest), JSON.stringify(s.pkg), JSON.stringify(s.pricing),
      s.cost, s.cod, s.cod_curr, s.driver_id, now, now
    ]);

    // Initial Event
    execute(`
      INSERT INTO shipment_events (id, shipment_id, status, location, description, actor_type, created_at)
      VALUES (?, ?, ?, ?, ?, 'system', ?)
    `, [`evt-${s.id}-1`, s.id, s.status, s.origin.city, `Envío en estado: ${s.status}`, now]);

    // COD Transaction if applicable
    if (s.cod > 0) {
      execute(`
        INSERT INTO cod_transactions (
          id, organization_id, shipment_id, driver_id, branch_id, client_id, amount, currency, status, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending_collection', ?)
      `, [`cod-tx-${s.id}`, 'org-gopaq', s.id, s.driver_id, 'br-sdq-central', 'cli-techstore', s.cod, s.cod_curr, now]);
    }
  }

  // 10. International Lockers
  execute(`
    INSERT INTO international_lockers (id, organization_id, client_id, locker_code, us_address, es_address, it_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    'lck-10482', 'org-gopaq', 'cli-techstore', 'GP-10482',
    '8400 NW 25th St, Suite GP-10482, Doral, FL 33198',
    'Calle Barajas #44, Casillero GP-10482, 28042 Madrid, España',
    'Via Malpensa #12, Locker GP-10482, 20121 Milano, Italia',
    now
  ]);

  // 11. API Keys (Hasheadas con SHA-256)
  execute(`
    INSERT INTO api_keys (id, organization_id, client_id, key_name, key_prefix, key_hash, mode, scopes, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, 'live', ?, 1, ?)
  `, [
    'apk-live-01', 'org-gopaq', 'cli-techstore', 'Shopify Production Key', 'gp_live_',
    'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'shipments:read,shipments:write,tracking:read,quotes:read,webhooks:write',
    now
  ]);

  console.log('✅ Seed completed successfully with 100% real persistent relational data.');
}

/**
 * Demo is an explicit, isolated dataset. It is never called by the server
 * startup path in production. The demo endpoint issues temporary sessions;
 * no shared demo password is embedded in the repository.
 */
export async function runDemoSeeds() {
  await initDatabaseAsync();
  const now = new Date().toISOString();
  const randomPasswordHash = hashPassword(crypto.randomBytes(32).toString('hex'));

  await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO organizations (id, name, slug, currency, country, active, created_at, updated_at) VALUES ('org-demo', 'GoPaq Demo', 'gopaq-demo', 'DOP', 'DO', 1, ?, ?) ON CONFLICT (id) DO NOTHING`, [now, now]);
    await tx.execute(`INSERT INTO branches (id, organization_id, code, name, city, address, phone, manager_name, latitude, longitude, is_hub, active, created_at, updated_at) VALUES ('br-demo-central', 'org-demo', 'DEMO-01', 'Sucursal Demo', 'Santo Domingo', 'Entorno de demostración', NULL, 'Demo GoPaq', 18.4861, -69.9312, 1, 1, ?, ?) ON CONFLICT (id) DO NOTHING`, [now, now]);

    const demoUsers = [
      ['usr-demo-admin', 'demo.admin@gopaq.local', 'Demo Super Admin', 'SUPER_ADMIN'],
      ['usr-demo-client', 'demo.client@gopaq.local', 'Demo Cliente', 'CLIENT'],
      ['usr-demo-branch', 'demo.branch@gopaq.local', 'Demo Sucursal', 'BRANCH_MANAGER'],
      ['usr-demo-driver', 'demo.driver@gopaq.local', 'Demo Driver', 'DRIVER']
    ];
    for (const [id, email, name, role] of demoUsers) {
      await tx.execute(`INSERT INTO users (id, organization_id, branch_id, email, password_hash, name, role, phone, active, created_at, updated_at) VALUES (?, 'org-demo', 'br-demo-central', ?, ?, ?, ?, NULL, 1, ?, ?) ON CONFLICT (id) DO NOTHING`, [id, email, randomPasswordHash, name, role, now, now]);
    }
    await tx.execute(`INSERT INTO clients (id, organization_id, branch_id, name, company_name, email, phone, tier, credit_limit, balance, cod_pending_balance, active, created_at, updated_at) VALUES ('cli-demo', 'org-demo', 'br-demo-central', 'Cliente Demo', 'Comercio Demo', 'demo.client@gopaq.local', '', 'Demo', 0, 0, 0, 1, ?, ?) ON CONFLICT (id) DO NOTHING`, [now, now]);
    await tx.execute(`INSERT INTO drivers (id, organization_id, branch_id, user_id, name, email, phone, license_number, vehicle_type, vehicle_plate, status, current_lat, current_lng, rating, active, created_at, updated_at) VALUES ('drv-demo', 'org-demo', 'br-demo-central', 'usr-demo-driver', 'Demo Driver', 'demo.driver@gopaq.local', '', 'DEMO', 'Furgoneta Demo', 'DEMO-000', 'available', 18.4861, -69.9312, 5, 1, ?, ?) ON CONFLICT (id) DO NOTHING`, [now, now]);
    await tx.execute(`INSERT INTO rates_matrix (id, organization_id, service_type, origin_zone, dest_zone, base_rate, per_kg_rate, per_vol_rate, min_charge, currency, active, created_at) VALUES ('rate-demo-local', 'org-demo', 'local', 'DEMO', 'DEMO', 100, 20, 20, 100, 'DOP', 1, ?) ON CONFLICT (id) DO NOTHING`, [now]);
    await tx.execute(`INSERT INTO international_lockers (id, organization_id, client_id, locker_code, us_address, es_address, it_address, created_at) VALUES ('lck-demo', 'org-demo', 'cli-demo', 'DEMO-LOCKER', 'Entorno DEMO · dirección no operativa', 'Entorno DEMO · dirección no operativa', 'Entorno DEMO · dirección no operativa', ?) ON CONFLICT (id) DO NOTHING`, [now]);
  });
  console.log('✅ Demo tenant ready: org-demo (isolated, resettable, no external sends).');
}

export async function resetDemoTenant() {
  await initDatabaseAsync();
  await transactionAsync(async (tx) => {
    await tx.execute(`DELETE FROM password_reset_tokens WHERE user_id IN (SELECT id FROM users WHERE organization_id = 'org-demo')`);
    await tx.execute(`DELETE FROM sessions WHERE organization_id = 'org-demo'`);
    await tx.execute(`DELETE FROM audit_logs WHERE organization_id = 'org-demo'`);
    await tx.execute(`DELETE FROM idempotency_keys WHERE organization_id = 'org-demo'`);
    await tx.execute(`DELETE FROM outbox_events WHERE organization_id = 'org-demo'`);
    await tx.execute(`DELETE FROM organizations WHERE id = 'org-demo'`);
  });
  console.log('✅ Demo tenant reset: org-demo only.');
}
