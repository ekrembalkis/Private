/**
 * Image Service v2.0 - SerpAPI Entegreli
 * Emity v2'den adapte edilmiş kusursuz arama sistemi
 * + Wikimedia Commons desteği korunmuş
 */

import { searchImagesSerpAPI, buildTechnicalQuery, getFallbackQueries, translateToEnglish, SerpAPIImage } from './serpApiService';
import { generateImageSearchQuery } from './semanticQueryService';
import { getSearchConfig, SearchStrategy } from './searchTermsLibrary';

export interface StockImage {
  id: string;
  url: string;
  thumbUrl: string;
  title: string;
  source: 'google' | 'wikimedia' | 'serpapi';
}

// SerpAPI Key - Environment'tan al
const getSerpApiKey = (): string => {
  return process.env.SERPAPI_KEY || '';
};

// Domain filtreleme - SADECE watermarklı stock siteler
const DOMAIN_BLACKLIST = [
  // Stock siteler (watermarklı - kullanılamaz)
  'shutterstock.com', 'istockphoto.com', 'gettyimages.com',
  'dreamstime.com', 'adobestock.com', '123rf.com',
  'depositphotos.com', 'bigstockphoto.com', 'alamy.com',
  // Sosyal medya (genellikle düşük kalite veya engellenebilir)
  'pinterest.com', 'tiktok.com'
];

// Tercih edilen kaliteli kaynaklar
const DOMAIN_WHITELIST = [
  'wikipedia.org', 'wikimedia.org', '.edu', '.gov',
  'elektrikport.com', 'elektrikrehberiniz.com',
  'electronics-tutorials.ws', 'allaboutcircuits.com',
  'electrical-engineering-portal.com', 'electricaltechnology.org',
  'circuitdigest.com', 'electronicshub.org',
  'atexdb.eu', 'ex-machinery.com', 'eaton.com', 'siemens.com'
];

/**
 * URL'yi temizle ve HTTPS'e çevir
 */
const sanitizeImageUrl = (url: string): string | null => {
  try {
    if (!url) return null;
    
    // x-raw-image ve data URL'leri filtrele
    if (url.startsWith('x-raw-image://') || url.startsWith('data:')) {
      return null;
    }
    
    // HTTP'yi HTTPS'e çevir (mixed content hatası önleme)
    if (url.startsWith('http://')) {
      url = url.replace('http://', 'https://');
    }
    
    if (!url.startsWith('https://')) {
      return null;
    }
    
    return url;
  } catch {
    return null;
  }
};

const isValidDomain = (url: string): boolean => {
  try {
    const sanitized = sanitizeImageUrl(url);
    if (!sanitized) return false;
    
    const domain = new URL(sanitized).hostname.toLowerCase();
    for (const blocked of DOMAIN_BLACKLIST) {
      if (domain.includes(blocked)) return false;
    }
    return true;
  } catch {
    return false;
  }
};

const isDomainPreferred = (url: string): boolean => {
  try {
    const domain = new URL(url).hostname.toLowerCase();
    return DOMAIN_WHITELIST.some(w => domain.includes(w));
  } catch {
    return false;
  }
};

// Query temizleme
const cleanQuery = (query: string): string => {
  return query.replace(/[^\w\sğüşıöçĞÜŞİÖÇ]/g, ' ').trim();
};

// ==========================================
// SERPAPI TABANLI ARAMA (YENİ - EMITY'DEN)
// ==========================================

/**
 * SerpAPI ile görsel arama - Ana fonksiyon
 * Emity v2'den adapte edilmiş kusursuz sistem
 */
export const searchImagesWithSerpAPI = async (
  topic: string,
  count: number = 15,
  imageType: 'autocad' | 'saha' | 'tablo' | 'genel' = 'genel'
): Promise<StockImage[]> => {
  const serpApiKey = getSerpApiKey();

  if (!serpApiKey) {
    console.log('[ImageService] ⚠️ SerpAPI key not found, falling back to Wikimedia');
    return searchWikimediaImages(topic, count);
  }

  // Query oluştur
  const query = buildTechnicalQuery(topic, imageType);
  console.log('[ImageService] 🔍 SerpAPI Search:', query);

  // Görsel tipi mapping
  const imageTypeMap: Record<string, 'photo' | 'lineart' | 'clipart' | undefined> = {
    'autocad': 'lineart',
    'tablo': 'lineart',
    'saha': 'photo',
    'genel': undefined
  };

  try {
    const results = await searchImagesSerpAPI(query, serpApiKey, {
      count,
      imageType: imageTypeMap[imageType],
      safeSearch: true
    });

    if (results.length === 0) {
      // Fallback queries dene
      console.log('[ImageService] ⚠️ No results, trying fallback queries...');
      const fallbackQueries = getFallbackQueries(topic, imageType);

      for (const fbQuery of fallbackQueries) {
        const fbResults = await searchImagesSerpAPI(fbQuery, serpApiKey, { count: 10 });
        if (fbResults.length > 0) {
          return convertSerpResults(fbResults);
        }
      }

      // Hala sonuç yoksa Wikimedia'ya düş
      console.log('[ImageService] ⚠️ Fallback to Wikimedia...');
      return searchWikimediaImages(topic, count);
    }

    return convertSerpResults(results);
  } catch (error) {
    console.error('[ImageService] ❌ SerpAPI failed:', error);
    return searchWikimediaImages(topic, count);
  }
};

/**
 * Semantic query sonucunu direkt kullan (buildTechnicalQuery bypass)
 */
