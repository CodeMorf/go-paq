export type AuthArea = 'super-admin' | 'portal' | 'sucursal' | 'driver';

export const ROLE_GROUPS: Record<AuthArea, readonly string[]> = {
  'super-admin': ['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS'],
  portal: ['CLIENT', 'CUSTOMER'],
  sucursal: ['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'],
  driver: ['DRIVER', 'COURIER']
};

export const ROLE_SCOPES: Record<string, readonly string[]> = {
  SUPER_ADMIN: ['*'],
  OWNER: ['*'],
  ADMIN: ['*'],
  OPERATIONS: [
    'shipments:read', 'shipments:write', 'tracking:read', 'quotes:read', 'quotes:write',
    'routes:read', 'routes:write', 'drivers:read', 'branches:read', 'clients:read',
    'clients:write',
    'international:read', 'moving:read', 'moving:write', 'heavy_cargo:read', 'heavy_cargo:write',
    'cod:read', 'cod:reconcile', 'cod:settle', 'webhooks:read', 'webhooks:write'
  ],
  CLIENT: ['shipments:read', 'shipments:write', 'tracking:read', 'quotes:read', 'quotes:write', 'clients:read', 'international:read', 'international:write', 'moving:read', 'moving:write', 'heavy_cargo:read', 'heavy_cargo:write', 'api_keys:read', 'api_keys:write', 'webhooks:read', 'webhooks:write'],
  CUSTOMER: ['shipments:read', 'shipments:write', 'tracking:read', 'quotes:read', 'quotes:write', 'clients:read', 'international:read', 'international:write', 'moving:read', 'moving:write', 'heavy_cargo:read', 'heavy_cargo:write'],
  BRANCH_MANAGER: ['shipments:read', 'shipments:write', 'tracking:read', 'quotes:read', 'quotes:write', 'routes:read', 'routes:write', 'drivers:read', 'branches:read', 'branches:write', 'clients:write', 'moving:read', 'heavy_cargo:read', 'cod:read', 'cod:receive', 'cod:reconcile', 'cod:collect'],
  MANAGER: ['shipments:read', 'shipments:write', 'tracking:read', 'quotes:read', 'routes:read', 'routes:write', 'drivers:read', 'branches:read', 'moving:read', 'heavy_cargo:read', 'cod:read', 'cod:receive'],
  COUNTER: ['shipments:read', 'shipments:write', 'tracking:read', 'quotes:read', 'branches:read', 'cod:read', 'cod:receive', 'cod:collect'],
  DISPATCHER: ['shipments:read', 'tracking:read', 'routes:read', 'routes:write', 'drivers:read', 'branches:read'],
  WAREHOUSE: ['shipments:read', 'tracking:read', 'branches:read', 'branches:write'],
  CASHIER: ['shipments:read', 'tracking:read', 'branches:read', 'branches:write', 'cod:read', 'cod:receive', 'cod:collect'],
  DRIVER: ['shipments:read', 'tracking:read', 'routes:read', 'drivers:read', 'driver:read', 'driver:write', 'cod:collect'],
  COURIER: ['shipments:read', 'tracking:read', 'routes:read', 'drivers:read', 'driver:read', 'driver:write', 'cod:collect']
};

export function normalizeRole(role?: string): string {
  return String(role || '').trim().toUpperCase().replace(/[\s-]+/g, '_');
}

export function isRoleAllowedForArea(role: string | undefined, area: AuthArea): boolean {
  return ROLE_GROUPS[area].includes(normalizeRole(role));
}

export function roleHasScope(role: string | undefined, scope: string): boolean {
  const scopes = ROLE_SCOPES[normalizeRole(role)] || [];
  return scopes.includes('*') || scopes.includes(scope);
}

export function defaultAreaForRole(role?: string): AuthArea {
  const normalized = normalizeRole(role);
  if (ROLE_GROUPS['super-admin'].includes(normalized)) return 'super-admin';
  if (ROLE_GROUPS.driver.includes(normalized)) return 'driver';
  if (ROLE_GROUPS.sucursal.includes(normalized)) return 'sucursal';
  return 'portal';
}
