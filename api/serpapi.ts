import type { VercelRequest, VercelResponse } from '@vercel/node';

/**
 * SerpAPI Proxy for Staj Defteri Oluşturucu
 * Vercel Serverless Function - CORS sorunlarını çözer
 * Emity v2'den adapte edilmiştir
 */

// İzin verilen SerpAPI motorları
const ALLOWED_ENGINES = [
    'google_images',
    'google_trends'
];

// Engellenen domainler - stok foto siteleri ve sosyal medya
const BLOCKED_DOMAINS = [
    // Stok foto siteleri
    'shutterstock.com',
    'istockphoto.com',
    'gettyimages.com',
    'dreamstime.com',
    'freepik.com',
    'adobestock.com',
    'depositphotos.com',
    '123rf.com',
    'alamy.com',
    'bigstockphoto.com',
    // Sosyal medya
    'pinterest.com',
    'instagram.com',
    'facebook.com',
    'fbsbx.com',
    'fbcdn.net',
    'lookaside.fbsbx.com',
    'tiktok.com',
    'twitter.com',
    'twimg.com',
    // E-ticaret
    'aliexpress.com',
    'alibaba.com',
    'amazon.com',
    // Diğer
    'wikia.nocookie.net',
    'fandom.com'
];

// Tercih edilen domainler - teknik/eğitim kaynakları
const PREFERRED_DOMAINS = [
    'wikipedia.org',
    'wikimedia.org',
    '.edu',
    '.gov',
    'elektrikport.com',
    'elektrikrehberiniz.com',
    'electronics-tutorials.ws',
    'allaboutcircuits.com',
    'electrical4u.com',
    'circuitdigest.com'
];

export default async function handler(req: VercelRequest, res: VercelResponse) {
    // CORS Headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    try {
        const { api_key, engine, ...otherParams } = req.query;

        // API key kontrolü
        if (!api_key) {
            return res.status(400).json({ error: 'Missing api_key parameter' });
        }

        // Engine kontrolü
        if (!engine) {
            return res.status(400).json({ error: 'Missing engine parameter' });
        }

        // Engine validasyonu
        if (!ALLOWED_ENGINES.includes(String(engine))) {
            return res.status(400).json({
                error: `Invalid engine. Allowed: ${ALLOWED_ENGINES.join(', ')}`
            });
        }

        // SerpAPI URL oluştur
        const params = new URLSearchParams();
        params.append('api_key', String(api_key));
        params.append('engine', String(engine));

        // Diğer parametreleri ekle
        Object.entries(otherParams).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    params.append(key, value[0]);
                } else {
                    params.append(key, String(value));
                }
            }
        });

        console.log('[SerpAPI Proxy] Request:', {
            engine,
            query: otherParams.q || otherParams.search_query,
            count: otherParams.num || otherParams.count
        });

        // SerpAPI'ye istek at
        const response = await fetch(`https://serpapi.com/search.json?${params}`);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('[SerpAPI Proxy] Error:', response.status, errorText.substring(0, 200));
            return res.status(response.status).json({
                error: `SerpAPI error: ${response.status}`,
                details: errorText.substring(0, 200)
            });
        }

        const data = await response.json();

        // SerpAPI hata kontrolü
        if (data.error) {
            console.error('[SerpAPI Proxy] API Error:', data.error);
            return res.status(400).json({ error: data.error });
        }

        console.log('[SerpAPI Proxy] Success:', {
            engine,
            resultCount: data.images_results?.length || 0
        });

        // Google Images için özel filtreleme
        if (engine === 'google_images' && data.images_results) {
            const filteredResults = data.images_results.filter((img: any) => {
                const url = img.original || '';
                // Engellenen domainleri filtrele
                const isBlocked = BLOCKED_DOMAINS.some(domain => url.includes(domain));
                if (isBlocked) return false;

                // Sadece görsel dosyalarını kabul et
                const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i.test(url);
                return hasImageExtension || url.includes('image') || img.thumbnail;
            });

            // Tercih edilen domainleri öne al
            const sortedResults = filteredResults.sort((a: any, b: any) => {
                const aUrl = a.original || '';
                const bUrl = b.original || '';
                const aPreferred = PREFERRED_DOMAINS.some(d => aUrl.includes(d));
                const bPreferred = PREFERRED_DOMAINS.some(d => bUrl.includes(d));
                return (bPreferred ? 1 : 0) - (aPreferred ? 1 : 0);
            });

            return res.status(200).json({
                ...data,
                images_results: sortedResults,
                filtered_count: data.images_results.length - sortedResults.length
            });
        }

        return res.status(200).json(data);

    } catch (error: any) {
        console.error('[SerpAPI Proxy] Exception:', error.message);
        return res.status(500).json({
            error: 'Proxy request failed',
            message: error.message
        });
    }
}
