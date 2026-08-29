import { Router } from 'express';
import crypto from 'crypto';
import { queryOne, execute, transaction } from '../../db/database';
import { comparePassword, generateToken, hashPassword } from '../../auth/jwt';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const authRouter = Router();

const normalizeEmail = (value: string) => value.toLowerCase().trim();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email y contraseña requeridos.' });

  const user = queryOne(`
    SELECT u.*, o.name as organization_name, o.currency, b.name as branch_name
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.email = ? AND u.active = 1 AND o.active = 1
  `, [normalizeEmail(email)]);

  if (!user || !comparePassword(password, user.password_hash)) {
    return res.status(401).json({ success: false, error: 'Credenciales inválidas o usuario inactivo.' });
  }

  const token = generateToken({
    userId: user.id,
    organizationId: user.organization_id,
    branchId: user.branch_id,
    email: user.email,
    role: user.role,
    name: user.name
  });
  const { password_hash, ...safeUser } = user;
  return res.json({ success: true, token, user: safeUser });
});

authRouter.post('/register', (req, res) => {
  const { email, password, name, phone, companyName, organizationId, tenantSlug } = req.body;
  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Nombre, email y contraseña son obligatorios.' });
  }
  if (String(password).length < 8) {
    return res.status(422).json({ success: false, error: 'La contraseña debe contener al menos 8 caracteres.' });
  }

  let resolvedOrgId = organizationId;
  if (!resolvedOrgId && tenantSlug) {
    const orgBySlug = queryOne<{ id: string }>('SELECT id FROM organizations WHERE slug = ? AND active = 1', [tenantSlug]);
    if (orgBySlug) resolvedOrgId = orgBySlug.id;
  }
  if (!resolvedOrgId) resolvedOrgId = process.env.GOPAQ_PUBLIC_ORG_ID || 'org-gopaq';

  const org = queryOne<{ id: string; name: string }>('SELECT id, name FROM organizations WHERE id = ? AND active = 1', [resolvedOrgId]);
  if (!org) return res.status(422).json({ success: false, error: 'Tenant u organización inválida.' });

  const emailNormalized = normalizeEmail(email);
  const existing = queryOne('SELECT id FROM users WHERE email = ?', [emailNormalized]);
  if (existing) return res.status(409).json({ success: false, error: 'El correo electrónico ya se encuentra registrado.' });

  const branch = queryOne<{ id: string }>(`
    SELECT id FROM branches
    WHERE organization_id = ? AND active = 1
    ORDER BY is_hub DESC, created_at ASC
    LIMIT 1
  `, [org.id]);
  const branchId = branch?.id || null;

  const entropy = crypto.randomBytes(6).toString('hex');
  const userId = `usr-cli-${entropy}`;
  const clientId = `cli-${entropy}`;
  const lockerCode = `GP-${crypto.randomBytes(3).toString('hex').toUpperCase()}`;
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();
  const normalizedPhone = phone ? String(phone).trim() : '';

  transaction(() => {
    execute(`
      INSERT INTO users (id, organization_id, branch_id, email, password_hash, name, role, phone, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, 'CLIENT', ?, 1, ?, ?)
    `, [userId, org.id, branchId, emailNormalized, passwordHash, String(name).trim(), normalizedPhone, now, now]);

    execute(`
      INSERT INTO clients (id, organization_id, branch_id, name, company_name, email, phone, tier, credit_limit, balance, cod_pending_balance, active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 'Standard', 0, 0, 0, 1, ?, ?)
    `, [clientId, org.id, branchId, String(name).trim(), companyName || String(name).trim(), emailNormalized, normalizedPhone, now, now]);

    execute(`
      INSERT INTO international_lockers (id, organization_id, client_id, locker_code, us_address, es_address, it_address, created_at)
      VALUES (?, ?, ?, ?, '8400 NW 25th St, Doral, FL', 'Calle Gran Vía 28, Madrid', 'Via Montenapoleone 8, Milán', ?)
    `, [`lck-${clientId}`, org.id, clientId, lockerCode, now]);
  });

  const token = generateToken({
    userId,
    organizationId: org.id,
    branchId: branchId || undefined,
    email: emailNormalized,
    role: 'CLIENT',
    name: String(name).trim()
  });

  return res.status(201).json({
    success: true,
    token,
    user: {
      id: userId,
      organizationId: org.id,
      organizationName: org.name,
      branchId,
      email: emailNormalized,
      role: 'CLIENT',
      name: String(name).trim(),
      lockerCode
    }
  });
});

authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = queryOne(`
    SELECT u.id, u.email, u.name, u.role, u.phone, u.branch_id, u.organization_id,
           o.name as organization_name, b.name as branch_name
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ? AND u.organization_id = ? AND u.active = 1
  `, [req.user!.userId, req.organizationId]);

  if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
  return res.json({ success: true, user });
});
