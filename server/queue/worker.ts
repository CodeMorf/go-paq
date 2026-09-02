import crypto from 'crypto';
import { Worker, Job } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';
import { executeAsync, queryAllAsync, queryOneAsync, transactionAsync } from '../db/database';
import { getQueue, QUEUE_NAMES, QueueName, isQueueConfigured, queueForEvent } from './queues';

const redisUrl = process.env.REDIS_URL?.trim();
const REALTIME_CHANNEL = 'gopaq:realtime';
let publisher: Redis | null = null;
let workers: Worker[] = [];
let pumpRunning = false;

function connectionOptions(): RedisOptions {
  return { maxRetriesPerRequest: null, enableOfflineQueue: false, connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 5000) };
}

function redisPublisher() {
  if (!redisUrl) return null;
  if (!publisher) publisher = new Redis(redisUrl, connectionOptions());
  return publisher;
}

function parseJson(value: unknown): Record<string, any> {
  if (typeof value === 'object' && value) return value as Record<string, any>;
  try { return JSON.parse(String(value || '{}')); } catch { return {}; }
}

async function publishRealtime(event: any) {
  const client = redisPublisher();
  if (!client) return { published: false, error: 'redis_not_configured' };
  await client.publish(REALTIME_CHANNEL, JSON.stringify({
    organizationId: event.organization_id,
    eventType: event.event_type,
    aggregateType: event.aggregate_type,
    aggregateId: event.aggregate_id,
    payload: parseJson(event.payload_json),
    eventId: event.id
  }));
  return { published: true };
}

function subscribedTo(events: unknown, eventType: string) {
  const raw = typeof events === 'string' ? events : JSON.stringify(events || []);
  const parsed = (() => {
    try { return JSON.parse(raw); } catch { return raw.split(',').map((item) => item.trim()); }
  })();
  return Array.isArray(parsed) && (parsed.includes('*') || parsed.includes(eventType));
}

async function deliverWebhooks(event: any) {
  const webhooks = await queryAllAsync<any>(
    'SELECT id, organization_id, target_url, secret_key, events, failure_count FROM webhooks WHERE organization_id = ? AND active = 1',
    [event.organization_id]
  );
  const payload = parseJson(event.payload_json);
  const failed: string[] = [];

  for (const webhook of webhooks) {
    if (!subscribedTo(webhook.events, event.event_type)) continue;
    const deliveryId = `whd-${event.id}-${webhook.id}`;
    const previous = await queryOneAsync<{ status: string }>('SELECT status FROM webhook_deliveries WHERE id = ?', [deliveryId]);
    if (previous?.status === 'delivered') continue;

    const body = JSON.stringify({ id: event.id, type: event.event_type, data: payload, occurredAt: event.created_at });
    const signature = crypto.createHmac('sha256', String(webhook.secret_key)).update(body).digest('hex');
    let status = 'failed';
    let responseCode: number | null = null;
    let responseBody = '';
    try {
      const response = await fetch(String(webhook.target_url), {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          'user-agent': 'GoPaq-Webhook/1.0',
          'x-gopaq-event': event.event_type,
          'x-gopaq-delivery-id': deliveryId,
          'x-gopaq-signature': `sha256=${signature}`
        },
        body,
        signal: AbortSignal.timeout(Number(process.env.WEBHOOK_TIMEOUT_MS || 10000))
      });
      responseCode = response.status;
      responseBody = (await response.text()).slice(0, 2000);
      status = response.ok ? 'delivered' : 'failed';
    } catch (error: any) {
      responseBody = error?.message || 'provider_unavailable';
    }

    await executeAsync(`
      INSERT INTO webhook_deliveries (id, webhook_id, event, payload_json, response_code, response_body, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
      ON CONFLICT (id) DO UPDATE SET response_code = excluded.response_code, response_body = excluded.response_body, status = excluded.status
    `, [deliveryId, webhook.id, event.event_type, body, responseCode, responseBody, status]);

    if (status !== 'delivered') {
      failed.push(webhook.id);
      await executeAsync('UPDATE webhooks SET failure_count = failure_count + 1 WHERE id = ? AND organization_id = ?', [webhook.id, event.organization_id]);
    } else {
      await executeAsync('UPDATE webhooks SET failure_count = 0 WHERE id = ? AND organization_id = ?', [webhook.id, event.organization_id]);
    }
  }
  if (failed.length) throw new Error(`webhook_delivery_failed:${failed.join(',')}`);
}

