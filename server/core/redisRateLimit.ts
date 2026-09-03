import type { Store, ClientRateLimitInfo, Options } from 'express-rate-limit';
import Redis from 'ioredis';

export class RedisRateLimitStore implements Store {
  localKeys = false;
  private readonly keyPrefix: string;
  private readonly redis: Redis;
  private windowMs = 60_000;
  private connectPromise: Promise<void> | null = null;

  constructor(prefix: string) {
    const redisUrl = String(process.env.REDIS_URL || '').trim();
    if (!redisUrl) throw new Error('Redis es obligatorio para el almacén de rate limit.');
    this.keyPrefix = prefix;
    this.redis = new Redis(redisUrl, { lazyConnect: true, maxRetriesPerRequest: 1, enableOfflineQueue: false, connectTimeout: 1500 });
  }

  init(options: Options) {
    this.windowMs = options.windowMs;
  }

  private async ensureConnected() {
    if (this.redis.status === 'ready') return;
    if (!this.connectPromise) {
      this.connectPromise = new Promise<void>((resolve, reject) => {
        const cleanup = () => {
          this.redis.off('ready', onReady);
          this.redis.off('error', onError);
        };
        const onReady = () => { cleanup(); resolve(); };
        const onError = (error: Error) => { cleanup(); reject(error); };
        this.redis.once('ready', onReady);
        this.redis.once('error', onError);
        if (this.redis.status === 'wait') {
          void this.redis.connect().catch(onError);
        }
      }).finally(() => { this.connectPromise = null; });
    }
    await this.connectPromise;
    if (String(this.redis.status) !== 'ready') throw new Error('Redis no quedó listo para rate limiting.');
  }

  async increment(key: string): Promise<ClientRateLimitInfo> {
    await this.ensureConnected();
    const redisKey = `${this.keyPrefix}:${key}`;
    const result = await this.redis.eval(`
      local hits = redis.call('INCR', KEYS[1])
      if hits == 1 then redis.call('PEXPIRE', KEYS[1], ARGV[1]) end
      local ttl = redis.call('PTTL', KEYS[1])
      return { hits, ttl }
    `, 1, redisKey, String(this.windowMs)) as [number, number];
    const totalHits = Number(result?.[0] || 0);
    const ttl = Math.max(1, Number(result?.[1] || this.windowMs));
    return { totalHits, resetTime: new Date(Date.now() + ttl) };
  }

  async decrement(key: string) {
    await this.ensureConnected();
    await this.redis.decr(`${this.keyPrefix}:${key}`);
  }

  async resetKey(key: string) {
    await this.ensureConnected();
    await this.redis.del(`${this.keyPrefix}:${key}`);
  }

  async shutdown() {
    if (this.redis.status !== 'end') await this.redis.quit();
  }
}
