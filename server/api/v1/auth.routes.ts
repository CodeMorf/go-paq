import { Router } from 'express';
import { queryOne, execute } from '../../db/database';
import { comparePassword, generateToken, hashPassword } from '../../auth/jwt';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const authRouter = Router();

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
