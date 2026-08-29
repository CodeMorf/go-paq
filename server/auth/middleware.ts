import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { verifyToken, TokenPayload } from './jwt';
import { queryOne, execute } from '../db/database';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  organizationId?: string;
  clientId?: string;
  apiKeyScopes?: string[];
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  const apiKeyHeader = req.headers['x-api-key'] as string | undefined;

  // 1. API Key Authentication
  if (apiKeyHeader && apiKeyHeader.trim().length > 0) {
    const rawKey = apiKeyHeader.trim();
    const keyHash = crypto.createHash('sha256').update(rawKey).digest('hex');

    const keyRow = queryOne(`
      SELECT * FROM api_keys 
      WHERE (key_hash = ? OR key_prefix = ?) AND active = 1
      LIMIT 1
    `, [keyHash, rawKey.substring(0, 12)]);

    if (!keyRow || keyRow.key_hash !== keyHash) {
      return res.status(401).json({ success: false, error: 'API Key inválida o revocada.' });
    }

    // Update last used timestamp
    execute(`UPDATE api_keys SET last_used_at = datetime('now') WHERE id = ?`, [keyRow.id]);

    req.organizationId = keyRow.organization_id;
    req.clientId = keyRow.client_id;
    req.apiKeyScopes = keyRow.scopes ? keyRow.scopes.split(',').map((s: string) => s.trim()) : [];
    return next();
  }

  // 2. JWT Bearer Token Authentication
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);

    if (!decoded) {
      return res.status(401).json({ success: false, error: 'Token inválido o expirado.' });
    }

    req.user = decoded;
    req.organizationId = decoded.organizationId;
    return next();
  }

  return res.status(401).json({ success: false, error: 'Credenciales de autenticación requeridas (Bearer JWT o X-API-Key).' });
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'Usuario no autenticado.' });
    }

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'Owner') {
      return next();
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Acceso denegado: permisos insuficientes.' });
    }

    next();
  };
}

export function requireScope(scope: string) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    // Users with JWT have full UI access
    if (req.user) return next();

    // API Key must have the specific scope
    if (req.apiKeyScopes && req.apiKeyScopes.includes(scope)) {
      return next();
    }

    return res.status(403).json({ success: false, error: `Scope insuficiente. Se requiere: ${scope}` });
  };
}
