const windows = new Map<string, { startedAt: number; count: number }>();
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 60;

export function consumeApiRateLimit(keyId: string, now = Date.now()) {
  const current = windows.get(keyId);
  if (!current || now - current.startedAt >= WINDOW_MS) {
    windows.set(keyId, { startedAt: now, count: 1 });
    return { allowed: true, remaining: MAX_REQUESTS - 1 };
  }
  if (current.count >= MAX_REQUESTS) return { allowed: false, remaining: 0, retryAfterSeconds: Math.ceil((WINDOW_MS - (now - current.startedAt)) / 1000) };
  current.count += 1;
  return { allowed: true, remaining: MAX_REQUESTS - current.count };
}
