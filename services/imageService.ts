
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
  suggestedTopic: string;      // Önerilen konu başlığı
  suggestedPrompt: string;     // Önerilen custom prompt
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
        queries: ['cable cross section table AWG', 'wire gauge ampacity chart', 'conductor sizing table electrical'],
        wikimediaCategory: 'Electrical_wiring',
        suggestedTopic: 'Kablo kesit hesaplamaları ve standartlar eğitimi',
        suggestedPrompt: 'Bugün kablo kesit seçim tabloları üzerinde çalışıldı. Akım taşıma kapasitesi, ortam sıcaklığı düzeltme faktörleri ve kesit hesaplama yöntemleri incelendi. Tablodaki değerlerin pratikte nasıl kullanıldığı öğrenildi.'
      },
      {
        id: 'current-capacity',
        name: 'Akım Taşıma Kapasitesi',
        description: 'Kabloların akım taşıma değerleri',
        queries: ['ampacity table electrical wire', 'current carrying capacity chart', 'cable current rating table'],
        wikimediaCategory: 'Electrical_wiring',
        suggestedTopic: 'Kablo akım taşıma kapasitesi hesaplamaları',
        suggestedPrompt: 'Bugün kabloların akım taşıma kapasitesi tabloları incelendi. Farklı kablo tipleri, döşeme koşulları ve sıcaklık faktörlerinin kapasiteye etkisi öğrenildi. Pratik hesaplama örnekleri yapıldı.'
      },
      {
        id: 'voltage-drop',
        name: 'Gerilim Düşümü Tablosu',
        description: 'Gerilim düşümü hesap tabloları',
        queries: ['voltage drop calculation chart', 'electrical voltage drop table', 'wire voltage drop formula'],
        wikimediaCategory: 'Electrical_power_distribution_diagrams',
        suggestedTopic: 'Gerilim düşümü hesaplamaları eğitimi',
        suggestedPrompt: 'Bugün gerilim düşümü hesaplama tabloları üzerinde çalışıldı. Hat uzunluğu, kesit ve akım değerlerine göre gerilim düşümü formülleri uygulandı. Yönetmeliklerdeki izin verilen düşüm değerleri öğrenildi.'
      },
      {
        id: 'fuse-selection',
        name: 'Sigorta Seçim Tablosu',
        description: 'Sigorta ve şalter seçim tabloları',
        queries: ['circuit breaker sizing chart', 'fuse selection table MCB', 'breaker amperage rating chart'],
        wikimediaCategory: 'Circuit_breaker_symbols',
        suggestedTopic: 'Sigorta ve şalter seçim kriterleri eğitimi',
        suggestedPrompt: 'Bugün sigorta ve otomatik şalter seçim tabloları incelendi. Kesici kapasitesi, karakteristik eğriler (B, C, D) ve koordinasyon kuralları öğrenildi. Kablo koruma koordinasyonu üzerinde çalışıldı.'
      },
      {
        id: 'cable-colors',
        name: 'Kablo Renk Kodları',
        description: 'İletken renk standartları',
        queries: ['electrical wire color code IEC', 'cable color standard chart', 'wiring color codes diagram'],
        wikimediaCategory: 'SVG_electrical_wiring_and_cables',
        suggestedTopic: 'Kablo renk kodları ve işaretleme standartları',
        suggestedPrompt: 'Bugün elektrik kablolarının renk kodlama standartları öğrenildi. Faz, nötr ve toprak iletkenlerinin renkleri, eski ve yeni standartlar arasındaki farklar incelendi. IEC standartlarına uygun işaretleme yapıldı.'
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
        queries: ['electrical symbols IEC 60617', 'wiring diagram symbols standard', 'electrical schematic symbols chart'],
        wikimediaCategory: 'IEC_60617_electrical_symbols',
        suggestedTopic: 'Elektrik tesisat sembolleri eğitimi',
        suggestedPrompt: 'Bugün elektrik tesisat projelerinde kullanılan semboller öğrenildi. Anahtar, priz, aydınlatma armatürleri ve dağıtım kutusu sembolleri incelendi. Proje okuma ve çizim teknikleri üzerinde çalışıldı.'
      },
      {
        id: 'single-line-symbols',
        name: 'Tek Hat Şeması Sembolleri',
        description: 'Trafo, şalter, bara sembolleri',
        queries: ['single line diagram symbols', 'one line diagram symbols power', 'transformer circuit breaker symbol'],
        wikimediaCategory: 'Electrical_one-line_diagrams',
        suggestedTopic: 'Tek hat şeması sembolleri ve okuma teknikleri',
        suggestedPrompt: 'Bugün tek hat şemalarında kullanılan semboller öğrenildi. Trafo, kesici, ayırıcı, bara ve ölçü trafosu sembolleri incelendi. Gerçek projeler üzerinde şema okuma çalışması yapıldı.'
      },
      {
        id: 'panel-symbols',
        name: 'Pano Sembolleri',
        description: 'Pano içi eleman sembolleri',
        queries: ['electrical panel symbols schematic', 'switchboard diagram symbols', 'distribution board symbols'],
        wikimediaCategory: 'Circuit_breaker_symbols',
        suggestedTopic: 'Elektrik pano sembolleri eğitimi',
        suggestedPrompt: 'Bugün elektrik panolarında kullanılan semboller öğrenildi. Şalter, kontaktör, röle, sinyal lambası ve buton sembolleri incelendi. Pano yerleşim ve bağlantı şemaları okuma çalışması yapıldı.'
      },
      {
        id: 'protection-symbols',
        name: 'Koruma Cihazları Sembolleri',
        description: 'Röle, kontaktör, termik sembolleri',
        queries: ['protection relay symbols IEC', 'contactor symbol diagram', 'thermal overload relay symbol'],
        wikimediaCategory: 'Electronic_symbols',
        suggestedTopic: 'Koruma cihazları sembolleri ve şemaları',
        suggestedPrompt: 'Bugün koruma cihazlarının sembolleri öğrenildi. Termik röle, manyetik koruma, aşırı akım rölesi ve kaçak akım koruma sembolleri incelendi. Koruma koordinasyonu şemaları üzerinde çalışıldı.'
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
        queries: ['single line diagram electrical', 'one line diagram example power', 'electrical SLD drawing'],
        wikimediaCategory: 'Electrical_one-line_diagrams',
        suggestedTopic: 'Tek hat şeması inceleme ve analiz çalışması',
        suggestedPrompt: 'Bugün gerçek projelerin tek hat şemaları incelendi. Ana dağıtım panosu, tali panolar ve yük dağılımı analiz edildi. Şema üzerinden güç hesaplamaları ve koruma koordinasyonu değerlendirildi.'
      },
      {
        id: 'panel-wiring',
        name: 'Pano İç Bağlantı Şeması',
        description: 'Pano montaj ve bağlantı şemaları',
        queries: ['electrical panel wiring diagram', 'distribution board schematic', 'switchboard internal wiring'],
        wikimediaCategory: 'Electrical_wiring_diagrams',
        suggestedTopic: 'Pano iç bağlantı şemaları inceleme',
        suggestedPrompt: 'Bugün pano iç bağlantı şemaları üzerinde çalışıldı. Bara bağlantıları, klemens numaralandırma ve kablo yolları incelendi. Şemadan montaj yapma ve hata bulma teknikleri öğrenildi.'
      },
      {
        id: 'grounding',
        name: 'Topraklama Şeması',
        description: 'Topraklama sistem şemaları',
        queries: ['grounding system diagram TN TT IT', 'earthing diagram electrical', 'ground electrode system diagram'],
        wikimediaCategory: 'Earthing_systems',
        suggestedTopic: 'Topraklama sistemleri ve şemaları eğitimi',
        suggestedPrompt: 'Bugün topraklama sistem şemaları incelendi. TN, TT ve IT sistemlerinin farkları, topraklama direnci hesaplamaları ve elektrot yerleşimi öğrenildi. Yönetmelik gereksinimleri değerlendirildi.'
      },
      {
        id: 'compensation',
        name: 'Kompanzasyon Şeması',
        description: 'Reaktif güç kompanzasyonu',
        queries: ['power factor correction diagram', 'capacitor bank schematic wiring', 'reactive power compensation system'],
        wikimediaCategory: 'Electrical_diagrams',
        suggestedTopic: 'Reaktif güç kompanzasyonu eğitimi',
        suggestedPrompt: 'Bugün reaktif güç kompanzasyon sistemleri incelendi. Güç faktörü hesaplamaları, kondansatör seçimi ve kompanzasyon panosu bağlantı şemaları öğrenildi. Enerji tasarrufu hesapları yapıldı.'
      },
      {
        id: 'motor-control',
        name: 'Motor Kumanda Devresi',
        description: 'Yıldız üçgen, direkt yol verme',
        queries: ['star delta starter diagram', 'motor control circuit schematic', 'DOL direct online starter wiring'],
        wikimediaCategory: 'Motor_controllers',
        suggestedTopic: 'Motor kumanda devreleri eğitimi',
        suggestedPrompt: 'Bugün motor kumanda devreleri üzerinde çalışıldı. Direkt yol verme, yıldız üçgen ve soft starter devreleri incelendi. Kumanda ve güç devresi şemaları okundu, bağlantı mantığı öğrenildi.'
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
        queries: ['lighting circuit diagram wiring', 'light switch schematic two way', 'lighting installation diagram'],
        wikimediaCategory: 'Electrical_installations',
        suggestedTopic: 'Aydınlatma devre şemaları ve uygulaması',
        suggestedPrompt: 'Bugün aydınlatma devre şemaları incelendi. Basit anahtar, komütatör, vaevien ve paralel bağlantı şemaları çizildi. Enerji tasarruflu aydınlatma ve hareket sensörlü devreler öğrenildi.'
      },
      {
        id: 'socket-circuit',
        name: 'Priz Devresi',
        description: 'Priz hattı bağlantı şemaları',
        queries: ['socket outlet wiring diagram', 'power outlet circuit schematic', 'electrical receptacle wiring'],
        wikimediaCategory: 'Electrical_installations',
        suggestedTopic: 'Priz devreleri ve topraklama uygulaması',
        suggestedPrompt: 'Bugün priz devre şemaları ve bağlantıları incelendi. Topraklı priz montajı, hat kesitleri ve koruma koordinasyonu öğrenildi. Mutfak ve banyo gibi özel mahaller için kurallar değerlendirildi.'
      },
      {
        id: 'rcd-circuit',
        name: 'Kaçak Akım Koruma',
        description: 'RCD/RCCB bağlantı şemaları',
        queries: ['RCD RCCB wiring diagram', 'residual current device circuit', 'ground fault circuit interrupter'],
        wikimediaCategory: 'Circuit_diagrams',
        suggestedTopic: 'Kaçak akım koruma sistemleri eğitimi',
        suggestedPrompt: 'Bugün kaçak akım koruma cihazları (RCD/RCCB) incelendi. Çalışma prensibi, bağlantı şeması ve test yöntemleri öğrenildi. Seçicilik ve koordinasyon kuralları değerlendirildi.'
      },
      {
        id: 'surge-protection',
        name: 'Parafudr Bağlantısı',
        description: 'Aşırı gerilim koruma',
        queries: ['surge protector wiring SPD', 'lightning arrester connection diagram', 'SPD Type 1 Type 2 installation'],
        wikimediaCategory: 'Electrical_diagrams',
        suggestedTopic: 'Aşırı gerilim koruma sistemleri eğitimi',
        suggestedPrompt: 'Bugün parafudr (SPD) sistemleri incelendi. Tip 1, Tip 2 ve Tip 3 koruma seviyeleri, bağlantı şemaları ve koordinasyon kuralları öğrenildi. Yıldırımdan korunma prensipleri değerlendirildi.'
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
        queries: ['electrical warning signs ISO 7010', 'high voltage warning symbol', 'danger electricity sign yellow'],
        wikimediaCategory: 'Electrical_safety_symbols',
        suggestedTopic: 'Elektrik güvenlik işaretleri eğitimi',
        suggestedPrompt: 'Bugün elektrik tesislerinde kullanılan güvenlik işaretleri öğrenildi. Tehlike, uyarı ve bilgilendirme levhaları incelendi. İşaretlerin yerleşim kuralları ve standartları değerlendirildi.'
      },
      {
        id: 'safety-symbols',
        name: 'İş Güvenliği Sembolleri',
        description: 'İSG sembolleri ve işaretleri',
        queries: ['safety symbols ISO 7010 electrical', 'hazard warning symbols industry', 'prohibition signs workplace'],
        wikimediaCategory: 'Safety_symbols',
        suggestedTopic: 'İş sağlığı ve güvenliği sembolleri eğitimi',
        suggestedPrompt: 'Bugün iş güvenliği sembolleri ve işaretleri öğrenildi. Yasak, zorunluluk, uyarı ve acil durum işaretleri incelendi. İşyerinde güvenli çalışma prosedürleri değerlendirildi.'
      },
      {
        id: 'ppe',
        name: 'Kişisel Koruyucu Donanım',
        description: 'KKD görselleri',
        queries: ['electrical PPE insulated gloves', 'electrician safety equipment', 'arc flash protective gear'],
        wikimediaCategory: 'Electrical_safety',
        suggestedTopic: 'Kişisel koruyucu donanım (KKD) eğitimi',
        suggestedPrompt: 'Bugün elektrik çalışmalarında kullanılan kişisel koruyucu donanımlar öğrenildi. İzole eldiven, koruyucu gözlük, iş ayakkabısı ve yüz siperi kullanımı incelendi. KKD seçim ve bakım kuralları değerlendirildi.'
      }
    ]
  }
];