export const searchImagesDirectQuery = async (
  query: string,
  count: number = 15,
  imageType: 'autocad' | 'saha' | 'tablo' | 'genel' = 'genel'
): Promise<StockImage[]> => {
  const serpApiKey = getSerpApiKey();

  if (!serpApiKey) {
    console.log('[ImageService] ⚠️ SerpAPI key not found, falling back to Wikimedia');
    return searchWikimediaImages(query, count);
  }

  console.log('[ImageService] 🔍 Direct SerpAPI Search:', query);

  // Görsel tipi mapping - tablo için lineart daha iyi sonuç verir
  const imageTypeMap: Record<string, 'photo' | 'lineart' | 'clipart' | undefined> = {
    'autocad': 'lineart',
    'tablo': undefined, // tablo için filtre kaldırıldı - daha geniş sonuç
    'saha': 'photo',
    'genel': undefined
  };

  try {
    const results = await searchImagesSerpAPI(query, serpApiKey, {
      count,
      imageType: imageTypeMap[imageType],
      safeSearch: true
    });

    if (results.length === 0) {
      console.log('[ImageService] ⚠️ No results, trying Wikimedia...');
      return searchWikimediaImages(query, count);
    }

    return convertSerpResults(results);
  } catch (error) {
    console.error('[ImageService] ❌ SerpAPI failed:', error);
    return searchWikimediaImages(query, count);
  }
};

/**
 * SerpAPI sonuçlarını StockImage formatına çevir
 */
const convertSerpResults = (results: SerpAPIImage[]): StockImage[] => {
  return results
    .map((img, index) => {
      const sanitizedUrl = sanitizeImageUrl(img.url);
      const sanitizedThumb = sanitizeImageUrl(img.thumbnail || img.url);
      
      if (!sanitizedUrl) return null;
      
      return {
        id: img.id || `serp-${index}-${Date.now()}`,
        url: sanitizedUrl,
        thumbUrl: sanitizedThumb || sanitizedUrl,
        title: img.title,
        source: 'serpapi' as const
      };
    })
    .filter((img): img is StockImage => img !== null && isValidDomain(img.url))
    .sort((a, b) => {
      // Tercih edilen domainleri öne al
      const aPreferred = isDomainPreferred(a.url);
      const bPreferred = isDomainPreferred(b.url);
      return (bPreferred ? 1 : 0) - (aPreferred ? 1 : 0);
    });
};

// ==========================================
// WIKIMEDIA COMMONS DESTEĞI (KORUNMUŞ)
// ==========================================

/**
 * Wikimedia Commons API - Ücretsiz ve kaliteli teknik görseller
 */
const searchWikimediaImages = async (query: string, count: number = 5): Promise<StockImage[]> => {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?` +
      `action=query&list=search&srsearch=${encodeURIComponent(query)}&srnamespace=6&srlimit=${count * 2}&format=json&origin=*`;

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.query?.search?.length) return [];

    const titles = searchData.query.search.map((item: any) => item.title).join('|');

    const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?` +
      `action=query&titles=${encodeURIComponent(titles)}&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;

    const imageResponse = await fetch(imageInfoUrl);
    const imageData = await imageResponse.json();

    const pages = imageData.query?.pages || {};
    const results: StockImage[] = [];

    Object.values(pages).forEach((page: any, index: number) => {
      if (page.imageinfo?.[0]?.url) {
        const rawUrl = page.imageinfo[0].url;
        const sanitizedUrl = sanitizeImageUrl(rawUrl);
        
        if (!sanitizedUrl) return;
        
        // Sadece görsel formatlarını kabul et
        if (sanitizedUrl.match(/\.(jpg|jpeg|png|svg|gif)$/i)) {
          results.push({
            id: `wiki-${index}-${Date.now()}`,
            url: sanitizedUrl,
            thumbUrl: sanitizedUrl.replace(/\/commons\//, '/commons/thumb/') + '/300px-' + sanitizedUrl.split('/').pop(),
            title: page.title?.replace('File:', '') || query,
            source: 'wikimedia'
          });
        }
      }
    });

    return results;
  } catch (error) {
    console.error('Wikimedia search failed:', error);
    return [];
  }
};

// Wikimedia filtreli arama (fileType destekli)
const searchWikimediaWithFilters = async (
  query: string,
  count: number = 10,
  fileType: 'svg' | 'png' | 'jpg' | 'any' = 'any'
): Promise<StockImage[]> => {
  try {
    // Dosya tipi filtresi ekle
    let searchQuery = query;
    if (fileType === 'svg') {
      searchQuery = `${query} filetype:drawing`;
    }

    const searchUrl = `https://commons.wikimedia.org/w/api.php?` +
      `action=query&list=search` +
      `&srsearch=${encodeURIComponent(searchQuery)}` +
      `&srnamespace=6` +
      `&srlimit=${count * 2}` +
      `&format=json&origin=*`;

    console.log('  Wikimedia search:', searchQuery);

    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();

    if (!searchData.query?.search?.length) {
      console.log('  No search results');
      return [];
    }

    const titles = searchData.query.search.map((item: any) => item.title).join('|');

    const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?` +
      `action=query&titles=${encodeURIComponent(titles)}` +
      `&prop=imageinfo&iiprop=url|size|mime` +
      `&format=json&origin=*`;

    const imageResponse = await fetch(imageInfoUrl);
    const imageData = await imageResponse.json();

    const pages = imageData.query?.pages || {};
    const results: StockImage[] = [];

    Object.values(pages).forEach((page: any, index: number) => {
      if (page.imageinfo?.[0]?.url) {
        const url = page.imageinfo[0].url;
        const mime = page.imageinfo[0].mime || '';
        const width = page.imageinfo[0].width || 0;

        // Dosya tipi filtresi
        if (fileType === 'svg' && !mime.includes('svg') && !url.includes('.svg')) {
          return;
        }
        if (fileType === 'png' && !mime.includes('png') && !url.includes('.png')) {
          return;
        }
        if (fileType === 'jpg' && !mime.includes('jpeg') && !url.includes('.jpg')) {
          return;
        }

        // Görsel formatları kabul et
        if (url.match(/\.(jpg|jpeg|png|svg|gif)$/i)) {
          // Thumbnail URL oluştur
          let thumbUrl = url;
          if (url.includes('.svg')) {
            thumbUrl = url.replace('/commons/', '/commons/thumb/') + '/400px-' + url.split('/').pop() + '.png';
          } else if (width > 400) {
            thumbUrl = url.replace('/commons/', '/commons/thumb/') + '/400px-' + url.split('/').pop();
          }

          results.push({
            id: `wiki-filter-${index}-${Date.now()}`,
            url: url,
            thumbUrl: thumbUrl,
            title: page.title?.replace('File:', '') || query,
            source: 'wikimedia'
          });
        }
      }
    });

    return results.slice(0, count);
  } catch (error) {
    console.error('Wikimedia filtered search failed:', error);
    return [];
  }
};

// Wikimedia kategori adına göre arama
const searchWikimediaByCategoryName = async (
  categoryName: string,
  count: number = 10
): Promise<StockImage[]> => {
  try {
    const url = `https://commons.wikimedia.org/w/api.php?` +
      `action=query&list=categorymembers&cmtype=file` +
      `&cmtitle=Category:${encodeURIComponent(categoryName)}` +
      `&cmlimit=${count}&format=json&origin=*`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.query?.categorymembers?.length) return [];

    const titles = data.query.categorymembers
      .map((item: any) => item.title)
      .join('|');

    const imageInfoUrl = `https://commons.wikimedia.org/w/api.php?` +
      `action=query&titles=${encodeURIComponent(titles)}` +
      `&prop=imageinfo&iiprop=url|extmetadata&format=json&origin=*`;

    const imageResponse = await fetch(imageInfoUrl);
    const imageData = await imageResponse.json();

    const pages = imageData.query?.pages || {};
    const results: StockImage[] = [];

    Object.values(pages).forEach((page: any, index: number) => {
      if (page.imageinfo?.[0]?.url) {
        const imgUrl = page.imageinfo[0].url;
        if (imgUrl.match(/\.(jpg|jpeg|png|svg|gif)$/i)) {
          results.push({
            id: `wiki-cat-${index}-${Date.now()}`,
            url: imgUrl,
            thumbUrl: imgUrl.replace(/\/commons\//, '/commons/thumb/') + '/300px-' + imgUrl.split('/').pop(),
            title: page.title?.replace('File:', '') || categoryName,
            source: 'wikimedia'
          });
        }
      }
    });

    return results;
  } catch (error) {
    console.error('Wikimedia category search failed:', error);
    return [];
  }
};

