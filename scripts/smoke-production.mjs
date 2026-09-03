const baseUrl = process.env.SMOKE_BASE_URL || process.argv[2];

if (!baseUrl) {
  console.error('Uso: SMOKE_BASE_URL=https://gopaq.lat npm run smoke');
  process.exit(2);
}

const origin = new URL(baseUrl).origin;
const failures = [];

async function request(path, init = {}, expectedStatus = 200) {
  const response = await fetch(new URL(path, origin), {
    ...init,
    headers: { accept: 'application/json', ...(init.headers || {}) }
  });
  if (response.status !== expectedStatus) {
    throw new Error(`${init.method || 'GET'} ${path} respondió ${response.status}; esperado ${expectedStatus}`);
  }
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) return response.json();
  return response.text();
}

async function check(label, callback) {
  try {
    await callback();
    console.log(`PASS ${label}`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'fallo_no_identificado';
    failures.push(`${label}: ${message}`);
    console.error(`FAIL ${label}: ${message}`);
  }
}

await check('sitio público', async () => {
  const html = await request('/');
  if (typeof html !== 'string' || !html.includes('id="root"')) throw new Error('el build público no fue servido');
});

await check('health', async () => {
  const body = await request('/api/health');
  if (body.status !== 'ok' || !body.version) throw new Error('health incompleto');
});

await check('readiness', async () => {
  const body = await request('/api/ready');
  if (body.status !== 'ready' || body.database?.ok !== true || body.redis?.ok !== true || body.migrations !== true) {
    throw new Error('readiness no confirmó DB, Redis y migraciones');
  }
  if (Object.prototype.hasOwnProperty.call(body.database || {}, 'error') || Object.prototype.hasOwnProperty.call(body.redis || {}, 'error')) {
    throw new Error('readiness expone detalles internos');
  }
});

await check('OpenAPI', async () => {
  const body = await request('/api/v1/docs/openapi.json');
  if (body.openapi !== '3.1.0' || !body.paths?.['/auth/login'] || !body.paths?.['/quotes']) throw new Error('contrato OpenAPI incompleto');
});

await check('sucursales públicas', async () => {
  const body = await request('/api/v1/branches/public');
  if (body.success !== true || !Array.isArray(body.branches)) throw new Error('respuesta de sucursales inválida');
});

await check('geografía dominicana', async () => {
  const body = await request('/api/v1/geography?country=DO');
  const provinces = Array.isArray(body.provinces) ? body.provinces : [];
  const zoneCount = provinces.reduce((total, province) => total + (Array.isArray(province.zones) ? province.zones.length : 0), 0);
  if (!body.success || provinces.length !== 32 || zoneCount !== 96 || provinces.some((province) => !Array.isArray(province.zones) || province.zones.length !== 3)) {
    throw new Error('el catálogo no contiene 32 provincias y 96 zonas');
  }
});

await check('estado público de mapas', async () => {
  const body = await request('/api/v1/configuration/maps');
  if (body.success !== true || !['CONFIGURADO', 'NO CONFIGURADO'].includes(body.status)) throw new Error('estado de mapas no es explícito');
});

await check('cotización real', async () => {
  const body = await request('/api/v1/quotes', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ serviceType: 'nacional', originCity: 'Santo Domingo', destCity: 'Santiago', weightKg: 1, lengthCm: 20, widthCm: 15, heightCm: 10 })
  });
  if (body.success !== true || !body.quote?.ruleCode || Number(body.quote.total) <= 0) throw new Error('el motor no devolvió una tarifa persistida');
});

for (const page of ['/', '/servicios', '/rastreo', '/cotizar', '/sucursales', '/nosotros', '/contacto', '/super-admin/login', '/portal/login', '/sucursal/login', '/driver/login']) {
  await check(`ruta ${page}`, async () => {
    const html = await request(page);
    if (typeof html !== 'string' || !html.includes('id="root"')) throw new Error('ruta sin build SPA');
  });
}

const roleChecks = [
  ['super-admin', 'SMOKE_SUPER_ADMIN_EMAIL', 'SMOKE_SUPER_ADMIN_PASSWORD', ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS']],
  ['portal', 'SMOKE_CLIENT_EMAIL', 'SMOKE_CLIENT_PASSWORD', ['CLIENT', 'CUSTOMER']],
  ['sucursal', 'SMOKE_BRANCH_EMAIL', 'SMOKE_BRANCH_PASSWORD', ['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER']],
  ['driver', 'SMOKE_DRIVER_EMAIL', 'SMOKE_DRIVER_PASSWORD', ['DRIVER', 'COURIER']]
];
const suppliedRoleChecks = roleChecks.filter(([, emailKey, passwordKey]) => process.env[emailKey] || process.env[passwordKey]);
if (process.env.SMOKE_AUTH_REQUIRED === 'true' && suppliedRoleChecks.length !== roleChecks.length) {
  failures.push('autenticación: faltan credenciales de los cuatro portales');
  console.error('FAIL autenticación: SMOKE_AUTH_REQUIRED exige los cuatro portales');
}

const authenticated = [];
for (const [area, emailKey, passwordKey, allowedRoles] of suppliedRoleChecks) {
  await check(`login ${area}`, async () => {
    const body = await request('/api/v1/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: process.env[emailKey], password: process.env[passwordKey], area })
    });
    if (body.success !== true || !body.token || !allowedRoles.includes(String(body.user?.role || '').toUpperCase())) throw new Error('rol o sesión no confirmados');
    const me = await request('/api/v1/auth/me', { headers: { authorization: `Bearer ${body.token}` } });
    if (me.success !== true || !allowedRoles.includes(String(me.user?.role || '').toUpperCase())) throw new Error('auth/me no confirmó el rol');
    authenticated.push({ area, token: body.token, role: String(me.user.role).toUpperCase() });
  });
}

const admin = authenticated.find((entry) => entry.area === 'super-admin');
if (admin) {
  await check('configuración administrativa protegida', async () => {
    const body = await request('/api/v1/configuration', { headers: { authorization: `Bearer ${admin.token}` } });
    if (body.success !== true || !body.settings) throw new Error('configuración no disponible para administrador');
  });
}

if (authenticated.some((entry) => entry.area === 'portal')) {
  const client = authenticated.find((entry) => entry.area === 'portal');
  await check('aislamiento de configuración para cliente', async () => {
    await request('/api/v1/configuration', { headers: { authorization: `Bearer ${client.token}` } }, 403);
  });
}

if (failures.length) {
  console.error(`\nSmoke fallido: ${failures.length} comprobación(es).`);
  process.exit(1);
}
console.log('\nSmoke GoPaq completado sin fallos.');
