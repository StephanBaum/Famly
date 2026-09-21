import { Index } from '@upstash/vector';

function getVectorIndex(): Index | null {
  const url =
    process.env.UPSTASH_VECTOR_REST_URL ||
    process.env.VECTOR_REST_API_URL ||
    process.env.UPSTASH_VECTOR_URL;
  const token =
    process.env.UPSTASH_VECTOR_REST_TOKEN ||
    process.env.VECTOR_REST_API_TOKEN ||
    process.env.UPSTASH_VECTOR_TOKEN;
  if (!url || !token) return null;
  try {
    return new Index({ url, token });
  } catch {
    return null;
  }
}

export default async function handler(req: any, res: any) {
  // CORS
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const vector = getVectorIndex();

  if (!vector) {
    return res.status(200).json({
      success: false,
      configured: false,
      message: 'Upstash Vector ist nicht konfiguriert (UPSTASH_VECTOR_REST_URL fehlt).',
      memories: [],
    });
  }

  try {
    // GET: Query vector memories semantically
    if (req.method === 'GET') {
      const query = (req.query?.query as string) || '';
      const topK = parseInt((req.query?.topK as string) || '5', 10);

      if (!query.trim()) {
        return res.status(200).json({
          success: true,
          configured: true,
          memories: [],
        });
      }

      const results = await vector.query({
        data: query,
        topK,
        includeMetadata: true,
      });

      const formatted = results.map((item: any) => ({
        id: item.id,
        score: item.score,
        content: item.metadata?.content || item.id,
        category: item.metadata?.category || 'general',
        tags: item.metadata?.tags || [],
        createdAt: item.metadata?.createdAt || Date.now(),
      }));

      return res.status(200).json({
        success: true,
        configured: true,
        memories: formatted,
      });
    }

    // POST: Upsert memory
    if (req.method === 'POST') {
      const { id, content, category, tags } = req.body || {};
      if (!content || !content.trim()) {
        return res.status(400).json({ success: false, error: 'Content is required' });
      }

      const memoryId = id || `mem_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const now = Date.now();

      await vector.upsert({
        id: memoryId,
        data: content,
        metadata: {
          content,
          category: category || 'general',
          tags: tags || [],
          createdAt: now,
        },
      });

      return res.status(200).json({
        success: true,
        configured: true,
        id: memoryId,
      });
    }

    // DELETE: Remove memory
    if (req.method === 'DELETE') {
      const id = req.query?.id as string;
      if (!id) {
        return res.status(400).json({ success: false, error: 'ID is required' });
      }

      await vector.delete(id);
      return res.status(200).json({ success: true, configured: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (err: any) {
    console.error('Error in /api/memory:', err);
    return res.status(500).json({
      success: false,
      error: err?.message || 'Error processing vector request',
    });
  }
}
