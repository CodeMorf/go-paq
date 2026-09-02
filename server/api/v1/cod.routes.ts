import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { asyncHandler } from '../../core/http';

export const codRouter = Router();

codRouter.get('/ledger', authenticate, requireScope('cod:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const transactions = await queryAllAsync(`
    SELECT c.*, s.tracking_number, d.name AS driver_name, b.name AS branch_name, cl.company_name AS client_name
    FROM cod_transactions c
    JOIN shipments s ON c.shipment_id = s.id AND s.organization_id = c.organization_id
    LEFT JOIN drivers d ON c.driver_id = d.id AND d.organization_id = c.organization_id
    LEFT JOIN branches b ON c.branch_id = b.id AND b.organization_id = c.organization_id
    LEFT JOIN clients cl ON c.client_id = cl.id AND cl.organization_id = c.organization_id
    WHERE c.organization_id = ?
    ORDER BY c.created_at DESC
  `, [orgId]);
  const summary = await queryOneAsync(`
    SELECT SUM(CASE WHEN status = 'pending_collection' THEN amount ELSE 0 END) AS pending_collection,
           SUM(CASE WHEN status IN ('collected_driver', 'received_branch', 'reconciled') THEN amount ELSE 0 END) AS in_custody,
           SUM(CASE WHEN status = 'settled_merchant' THEN amount ELSE 0 END) AS settled_total,
           COUNT(*) AS total_transactions
    FROM cod_transactions WHERE organization_id = ?
  `, [orgId]);
  return res.json({ success: true, summary, transactions });
}));

const settleSchema = z.object({
  transactionIds: z.array(z.string().trim().min(1).max(160)).min(1).max(500),
  settlementReference: z.string().trim().min(4).max(120).optional(),
  notes: z.string().trim().max(500).optional()
});

codRouter.post('/settle', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS']), requireScope('cod:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const parsed = settleSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ success: false, error: 'Datos de liquidación inválidos.' });
  const ids = [...new Set(parsed.data.transactionIds)];
  if (ids.length !== parsed.data.transactionIds.length) return res.status(409).json({ success: false, error: 'La liquidación contiene transacciones repetidas.' });
  const orgId = req.organizationId!;
  const idempotencyKey = req.header('idempotency-key')?.trim();
  if (idempotencyKey) {
    const previous = await queryOneAsync<{ request_hash: string; status_code: number; response_json: string }>('SELECT request_hash, status_code, response_json FROM idempotency_keys WHERE organization_id = ? AND idempotency_key = ?', [orgId, idempotencyKey]);
    const hash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    if (previous?.request_hash !== hash && previous) return res.status(409).json({ success: false, error: 'La Idempotency-Key ya fue usada con otro contenido.' });
    if (previous) return res.status(previous.status_code || 200).json(JSON.parse(previous.response_json));
  }

  const now = new Date().toISOString();
  const reference = parsed.data.settlementReference || `COD-${crypto.randomBytes(10).toString('hex').toUpperCase()}`;
  const response = { success: true, message: `${ids.length} transacciones liquidadas con éxito.`, settlementReference: reference, settledAt: now, transactionIds: ids };
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');

  await transactionAsync(async (tx) => {
    for (const txId of ids) {
      const row = await tx.queryOne<{ id: string; status: string; amount: number }>('SELECT id, status, amount FROM cod_transactions WHERE id = ? AND organization_id = ?', [txId, orgId]);
      if (!row) throw Object.assign(new Error('Una o más transacciones no pertenecen a esta organización.'), { statusCode: 404 });
      if (!['received_branch', 'reconciled'].includes(row.status)) throw Object.assign(new Error(`La transacción ${txId} no está lista para liquidarse.`), { statusCode: 409 });
      const updated = await tx.execute(`UPDATE cod_transactions SET status = 'settled_merchant', settled_at = ?, settlement_reference = ?, notes = ? WHERE id = ? AND organization_id = ? AND status IN ('received_branch', 'reconciled')`, [now, reference, parsed.data.notes || 'Liquidación COD autorizada', txId, orgId]);
      if (updated.changes !== 1) throw Object.assign(new Error(`La transacción ${txId} cambió mientras se liquidaba.`), { statusCode: 409 });
    }
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'cod.settled', 'cod_settlement', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, reference, JSON.stringify({ reference, transactionIds: ids }), now]);
    if (idempotencyKey) await tx.execute(`INSERT INTO idempotency_keys (id, organization_id, idempotency_key, request_hash, status_code, response_json, created_at, expires_at) VALUES (?, ?, ?, ?, 200, ?, ?, ?)`, [`idem-${crypto.randomUUID()}`, orgId, idempotencyKey, requestHash, JSON.stringify(response), now, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
  });
  return res.json(response);
}));
