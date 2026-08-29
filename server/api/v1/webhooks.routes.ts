import { Router } from 'express';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const webhooksRouter = Router();

webhooksRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const webhooks = queryAll(`SELECT * FROM webhooks WHERE organization_id = ?`, [orgId]);
  return res.json({ success: true, webhooks });
});

webhooksRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const { targetUrl, events = 'shipment.updated,shipment.delivered' } = req.body;

  if (!targetUrl) {
    return res.status(400).json({ success: false, error: 'targetUrl es obligatorio.' });
  }

  const webhookId = `whk-${Date.now()}`;
  const secretKey = `whsec_${Math.random().toString(36).substring(2, 15)}`;
  const now = new Date().toISOString();

  execute(`
    INSERT INTO webhooks (id, organization_id, target_url, secret_key, events, active, failure_count, created_at)
    VALUES (?, ?, ?, ?, ?, 1, 0, ?)
  `, [webhookId, orgId, targetUrl, secretKey, events, now]);

  return res.status(201).json({
    success: true,
    webhook: { id: webhookId, targetUrl, secretKey, events, active: 1, createdAt: now }
  });
});
