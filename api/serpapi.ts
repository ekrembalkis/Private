/**
 * SerpAPI Image Search Service
 * Emity v2'den adapte edilmiş - Staj Defteri için özelleştirilmiş
 * Vercel Proxy üzerinden CORS sorunları çözülmüş
 * Query'ler İngilizce - Daha iyi sonuçlar için
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
            hl: 'en', // English results for better quality
            gl: 'us'  // US location for more results
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
 * Turkish to English topic mapping for better search results
 */
const TOPIC_TRANSLATIONS: Record<string, string> = {
    // Common terms
    'elektrik': 'electrical',
    'pano': 'electrical panel switchboard',
    'kablo': 'cable wiring',
    'montaj': 'installation mounting',
    'devre': 'circuit',
    'şema': 'schematic diagram',
    'proje': 'project drawing',
    'aydınlatma': 'lighting',
    'topraklama': 'grounding earthing',
    'sigorta': 'fuse circuit breaker',
    'trafo': 'transformer',
    'motor': 'motor drive',
    'kompanzasyon': 'power factor correction capacitor',
    'ölçüm': 'measurement testing',
    'bakım': 'maintenance repair',
    'arıza': 'fault troubleshooting',
    'tesisat': 'installation wiring',
    'dağıtım': 'distribution',
    'kumanda': 'control',
    'otomasyon': 'automation PLC',
    'inverter': 'inverter VFD',
    'kondansatör': 'capacitor',
    'kontaktör': 'contactor',
    'röle': 'relay',
    'şalter': 'switch breaker',
    'bara': 'busbar',
    'klemens': 'terminal block',
    'pabuç': 'cable lug',
    'multimetre': 'multimeter',
    'pens': 'clamp meter',
    'villa': 'residential house',
    'fabrika': 'factory industrial',
    'ofis': 'office commercial',
    'şantiye': 'construction site',
    'AutoCAD': 'AutoCAD CAD',
    'tek hat': 'single line diagram',
    'güç': 'power',
    'gerilim': 'voltage',
    'akım': 'current amperage'
};

/**
 * Translate Turkish topic to English for better search
 */
const translateToEnglish = (topic: string): string => {
    let result = topic.toLowerCase();
    
    // Replace known Turkish terms with English
    for (const [tr, en] of Object.entries(TOPIC_TRANSLATIONS)) {
        const regex = new RegExp(tr.toLowerCase(), 'gi');
        result = result.replace(regex, en);
    }
    
    return result;
};

/**
 * Teknik görsel araması için optimize edilmiş query builder
 * All queries are in English for better results
 */
export const buildTechnicalQuery = (
    topic: string,
    queryType: 'autocad' | 'saha' | 'tablo' | 'genel' = 'genel'
): string => {
    // Translate topic to English
    const englishTopic = translateToEnglish(topic);

    switch (queryType) {
        case 'autocad':
            return `${englishTopic} AutoCAD electrical drawing blueprint schematic`;
        case 'saha':
            return `${englishTopic} electrical installation work site electrician`;
        case 'tablo':
            return `${englishTopic} electrical diagram chart schematic symbol`;
        default:
            return `${englishTopic} electrical`;
    }
};

/**
 * Fallback query'ler - ana sorgu sonuç vermezse
 * All in English
 */
export const getFallbackQueries = (topic: string, queryType: string): string[] => {
    const englishTopic = translateToEnglish(topic);
    const baseTopic = englishTopic.split(' ').slice(0, 3).join(' ');

    switch (queryType) {
        case 'autocad':
            return [
                `${baseTopic} electrical drawing CAD`,
                'electrical wiring diagram AutoCAD',
                'single line diagram electrical schematic',
                'electrical floor plan drawing'
            ];
        case 'saha':
            return [
                `${baseTopic} electrical installation`,
                'electrician working panel installation',
                'electrical construction site work',
                'cable tray installation electrical'
            ];
        case 'tablo':
            return [
                `${baseTopic} electrical diagram`,
                'electrical symbols chart reference',
                'circuit diagram schematic',
                'electrical wiring diagram symbols'
            ];
        default:
            return [
                `${baseTopic} electrical`,
                `${baseTopic} wiring diagram`
            ];
    }
};