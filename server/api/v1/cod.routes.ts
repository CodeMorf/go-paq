import { Router } from 'express';
import { queryAll, queryOne, execute, transaction } from '../../db/database';
import { authenticate, AuthenticatedRequest } from '../../auth/middleware';

export const codRouter = Router();

// GET /api/v1/cod/ledger
codRouter.get('/ledger', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId || 'org-gopaq';
  const transactions = queryAll(`
    SELECT c.*, s.tracking_number, d.name as driver_name, b.name as branch_name, cl.company_name as client_name
    FROM cod_transactions c
    JOIN shipments s ON c.shipment_id = s.id
    LEFT JOIN drivers d ON c.driver_id = d.id
    LEFT JOIN branches b ON c.branch_id = b.id
    LEFT JOIN clients cl ON c.client_id = cl.id
    WHERE c.organization_id = ?
    ORDER BY c.created_at DESC
  `, [orgId]);

  const summary = queryOne(`
    SELECT 
      SUM(CASE WHEN status = 'pending_collection' THEN amount ELSE 0 END) as pending_collection,
      SUM(CASE WHEN status = 'collected_driver' THEN amount ELSE 0 END) as in_custody_drivers,
      SUM(CASE WHEN status = 'settled_merchant' THEN amount ELSE 0 END) as settled_total,
      COUNT(*) as total_transactions
    FROM cod_transactions
    WHERE organization_id = ?
  `, [orgId]);

  return res.json({ success: true, summary, transactions });
});

// POST /api/v1/cod/settle (Liquidación a comerciante)
codRouter.post('/settle', authenticate, (req: AuthenticatedRequest, res) => {
  const orgId = req.organizationId!;
  const { transactionIds = [], settlementReference, notes } = req.body;

  if (transactionIds.length === 0) {
    return res.status(400).json({ success: false, error: 'Debe especificar al menos una transacción para liquidar.' });
  }

  const now = new Date().toISOString();
  const ref = settlementReference || `PAY-COD-${Date.now()}`;

  transaction(() => {
    for (const txId of transactionIds) {
      execute(`
        UPDATE cod_transactions 
        SET status = 'settled_merchant', settled_at = ?, settlement_reference = ?, notes = ?
        WHERE id = ? AND organization_id = ? AND status != 'settled_merchant'
      `, [now, ref, notes || 'Liquidación bancaria automática GoPaq COD', txId, orgId]);
    }
  });

  return res.json({
    success: true,
    message: `${transactionIds.length} transacciones liquidadas con éxito.`,
    settlementReference: ref,
    settledAt: now
  });
});
