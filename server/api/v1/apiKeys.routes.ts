import { Router } from 'express';
import crypto from 'crypto';
import { queryAll, queryOne, execute } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const apiKeysRouter = Router();

apiKeysRouter.get('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const keys = queryAll(`SELECT id, key_name, key_prefix, mode, scopes, active, last_used_at, created_at FROM api_keys WHERE organization_id = ?`, [orgId]);
  return res.json({ success: true, keys });
});

apiKeysRouter.post('/', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const { keyName = 'API Key E-commerce', mode = 'live', scopes = 'shipments:read,shipments:write,tracking:read', clientId = 'cli-techstore' } = req.body;
  if (!['live','test'].includes(mode)) return res.status(400).json({ success:false, error:'Modo de API Key inválido.' });
  if (clientId) { const client = queryOne(`SELECT id FROM clients WHERE id=? AND organization_id=? AND active=1`, [clientId, orgId]); if (!client) return res.status(404).json({ success:false, error:'Cliente no encontrado.' }); }

  const rawSecret = `gp_${mode}_sec_${crypto.randomBytes(24).toString('hex')}`;
  const keyPrefix = rawSecret.substring(0, 12);
  const keyHash = crypto.createHash('sha256').update(rawSecret).digest('hex');
  const keyId = `apk-${Date.now()}`;
  const now = new Date().toISOString();

  execute(`
    INSERT INTO api_keys (id, organization_id, client_id, key_name, key_prefix, key_hash, mode, scopes, active, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
  `, [keyId, orgId, clientId || null, keyName, keyPrefix, keyHash, mode, scopes, now]);

  return res.status(201).json({
    success: true,
    message: 'API Key generada con éxito. Cópiala ahora; por seguridad no volverá a mostrarse.',
    apiKey: {
      id: keyId,
      keyName,
      keyPrefix,
      rawSecret,
      mode,
      scopes,
      createdAt: now
    }
  });
});


apiKeysRouter.delete('/:id', authenticate, (req: AuthenticatedRequest, res) => {
  const result:any = execute(`UPDATE api_keys SET active=0 WHERE id=? AND organization_id=? AND active=1`, [req.params.id, req.organizationId!]);
  if (!result?.changes) return res.status(404).json({success:false,error:'API Key no encontrada.'});
  return res.json({success:true,message:'API Key revocada.'});
});
