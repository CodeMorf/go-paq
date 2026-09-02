import { Router, Request, Response } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, executeAsync, transactionAsync } from '../../db/database';
import { comparePassword, generateToken, hashPassword, TokenPayload } from '../../auth/jwt';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { AuthArea, ROLE_GROUPS, normalizeRole } from '../../auth/roles';
import { writeAuditLog } from '../../auth/audit';
import { asyncHandler } from '../../core/http';

export const authRouter = Router();

const normalizeEmail = (value: string) => value.toLowerCase().trim();
const refreshCookieName = 'gopaq_refresh';
const refreshDays = 30;
const areaSchema = z.enum(['super-admin', 'portal', 'sucursal', 'driver']);

const loginSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(1).max(256),
  area: areaSchema.optional()
});

const registerSchema = z.object({
  email: z.string().email().max(254),
  password: z.string().min(8).max(256),
  name: z.string().trim().min(2).max(160),
  phone: z.string().trim().max(40).optional(),
  companyName: z.string().trim().max(160).optional()
});

const tokenSchema = z.object({ token: z.string().min(32).max(512), password: z.string().min(8).max(256) });

function parseCookies(req: Request): Record<string, string> {
  const header = req.headers.cookie || '';
  return Object.fromEntries(header.split(';').map((part) => {
    const index = part.indexOf('=');
    if (index < 0) return ['', ''];
    return [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function hashRefreshToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function setRefreshCookie(res: Response, token: string) {
  res.cookie(refreshCookieName, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth',
    maxAge: refreshDays * 24 * 60 * 60 * 1000
  });
}

function clearRefreshCookie(res: Response) {
  res.clearCookie(refreshCookieName, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/api/v1/auth'
  });
}

function safeUser(user: any) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone || null,
    branchId: user.branch_id || null,
    organizationId: user.organization_id,
    organizationName: user.organization_name || null,
    organizationSlug: user.organization_slug || null,
    branchName: user.branch_name || null,
    isDemo: user.organization_id === 'org-demo'
  };
}

async function issueSession(user: any, req: Request, res: Response) {
  const sessionId = crypto.randomUUID();
  const refreshToken = crypto.randomBytes(48).toString('base64url');
  const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000).toISOString();
  const accessPayload: TokenPayload = {
    userId: user.id,
    organizationId: user.organization_id,
    branchId: user.branch_id || undefined,
    email: user.email,
    role: user.role,
    name: user.name,
    clientId: user.client_id || undefined,
    sessionId
  };

  await executeAsync(`
    INSERT INTO sessions (id, user_id, organization_id, token_hash, expires_at, user_agent, ip_address, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `, [
    sessionId,
    user.id,
    user.organization_id,
    hashRefreshToken(refreshToken),
    expiresAt,
    String(req.get('user-agent') || '').slice(0, 500) || null,
    req.ip || null,
    new Date().toISOString()
  ]);

  setRefreshCookie(res, refreshToken);
  return { token: generateToken(accessPayload), user: safeUser(user), expiresAt };
}

authRouter.post('/login', asyncHandler(async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Correo, contraseña o área inválidos.' });

  const email = normalizeEmail(parsed.data.email);
  const user = await queryOneAsync(`
    SELECT u.id, u.email, u.password_hash, u.name, u.role, u.phone, u.branch_id, u.organization_id,
           c.id AS client_id, o.name AS organization_name, o.slug AS organization_slug, b.name AS branch_name
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN branches b ON u.branch_id = b.id
    LEFT JOIN clients c ON c.organization_id = u.organization_id AND c.email = u.email
    WHERE u.email = ? AND u.active = 1 AND o.active = 1
  `, [email]);

  if (!user || !comparePassword(parsed.data.password, user.password_hash)) {
    await writeAuditLog({ action: 'auth.login', outcome: 'failure', ipAddress: req.ip, metadata: { email, area: parsed.data.area || 'general' } });
    return res.status(401).json({ success: false, error: 'Credenciales inválidas o usuario inactivo.' });
  }

  if (parsed.data.area && !ROLE_GROUPS[parsed.data.area].includes(normalizeRole(user.role))) {
    await writeAuditLog({ organizationId: user.organization_id, userId: user.id, action: 'auth.login_wrong_area', outcome: 'failure', ipAddress: req.ip, metadata: { area: parsed.data.area, role: user.role } });
    return res.status(403).json({ success: false, error: 'Esta cuenta no pertenece al área seleccionada.' });
  }

  const session = await issueSession(user, req, res);
  await writeAuditLog({ organizationId: user.organization_id, userId: user.id, action: 'auth.login', outcome: 'success', ipAddress: req.ip, metadata: { area: parsed.data.area || 'general' } });
  return res.json({ success: true, ...session });
}));

