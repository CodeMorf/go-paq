import { Queue } from 'bullmq';
import Redis, { RedisOptions } from 'ioredis';

export const QUEUE_NAMES = [
  'notifications',
  'webhooks',
  'routing',
  'tracking',
  'driver-sync',
  'cod',
  'international',
  'moving',
  'heavy-cargo',
  'ai',
  'voice',
  'integrations',
  'maintenance'
] as const;

export type QueueName = typeof QUEUE_NAMES[number];

const redisUrl = process.env.REDIS_URL?.trim();
let producerConnection: Redis | null = null;
const queues = new Map<QueueName, Queue>();

export function isQueueConfigured() {
  return Boolean(redisUrl);
}

function redisOptions(): RedisOptions {
  return {
    maxRetriesPerRequest: null,
    enableOfflineQueue: false,
    connectTimeout: Number(process.env.REDIS_CONNECT_TIMEOUT_MS || 5000)
  };
}

function getProducerConnection() {
  if (!redisUrl) return null;
  if (!producerConnection) producerConnection = new Redis(redisUrl, redisOptions());
  return producerConnection;
}

export function queueForEvent(eventType: string): QueueName {
  if (eventType.startsWith('shipment.') || eventType.startsWith('tracking.')) return 'tracking';
  if (eventType.startsWith('route.') || eventType.startsWith('dispatch.')) return 'routing';
  if (eventType.startsWith('driver.')) return 'driver-sync';
  if (eventType.startsWith('cod.')) return 'cod';
  if (eventType.startsWith('international.')) return 'international';
  if (eventType.startsWith('moving.')) return 'moving';
  if (eventType.startsWith('heavy_cargo.') || eventType.startsWith('heavy-cargo.')) return 'heavy-cargo';
  if (eventType.startsWith('ai.')) return 'ai';
  if (eventType.startsWith('voice.')) return 'voice';
  if (eventType.startsWith('integration.')) return 'integrations';
  if (eventType.startsWith('maintenance.')) return 'maintenance';
  return 'notifications';
}

export function getQueue(name: QueueName) {
  if (!getProducerConnection()) return null;
  const existing = queues.get(name);
  if (existing) return existing;
  const queue = new Queue(name, {
    connection: getProducerConnection()!,
    defaultJobOptions: {
      attempts: Number(process.env.QUEUE_ATTEMPTS || 5),
      backoff: { type: 'exponential', delay: Number(process.env.QUEUE_BACKOFF_MS || 2000) },
      removeOnComplete: { age: 24 * 60 * 60, count: 1000 },
      removeOnFail: { age: 7 * 24 * 60 * 60, count: 5000 }
    }
  });
  queues.set(name, queue);
  return queue;
}

export async function enqueueOutboxEvent(event: {
  id: string;
  organization_id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  payload_json: string;
}) {
  const name = queueForEvent(event.event_type);
  const queue = getQueue(name);
  if (!queue) return { queued: false, error: 'redis_not_configured', queue: name };
  await queue.add('outbox-event', { eventId: event.id }, { jobId: `outbox-${event.id}` });
  return { queued: true, queue: name };
}

export async function closeQueues() {
  await Promise.all([...queues.values()].map((queue) => queue.close()));
  queues.clear();
  if (producerConnection) {
    await producerConnection.quit().catch(() => producerConnection?.disconnect());
    producerConnection = null;
  }
}
