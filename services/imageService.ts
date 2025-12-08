
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

// ==========================================
// HAZIR KATEGORİLER SİSTEMİ
// ==========================================

export interface CategoryItem {
  id: string;
  name: string;
  description: string;
  queries: string[]; // Wikimedia + Google için arama sorguları
  wikimediaCategory?: string; // Direkt Wikimedia kategori adı
}

export interface CategoryGroup {
  id: string;
  name: string;
  icon: string;
  items: CategoryItem[];
}

export const PRESET_CATEGORIES: CategoryGroup[] = [
  {
    id: 'tables',
    name: 'Tablolar',
    icon: '📊',
    items: [
      {
        id: 'cable-section',
        name: 'Kablo Kesit Tablosu',
        description: 'İletken kesit seçim tabloları',
        queries: ['kablo kesit tablosu', 'cable cross section table', 'conductor sizing chart'],
        wikimediaCategory: 'Electrical_wiring'
      },
      {
        id: 'current-capacity',
        name: 'Akım Taşıma Kapasitesi',
        description: 'Kabloların akım taşıma değerleri',
        queries: ['akım taşıma kapasitesi tablosu', 'current carrying capacity table', 'ampacity chart'],
        wikimediaCategory: 'Electrical_wiring'
      },
      {
        id: 'voltage-drop',
        name: 'Gerilim Düşümü Tablosu',
        description: 'Gerilim düşümü hesap tabloları',
        queries: ['gerilim düşümü tablosu', 'voltage drop calculation table'],
        wikimediaCategory: 'Electrical_power_distribution_diagrams'
      },
      {
        id: 'fuse-selection',
        name: 'Sigorta Seçim Tablosu',
        description: 'Sigorta ve şalter seçim tabloları',
        queries: ['sigorta seçim tablosu', 'fuse selection chart', 'circuit breaker sizing'],
        wikimediaCategory: 'Circuit_breaker_symbols'
      },
      {
        id: 'cable-colors',
        name: 'Kablo Renk Kodları',
        description: 'İletken renk standartları',
        queries: ['kablo renk kodu tablosu', 'wire color code chart', 'electrical wire colors'],
        wikimediaCategory: 'SVG_electrical_wiring_and_cables'
      }
    ]
  },
  {
    id: 'symbols',
    name: 'Semboller',
    icon: '⚡',
    items: [
      {
        id: 'installation-symbols',
        name: 'Elektrik Tesisat Sembolleri',
        description: 'Anahtar, priz, aydınlatma sembolleri',
        queries: ['elektrik tesisat sembolleri', 'electrical installation symbols', 'wiring diagram symbols'],
        wikimediaCategory: 'Electrical_symbols'
      },
      {
        id: 'single-line-symbols',
        name: 'Tek Hat Şeması Sembolleri',
        description: 'Trafo, şalter, bara sembolleri',
        queries: ['tek hat şeması sembolleri', 'single line diagram symbols', 'one line diagram symbols'],
        wikimediaCategory: 'Single-line_wiring_diagrams_of_distribution_boards'
      },
      {
        id: 'panel-symbols',
        name: 'Pano Sembolleri',
        description: 'Pano içi eleman sembolleri',
        queries: ['elektrik pano sembolleri', 'electrical panel symbols', 'switchboard symbols'],
        wikimediaCategory: 'Circuit_breaker_symbols'
      },
      {
        id: 'protection-symbols',
        name: 'Koruma Cihazları Sembolleri',
        description: 'Röle, kontaktör, termik sembolleri',
        queries: ['koruma cihazları sembolleri', 'protection relay symbols', 'contactor symbols'],
        wikimediaCategory: 'Electronic_symbols'
      }
    ]
  },
  {
    id: 'diagrams',
    name: 'Şemalar',
    icon: '📐',
    items: [
      {
        id: 'single-line',
        name: 'Tek Hat Şeması Örnekleri',
        description: 'Bina ve tesis tek hat şemaları',
        queries: ['tek hat şeması örneği', 'single line diagram example', 'electrical one line diagram'],
        wikimediaCategory: 'Single-line_wiring_diagrams_of_distribution_boards'
      },
      {
        id: 'panel-wiring',
        name: 'Pano İç Bağlantı Şeması',
        description: 'Pano montaj ve bağlantı şemaları',
        queries: ['pano bağlantı şeması', 'panel wiring diagram', 'switchboard connection diagram'],
        wikimediaCategory: 'Electrical_installations'
      },
      {
        id: 'grounding',
        name: 'Topraklama Şeması',
        description: 'Topraklama sistem şemaları',
        queries: ['topraklama şeması', 'grounding diagram', 'earthing system diagram TN TT IT'],
        wikimediaCategory: 'Electrical_diagrams'
      },
      {
        id: 'compensation',
        name: 'Kompanzasyon Şeması',
        description: 'Reaktif güç kompanzasyonu',
        queries: ['kompanzasyon şeması', 'power factor correction diagram', 'capacitor bank diagram'],
        wikimediaCategory: 'Electrical_diagrams'
      },
      {
        id: 'motor-control',
        name: 'Motor Kumanda Devresi',
        description: 'Yıldız üçgen, direkt yol verme',
        queries: ['motor kumanda devresi', 'motor control circuit', 'star delta starter diagram'],
        wikimediaCategory: 'Circuit_diagrams'
      }
    ]
  },
  {
    id: 'installation',
    name: 'Tesisat',
    icon: '🔌',
    items: [
      {
        id: 'lighting-circuit',
        name: 'Aydınlatma Devresi',
        description: 'Aydınlatma tesisat şemaları',
        queries: ['aydınlatma devresi şeması', 'lighting circuit diagram', 'light switch wiring'],
        wikimediaCategory: 'Electrical_installations'
      },
      {
        id: 'socket-circuit',
        name: 'Priz Devresi',
        description: 'Priz hattı bağlantı şemaları',
        queries: ['priz devresi şeması', 'socket outlet wiring diagram', 'power outlet circuit'],
        wikimediaCategory: 'Electrical_installations'
      },
      {
        id: 'rcd-circuit',
        name: 'Kaçak Akım Koruma',
        description: 'RCD/RCCB bağlantı şemaları',
        queries: ['kaçak akım rölesi bağlantısı', 'RCD wiring diagram', 'residual current device'],
        wikimediaCategory: 'Circuit_diagrams'
      },
      {
        id: 'surge-protection',
        name: 'Parafudr Bağlantısı',
        description: 'Aşırı gerilim koruma',
        queries: ['parafudr bağlantı şeması', 'surge protector wiring', 'SPD connection diagram'],
        wikimediaCategory: 'Electrical_diagrams'
      }
    ]
  },
  {
    id: 'safety',
    name: 'Güvenlik',
    icon: '⚠️',
    items: [
      {
        id: 'warning-signs',
        name: 'Elektrik Uyarı İşaretleri',
        description: 'Tehlike ve uyarı levhaları',
        queries: ['elektrik uyarı işareti', 'electrical warning signs', 'high voltage warning'],
        wikimediaCategory: 'SVG_electricity_warning_signs'
      },
      {
        id: 'safety-symbols',
        name: 'İş Güvenliği Sembolleri',
        description: 'İSG sembolleri ve işaretleri',
        queries: ['iş güvenliği sembolleri', 'occupational safety symbols', 'safety signs electrical'],
        wikimediaCategory: 'Safety_symbols'
      },
      {
        id: 'ppe',
        name: 'Kişisel Koruyucu Donanım',
        description: 'KKD görselleri',
        queries: ['elektrikçi kişisel koruyucu', 'electrical PPE', 'personal protective equipment electrical'],
        wikimediaCategory: 'Electrical_safety'
      }
    ]
  }
];

