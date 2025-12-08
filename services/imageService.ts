
export interface StockImage {
  id: string;
  url: string;
  thumbUrl: string;
  title: string;
  source: 'google' | 'wikimedia';
}

// Domain filtreleme
const DOMAIN_BLACKLIST = [
  'shutterstock.com', 'istockphoto.com', 'gettyimages.com',
  'dreamstime.com', 'freepik.com', 'adobestock.com',
  'pinterest.com', 'facebook.com', 'instagram.com',
  'twitter.com', 'tiktok.com', 'aliexpress.com'
];

const DOMAIN_WHITELIST = [
  'wikipedia.org', 'wikimedia.org', '.edu',
  'elektrikport.com', 'elektrikrehberiniz.com',
  'electronics-tutorials.ws', 'allaboutcircuits.com'
];

const isValidDomain = (url: string): boolean => {
  try {
    const domain = new URL(url).hostname.toLowerCase();
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

// Wikimedia Commons API - Ücretsiz ve kaliteli teknik görseller
const searchWikimediaImages = async (query: string, count: number = 5): Promise<StockImage[]> => {
  try {
    const searchUrl = `https://commons.wikimedia.org/w/api.php?` +
      `action=query&list=search&srsearch=${encodeURIComponent(query + ' elektrik OR circuit OR diagram')}&srnamespace=6&srlimit=${count}&format=json&origin=*`;
    
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
        const url = page.imageinfo[0].url;
        // Sadece görsel formatlarını kabul et
        if (url.match(/\.(jpg|jpeg|png|svg|gif)$/i)) {
          results.push({
            id: `wiki-${index}-${Date.now()}`,
            url: url,
            thumbUrl: url.replace(/\/commons\//, '/commons/thumb/') + '/300px-' + url.split('/').pop(),
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

// Google Custom Search - Geliştirilmiş parametreler
const searchGoogleImages = async (
  query: string,
  count: number = 10,
  imageType: string = 'autocad'
): Promise<StockImage[]> => {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    console.error("Google Search API credentials missing");
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
        imgType = 'lineart'; // Teknik çizimler için kritik!
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

    console.log('Google search URL:', url);
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

    // Domain filtreleme ve sıralama
    const validResults = data.items
      .filter((item: any) => isValidDomain(item.link))
      .map((item: any, index: number) => ({
        id: `google-${index}-${Date.now()}`,
        url: item.link,
        thumbUrl: item.image?.thumbnailLink || item.link,
        title: item.title || query,
        source: 'google' as const,
        isPreferred: isDomainPreferred(item.link)
      }))
      // Tercih edilen domainleri öne al
      .sort((a: any, b: any) => (b.isPreferred ? 1 : 0) - (a.isPreferred ? 1 : 0));

    console.log(`Found ${validResults.length} valid images after filtering`);
    return validResults;
  } catch (error) {
    console.error('Google Image Search failed:', error);
    return [];
  }
};

// Tip bazlı arama sorguları
const getSearchQueries = (topic: string, imageType: string): string[] => {
  const baseTopic = topic.split(' ').slice(0, 3).join(' ');
  
  switch(imageType) {
    case 'autocad':
      return [
        `${baseTopic} AutoCAD elektrik projesi`,
        `${baseTopic} elektrik tesisat çizim`,
        `elektrik tek hat şeması proje`,
        `electrical wiring diagram schematic`
      ];
    case 'saha':
      return [
        `${baseTopic} elektrik montaj`,
        `elektrik pano kurulum`,
        `electrical installation work`,
        `elektrikçi tesisat`
      ];
    case 'tablo':
      return [
        `${baseTopic} elektrik şema`,
        `elektrik devre diyagramı`,
        `electrical circuit diagram`,
        `elektrik sembol tablosu`
      ];
    default:
      return [baseTopic];
  }
};

// Ana arama fonksiyonu - Çoklu kaynak + Fallback
export const searchImages = async (
  topic: string,
  count: number = 15,
  imageType: string = 'autocad'
): Promise<StockImage[]> => {
  const queries = getSearchQueries(topic, imageType);
  let allResults: StockImage[] = [];
  
  // 1. Önce Wikimedia Commons'dan ara (ücretsiz, kaliteli)
  if (imageType === 'autocad' || imageType === 'tablo') {
    console.log('Searching Wikimedia Commons...');
    const wikiResults = await searchWikimediaImages(queries[0], 5);
    allResults = [...wikiResults];
    console.log(`Wikimedia returned ${wikiResults.length} results`);
  }
  
  // 2. Google'dan tamamla
  for (const query of queries) {
    if (allResults.length >= count) break;
    
    const needed = count - allResults.length;
    const googleResults = await searchGoogleImages(query, Math.min(needed, 10), imageType);
    
    // Duplicate URL'leri filtrele
    const newResults = googleResults.filter(r => 
      !allResults.some(existing => existing.url === r.url)
    );
    
    allResults = [...allResults, ...newResults];
    console.log(`Query "${query}" - Total: ${allResults.length}`);
    
    // Rate limit için bekleme
    if (allResults.length < count && queries.indexOf(query) < queries.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  return allResults.slice(0, count);
};
