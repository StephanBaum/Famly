import { Redis } from '@upstash/redis';
import { Index } from '@upstash/vector';

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

function getVectorIndex(): Index | null {
  const url = process.env.UPSTASH_VECTOR_REST_URL;
  const token = process.env.UPSTASH_VECTOR_REST_TOKEN;
  if (!url || !token) return null;
  try {
    return new Index({ url, token });
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
  let redisStatus = {
    configured: false,
    message: 'Upstash Redis nicht verbunden.',
  };

  if (redis) {
    try {
      await redis.ping();
      redisStatus = {
        configured: true,
        message: 'Upstash Redis ist aktiv & verbunden.',
      };
    } catch (err: any) {
      redisStatus = {
        configured: false,
        message: `Fehler bei Redis-Verbindung: ${err?.message || 'Unbekannt'}`,
      };
    }
  }

  const vector = getVectorIndex();
  let vectorStatus = {
    configured: false,
    message: 'Upstash Vector nicht verbunden.',
  };

  if (vector) {
    try {
      const info = await vector.info();
      vectorStatus = {
        configured: true,
        message: `Upstash Vector aktiv (${info.vectorCount || 0} Vektoren indiziert).`,
      };
    } catch (err: any) {
      vectorStatus = {
        configured: false,
        message: `Vector-Verbindungsfehler: ${err?.message || 'Unbekannt'}`,
      };
    }
  }

  const qstashToken = process.env.QSTASH_TOKEN;
  const qstashStatus = {
    configured: Boolean(qstashToken),
    message: qstashToken
      ? 'Upstash QStash / Workflow ist aktiv für Hintergrund-Routinen.'
      : 'Upstash QStash nicht verbunden.',
  };

  const isAnyConfigured = redisStatus.configured || vectorStatus.configured || qstashStatus.configured;

  return res.status(200).json({
    configured: redisStatus.configured,
    provider: redisStatus.configured ? 'upstash_redis' : 'none',
    message: redisStatus.message,
    services: {
      redis: redisStatus,
      vector: vectorStatus,
      qstash: qstashStatus,
    },
    timestamp: Date.now(),
  });
}
