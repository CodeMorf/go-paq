import jwt, { SignOptions } from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
  console.error('FATAL: JWT_SECRET environment variable is missing in production mode.');
  process.exit(1);
}

const JWT_SECRET = process.env.JWT_SECRET || (process.env.NODE_ENV === 'production' ? '' : 'local-development-only-gopaq-secret');
const JWT_EXPIRES_IN = (process.env.JWT_ACCESS_TTL || '15m') as SignOptions['expiresIn'];

export interface TokenPayload {
  userId: string;
  organizationId: string;
  branchId?: string;
  email: string;
  role: string;
  name: string;
  clientId?: string;
  sessionId?: string;
  supportSession?: boolean;
  supportingUserId?: string;
  tokenType?: 'access';
}

export function generateToken(payload: TokenPayload): string {
  if (!JWT_SECRET) throw new Error('JWT_SECRET no está configurado.');
  return jwt.sign({ ...payload, tokenType: 'access' }, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: process.env.JWT_ISSUER || 'gopaq',
    audience: process.env.JWT_AUDIENCE || 'gopaq-web'
  });
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    if (!JWT_SECRET) return null;
    const payload = jwt.verify(token, JWT_SECRET, {
      issuer: process.env.JWT_ISSUER || 'gopaq',
      audience: process.env.JWT_AUDIENCE || 'gopaq-web'
    }) as TokenPayload;
    if (payload.tokenType !== 'access' || !payload.userId || !payload.organizationId || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(plain: string): string {
  return bcrypt.hashSync(plain, 10);
}

export function comparePassword(plain: string, hash: string): boolean {
  return bcrypt.compareSync(plain, hash);
}
