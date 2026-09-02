import crypto from 'crypto';
import { closeDatabase, initDatabaseAsync, isPostgres, queryOneAsync, transactionAsync } from './database';
import { hashPassword } from '../auth/jwt';

/**
 * Creates only the minimum production tenant and first administrator.
 *
 * This command is intentionally explicit and idempotent. It never creates
 * demo data and it never replaces an existing administrator password.
 */
async function main() {
  if (process.env.NODE_ENV !== 'production') {
    throw new Error('El bootstrap de producción requiere NODE_ENV=production.');
  }
  if (!isPostgres) {
    throw new Error('El bootstrap de producción requiere PostgreSQL.');
  }
  if (process.env.GOPAQ_BOOTSTRAP_CONFIRM !== 'I_UNDERSTAND') {
    throw new Error('Falta GOPAQ_BOOTSTRAP_CONFIRM=I_UNDERSTAND.');
  }

  const email = String(process.env.GOPAQ_BOOTSTRAP_ADMIN_EMAIL || '').trim().toLowerCase();
  const password = String(process.env.GOPAQ_BOOTSTRAP_ADMIN_PASSWORD || '');
  const name = String(process.env.GOPAQ_BOOTSTRAP_ADMIN_NAME || '').trim();
  if (!email || !email.includes('@') || !name || password.length < 16) {
    throw new Error('GOPAQ_BOOTSTRAP_ADMIN_EMAIL, NAME y PASSWORD (mínimo 16 caracteres) son obligatorios.');
  }
  if (email.endsWith('@gopaq.local') || email.includes('demo')) {
    throw new Error('No se permite una cuenta de bootstrap de producción con correo demo/local.');
  }

  await initDatabaseAsync();
  const now = new Date().toISOString();
  const branchId = 'br-gopaq-central';
  const existingUser = await queryOneAsync<{ id: string; organization_id: string; role: string }>('SELECT id, organization_id, role FROM users WHERE email = ?', [email]);
  if (existingUser && existingUser.organization_id !== 'org-gopaq') {
    throw new Error('El correo de bootstrap ya pertenece a otra organización.');
  }

  await transactionAsync(async (tx) => {
    await tx.execute(`
      INSERT INTO organizations (id, name, slug, currency, country, active, created_at, updated_at)
      VALUES ('org-gopaq', 'GoPaq Logistics', 'gopaq', 'DOP', 'DO', 1, ?, ?)
      ON CONFLICT (id) DO UPDATE SET active = 1, updated_at = excluded.updated_at
    `, [now, now]);
    await tx.execute(`
      INSERT INTO branches (id, organization_id, code, name, city, address, phone, is_hub, active, created_at, updated_at)
      VALUES (?, 'org-gopaq', 'SDQ-01', 'Sucursal Central GoPaq', 'Santo Domingo', 'Santo Domingo, República Dominicana', NULL, 1, 1, ?, ?)
      ON CONFLICT (id) DO UPDATE SET active = 1, updated_at = excluded.updated_at
    `, [branchId, now, now]);

    const rates = [
      ['rate-prod-local', 'local', 175, 25, 30, 175],
      ['rate-prod-express', 'express', 290, 35, 45, 290],
      ['rate-prod-nacional', 'nacional', 320, 45, 55, 320],
      ['rate-prod-internacional', 'internacional', 450, 180, 220, 450],
      ['rate-prod-moving', 'mudanza', 4500, 0, 850, 4500],
      ['rate-prod-heavy', 'carga_pesada', 8500, 18, 500, 8500]
    ] as const;
    for (const [rateId, serviceType, baseRate, perKg, perVol, minCharge] of rates) {
      await tx.execute(`
        INSERT INTO rates_matrix (id, organization_id, service_type, origin_zone, dest_zone, base_rate, per_kg_rate, per_vol_rate, min_charge, currency, active, created_at)
        VALUES (?, 'org-gopaq', ?, 'DEFAULT', 'DEFAULT', ?, ?, ?, ?, 'DOP', 1, ?)
        ON CONFLICT (id) DO NOTHING
      `, [rateId, serviceType, baseRate, perKg, perVol, minCharge, now]);
    }

    if (!existingUser) {
      await tx.execute(`
        INSERT INTO users (id, organization_id, branch_id, email, password_hash, name, role, active, created_at, updated_at)
        VALUES (?, 'org-gopaq', ?, ?, ?, ?, 'SUPER_ADMIN', 1, ?, ?)
      `, [`usr-${crypto.randomUUID()}`, branchId, email, hashPassword(password), name, now, now]);
    } else {
      await tx.execute('UPDATE users SET active = 1, role = \'SUPER_ADMIN\', branch_id = ?, updated_at = ? WHERE id = ? AND organization_id = \'org-gopaq\'', [branchId, now, existingUser.id]);
    }
  });

  console.log(JSON.stringify({ success: true, organizationId: 'org-gopaq', adminEmail: email, adminCreated: !existingUser }));
}

main()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : 'production_bootstrap_failed');
    process.exitCode = 1;
  })
  .finally(async () => {
    await closeDatabase();
  });
