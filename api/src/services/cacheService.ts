import { createClient, type RedisClientType } from 'redis';
import { createHash } from 'crypto';
import { config } from '../config';

let client: RedisClientType | null = null;
let connected = false;

async function getClient(): Promise<RedisClientType | null> {
  if (connected && client) return client;

  try {
    client = createClient({ url: config.redisUrl });
    client.on('error', (err) => {
      console.warn('[redis]', err.message);
    });
    await client.connect();
    connected = true;
    return client;
  } catch (err) {
    console.warn('[redis] unavailable — caching disabled:', (err as Error).message);
    connected = false;
    client = null;
    return null;
  }
}

export function hashCacheKey(sourceText: string, strategy: string): string {
  return createHash('sha256').update(`${strategy}:${sourceText}`).digest('hex');
}

export async function getCached<T>(key: string): Promise<T | null> {
  const redis = await getClient();
  if (!redis) return null;
  try {
    const raw = await redis.get(`llm:${key}`);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function setCached(key: string, value: unknown, ttlSeconds = 86400): Promise<void> {
  const redis = await getClient();
  if (!redis) return;
  try {
    await redis.setEx(`llm:${key}`, ttlSeconds, JSON.stringify(value));
  } catch (err) {
    console.warn('[redis] set failed:', (err as Error).message);
  }
}

export async function disconnectCache(): Promise<void> {
  if (client && connected) {
    await client.quit();
    connected = false;
    client = null;
  }
}
