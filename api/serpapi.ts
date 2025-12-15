/**
 * SerpAPI Proxy - Vercel Serverless Function
 * /api/serpapi endpoint'i için backend proxy
 * CORS sorunlarını çözer
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Only allow GET
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get query parameters
    const { q, api_key, engine, num, safe, hl, gl, tbs } = req.query;

    // Validate required params
    if (!q) {
      return res.status(400).json({ error: 'Missing required parameter: q' });
    }

    if (!api_key) {
      return res.status(400).json({ error: 'Missing required parameter: api_key' });
    }

    // Build SerpAPI URL
    const params = new URLSearchParams({
      q: String(q),
      api_key: String(api_key),
      engine: String(engine || 'google_images'),
      num: String(num || '15'),
      safe: String(safe || 'active'),
      hl: String(hl || 'en'),
      gl: String(gl || 'us')
    });

    // Add optional tbs (image type filter) if provided
    if (tbs) {
      params.append('tbs', String(tbs));
    }

    const serpApiUrl = `https://serpapi.com/search?${params.toString()}`;
    
    // Log (hide API key)
    console.log('[SerpAPI Proxy] Request:', serpApiUrl.replace(String(api_key), '***'));

    // Fetch from SerpAPI
    const response = await fetch(serpApiUrl);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('[SerpAPI Proxy] SerpAPI Error:', response.status, errorText.substring(0, 200));
      return res.status(response.status).json({ 
        error: 'SerpAPI request failed', 
        status: response.status,
        message: errorText.substring(0, 200)
      });
    }

    const data = await response.json();
    
    // Return successful response
    console.log('[SerpAPI Proxy] Success:', data.images_results?.length || 0, 'images');
    return res.status(200).json(data);

  } catch (error) {
    console.error('[SerpAPI Proxy] Exception:', error);
    return res.status(500).json({ 
      error: 'Internal server error', 
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}