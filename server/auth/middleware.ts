import { Request, Response, NextFunction } from 'express';
import { verifyToken, TokenPayload } from './jwt';

export interface AuthenticatedRequest extends Request {
  user?: TokenPayload;
  organizationId?: string;
}

export function authenticate(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // Check if API Key header present for external integrations
    const apiKey = req.headers['x-api-key'] as string;
    if (apiKey) {
      // Default to organization context for API key
      req.organizationId = 'org-gopaq';
      return next();
    }
    return res.status(401).json({ success: false, error: 'Token de autenticación requerido.' });
  }

  const token = authHeader.split(' ')[1];
  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(401).json({ success: false, error: 'Token inválido o expirado.' });
  }

  req.user = decoded;
  req.organizationId = decoded.organizationId;
  next();
}

export function requireRole(allowedRoles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autenticado.' });
    }

    if (req.user.role === 'SUPER_ADMIN' || req.user.role === 'Owner') {
      return next(); // Super Admin has access to all
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ success: false, error: 'Acceso denegado: permisos insuficientes para este recurso.' });
    }

    next();
  };
}