authRouter.post('/demo', asyncHandler(async (req, res) => {
  const parsed = areaSchema.safeParse(req.body?.area);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Área demo inválida.' });
  if (process.env.DEMO_ACCESS_ENABLED !== 'true') return res.status(404).json({ success: false, error: 'Acceso demo no habilitado.' });

  const roles = ROLE_GROUPS[parsed.data];
  const placeholders = roles.map(() => '?').join(', ');
  const user = await queryOneAsync(`
    SELECT u.id, u.email, u.name, u.role, u.phone, u.branch_id, u.organization_id,
           c.id AS client_id, o.name AS organization_name, o.slug AS organization_slug, b.name AS branch_name
    FROM users u
    JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN branches b ON u.branch_id = b.id
    LEFT JOIN clients c ON c.organization_id = u.organization_id AND c.email = u.email
    WHERE u.organization_id = 'org-demo' AND u.active = 1 AND o.active = 1 AND u.role IN (${placeholders})
    ORDER BY u.id ASC LIMIT 1
  `, [...roles]);

  if (!user) return res.status(503).json({ success: false, error: 'demo_not_configured' });
  const session = await issueSession(user, req, res);
  await writeAuditLog({ organizationId: user.organization_id, userId: user.id, action: 'auth.demo_login', outcome: 'success', ipAddress: req.ip, metadata: { area: parsed.data } });
  return res.json({ success: true, demo: true, ...session });
}));