// ==========================================
// GOOGLE CUSTOM SEARCH (ESKİ - FALLBACK)
// ==========================================

/**
 * Google Custom Search - Fallback olarak kullanılır
 */
const searchGoogleImages = async (
  query: string,
  count: number = 10,
  imageType: string = 'autocad'
): Promise<StockImage[]> => {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    console.log("[ImageService] Google Search API credentials missing, using Wikimedia");
    return [];
  }

  try {
    const cleanedQuery = cleanQuery(query);

    // Görsel tipine göre API parametreleri
    let imgType = 'photo';
    let imgColorType = '';
    let extraTerms = '';

    switch(imageType) {
      case 'autocad':
        imgType = 'lineart';
        imgColorType = '&imgColorType=mono';
        extraTerms = ' teknik çizim proje';
        break;
      case 'saha':
        imgType = 'photo';
        extraTerms = ' montaj kurulum elektrik';
        break;
      case 'tablo':
        imgType = 'lineart';
        imgColorType = '&imgColorType=gray';
        extraTerms = ' şema diyagram tablo';
        break;
    }

    const url = `https://www.googleapis.com/customsearch/v1?` +
      `key=${apiKey}` +
      `&cx=${cseId}` +
      `&q=${encodeURIComponent(cleanedQuery + extraTerms)}` +
      `&searchType=image` +
      `&imgType=${imgType}` +
      imgColorType +
      `&imgSize=large` +
      `&num=${Math.min(count, 10)}` +
      `&safe=active` +
      `&excludeTerms=stock+getty+shutterstock+freepik+istock`;

    console.log('[ImageService] Google search:', cleanedQuery);
    const response = await fetch(url);

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Image Search error:', error);
      return [];
    }

    const data = await response.json();

    if (!data.items?.length) {
      console.log('No images found for:', cleanedQuery);
      return [];
    }

    // Domain filtreleme ve sıralama + URL sanitization
    const validResults = data.items
      .map((item: any, index: number) => {
        const sanitizedUrl = sanitizeImageUrl(item.link);
        const sanitizedThumb = sanitizeImageUrl(item.image?.thumbnailLink) || sanitizedUrl;
        
        if (!sanitizedUrl) return null;
        if (!isValidDomain(sanitizedUrl)) return null;
        
        return {
          id: `google-${index}-${Date.now()}`,
          url: sanitizedUrl,
          thumbUrl: sanitizedThumb,
          title: item.title || query,
          source: 'google' as const,
          isPreferred: isDomainPreferred(sanitizedUrl)
        };
      })
      .filter((item: any) => item !== null)
      .sort((a: any, b: any) => (b.isPreferred ? 1 : 0) - (a.isPreferred ? 1 : 0));

    console.log(`Found ${validResults.length} valid images after filtering`);
    return validResults;
    return validResults;
  } catch (error) {
    console.error('Google Image Search failed:', error);
    return [];
  }
};

// ==========================================
// ANA EXPORT FONKSİYONLAR
// ==========================================

/**
 * Ana arama fonksiyonu - Semantic Query + SerpAPI
 */
