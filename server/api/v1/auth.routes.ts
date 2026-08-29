import { Router } from 'express';
import crypto from 'crypto';
import { queryOne, execute, transaction } from '../../db/database';
import { comparePassword, generateToken, hashPassword } from '../../auth/jwt';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const authRouter = Router();

authRouter.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: 'Email y contraseña requeridos.' });

  const user = queryOne(`
    SELECT u.*, o.name as organization_name, o.currency, b.name as branch_name
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.email = ? AND u.active = 1
  `, [String(email).toLowerCase().trim()]);

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
  const name = String(req.body?.name || '').trim();
  const email = String(req.body?.email || '').trim().toLowerCase();
  const phone = String(req.body?.phone || '').trim();
  const password = String(req.body?.password || '');

  if (name.length < 2 || !email.includes('@') || phone.length < 7 || password.length < 8) {
    return res.status(422).json({ success: false, error: 'Nombre, correo, teléfono y contraseña válida son requeridos.' });
  }
  if (queryOne('SELECT id FROM users WHERE email = ?', [email])) {
    return res.status(409).json({ success: false, error: 'Ya existe una cuenta con este correo.' });
  }

  const organization = queryOne('SELECT id FROM organizations WHERE active = 1 ORDER BY created_at ASC LIMIT 1');
  if (!organization) return res.status(503).json({ success: false, error: 'No existe una organización activa para registrar clientes.' });

  const userId = `usr-${crypto.randomUUID()}`;
  const clientId = `cli-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  const passwordHash = hashPassword(password);

  transaction(() => {
    execute(`INSERT INTO users (id, organization_id, email, password_hash, name, role, phone, active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 'CLIENT', ?, 1, ?, ?)`, [userId, organization.id, email, passwordHash, name, phone, now, now]);
    execute(`INSERT INTO clients (id, organization_id, name, email, phone, active, created_at, updated_at)
             VALUES (?, ?, ?, ?, ?, 1, ?, ?)`, [clientId, organization.id, name, email, phone, now, now]);
  });

  const token = generateToken({ userId, organizationId: organization.id, email, role: 'CLIENT', name });
  return res.status(201).json({
    success: true,
    token,
    user: { id: userId, organization_id: organization.id, email, name, phone, role: 'CLIENT' }
  });
});

authRouter.get('/me', authenticate, (req: AuthenticatedRequest, res) => {
  const user = queryOne(`
    SELECT u.id, u.email, u.name, u.role, u.phone, u.branch_id, u.organization_id,
           o.name as organization_name, b.name as branch_name
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN branches b ON u.branch_id = b.id
    WHERE u.id = ?
  `, [req.user!.userId]);

  if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
  return res.json({ success: true, user });
});
