import { Redis } from '@upstash/redis';

function getRedisClient(): Redis | null {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  try {
    return new Redis({ url, token });
  } catch {
    return null;
  }
}

export default async function handler(_req: any, res: any) {
  // Allow CORS for local dev / testing
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (_req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const redis = getRedisClient();

  if (!redis) {
    return res.status(200).json({
      configured: false,
      provider: 'none',
      message: 'Vercel Storage ist noch nicht verbunden. Klicke im Vercel Dashboard auf "Storage" -> "Upstash Redis" -> "Connect".',
      timestamp: Date.now(),
    });
  }

  try {
    // Ping redis to ensure connection works
    await redis.ping();
    return res.status(200).json({
      configured: true,
      provider: 'upstash_redis',
      message: 'Vercel Storage (Upstash Redis) ist aktiv und bereit.',
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return res.status(200).json({
      configured: false,
      provider: 'error',
      message: `Fehler beim Verbinden mit Vercel Storage: ${err?.message || 'Unbekannt'}`,
      timestamp: Date.now(),
    });
  }
}