// Kategori bazlı arama fonksiyonu
export const searchByCategory = async (
  categoryId: string,
  count: number = 15
): Promise<StockImage[]> => {
  // Kategoriyi bul
  let targetCategory: CategoryItem | null = null;
  
  for (const group of PRESET_CATEGORIES) {
    const found = group.items.find(item => item.id === categoryId);
    if (found) {
      targetCategory = found;
      break;
    }
  }
  
  if (!targetCategory) {
    console.error('Category not found:', categoryId);
    return [];
  }

  let allResults: StockImage[] = [];

  // 1. Önce Wikimedia'dan ara
  if (targetCategory.wikimediaCategory) {
    console.log('Searching Wikimedia category:', targetCategory.wikimediaCategory);
    const wikiResults = await searchWikimediaByCategoryName(targetCategory.wikimediaCategory, 8);
    allResults = [...wikiResults];
  }

  // 2. Wikimedia arama sorguları
  for (const query of targetCategory.queries.slice(0, 2)) {
    if (allResults.length >= count) break;
    const wikiQueryResults = await searchWikimediaImages(query, 5);
    const newResults = wikiQueryResults.filter(r => 
      !allResults.some(existing => existing.url === r.url)
    );
    allResults = [...allResults, ...newResults];
  }

  // 3. Google'dan tamamla
  if (allResults.length < count) {
    for (const query of targetCategory.queries) {
      if (allResults.length >= count) break;
      const googleResults = await searchGoogleImages(query, 5, 'tablo');
      const newResults = googleResults.filter(r => 
        !allResults.some(existing => existing.url === r.url)
      );
      allResults = [...allResults, ...newResults];
      await new Promise(r => setTimeout(r, 200));
    }
  }

  return allResults.slice(0, count);
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
        const url = page.imageinfo[0].url;
        if (url.match(/\.(jpg|jpeg|png|svg|gif)$/i)) {
          results.push({
            id: `wiki-cat-${index}-${Date.now()}`,
            url: url,
            thumbUrl: url.replace(/\/commons\//, '/commons/thumb/') + '/300px-' + url.split('/').pop(),
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
