import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyToken, TokenPayload } from './jwt';
import { queryOneAsync, executeAsync } from '../db/database';
import { normalizeRole, roleHasScope } from './roles';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  organizationId?: string;
  clientId?: string;
  apiKeyScopes?: string[];
  authType?: 'jwt' | 'api_key';
}

/**
 * JWT signature validation is not enough for a revocable production session.
 * Every access token carries the database session id created at login; this
 * lookup makes logout, password reset and administrative revocation effective
 * before the nominal access-token TTL expires.
 */
export async function validateAccessToken(token: string): Promise<TokenPayload | null> {
  const decoded = verifyToken(token);
  if (!decoded?.sessionId) return null;

  const session = await queryOneAsync<{
    id: string;
    role: string;
    branch_id: string | null;
    client_id: string | null;
  }>(`
    SELECT s.id, u.role, u.branch_id, c.id AS client_id
    FROM sessions s
    JOIN users u ON u.id = s.user_id AND u.organization_id = s.organization_id
    JOIN organizations o ON o.id = s.organization_id
    LEFT JOIN clients c ON c.organization_id = u.organization_id AND c.email = u.email
    WHERE s.id = ?
      AND s.user_id = ?
      AND s.organization_id = ?
      AND s.revoked_at IS NULL
      AND s.expires_at > CURRENT_TIMESTAMP
      AND u.active = 1
      AND o.active = 1
  `, [decoded.sessionId, decoded.userId, decoded.organizationId]);

  if (!session) return null;
  return {
    ...decoded,
    role: session.role,
    branchId: session.branch_id || undefined,
    clientId: session.client_id || undefined
  };
}

export async function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

    // 1. API Key Authentication. The hash is the only lookup key; the
    // prefix is metadata and must never be sufficient to authenticate.
    if (apiKeyHeader && apiKeyHeader.trim().length > 0) {
      const rawKey = apiKeyHeader.trim();
      if (rawKey.length > 512) return res.status(401).json({ success: false, error: 'API Key inválida o revocada.' });
      const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

      const keyRow = await queryOneAsync(`
        SELECT * FROM api_keys
        WHERE key_hash = ? AND active = 1
        LIMIT 1
      `, [keyHash]);

      if (!keyRow) return res.status(401).json({ success: false, error: 'API Key inválida o revocada.' });

      await executeAsync(`UPDATE api_keys SET last_used_at = CURRENT_TIMESTAMP WHERE id = ? AND organization_id = ?`, [keyRow.id, keyRow.organization_id]);

      req.organizationId = keyRow.organization_id;
      req.clientId = keyRow.client_id;
      req.apiKeyScopes = keyRow.scopes ? String(keyRow.scopes).split(',').map((s: string) => s.trim()).filter(Boolean) : [];
      req.authType = 'api_key';
      return next();
    }

    // 2. JWT Bearer Token Authentication
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.slice('Bearer '.length).trim();
      const decoded = await validateAccessToken(token);

      if (!decoded) return res.status(401).json({ success: false, error: 'Token inválido o expirado.' });

      req.user = decoded;
      req.organizationId = decoded.organizationId;
      req.clientId = decoded.clientId;
      req.authType = 'jwt';
      return next();
    }

    return res.status(401).json({ success: false, error: 'Credenciales de autenticación requeridas (Bearer JWT o X-API-Key).' });
  } catch (error) {
    return next(error);
  }
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado.' });
    }

    const role = normalizeRole(req.user.role);
    if (!allowedRoles.map(normalizeRole).includes(role)) {
      return res.status(403).json({ success: false, error: 'Acceso denegado: permisos insuficientes.' });
    }

    next();
  };
}

export function requireScope(scope: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (req.apiKeyScopes?.includes(scope)) {
      return next();
    }

    if (req.user && roleHasScope(req.user.role, scope)) return next();

    return res.status(403).json({ success: false, error: `Scope insuficiente. Se requiere: ${scope}` });
  };
}
