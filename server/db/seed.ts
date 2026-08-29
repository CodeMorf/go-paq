import bcrypt from 'bcryptjs';
import { initDatabase, execute, queryOne } from './database';

export function runSeeds() {
  initDatabase();

  const orgCount = queryOne<{ count: number }>('SELECT COUNT(*) as count FROM organizations');
  if (orgCount && orgCount.count > 0) {
    console.log('[DB] Seed skipped: existing data detected.');
    return;
  }

  const now = new Date().toISOString();
  const adminPassword = bcrypt.hashSync(process.env.GOPAQ_SEED_ADMIN_PASSWORD || 'GoPaq123!', 10);
  const branchPassword = bcrypt.hashSync(process.env.GOPAQ_SEED_BRANCH_PASSWORD || 'Sucursal123!', 10);
  const clientPassword = bcrypt.hashSync(process.env.GOPAQ_SEED_CLIENT_PASSWORD || 'Cliente123!', 10);
  const driverPassword = bcrypt.hashSync(process.env.GOPAQ_SEED_DRIVER_PASSWORD || 'Driver123!', 10);

  execute(`INSERT INTO organizations (id, name, slug, tax_id, phone, email, currency, country, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
    'org-gopaq', 'GoPaq Logistics', 'gopaq-global', '131000000', '809-555-0100', 'admin@gopaq.local', 'DOP', 'DO', now, now
  ]);

  execute(`INSERT INTO branches (id, organization_id, code, name, city, address, phone, manager_name, latitude, longitude, is_hub, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
    'br-sdq-central', 'org-gopaq', 'SDQ-CENTRAL', 'Santo Domingo Central', 'Santo Domingo', 'Av. 27 de Febrero, Santo Domingo', '809-555-0101', 'Gerencia GoPaq', 18.4861, -69.9312, 1, now, now
  ]);

  execute(`INSERT INTO users (id, organization_id, branch_id, email, password_hash, name, role, phone, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
    'usr-admin', 'org-gopaq', null, 'admin@gopaq.local', adminPassword, 'Administrador GoPaq', 'SUPER_ADMIN', '809-555-0100', now, now
  ]);
  execute(`INSERT INTO users (id, organization_id, branch_id, email, password_hash, name, role, phone, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
    'usr-branch', 'org-gopaq', 'br-sdq-central', 'sucursal@gopaq.local', branchPassword, 'Operador Sucursal', 'BRANCH_MANAGER', '809-555-0102', now, now
  ]);
  execute(`INSERT INTO users (id, organization_id, branch_id, email, password_hash, name, role, phone, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
    'usr-client', 'org-gopaq', null, 'cliente@gopaq.local', clientPassword, 'Cliente GoPaq', 'CLIENT', '809-555-0103', now, now
  ]);
  execute(`INSERT INTO users (id, organization_id, branch_id, email, password_hash, name, role, phone, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
    'usr-driver', 'org-gopaq', 'br-sdq-central', 'driver@gopaq.local', driverPassword, 'Conductor GoPaq', 'DRIVER', '809-555-0104', now, now
  ]);

  execute(`INSERT INTO clients (id, organization_id, branch_id, name, company_name, email, phone, rnc_tax_id, tier, credit_limit, balance, cod_pending_balance, addresses_json, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
    'cli-techstore', 'org-gopaq', 'br-sdq-central', 'Tech Store', 'Tech Store SRL', 'cliente@gopaq.local', '809-555-0103', '131111111', 'Business', 50000, 0, 0,
    JSON.stringify([{ label: 'Principal', address: 'Santo Domingo, RD' }]), now, now
  ]);

  execute(`INSERT INTO drivers (id, organization_id, branch_id, user_id, name, email, phone, license_number, vehicle_type, vehicle_plate, status, current_lat, current_lng, speed, heading, battery, rating, active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`, [
    'drv-01', 'org-gopaq', 'br-sdq-central', 'usr-driver', 'Conductor GoPaq', 'driver@gopaq.local', '809-555-0104', 'LIC-001', 'motorcycle', 'GPQ-001', 'available', 18.4861, -69.9312, 0, 0, 100, 5, now, now
  ]);

  console.log('[DB] GoPaq development seed created. Change seed passwords through GOPAQ_SEED_* variables.');
}
