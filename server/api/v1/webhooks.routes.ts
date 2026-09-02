import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';

export const webhooksRouter = Router();

webhooksRouter.get('/', authenticate, requireScope('webhooks:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const own = ['CLIENT', 'CUSTOMER'].includes(normalizeRole(req.user?.role)) || req.authType === 'api_key';
  const webhooks = await queryAllAsync(`SELECT id, target_url, events, active, failure_count, created_at FROM webhooks WHERE organization_id = ?${own && req.clientId ? ' AND client_id = ?' : ''} ORDER BY created_at DESC`, own && req.clientId ? [orgId, req.clientId] : [orgId]);
  return res.json({ success: true, webhooks });
}));

const webhookSchema = z.object({ targetUrl: z.string().url().max(2048), events: z.array(z.string().trim().min(3).max(100)).min(1).max(50).default(['shipment.updated', 'shipment.delivered']), clientId: z.string().trim().min(1).max(160).optional() });

webhooksRouter.post('/', authenticate, requireScope('webhooks:write'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = webhookSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de webhook inválidos.' });
  const target = new URL(parsed.data.targetUrl);
  if (process.env.NODE_ENV === 'production' && target.protocol !== 'https:') return res.status(422).json({ success: false, error: 'Los webhooks de producción deben usar HTTPS.' });
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const clientScoped = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  const clientId = clientScoped ? req.clientId : parsed.data.clientId || null;
  if (clientScoped && parsed.data.clientId && parsed.data.clientId !== req.clientId) return res.status(403).json({ success: false, error: 'No puedes crear un webhook de otro cliente.' });
  if (clientId && !(await queryOneAsync('SELECT id FROM clients WHERE id = ? AND organization_id = ? AND active = 1', [clientId, orgId]))) return res.status(422).json({ success: false, error: 'Cliente inválido para esta organización.' });
  const webhookId = `whk-${crypto.randomUUID()}`;
  const secretKey = `whsec_${crypto.randomBytes(32).toString('hex')}`;
  const now = new Date().toISOString();
  await transactionAsync(async (tx) => {
    await tx.execute(`INSERT INTO webhooks (id, organization_id, client_id, target_url, secret_key, events, active, failure_count, created_at) VALUES (?, ?, ?, ?, ?, ?, 1, 0, ?)`, [webhookId, orgId, clientId, target.href, secretKey, parsed.data.events.join(','), now]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, metadata_json, created_at) VALUES (?, ?, ?, 'webhook.created', 'webhook', ?, 'success', ?, ?)`, [`aud-${crypto.randomUUID()}`, orgId, req.user?.userId || null, webhookId, JSON.stringify({ events: parsed.data.events }), now]);
  });
  return res.status(201).json({ success: true, message: 'Webhook guardado. El secreto solo se muestra una vez.', webhook: { id: webhookId, targetUrl: target.href, secretKey, events: parsed.data.events, active: true, createdAt: now } });
}));
