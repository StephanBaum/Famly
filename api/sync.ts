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

const REDIS_KEY_STATE = 'famly:state:v1';
const REDIS_KEY_TIMESTAMP = 'famly:updated_at:v1';

export default async function handler(req: any, res: any) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const redis = getRedisClient();

  if (!redis) {
    return res.status(200).json({
      success: false,
      configured: false,
      message: 'Vercel Storage ist nicht konfiguriert.',
    });
  }

  try {
    // GET: Retrieve latest family state
    if (req.method === 'GET') {
      const [state, updatedAt] = await Promise.all([
        redis.get(REDIS_KEY_STATE),
        redis.get(REDIS_KEY_TIMESTAMP),
      ]);

      return res.status(200).json({
        success: true,
        configured: true,
        data: state || null,
        updatedAt: Number(updatedAt) || null,
      });
    }

    // POST: Save or merge updated family state
    if (req.method === 'POST') {
      const incomingState = req.body;
      if (!incomingState || typeof incomingState !== 'object') {
        return res.status(400).json({ success: false, error: 'Invalid state payload' });
      }

      const now = Date.now();

      // Save state and timestamp atomically in Redis
      await Promise.all([
        redis.set(REDIS_KEY_STATE, JSON.stringify(incomingState)),
        redis.set(REDIS_KEY_TIMESTAMP, now),
      ]);

      return res.status(200).json({
        success: true,
        configured: true,
        updatedAt: now,
      });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Error in /api/sync:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Internal server error in Vercel Storage',
    });
  }
}
