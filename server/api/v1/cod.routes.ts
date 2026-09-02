import { Router } from 'express';
import crypto from 'crypto';
import { z } from 'zod';
import { isPostgres, queryAllAsync, queryOneAsync, transactionAsync } from '../../db/database';
import { authenticate, AuthenticatedRequest, requireRole, requireScope } from '../../auth/middleware';
import { normalizeRole } from '../../auth/roles';
import { asyncHandler } from '../../core/http';

export const codRouter = Router();

codRouter.get('/ledger', authenticate, requireScope('cod:read'), asyncHandler(async (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const role = normalizeRole(req.user?.role);
  const branchScoped = ['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'DISPATCHER', 'WAREHOUSE', 'CASHIER'].includes(role);
  if (branchScoped && !req.user?.branchId) return res.status(403).json({ success: false, error: 'La cuenta de sucursal no tiene una sucursal asignada.' });
  const clientScoped = ['CLIENT', 'CUSTOMER'].includes(role) || req.authType === 'api_key';
  if (clientScoped && !req.clientId) return res.status(403).json({ success: false, error: 'La cuenta de cliente no tiene un cliente asignado.' });
  const branchFilter = branchScoped ? ' AND c.branch_id = ?' : '';
  const clientFilter = clientScoped ? ' AND c.client_id = ?' : '';
  const branchParams = branchScoped ? [orgId, req.user!.branchId] : [orgId];
  if (clientScoped) branchParams.push(req.clientId);
  const transactions = await queryAllAsync(`
    SELECT c.*, s.tracking_number, d.name AS driver_name, b.name AS branch_name, cl.company_name AS client_name
    FROM cod_transactions c
    JOIN shipments s ON c.shipment_id = s.id AND s.organization_id = c.organization_id
    LEFT JOIN drivers d ON c.driver_id = d.id AND d.organization_id = c.organization_id
    LEFT JOIN branches b ON c.branch_id = b.id AND b.organization_id = c.organization_id
    LEFT JOIN clients cl ON c.client_id = cl.id AND cl.organization_id = c.organization_id
    WHERE c.organization_id = ?${branchFilter}${clientFilter}
    ORDER BY c.created_at DESC
  `, branchParams);
  const summary = await queryOneAsync(`
    SELECT SUM(CASE WHEN status = 'pending_collection' THEN amount ELSE 0 END) AS pending_collection,
           SUM(CASE WHEN status IN ('collected_driver', 'received_branch', 'reconciled') THEN amount ELSE 0 END) AS in_custody,
           SUM(CASE WHEN status = 'settled_merchant' THEN amount ELSE 0 END) AS settled_total,
           COUNT(*) AS total_transactions
    FROM cod_transactions WHERE organization_id = ?${branchScoped ? ' AND branch_id = ?' : ''}${clientScoped ? ' AND client_id = ?' : ''}
  `, branchParams);
  return res.json({ success: true, summary, transactions });
}));

const settleSchema = z.object({
  transactionIds: z.array(z.string().trim().min(1).max(160)).min(1).max(500),
  settlementReference: z.string().trim().min(4).max(120).optional(),
  notes: z.string().trim().max(500).optional()
});

const transitionSchema = z.object({
  transactionIds: z.array(z.string().trim().min(1).max(160)).min(1).max(500),
  branchId: z.string().trim().min(1).max(160).optional(),
  notes: z.string().trim().max(500).optional()
});

type CodTransition = 'received_branch' | 'reconciled';

async function transitionCod(
  req: AuthenticatedRequest,
  res: any,
  targetStatus: CodTransition,
  expectedStatus: 'collected_driver' | 'received_branch'
) {
  const parsed = transitionSchema.safeParse(req.body);
  if (!parsed.success) return res.status(422).json({ success: false, error: 'Datos de transición COD inválidos.' });
  const ids = [...new Set(parsed.data.transactionIds)];
  if (ids.length !== parsed.data.transactionIds.length) return res.status(409).json({ success: false, error: 'La operación contiene transacciones repetidas.' });

  const orgId = req.organizationId!;
  const idempotencyKey = req.header('idempotency-key')?.trim();
  if (idempotencyKey && (idempotencyKey.length < 8 || idempotencyKey.length > 200)) return res.status(400).json({ success: false, error: 'Idempotency-Key inválida.' });
  const requestHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
  if (idempotencyKey) {
    const previous = await queryOneAsync<{ request_hash: string; status_code: number | null; response_json: string | null }>('SELECT request_hash, status_code, response_json FROM idempotency_keys WHERE organization_id = ? AND idempotency_key = ?', [orgId, idempotencyKey]);
    if (previous?.request_hash !== requestHash && previous) return res.status(409).json({ success: false, error: 'La Idempotency-Key ya fue usada con otro contenido.' });
    if (previous?.response_json) return res.status(previous.status_code || 200).json(JSON.parse(previous.response_json));
  }

  const now = new Date().toISOString();
  const branchRoles = ['BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'CASHIER'];
  const role = normalizeRole(req.user?.role);
  const scopedBranchId = branchRoles.includes(role) ? req.user?.branchId : parsed.data.branchId;
  if (branchRoles.includes(role) && !scopedBranchId) return res.status(403).json({ success: false, error: 'La cuenta de sucursal no tiene una sucursal asignada.' });

  const response = await transactionAsync(async (tx) => {
    const changed: string[] = [];
    for (const txId of ids) {
      const row = await tx.queryOne<{ id: string; shipment_id: string; tracking_number: string; branch_id: string | null; status: string; amount: number }>(
        `SELECT c.id, c.shipment_id, s.tracking_number, c.branch_id, c.status, c.amount
         FROM cod_transactions c
         JOIN shipments s ON s.id = c.shipment_id AND s.organization_id = c.organization_id
         WHERE c.id = ? AND c.organization_id = ?${isPostgres ? ' FOR UPDATE' : ''}`,
        [txId, orgId]
      );
      if (!row) throw Object.assign(new Error('Una o más transacciones no pertenecen a esta organización.'), { statusCode: 404 });
      if (scopedBranchId && row.branch_id !== scopedBranchId) throw Object.assign(new Error('La cuenta no puede operar COD de otra sucursal.'), { statusCode: 403 });
      if (parsed.data.branchId && row.branch_id !== parsed.data.branchId) throw Object.assign(new Error('La transacción COD no corresponde a la sucursal indicada.'), { statusCode: 409 });
      if (row.status !== expectedStatus) throw Object.assign(new Error(`La transacción ${txId} debe estar en ${expectedStatus} para avanzar a ${targetStatus}.`), { statusCode: 409 });

      const updated = targetStatus === 'received_branch'
        ? await tx.execute(`UPDATE cod_transactions SET status = 'received_branch', received_branch_at = ?, received_branch_by = ?, notes = ? WHERE id = ? AND organization_id = ? AND status = 'collected_driver'`, [now, req.user!.userId, parsed.data.notes || null, txId, orgId])
        : await tx.execute(`UPDATE cod_transactions SET status = 'reconciled', reconciled_at = ?, reconciled_by = ?, notes = ? WHERE id = ? AND organization_id = ? AND status = 'received_branch'`, [now, req.user!.userId, parsed.data.notes || null, txId, orgId]);
      if (updated.changes !== 1) throw Object.assign(new Error(`La transacción ${txId} cambió mientras se procesaba.`), { statusCode: 409 });

      await tx.execute(`INSERT INTO shipment_events (id, shipment_id, status, location, description, actor_type, actor_id, extra_json, created_at) VALUES (?, ?, ?, NULL, ?, 'user', ?, ?, ?)`, [
        `evt-${crypto.randomUUID()}`,
        row.shipment_id,
        targetStatus,
        targetStatus === 'received_branch' ? 'COD recibido en sucursal' : 'COD conciliado por operaciones',
        req.user!.userId,
        JSON.stringify({ codTransactionId: txId, amount: row.amount, branchId: row.branch_id }),
        now
      ]);
      await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, ?, 'cod_transaction', ?, ?, 'pending', 0, ?)`, [
        `out-${crypto.randomUUID()}`,
        orgId,
        `cod.${targetStatus}`,
        txId,
        JSON.stringify({ codTransactionId: txId, shipmentId: row.shipment_id, trackingNumber: row.tracking_number, amount: row.amount, branchId: row.branch_id, status: targetStatus, actorId: req.user!.userId }),
        now
      ]);
      await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, ?, 'cod_transaction', ?, 'success', ?, ?, ?)`, [
        `aud-${crypto.randomUUID()}`,
        orgId,
        req.user!.userId,
        `cod.${targetStatus}`,
        txId,
        req.ip,
        JSON.stringify({ amount: row.amount, branchId: row.branch_id }),
        now
      ]);
      changed.push(txId);
    }

    const result = { success: true, status: targetStatus, transactionIds: changed, processedAt: now };
    if (idempotencyKey) await tx.execute(`INSERT INTO idempotency_keys (id, organization_id, idempotency_key, request_hash, status_code, response_json, created_at, expires_at) VALUES (?, ?, ?, ?, 200, ?, ?, ?)`, [`idem-${crypto.randomUUID()}`, orgId, idempotencyKey, requestHash, JSON.stringify(result), now, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
    return result;
  });
  return res.json(response);
}

codRouter.post('/receive', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS', 'BRANCH_MANAGER', 'MANAGER', 'COUNTER', 'CASHIER']), requireScope('cod:receive'), asyncHandler(async (req: AuthenticatedRequest, res) => transitionCod(req, res, 'received_branch', 'collected_driver')));

codRouter.post('/reconcile', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS', 'BRANCH_MANAGER']), requireScope('cod:reconcile'), asyncHandler(async (req: AuthenticatedRequest, res) => transitionCod(req, res, 'reconciled', 'received_branch')));

codRouter.post('/settle', authenticate, requireRole(['SUPER_ADMIN', 'OWNER', 'ADMIN', 'OPERATIONS']), requireScope('cod:settle'), asyncHandler(async (req: AuthenticatedRequest, res) => {
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
      const row = await tx.queryOne<{ id: string; status: string; amount: number }>(`SELECT id, status, amount FROM cod_transactions WHERE id = ? AND organization_id = ?${isPostgres ? ' FOR UPDATE' : ''}`, [txId, orgId]);
      if (!row) throw Object.assign(new Error('Una o más transacciones no pertenecen a esta organización.'), { statusCode: 404 });
      if (row.status !== 'reconciled') throw Object.assign(new Error(`La transacción ${txId} debe estar conciliada antes de liquidarse.`), { statusCode: 409 });
      const updated = await tx.execute(`UPDATE cod_transactions SET status = 'settled_merchant', settled_at = ?, settlement_reference = ?, notes = ? WHERE id = ? AND organization_id = ? AND status = 'reconciled'`, [now, reference, parsed.data.notes || 'Liquidación COD autorizada', txId, orgId]);
      if (updated.changes !== 1) throw Object.assign(new Error(`La transacción ${txId} cambió mientras se liquidaba.`), { statusCode: 409 });
    }
    await tx.execute(`INSERT INTO outbox_events (id, organization_id, event_type, aggregate_type, aggregate_id, payload_json, status, attempts, created_at) VALUES (?, ?, 'cod.settled', 'cod_settlement', ?, ?, 'pending', 0, ?)`, [`out-${crypto.randomUUID()}`, orgId, reference, JSON.stringify({ reference, transactionIds: ids }), now]);
    await tx.execute(`INSERT INTO audit_logs (id, organization_id, user_id, action, resource_type, resource_id, outcome, ip_address, metadata_json, created_at) VALUES (?, ?, ?, 'cod.settled', 'cod_settlement', ?, 'success', ?, ?, ?)`, [`aud-${crypto.randomUUID()}`, orgId, req.user!.userId, reference, req.ip, JSON.stringify({ transactionIds: ids }), now]);
    if (idempotencyKey) await tx.execute(`INSERT INTO idempotency_keys (id, organization_id, idempotency_key, request_hash, status_code, response_json, created_at, expires_at) VALUES (?, ?, ?, ?, 200, ?, ?, ?)`, [`idem-${crypto.randomUUID()}`, orgId, idempotencyKey, requestHash, JSON.stringify(response), now, new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()]);
  });
  return res.json(response);
}));
