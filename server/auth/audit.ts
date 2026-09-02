import { executeAsync } from '../db/database';
import crypto from 'crypto';

export async function writeAuditLog(input: {
  organizationId?: string | null;
  userId?: string | null;
  action: string;
  resourceType?: string;
  resourceId?: string;
  outcome: 'success' | 'failure';
  ipAddress?: string;
  metadata?: Record<string, unknown>;
}) {
  try {
    await executeAsync(`
      INSERT INTO audit_logs (
        id, organization_id, user_id, action, resource_type, resource_id,
        outcome, ip_address, metadata_json, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
      `aud-${crypto.randomUUID()}`,
      input.organizationId || null,
      input.userId || null,
      input.action,
      input.resourceType || null,
      input.resourceId || null,
      input.outcome,
      input.ipAddress || null,
      JSON.stringify(input.metadata || {})
    ]);
  } catch (error) {
    // Audit failure must be observable, but must not turn a successful business
    // request into an unknown outcome for the caller.
    console.error('[audit-log-failure]', error instanceof Error ? error.message : 'unknown');
  }
}