export const searchImages = async (
  topic: string,
  count: number = 15,
  imageType: string = 'autocad'
): Promise<StockImage[]> => {
  console.log('=== IMAGE SEARCH START ===');
  console.log('Topic:', topic);
  console.log('Type:', imageType);
  console.log('Count:', count);

  // Semantic Query ile İngilizce'ye çevir (Gemini AI)
  let englishTopic: string;
  try {
    englishTopic = await generateImageSearchQuery(topic);
    console.log('Semantic Query Result:', englishTopic);
  } catch (error) {
    console.warn('[ImageService] Semantic query failed, using keyword fallback');
    englishTopic = translateToEnglish(topic);
    console.log('Keyword Fallback Result:', englishTopic);
  }

  let allResults: StockImage[] = [];

  // 1. SerpAPI ile ara (PRİMER) - Semantic query sonucunu direkt kullan
  const serpApiKey = getSerpApiKey();
  if (serpApiKey) {
    console.log('Strategy 1: SerpAPI with Semantic Query');
    console.log('[ImageService] 🔍 Search Query:', englishTopic);
    
    try {
      // Direkt query fonksiyonunu kullan (buildTechnicalQuery bypass)
      const serpResults = await searchImagesDirectQuery(
        englishTopic,
        count,
        imageType as 'autocad' | 'saha' | 'tablo' | 'genel'
      );
      allResults = [...serpResults];
      console.log(`SerpAPI returned ${serpResults.length} results`);
    } catch (error) {
      console.error('SerpAPI search failed:', error);
    }
  }

  // 2. Yetersizse Wikimedia Commons'dan tamamla
  if (allResults.length < count && (imageType === 'autocad' || imageType === 'tablo')) {
    console.log('Strategy 2: Wikimedia Commons');
    const wikiResults = await searchWikimediaImages(englishTopic, count - allResults.length);
    // Duplicate URL'leri filtrele
    const newWikiResults = wikiResults.filter(r =>
      !allResults.some(existing => existing.url === r.url)
    );
    allResults = [...allResults, ...newWikiResults];
    console.log(`Wikimedia returned ${newWikiResults.length} new results`);
  }

  // 3. Hala yetersizse Google Custom Search
  if (allResults.length < 5) {
    console.log('Strategy 3: Google Custom Search (fallback)');
    const googleResults = await searchGoogleImages(englishTopic, 10, imageType);
    // Duplicate ve geçersiz URL'leri filtrele
    const newGoogleResults = googleResults.filter(r =>
      !allResults.some(existing => existing.url === r.url) &&
      !r.url.startsWith('x-raw-image://') &&
      r.url.startsWith('http')
    );
    allResults = [...allResults, ...newGoogleResults];
    console.log(`Google returned ${newGoogleResults.length} new results`);
  }

  console.log('=== IMAGE SEARCH END ===');
  console.log('Total results:', allResults.length);

  return allResults.slice(0, count);
};

// ==========================================
// KATEGORİ BAZLI ARAMA
// ==========================================

// Preset kategoriler
export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  queries: string[];
  wikimediaCategory?: string;
  suggestedTopic: string;
  suggestedPrompt: string;
  imageType?: 'photo' | 'lineart' | 'clipart'; // NEW: Image type filter
}

export interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  items: CategoryItem[];
  defaultImageType?: 'photo' | 'lineart' | 'clipart'; // NEW: Default for group
}

