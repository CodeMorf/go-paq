import { Router } from 'express';
import crypto from 'crypto';
import { queryOne, execute, transaction } from '../../db/database';
import { comparePassword, generateToken, hashPassword } from '../../auth/jwt';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const authRouter = Router();

// POST /api/v1/auth/login
authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, error: 'Email y contraseña requeridos.' });
  }

  const user = queryOne(`
    SELECT u.*, o.name as organization_name, o.currency, b.name as branch_name 
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.email = ? AND u.active = 1
  `, [email.toLowerCase().trim()]);

  if (!user) {
    return res.status(401).json({ success: false, error: 'Credenciales inválidas o usuario inactivo.' });
  }

  const isValid = comparePassword(password, user.password_hash);
  if (!isValid) {
    return res.status(401).json({ success: false, error: 'Credenciales inválidas.' });
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
  return res.json({
    success: true,
    token,
    user: safeUser
  });
});

// POST /api/v1/auth/register (Explicit Multi-Tenant Resolution)
authRouter.post('/register', (req, res) => {
  const { email, password, name, phone, companyName, organizationId, tenantSlug } = req.body;

  if (!email || !password || !name) {
    return res.status(400).json({ success: false, error: 'Nombre, email y contraseña son obligatorios.' });
  }

  // 1. Explicit Tenant Resolution
  let resolvedOrgId = organizationId;
  if (!resolvedOrgId && tenantSlug) {
    const orgBySlug = queryOne<{ id: string }>('SELECT id FROM organizations WHERE slug = ? AND active = 1', [tenantSlug]);
    if (orgBySlug) resolvedOrgId = orgBySlug.id;
  }
  if (!resolvedOrgId) {
    resolvedOrgId = process.env.GOPAQ_PUBLIC_ORG_ID || 'org-gopaq';
  }

  const org = queryOne<{ id: string; name: string }>('SELECT id, name FROM organizations WHERE id = ? AND active = 1', [resolvedOrgId]);
  if (!org) {
    return res.status(422).json({ success: false, error: 'Tenant u organización inválida o no configurada para registro público.' });
  }

  // 2. Check for duplicate email
  const existing = queryOne('SELECT id FROM users WHERE email = ?', [email.toLowerCase().trim()]);
  if (existing) {
    return res.status(409).json({ success: false, error: 'El correo electrónico ya se encuentra registrado.' });
  }

  const userId = `usr-cli-${Date.now()}`;
  const clientId = `cli-${Date.now()}`;
  const passwordHash = hashPassword(password);
  const now = new Date().toISOString();

  transaction(() => {
    // Create User account
    execute(`
      INSERT INTO users (id, organization_id, branch_id, email, password_hash, name, role, phone, active, created_at, updated_at)
      VALUES (?, ?, 'br-sdq-central', ?, ?, ?, 'CLIENT', ?, 1, ?, ?)
    `, [userId, org.id, email.toLowerCase().trim(), passwordHash, name, phone || '', now, now]);

    // Create Client profile
    execute(`
      INSERT INTO clients (id, organization_id, branch_id, name, company_name, email, phone, tier, credit_limit, balance, cod_pending_balance, active, created_at, updated_at)
      VALUES (?, ?, 'br-sdq-central', ?, ?, ?, ?, 'Standard', 0, 0, 0, 1, ?, ?)
    `, [clientId, org.id, name, companyName || name, email.toLowerCase().trim(), phone || '', now, now]);

    // Assign International Locker
    const lockerCode = `GP-${Math.floor(1000 + Math.random() * 9000)}`;
    execute(`
      INSERT INTO international_lockers (id, organization_id, client_id, locker_code, us_address, es_address, it_address, created_at)
      VALUES (?, ?, ?, ?, '8400 NW 25th St, Doral, FL', 'Calle Gran Vía 28, Madrid', 'Via Montenapoleone 8, Milán', ?)
    `, [`lck-${clientId}`, org.id, clientId, lockerCode, now]);
  });

  const token = generateToken({
    userId,
    organizationId: org.id,
    branchId: 'br-sdq-central',
    email: email.toLowerCase().trim(),
    role: 'CLIENT',
    name
  });

  return res.status(201).json({
    success: true,
    token,
    user: {
      id: userId,
      organizationId: org.id,
      organizationName: org.name,
      email: email.toLowerCase().trim(),
      role: 'CLIENT',
      name
    }
  });
});

// GET /api/v1/auth/me
authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = queryOne(`
    SELECT u.id, u.email, u.name, u.role, u.phone, u.branch_id, u.organization_id,
           o.name as organization_name, b.name as branch_name
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ?
  `, [req.user!.userId]);

  if (!user) {
    return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
  }

  return res.json({ success: true, user });
});