async function processEvent(job: Job<{ eventId: string }>) {
  const event = await queryOneAsync<any>('SELECT * FROM outbox_events WHERE id = ?', [job.data.eventId]);
  if (!event) return;
  if (event.status === 'processed') return;

  await publishRealtime(event);
  await deliverWebhooks(event);
  await executeAsync('UPDATE outbox_events SET status = ?, processed_at = CURRENT_TIMESTAMP, last_error = NULL WHERE id = ?', ['processed', event.id]);
}

export async function claimAndEnqueueOutbox() {
  if (!isQueueConfigured() || pumpRunning) return { claimed: 0, queued: 0 };
  pumpRunning = true;
  try {
    const claimed = await transactionAsync(async (tx) => {
      const rows = await tx.queryAll<any>(`
        SELECT * FROM outbox_events
        WHERE status IN ('pending', 'failed')
          AND (next_attempt_at IS NULL OR next_attempt_at <= CURRENT_TIMESTAMP)
        ORDER BY created_at ASC
        LIMIT 50
        ${process.env.DATABASE_URL?.startsWith('postgres') ? 'FOR UPDATE SKIP LOCKED' : ''}
      `);
      for (const row of rows) {
        await tx.execute('UPDATE outbox_events SET status = ?, attempts = attempts + 1 WHERE id = ?', ['queued', row.id]);
      }
      return rows;
    });

    let queued = 0;
    for (const event of claimed) {
      try {
        const queue = queueForEvent(event.event_type) as QueueName;
        const target = getQueue(queue);
        if (!target) throw new Error('redis_not_configured');
        await target.add('outbox-event', { eventId: event.id }, { jobId: `outbox-${event.id}` });
        queued += 1;
      } catch (error) {
        const delaySeconds = Math.min(3600, 2 ** Math.min(Number(event.attempts || 1), 10));
        const nextAttemptAt = new Date(Date.now() + delaySeconds * 1000).toISOString();
        await executeAsync('UPDATE outbox_events SET status = ?, last_error = ?, next_attempt_at = ? WHERE id = ?', ['failed', error instanceof Error ? error.message : 'queue_error', nextAttemptAt, event.id]);
      }
    }
    return { claimed: claimed.length, queued };
  } finally {
    pumpRunning = false;
  }
}

export async function startWorkers() {
  if (!redisUrl) throw new Error('REDIS_URL is required for the production worker.');
  for (const name of QUEUE_NAMES) {
    const worker = new Worker(name, processEvent, {
      connection: new Redis(redisUrl, connectionOptions()),
      concurrency: Number(process.env.QUEUE_CONCURRENCY || 5),
      autorun: true
    });
    worker.on('failed', (job, error) => console.error(`[GoPaq Worker] ${name} failed`, job?.id, error.message));
    worker.on('error', (error) => console.error(`[GoPaq Worker] ${name} error`, error.message));
    workers.push(worker);
  }
  const interval = setInterval(() => { claimAndEnqueueOutbox().catch((error) => console.error('[GoPaq Outbox]', error instanceof Error ? error.message : 'pump_error')); }, Number(process.env.OUTBOX_POLL_MS || 1000));
  await claimAndEnqueueOutbox();
  return async () => {
    clearInterval(interval);
    await Promise.all(workers.map((worker) => worker.close()));
    workers = [];
    if (publisher) {
      await publisher.quit().catch(() => publisher?.disconnect());
      publisher = null;
    }
  };
}