export const PRESET_CATEGORIES: CategoryGroup[] = [
  {
    id: 'electrical-diagrams',
    name: 'Elektrik Şemaları',
    icon: '📊',
    defaultImageType: 'lineart', // Diagrams should be lineart
    items: [
      {
        id: 'single-line',
        name: 'Tek Hat Şemaları',
        description: 'Elektrik dağıtım tek hat şemaları',
        queries: ['single line diagram electrical power', 'one line diagram power distribution', 'electrical single line schematic'],
        wikimediaCategory: 'Electrical_single-line_diagrams',
        suggestedTopic: 'Elektrik tek hat şeması okuma ve çizim',
        suggestedPrompt: 'Bugün elektrik tek hat şemalarının okunması ve çizimi öğrenildi. Transformatör, şalter, sigorta ve kablo sembolleri incelendi. AutoCAD ortamında tek hat şeması çizimi yapıldı.',
        imageType: 'lineart'
      },
      {
        id: 'wiring-diagrams',
        name: 'Bağlantı Şemaları',
        description: 'Elektrik bağlantı ve kablo şemaları',
        queries: ['electrical wiring diagram schematic', 'circuit wiring connection diagram', 'wire connection schematic electrical'],
        wikimediaCategory: 'Wiring_diagrams',
        suggestedTopic: 'Elektrik bağlantı şemalarının incelenmesi',
        suggestedPrompt: 'Bugün elektrik bağlantı şemaları incelendi. Kablo renk kodları, bağlantı noktaları ve devre elemanları arasındaki bağlantılar öğrenildi.',
        imageType: 'lineart'
      },
      {
        id: 'control-circuits',
        name: 'Kumanda Devreleri',
        description: 'Motor ve kumanda devre şemaları',
        queries: ['motor control circuit diagram', 'contactor control circuit schematic', 'PLC ladder diagram industrial'],
        wikimediaCategory: 'Control_circuit_diagrams',
        suggestedTopic: 'Motor kumanda devreleri tasarımı',
        suggestedPrompt: 'Bugün motor kumanda devreleri üzerinde çalışıldı. Kontaktör, röle, termik ve buton bağlantıları incelendi. Yıldız-üçgen yol verme devresi çizildi.',
        imageType: 'lineart'
      }
    ]
  },
  {
    id: 'electrical-equipment',
    name: 'Elektrik Ekipmanları',
    icon: '⚡',
    defaultImageType: 'photo', // Equipment should be photos
    items: [
      {
        id: 'transformers',
        name: 'Transformatörler',
        description: 'Güç ve dağıtım transformatörleri',
        queries: ['power transformer electrical substation', 'distribution transformer installation', 'transformer winding electrical'],
        wikimediaCategory: 'Transformers',
        suggestedTopic: 'Transformatör yapısı ve çalışma prensibi',
        suggestedPrompt: 'Bugün transformatörlerin yapısı ve çalışma prensibi öğrenildi. Primer ve sekonder sargılar, nüve yapısı, soğutma sistemleri incelendi.',
        imageType: 'photo'
      },
      {
        id: 'switchgear',
        name: 'Şalt Tesisleri',
        description: 'Kesici, ayırıcı ve şalt ekipmanları',
        queries: ['switchgear electrical panel', 'circuit breaker switchgear', 'high voltage switchgear installation'],
        wikimediaCategory: 'Switchgear',
        suggestedTopic: 'Şalt tesisleri ve koruma ekipmanları',
        suggestedPrompt: 'Bugün şalt tesisleri gezildi. Kesici, ayırıcı, topraklama anahtarı ve bara sistemleri incelendi. Koruma koordinasyonu hakkında bilgi edinildi.',
        imageType: 'photo'
      },
      {
        id: 'panels',
        name: 'Elektrik Panoları',
        description: 'Dağıtım ve kumanda panoları',
        queries: ['electrical distribution panel board', 'motor control center MCC panel', 'electrical panel wiring installation'],
        wikimediaCategory: 'Electrical_panels',
        suggestedTopic: 'Elektrik pano montajı ve bağlantıları',
        suggestedPrompt: 'Bugün elektrik pano montajı yapıldı. Şalter, sigorta, kontaktör ve kablo bağlantıları gerçekleştirildi. Kablo düzeni ve etiketleme kuralları öğrenildi.',
        imageType: 'photo'
      }
    ]
  },
  {
    id: 'installation',
    name: 'Tesisat ve Montaj',
    icon: '🔧',
    defaultImageType: 'photo', // Installation work should be photos
    items: [
      {
        id: 'cable-laying',
        name: 'Kablo Döşeme',
        description: 'Kablo tavası ve döşeme işleri',
        queries: ['cable tray installation electrical', 'electrical cable laying work', 'cable routing installation industrial'],
        wikimediaCategory: 'Electrical_cables',
        suggestedTopic: 'Kablo döşeme ve tava montajı',
        suggestedPrompt: 'Bugün kablo döşeme çalışmaları yapıldı. Kablo tavası montajı, kablo çekme teknikleri ve bükülme yarıçapları öğrenildi.',
        imageType: 'photo'
      },
      {
        id: 'conduit',
        name: 'Boru Tesisatı',
        description: 'Elektrik boru ve kanal sistemleri',
        queries: ['electrical conduit installation', 'rigid conduit electrical work', 'EMT conduit wiring installation'],
        wikimediaCategory: 'Electrical_conduit',
        suggestedTopic: 'Elektrik boru tesisatı kurulumu',
        suggestedPrompt: 'Bugün elektrik boru tesisatı çalışmaları gerçekleştirildi. Sert boru, spiral boru ve fleksibıl boru kullanımı öğrenildi.',
        imageType: 'photo'
      },
      {
        id: 'grounding',
        name: 'Topraklama',
        description: 'Topraklama sistemleri kurulumu',
        queries: ['electrical grounding system installation', 'earthing ground rod installation', 'grounding electrode electrical'],
        wikimediaCategory: 'Electrical_grounding',
        suggestedTopic: 'Topraklama sistemi kurulumu',
        suggestedPrompt: 'Bugün topraklama sistemi kurulumu yapıldı. Topraklama çubuğu, iletken bağlantıları ve topraklama direnci ölçümü öğrenildi.',
        imageType: 'photo'
      }
    ]
  },
  {
    id: 'safety',
    name: 'İş Güvenliği',
    icon: '🦺',
    defaultImageType: 'clipart', // Safety symbols are often clipart
    items: [
      {
        id: 'safety-symbols',
        name: 'İş Güvenliği Sembolleri',
        description: 'İSG sembolleri ve işaretleri',
        queries: ['electrical safety warning signs', 'hazard warning symbols ISO 7010', 'electrical danger signs symbols'],
        wikimediaCategory: 'Safety_symbols',
        suggestedTopic: 'İş sağlığı ve güvenliği sembolleri eğitimi',
        suggestedPrompt: 'Bugün iş güvenliği sembolleri ve işaretleri öğrenildi. Yasak, zorunluluk, uyarı ve acil durum işaretleri incelendi. İşyerinde güvenli çalışma prosedürleri değerlendirildi.',
        imageType: 'clipart'
      },
      {
        id: 'ppe',
        name: 'Kişisel Koruyucu Donanım',
        description: 'KKD görselleri',
        queries: ['electrical PPE insulated gloves', 'electrician safety equipment gear', 'arc flash protective equipment'],
        wikimediaCategory: 'Electrical_safety',
        suggestedTopic: 'Kişisel koruyucu donanım (KKD) eğitimi',
        suggestedPrompt: 'Bugün elektrik çalışmalarında kullanılan kişisel koruyucu donanımlar öğrenildi. İzole eldiven, koruyucu gözlük, iş ayakkabısı ve yüz siperi kullanımı incelendi. KKD seçim ve bakım kuralları değerlendirildi.',
        imageType: 'photo'
      }
    ]
  },
  {
    id: 'technical-tables',
    name: 'Teknik Tablolar',
    icon: '📋',
    defaultImageType: 'lineart',
    items: [
      {
        id: 'transformer-vector-groups',
        name: 'Trafo Bağlantı Grupları',
        description: 'Dyn11, Yy0, Dd0 vektör grupları',
        queries: ['transformer vector group chart Dyn11 Yy0', 'transformer winding connection diagram', 'three phase transformer vector group table'],
        suggestedTopic: 'Transformatör bağlantı grupları ve vektör diyagramları',
        suggestedPrompt: 'Bugün transformatör bağlantı grupları incelendi. Dyn11, Yy0, Dd0 gibi yaygın bağlantı tipleri ve vektör diyagramları öğrenildi. Faz kayması ve paralel çalışma koşulları değerlendirildi.',
        imageType: 'lineart'
      },
      {
        id: 'ct-selection',
        name: 'Akım Trafosu (CT) Seçim Tabloları',
        description: 'CT oran ve sınıf seçimi',
        queries: ['current transformer CT ratio selection chart', 'CT accuracy class table 0.5 1.0', 'current transformer burden VA chart'],
        suggestedTopic: 'Akım trafosu seçimi ve bağlantısı',
        suggestedPrompt: 'Bugün akım trafosu (CT) seçim kriterleri öğrenildi. Oran seçimi, doğruluk sınıfları (0.5, 1.0, 5P) ve burden hesaplaması incelendi. Koruma ve ölçüm CT farkları değerlendirildi.',
        imageType: 'lineart'
      },
      {
        id: 'voltage-drop',
        name: 'Gerilim Düşümü Hesap Tabloları',
        description: 'Mesafe ve kesit bazlı gerilim düşümü',
        queries: ['voltage drop calculation table chart', 'cable voltage drop percentage table', 'wire size voltage drop distance chart'],
        suggestedTopic: 'Gerilim düşümü hesaplama ve kablo seçimi',
        suggestedPrompt: 'Bugün gerilim düşümü hesaplama yöntemleri öğrenildi. Kablo uzunluğu, kesit ve akım değerlerine göre düşüm tabloları incelendi. İzin verilen düşüm limitleri değerlendirildi.',
        imageType: 'lineart'
      },
      {
        id: 'busbar-capacity',
        name: 'Bara Akım Kapasitesi Tabloları',
        description: 'Bakır ve alüminyum bara kapasiteleri',
        queries: ['busbar current capacity table copper aluminum', 'busbar ampacity rating chart', 'copper busbar size current table'],
        suggestedTopic: 'Bara sistemleri ve akım taşıma kapasiteleri',
        suggestedPrompt: 'Bugün bara sistemleri ve akım taşıma kapasiteleri incelendi. Bakır ve alüminyum bara kesitleri, sıcaklık artışı ve kapasite tabloları öğrenildi.',
        imageType: 'lineart'
      },
      {
        id: 'power-factor-correction',
        name: 'Kompanzasyon cos φ Tabloları',
        description: 'Reaktif güç ve kVAr hesabı',
        queries: ['power factor correction kVAr table chart', 'capacitor bank sizing table cos phi', 'reactive power compensation calculation table'],
        suggestedTopic: 'Güç faktörü düzeltme ve kompanzasyon',
        suggestedPrompt: 'Bugün güç faktörü düzeltme (kompanzasyon) sistemleri öğrenildi. cos φ iyileştirme tabloları, kondansatör seçimi ve reaktif güç hesabı incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'harmonic-limits',
        name: 'Harmonik Distorsiyon Limitleri',
        description: 'THD ve IEEE 519 limitleri',
        queries: ['harmonic distortion THD limits table IEEE 519', 'voltage current harmonic limits chart', 'power quality harmonic standard table'],
        suggestedTopic: 'Harmonik analizi ve güç kalitesi',
        suggestedPrompt: 'Bugün harmonik distorsiyon ve güç kalitesi konuları incelendi. THD limitleri, IEEE 519 standardı ve harmonik filtreleme yöntemleri öğrenildi.',
        imageType: 'lineart'
      },
      {
        id: 'ups-sizing',
        name: 'UPS Boyutlandırma Tabloları',
        description: 'kVA ve batarya süresi hesabı',
        queries: ['UPS sizing calculation table kVA', 'UPS battery runtime chart', 'uninterruptible power supply capacity table'],
        suggestedTopic: 'UPS sistemleri ve boyutlandırma',
        suggestedPrompt: 'Bugün kesintisiz güç kaynağı (UPS) sistemleri incelendi. Yük hesabı, batarya kapasitesi ve çalışma süresi tabloları öğrenildi. Online ve offline UPS farkları değerlendirildi.',
        imageType: 'lineart'
      },
      {
        id: 'generator-sizing',
        name: 'Jeneratör Boyutlandırma Tabloları',
        description: 'kVA ve yük hesabı',
        queries: ['generator sizing kVA load calculation table', 'diesel generator capacity chart', 'standby generator sizing guide table'],
        suggestedTopic: 'Jeneratör sistemleri ve kapasite hesabı',
        suggestedPrompt: 'Bugün jeneratör boyutlandırma kriterleri öğrenildi. Motor yol alma akımları, güç faktörü ve yük tipleri dikkate alınarak kapasite hesabı yapıldı.',
        imageType: 'lineart'
      },
      {
        id: 'spd-types',
        name: 'Parafudr/SPD Tip Tabloları',
        description: 'Tip 1, 2, 3 aşırı gerilim koruma',
        queries: ['surge protector SPD type 1 2 3 chart', 'lightning arrester classification table', 'surge protection device selection guide'],
        suggestedTopic: 'Aşırı gerilim koruma (SPD) sistemleri',
        suggestedPrompt: 'Bugün aşırı gerilim koruma cihazları (SPD) incelendi. Tip 1, 2 ve 3 sınıflandırması, koruma seviyeleri ve kaskad koordinasyonu öğrenildi.',
        imageType: 'lineart'
      },
      {
        id: 'ik-rating',
        name: 'IK Darbe Dayanım Sınıfları',
        description: 'IK01 den IK10 a mekanik koruma',
        queries: ['IK rating impact protection chart table', 'mechanical protection IK code classification', 'IK rating joules impact resistance'],
        suggestedTopic: 'IK koruma sınıfları ve mekanik dayanım',
        suggestedPrompt: 'Bugün IK koruma sınıfları öğrenildi. IK00 dan IK10 a kadar darbe dayanım seviyeleri, joule değerleri ve uygulama alanları incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'cable-tray-fill',
        name: 'Kablo Tava Doluluk Oranları',
        description: 'Tava kapasite hesabı',
        queries: ['cable tray fill ratio capacity chart', 'cable tray sizing calculation table', 'wire way fill percentage table'],
        suggestedTopic: 'Kablo tavası seçimi ve doluluk hesabı',
        suggestedPrompt: 'Bugün kablo tavası boyutlandırma kriterleri öğrenildi. Doluluk oranları, ısı yayılımı ve kapasite düşürme faktörleri incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'conduit-fill',
        name: 'Boru İçi Kablo Sayısı Tabloları',
        description: 'Boru çapı ve kablo kapasitesi',
        queries: ['conduit fill chart wire capacity table', 'electrical conduit size cable number', 'NEC conduit fill percentage table'],
        suggestedTopic: 'Elektrik borusu seçimi ve kablo kapasitesi',
        suggestedPrompt: 'Bugün elektrik borusu boyutlandırma kuralları öğrenildi. Boru çapına göre kablo sayısı, doluluk yüzdeleri ve çekme hesabı incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'plc-io-modules',
        name: 'PLC I/O Modül Tipleri',
        description: 'Dijital ve analog modül seçimi',
        queries: ['PLC IO module types chart digital analog', 'PLC input output module selection table', 'programmable logic controller IO specifications'],
        suggestedTopic: 'PLC giriş/çıkış modülleri ve seçimi',
        suggestedPrompt: 'Bugün PLC I/O modül tipleri incelendi. Dijital giriş/çıkış, analog giriş/çıkış ve özel fonksiyon modülleri öğrenildi. Sinyal tipleri ve gerilim seviyeleri değerlendirildi.',
        imageType: 'lineart'
      },
      {
        id: 'solar-pv-sizing',
        name: 'Güneş Paneli (PV) Sistem Tabloları',
        description: 'Panel ve inverter boyutlandırma',
        queries: ['solar PV system sizing chart table', 'photovoltaic panel watt calculation', 'solar inverter sizing guide table'],
        suggestedTopic: 'Güneş enerjisi sistemleri ve boyutlandırma',
        suggestedPrompt: 'Bugün fotovoltaik (PV) sistem tasarımı öğrenildi. Panel kapasitesi, inverter seçimi ve şebeke bağlantı kriterleri incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'battery-capacity',
        name: 'Akü/Batarya Kapasite Tabloları',
        description: 'Ah kapasite ve deşarj eğrileri',
        queries: ['battery capacity Ah discharge rate table', 'lead acid battery discharge curve chart', 'lithium battery capacity temperature table'],
        suggestedTopic: 'Akü sistemleri ve kapasite hesabı',
        suggestedPrompt: 'Bugün akü/batarya sistemleri incelendi. Ah kapasite hesabı, deşarj eğrileri ve sıcaklık etkileri öğrenildi. Kurşun asit ve lityum batarya farkları değerlendirildi.',
        imageType: 'lineart'
      },
      {
        id: 'motor-efficiency-class',
        name: 'Motor Verimlilik Sınıfları (IE)',
        description: 'IE1, IE2, IE3, IE4 standartları',
        queries: ['motor efficiency class IE1 IE2 IE3 IE4 chart', 'electric motor efficiency standard table', 'IEC motor efficiency classification'],
        suggestedTopic: 'Motor verimlilik sınıfları ve enerji tasarrufu',
        suggestedPrompt: 'Bugün elektrik motoru verimlilik sınıfları öğrenildi. IE1 den IE4 e kadar verimlilik seviyeleri, enerji tasarrufu ve yasal gereklilikler incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'cable-fire-rating',
        name: 'Kablo Yangın Dayanım Sınıfları',
        description: 'FE180, LSZH, halojensiz kablolar',
        queries: ['cable fire resistance rating chart FE180', 'fire rated cable classification table', 'LSZH low smoke cable standard'],
        suggestedTopic: 'Yangın dayanımlı kablo seçimi',
        suggestedPrompt: 'Bugün yangına dayanıklı kablo tipleri öğrenildi. FE180, LSZH, halojensiz kablolar ve yangın anında devre bütünlüğü gereksinimleri incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'ex-proof-rating',
        name: 'Ex Proof Koruma Sınıfları',
        description: 'ATEX ve patlayıcı ortam sınıfları',
        queries: ['explosion proof Ex rating ATEX chart', 'hazardous area classification zone table', 'Ex d Ex e Ex i protection type'],
        suggestedTopic: 'Patlayıcı ortam ekipman seçimi (Ex Proof)',
        suggestedPrompt: 'Bugün patlayıcı ortam (Ex) sınıflandırması öğrenildi. Zone 0, 1, 2 tanımları, Ex d/e/i koruma tipleri ve ATEX gereksinimleri incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'thermal-relay-setting',
        name: 'Termik Röle Ayar Tabloları',
        description: 'Aşırı akım koruma ayarları',
        queries: ['thermal overload relay setting chart table', 'motor protection relay adjustment', 'overload relay trip class 10 20 30'],
        suggestedTopic: 'Termik röle ayarı ve motor koruması',
        suggestedPrompt: 'Bugün termik röle ayarlama prensipleri öğrenildi. Trip sınıfları (Class 10, 20, 30), ayar aralıkları ve motor koruma koordinasyonu incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'contactor-categories',
        name: 'Kontaktör Kullanım Kategorileri',
        description: 'AC1, AC3, AC4 kategorileri',
        queries: ['contactor utilization category AC1 AC3 AC4 table', 'contactor selection application chart', 'IEC contactor duty category'],
        suggestedTopic: 'Kontaktör seçimi ve kullanım kategorileri',
        suggestedPrompt: 'Bugün kontaktör kullanım kategorileri öğrenildi. AC1 (rezistif), AC3 (motor), AC4 (ağır yol verme) kategorileri ve seçim kriterleri incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'lightning-protection',
        name: 'Yıldırımdan Koruma Seviyeleri',
        description: 'LPL I, II, III, IV seviyeleri',
        queries: ['lightning protection level LPL chart table', 'lightning rod protection angle table', 'IEC 62305 protection level'],
        suggestedTopic: 'Yıldırımdan koruma sistemi tasarımı',
        suggestedPrompt: 'Bugün yıldırımdan koruma seviyeleri (LPL) öğrenildi. Koruma açıları, yuvarlanma küresi yöntemi ve iletken boyutları incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'short-circuit-current',
        name: 'Kısa Devre Akım Tabloları',
        description: 'Arıza akımı hesaplama',
        queries: ['short circuit current calculation table kA', 'fault current level chart electrical', 'prospective short circuit current table'],
        suggestedTopic: 'Kısa devre akımı hesabı ve koruma koordinasyonu',
        suggestedPrompt: 'Bugün kısa devre akımı hesaplama yöntemleri öğrenildi. Simetrik ve asimetrik akımlar, kesme kapasitesi seçimi ve koruma koordinasyonu incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'sensor-output-types',
        name: 'Sensör Çıkış Tipleri (NPN/PNP)',
        description: 'Sensör bağlantı şemaları',
        queries: ['sensor output type NPN PNP wiring diagram', 'proximity sensor connection chart', 'sinking sourcing sensor output table'],
        suggestedTopic: 'Endüstriyel sensör tipleri ve bağlantıları',
        suggestedPrompt: 'Bugün endüstriyel sensör çıkış tipleri öğrenildi. NPN (sinking) ve PNP (sourcing) farkları, 2/3/4 telli bağlantılar incelendi.',
        imageType: 'lineart'
      },
      {
        id: 'servo-motor-sizing',
        name: 'Servo Motor Boyutlandırma',
        description: 'Tork ve hız hesabı',
        queries: ['servo motor sizing torque speed chart', 'servo drive selection calculation table', 'servo motor inertia ratio guide'],
        suggestedTopic: 'Servo motor ve sürücü seçimi',
        suggestedPrompt: 'Bugün servo motor boyutlandırma kriterleri öğrenildi. Tork hesabı, atalet oranı ve hız/tork eğrileri incelendi. Sürücü eşleştirme prensipleri değerlendirildi.',
        imageType: 'lineart'
      },
      {
        id: 'modbus-protocol',
        name: 'Modbus/Ethernet Protokol Tabloları',
        description: 'Register ve adres tabloları',
        queries: ['Modbus RTU TCP register address table', 'Modbus function code chart', 'industrial protocol communication table'],
        suggestedTopic: 'Endüstriyel haberleşme protokolleri',
        suggestedPrompt: 'Bugün Modbus haberleşme protokolü öğrenildi. RTU ve TCP farkları, register tipleri, fonksiyon kodları ve adres yapısı incelendi.',
        imageType: 'lineart'
      }
    ]
  }
];