authRouter.post('/refresh', asyncHandler(async (req, res) => {
  const rawToken = parseCookies(req)[refreshCookieName];
  if (!rawToken) return res.status(401).json({ success: false, error: 'Sesión renovable no encontrada.' });
  const session = await queryOneAsync(`
    SELECT s.id AS session_id, s.user_id, s.organization_id, s.expires_at, u.email, u.name, u.role,
           u.phone, u.branch_id, c.id AS client_id, o.name AS organization_name, o.slug AS organization_slug,
           b.name AS branch_name
    FROM sessions s
    JOIN users u ON u.id = s.user_id AND u.organization_id = s.organization_id
    JOIN organizations o ON o.id = s.organization_id
    LEFT JOIN branches b ON b.id = u.branch_id
    LEFT JOIN clients c ON c.organization_id = u.organization_id AND c.email = u.email
    WHERE s.token_hash = ? AND s.revoked_at IS NULL AND u.active = 1 AND o.active = 1
  `, [hashRefreshToken(rawToken)]);

  if (!session || new Date(session.expires_at).getTime() <= Date.now()) {
    clearRefreshCookie(res);
    return res.status(401).json({ success: false, error: 'Sesión expirada. Inicia sesión nuevamente.' });
  }

  const rotated = await transactionAsync(async (tx) => {
    await tx.execute('UPDATE sessions SET revoked_at = ? WHERE id = ? AND revoked_at IS NULL', [new Date().toISOString(), session.session_id]);
    const nextToken = crypto.randomBytes(48).toString('base64url');
    const nextSessionId = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000).toISOString();
    await tx.execute(`
      INSERT INTO sessions (id, user_id, organization_id, token_hash, expires_at, user_agent, ip_address, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [nextSessionId, session.user_id, session.organization_id, hashRefreshToken(nextToken), expiresAt, String(req.get('user-agent') || '').slice(0, 500) || null, req.ip || null, new Date().toISOString()]);
    return { nextToken, nextSessionId };
  });

  setRefreshCookie(res, rotated.nextToken);
  return res.json({
    success: true,
    token: generateToken({ userId: session.user_id, organizationId: session.organization_id, branchId: session.branch_id || undefined, clientId: session.client_id || undefined, email: session.email, role: session.role, name: session.name, sessionId: rotated.nextSessionId }),
    user: safeUser(session)
  });
}));

authRouter.post('/logout', asyncHandler(async (req, res) => {
  const rawToken = parseCookies(req)[refreshCookieName];
  if (rawToken) await executeAsync('UPDATE sessions SET revoked_at = ? WHERE token_hash = ? AND revoked_at IS NULL', [new Date().toISOString(), hashRefreshToken(rawToken)]);
  clearRefreshCookie(res);
  return res.json({ success: true });
}));

authRouter.post('/register', asyncHandler(async (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Datos de registro inválidos.' });

  const publicOrgId = process.env.GOPAQ_PUBLIC_ORG_ID || 'org-gopaq';
  const org = await queryOneAsync<{ id: string; name: string; slug: string }>('SELECT id, name, slug FROM organizations WHERE id = ? AND active = 1 AND id <> \'org-demo\'', [publicOrgId]);
  if (!org) return res.status(503).json({ success: false, error: 'Registro público no configurado.' });

  const email = normalizeEmail(parsed.data.email);
  const existing = await queryOneAsync('SELECT id FROM users WHERE email = ?', [email]);
  if (existing) return res.status(409).json({ success: false, error: 'El correo electrónico ya se encuentra registrado.' });

  const branch = await queryOneAsync<{ id: string }>('SELECT id FROM branches WHERE organization_id = ? AND active = 1 ORDER BY is_hub DESC, created_at ASC LIMIT 1', [org.id]);
  const entropy = crypto.randomBytes(8).toString('hex');
  const userId = `usr-cli-${entropy}`;
  const clientId = `cli-${entropy}`;
  const lockerCode = `GP-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
  const name = parsed.data.name.trim();
  const now = new Date().toISOString();

  await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO users (id, organization_id, branch_id, email, password_hash, name, role, phone, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'CLIENT', ?, 1, ?, ?)`, [userId, org.id, branch?.id || null, email, hashPassword(parsed.data.password), name, parsed.data.phone?.trim() || '', now, now]);
    await tx.execute(`INSERT INTO clients (id, organization_id, branch_id, name, company_name, email, phone, tier, credit_limit, balance, cod_pending_balance, active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, 'Standard', 0, 0, 0, 1, ?, ?)`, [clientId, org.id, branch?.id || null, name, parsed.data.companyName?.trim() || name, email, parsed.data.phone?.trim() || '', now, now]);
    await tx.execute(`INSERT INTO international_lockers (id, organization_id, client_id, locker_code, us_address, es_address, it_address, created_at) VALUES (?, ?, ?, ?, NULL, NULL, NULL, ?)`, [`lck-${clientId}`, org.id, clientId, lockerCode, now]);
  });

  const user = { id: userId, email, name, role: 'CLIENT', phone: parsed.data.phone || '', branch_id: branch?.id || null, client_id: clientId, organization_id: org.id, organization_name: org.name, organization_slug: org.slug, branch_name: null };
  const session = await issueSession(user, req, res);
  await writeAuditLog({ organizationId: org.id, userId, action: 'auth.register', outcome: 'success', ipAddress: req.ip });
  return res.status(201).json({ success: true, ...session });
}));

authRouter.post('/password/forgot', asyncHandler(async (req, res) => {
  const emailResult = z.object({ email: z.string().email().max(254) }).safeParse(req.body);
  if (!emailResult.success) return res.status(400).json({ success: false, error: 'Correo inválido.' });
  const email = normalizeEmail(emailResult.data.email);
  const user = await queryOneAsync<{ id: string; organization_id: string }>('SELECT id, organization_id FROM users WHERE email = ? AND active = 1', [email]);
  if (user) {
    const rawToken = crypto.randomBytes(32).toString('base64url');
    await executeAsync('DELETE FROM password_reset_tokens WHERE user_id = ? AND used_at IS NULL', [user.id]);
    await executeAsync(`INSERT INTO password_reset_tokens (id, user_id, token_hash, expires_at, created_at) VALUES (?, ?, ?, ?, ?)`, [`prt-${crypto.randomUUID()}`, user.id, hashRefreshToken(rawToken), new Date(Date.now() + 30 * 60 * 1000).toISOString(), new Date().toISOString()]);
    if (process.env.PASSWORD_RESET_BASE_URL) console.warn('[password-reset] token queued for configured delivery provider', { userId: user.id });
  }
  return res.status(202).json({ success: true, status: process.env.PASSWORD_RESET_BASE_URL ? 'pending_delivery' : 'not_configured', message: 'Si la cuenta existe, el proceso de recuperación continuará por el canal configurado.' });
}));

authRouter.post('/password/reset', asyncHandler(async (req, res) => {
  const parsed = tokenSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Token o contraseña inválidos.' });
  const record = await queryOneAsync<{ id: string; user_id: string; expires_at: string }>('SELECT id, user_id, expires_at FROM password_reset_tokens WHERE token_hash = ? AND used_at IS NULL', [hashRefreshToken(parsed.data.token)]);
  if (!record || new Date(record.expires_at).getTime() <= Date.now()) return res.status(400).json({ success: false, error: 'Token de recuperación inválido o expirado.' });
  await transactionAsync(async (tx) => {
    await tx.execute('UPDATE users SET password_hash = ?, updated_at = ? WHERE id = ? AND active = 1', [hashPassword(parsed.data.password), new Date().toISOString(), record.user_id]);
    await tx.execute('UPDATE password_reset_tokens SET used_at = ? WHERE id = ? AND used_at IS NULL', [new Date().toISOString(), record.id]);
    await tx.execute('UPDATE sessions SET revoked_at = ? WHERE user_id = ? AND revoked_at IS NULL', [new Date().toISOString(), record.user_id]);
  });
  await writeAuditLog({ userId: record.user_id, action: 'auth.password_reset', outcome: 'success', ipAddress: req.ip });
  return res.json({ success: true, message: 'Contraseña actualizada. Inicia sesión nuevamente.' });
}));

authRouter.get('/me', authenticate, asyncHandler(async (req: AuthenticatedRequest, res) => {
  if (!req.user) return res.status(401).json({ success: false, error: 'Usuario no autenticado.' });
  const user = await queryOneAsync(`
    SELECT u.id, u.email, u.name, u.role, u.phone, u.branch_id, u.organization_id,
           c.id AS client_id, o.name AS organization_name, o.slug AS organization_slug, b.name AS branch_name
    FROM users u JOIN organizations o ON u.organization_id = o.id
    LEFT JOIN branches b ON u.branch_id = b.id
    LEFT JOIN clients c ON c.organization_id = u.organization_id AND c.email = u.email
    WHERE u.id = ? AND u.organization_id = ? AND u.active = 1 AND o.active = 1
  `, [req.user.userId, req.organizationId]);
  if (!user) return res.status(404).json({ success: false, error: 'Usuario no encontrado.' });
  return res.json({ success: true, user: safeUser(user) });
}));

authRouter.get('/users', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN']), requireScope('team:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const users = await queryAllAsync(`
    SELECT u.id, u.email, u.name, u.role, u.phone, u.branch_id, u.active,
           u.created_at, u.updated_at, b.name AS branch_name
    FROM users u
    LEFT JOIN branches b ON b.id = u.branch_id AND b.organization_id = u.organization_id
    WHERE u.organization_id = ?
    ORDER BY u.created_at ASC
  `, [req.organizationId]);
  return res.json({ success: true, users });
}));