// Kategori bazlı arama fonksiyonu - Optimize edilmiş
export const searchByCategory = async (
  categoryId: string,
  count: number = 15
): Promise<StockImage[]> => {
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

  console.log('Searching category:', targetCategory.name);
  let allResults: StockImage[] = [];

  // 1. Wikimedia kategorisinden ara
  if (targetCategory.wikimediaCategory) {
    const wikiCatResults = await searchWikimediaByCategoryName(targetCategory.wikimediaCategory, 10);
    allResults = [...wikiCatResults];
    console.log('Wikimedia category results:', wikiCatResults.length);
  }

  // 2. İngilizce sorgularla Wikimedia (daha iyi sonuç verir)
  // NOT: Artık tüm sorgular İngilizce olduğu için filtrelemeye gerek yok.
  for (const query of targetCategory.queries.slice(0, 3)) {
    if (allResults.length >= count) break;
    const wikiResults = await searchWikimediaImages(query, 8);
    const newResults = wikiResults.filter(r => !allResults.some(e => e.url === r.url));
    allResults = [...allResults, ...newResults];
  }

  // 3. Google'dan tamamla
  if (allResults.length < count) {
    for (const query of targetCategory.queries) {
      if (allResults.length >= count) break;
      const googleResults = await searchGoogleImages(query, 5, 'tablo');
      const newResults = googleResults.filter(r => !allResults.some(e => e.url === r.url));
      allResults = [...allResults, ...newResults];
      await new Promise(r => setTimeout(r, 150));
    }
  }

  // SVG ve Wikimedia öncelikli sırala
  const sorted = allResults.sort((a, b) => {
    const aScore = (a.url.includes('.svg') ? 2 : 0) + (a.source === 'wikimedia' ? 1 : 0);
    const bScore = (b.url.includes('.svg') ? 2 : 0) + (b.source === 'wikimedia' ? 1 : 0);
    return bScore - aScore;
  });

  return sorted.slice(0, count);
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
