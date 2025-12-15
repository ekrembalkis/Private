/**
 * SerpAPI Image Search Service
 * Emity v2'den adapte edilmiş - Staj Defteri için özelleştirilmiş
 * Vercel Proxy üzerinden CORS sorunları çözülmüş
 */

export interface SerpAPIImage {
    id: string;
    url: string;
    thumbnail: string;
    title: string;
    source: string;
    width: number;
    height: number;
}

export interface SerpAPIOptions {
    count?: number;
    imageType?: 'photo' | 'lineart' | 'clipart' | 'animated';
    safeSearch?: boolean;
}

/**
 * SerpAPI üzerinden görsel arama
 * Vercel proxy kullanarak CORS sorunlarını çözer
 */
export const searchImagesSerpAPI = async (
    query: string,
    apiKey: string,
    options: SerpAPIOptions = {}
): Promise<SerpAPIImage[]> => {
    const { count = 15, imageType, safeSearch = true } = options;

    if (!apiKey || !query || query.trim().length < 2) {
        console.log('[SerpAPI] ❌ Missing API key or invalid query');
        return [];
    }

    const cleanQuery = query.trim();
    console.log('[SerpAPI] 🔍 Searching:', cleanQuery);

    try {
        // Vercel API proxy kullan
        const params = new URLSearchParams({
            q: cleanQuery,
            api_key: apiKey,
            engine: 'google_images',
            num: String(Math.min(count, 100)), // SerpAPI max 100
            safe: safeSearch ? 'active' : 'off',
            hl: 'tr', // Türkçe sonuçlar
            gl: 'tr'  // Türkiye lokasyonu
        });

        // Görsel tipi filtresi
        if (imageType) {
            params.append('tbs', `itp:${imageType}`);
        }

        const response = await fetch('/api/serpapi?' + params.toString());

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('[SerpAPI] ❌ Proxy error:', response.status, errorData);
            return [];
        }

        const data = await response.json();

        if (!data.images_results || data.images_results.length === 0) {
            console.log('[SerpAPI] ⚠️ No results found');
            return [];
        }

        console.log('[SerpAPI] ✓ Found', data.images_results.length, 'images');

        return data.images_results.map((img: any, index: number) => ({
            id: 'serp-' + Date.now() + '-' + index,
            url: img.original,
            thumbnail: img.thumbnail,
            title: img.title || cleanQuery,
            source: img.source || 'Google Images',
            width: img.original_width || 0,
            height: img.original_height || 0
        }));

    } catch (error) {
        console.error('[SerpAPI] ❌ Search failed:', error);
        return [];
    }
};

/**
 * Teknik görsel araması için optimize edilmiş query builder
 */
export const buildTechnicalQuery = (
    topic: string,
    queryType: 'autocad' | 'saha' | 'tablo' | 'genel' = 'genel'
): string => {
    const baseTopic = topic.trim();

    switch (queryType) {
        case 'autocad':
            return `${baseTopic} AutoCAD elektrik proje çizim teknik`;
        case 'saha':
            return `${baseTopic} elektrik montaj kurulum saha çalışması`;
        case 'tablo':
            return `${baseTopic} elektrik şema diyagram devre`;
        default:
            return baseTopic;
    }
};

/**
 * Fallback query'ler - ana sorgu sonuç vermezse
 */
export const getFallbackQueries = (topic: string, queryType: string): string[] => {
    const baseTopic = topic.split(' ').slice(0, 3).join(' ');

    switch (queryType) {
        case 'autocad':
            return [
                `${baseTopic} electrical drawing`,
                'elektrik tesisat projesi AutoCAD',
                'electrical wiring diagram schematic',
                'single line diagram electrical'
            ];
        case 'saha':
            return [
                `${baseTopic} installation`,
                'elektrik pano montaj',
                'electrical installation work',
                'electrician work site'
            ];
        case 'tablo':
            return [
                `${baseTopic} circuit diagram`,
                'elektrik sembol tablosu',
                'electrical symbols chart',
                'circuit schematic diagram'
            ];
        default:
            return [baseTopic + ' elektrik', baseTopic + ' electrical'];
    }
};
