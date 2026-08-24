import { createClient, type RedisClientType } from "redis";

const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;
type Window = { startedAt: number; count: number };
const windows = new Map<string, Window>();
let redisPromise: Promise<RedisClientType> | null = null;

function consumeMemoryRateLimit(keyId: string, now = Date.now()) {
  const current = windows.get(keyId);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    windows.set(keyId, { startedAt: now, count: 1 });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }
  if (current.count >= MAX_REQUESTS) return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((WINDOW_MS - (now - current.startedAt)) / 1000) };
  current.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - current.count };
}

export function getRedisUrl() {
  const url = process.env.REDIS_URL?.trim();
  if (!url) return null;
  if (!url.startsWith("rediss://")) throw new Error("REDIS_URL debe usar TLS (rediss://)");
  return url;
}

async function getRedisClient() {
  const url = getRedisUrl();
  if (!url) return null;
  if (redisPromise) {
    try {
      const existing = await redisPromise;
      if (existing.isOpen) return existing;
    } catch {
      redisPromise = null;
    }
  }
  const client = createClient({ url });
  client.on("error", () => undefined);
  redisPromise = client.connect().then(() => client).catch(async (error) => {
    redisPromise = null;
    await client.disconnect().catch(() => undefined);
    throw error;
  });
  return redisPromise;
}

export async function consumeApiRateLimit(keyId: string, now = Date.now()) {
  const client = await getRedisClient().catch(() => null);
  if (!client) {
    if (process.env.NODE_ENV === "production") return { allowed: false, remaining: 0, retryAfterSeconds: 60, distributed: false };
    return { ...consumeMemoryRateLimit(keyId, now), distributed: false };
  }
  try {
    const key = `gopaq:ratelimit:${keyId}`;
    const count = await client.incr(key);
    if (count === 1) await client.pExpire(key, WINDOW_MS);
    const ttl = await client.pTTL(key);
    if (count > MAX_REQUESTS) return { allowed: false, remaining: 0, retryAfterSeconds: Math.max(1, Math.ceil(ttl / 1000)), distributed: true };
    return { allowed: true, remaining: MAX_REQUESTS - count, distributed: true };
  } catch {
    if (process.env.NODE_ENV === "production") return { allowed: false, remaining: 0, retryAfterSeconds: 60, distributed: false };
    return { ...consumeMemoryRateLimit(keyId, now), distributed: false };
  }
}