/**
 * Strateji bazlı kategori araması
 * SerpAPI temel motor olarak kullanılır
 */
export const searchByCategory = async (
  categoryId: string,
  count: number = 15
): Promise<StockImage[]> => {
  const config = getSearchConfig(categoryId);

  // Önce preset kategorilerde ara
  let category: CategoryItem | null = null;
  let parentGroup: CategoryGroup | null = null;
  
  for (const group of PRESET_CATEGORIES) {
    const found = group.items.find(item => item.id === categoryId);
    if (found) {
      category = found;
      parentGroup = group;
      break;
    }
  }

  console.log('=== CATEGORY SEARCH START ===');
  console.log('Category ID:', categoryId);

  let allResults: StockImage[] = [];

  // Kategori varsa query'leri kullan
  if (category) {
    console.log('Category found:', category.name);
    
    // imageType belirleme: önce item'dan, yoksa grup default'undan
    const imageType = category.imageType || parentGroup?.defaultImageType;
    console.log('Image Type Filter:', imageType || 'none');

    // SerpAPI ile ara (TEMEL MOTOR)
    const serpApiKey = getSerpApiKey();
    if (serpApiKey) {
      for (const query of category.queries) {
        if (allResults.length >= count) break;

        const results = await searchImagesSerpAPI(query, serpApiKey, {
          count: Math.min(10, count - allResults.length),
          imageType: imageType, // imageType filtresi eklendi
          safeSearch: true
        });

        const newResults = results
          .filter(r => !allResults.some(existing => existing.url === r.url))
          .map(r => ({
            id: r.id,
            url: r.url,
            thumbUrl: r.thumbnail,
            title: r.title,
            source: 'serpapi' as const
          }));

        allResults = [...allResults, ...newResults];
        console.log(`Query "${query}" - Found: ${results.length}, Total: ${allResults.length}`);

        // Rate limit
        await new Promise(r => setTimeout(r, 200));
      }
    } else {
      console.warn('[searchByCategory] ⚠️ SerpAPI key not found!');
    }

    // Wikimedia kategori varsa oradan da tamamla
    if (category.wikimediaCategory && allResults.length < count) {
      console.log('Supplementing from Wikimedia:', category.wikimediaCategory);
      const wikiResults = await searchWikimediaByCategoryName(
        category.wikimediaCategory,
        count - allResults.length
      );
      const newWikiResults = wikiResults.filter(r =>
        !allResults.some(existing => existing.url === r.url)
      );
      allResults = [...allResults, ...newWikiResults];
      console.log(`Wikimedia added ${newWikiResults.length} results`);
    }
  }

  // Config varsa eski strateji sistemini kullan
  if (config && allResults.length < count) {
    console.log('Using strategy config:', config.categoryName);

    const sortedStrategies = [...config.strategies].sort((a, b) => a.priority - b.priority);

    for (const strategy of sortedStrategies) {
      if (allResults.length >= count) break;

      console.log(`Strategy ${strategy.priority}: ${strategy.type} - "${strategy.query}"`);

      let results: StockImage[] = [];

      try {
        switch (strategy.type) {
          case 'wikimedia_category':
            results = await searchWikimediaByCategoryName(strategy.query, 10);
            break;

          case 'wikimedia_search':
            results = await searchWikimediaWithFilters(
              strategy.query,
              8,
              strategy.fileType || 'any'
            );
            break;

          case 'google':
            results = await searchGoogleImages(strategy.query, 5, 'tablo');
            break;
        }

        const newResults = results.filter(r =>
          !allResults.some(existing => existing.url === r.url)
        );

        console.log(`  Found: ${results.length}, New: ${newResults.length}`);
        allResults = [...allResults, ...newResults];

      } catch (error) {
        console.error(`  Strategy failed:`, error);
      }

      // Rate limiting
      await new Promise(r => setTimeout(r, 100));
    }
  }

  // SVG ve Wikimedia öncelikli sırala
  const sorted = allResults.sort((a, b) => {
    const aScore = (a.url.includes('.svg') ? 3 : 0) +
                   (a.source === 'wikimedia' ? 2 : 0) +
                   (a.url.includes('.png') ? 1 : 0);
    const bScore = (b.url.includes('.svg') ? 3 : 0) +
                   (b.source === 'wikimedia' ? 2 : 0) +
                   (b.url.includes('.png') ? 1 : 0);
    return bScore - aScore;
  });

  console.log('=== CATEGORY SEARCH END ===');
  console.log('Total results:', sorted.length);

  return sorted.slice(0, count);
};