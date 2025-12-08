
// services/visualGuideService.ts
// Görsel Rehberi Servisi - Statik öneriler + AI zenginleştirme

export interface VisualSuggestion {
  type: 'table' | 'diagram' | 'photo' | 'safety' | 'drawing';
  title: string;
  description: string;
  searchTerms: string[];
  sources: string[];
}

export interface VisualGuide {
  topic: string;
  suggestions: VisualSuggestion[];
  tips: string[];
  avoid: string[];
}

// Konu bazlı statik öneriler
const TOPIC_VISUAL_GUIDES: Record<string, VisualGuide> = {
  // Pano ile ilgili konular
  'pano': {
    topic: 'Pano Montajı',
    suggestions: [
      {
        type: 'photo',
        title: 'Pano İç Görünümü',
        description: 'Montajı tamamlanmış pano iç fotoğrafı',
        searchTerms: ['electrical panel internal', 'distribution board wiring'],
        sources: ['Kendi çektiğin fotoğraf', 'İş yerindeki panolar']
      },
      {
        type: 'diagram',
        title: 'Pano Tek Hat Şeması',
        description: 'Panonun elektriksel bağlantı şeması',
        searchTerms: ['panel single line diagram', 'distribution board SLD'],
        sources: ['Wikimedia Commons', 'Proje dosyaları']
      },
      {
        type: 'table',
        title: 'Sigorta Seçim Tablosu',
        description: 'MCB/MCCB seçim kriterleri tablosu',
        searchTerms: ['circuit breaker selection chart', 'MCB rating table'],
        sources: ['Schneider katalog', 'ABB teknik döküman']
      }
    ],
    tips: [
      'Pano kapağı açıkken çek, elemanlar görünsün',
      'Bara bağlantılarını yakından çek',
      'Etiketler okunabilir olsun'
    ],
    avoid: ['Bulanık fotoğraflar', 'Karanlık çekimler', 'Logo/marka odaklı görseller']
  },

  'kablo': {
    topic: 'Kablo İşleri',
    suggestions: [
      {
        type: 'table',
        title: 'Kablo Kesit Tablosu',
        description: 'mm² ve AWG karşılıkları, akım taşıma kapasiteleri',
        searchTerms: ['cable cross section table', 'wire gauge AWG mm2'],
        sources: ['Prysmian katalog', 'Wikimedia Commons']
      },
      {
        type: 'table',
        title: 'Kablo Renk Kodları',
        description: 'IEC standart kablo renkleri',
        searchTerms: ['wire color code IEC', 'cable colour standard'],
        sources: ['Elektrik yönetmelikleri', 'Wikimedia']
      },
      {
        type: 'photo',
        title: 'Kablo Döşeme Fotoğrafı',
        description: 'Kablo kanalı veya tavası görüntüsü',
        searchTerms: ['cable tray installation', 'wire routing'],
        sources: ['Saha fotoğrafı', 'İş yeri']
      }
    ],
    tips: [
      'Kesit hesabı varsa tabloyu kullan',
      'Renk kodları için standart tablo ekle',
      'Döşeme yöntemi için saha fotoğrafı'
    ],
    avoid: ['Katalog kapak görselleri', 'Reklam içerikleri']
  },

  'topraklama': {
    topic: 'Topraklama Sistemleri',
    suggestions: [
      {
        type: 'diagram',
        title: 'Topraklama Şeması (TN/TT/IT)',
        description: 'Topraklama sistem tipleri diyagramı',
        searchTerms: ['TN-S earthing diagram', 'TT grounding system', 'IT earthing'],
        sources: ['Wikimedia Commons', 'IEC standartları']
      },
      {
        type: 'photo',
        title: 'Topraklama Elektrodu',
        description: 'Topraklama çubuğu veya levha fotoğrafı',
        searchTerms: ['ground rod installation', 'earthing electrode'],
        sources: ['Saha fotoğrafı']
      },
      {
        type: 'table',
        title: 'Topraklama Direnci Tablosu',
        description: 'İzin verilen direnç değerleri',
        searchTerms: ['earthing resistance values table'],
        sources: ['Yönetmelikler', 'Teknik kitaplar']
      }
    ],
    tips: [
      'TN-S, TN-C-S, TT, IT şemalarından birini seç',
      'Ölçüm yapıldıysa sonuçları ekle'
    ],
    avoid: ['Çok karmaşık şemalar', 'Yabancı standart görselleri']
  },

  'motor': {
    topic: 'Motor Kumanda',
    suggestions: [
      {
        type: 'diagram',
        title: 'Yıldız-Üçgen Devre Şeması',
        description: 'Star-delta starter bağlantı şeması',
        searchTerms: ['star delta starter diagram', 'Y-D motor control'],
        sources: ['Wikimedia Commons', 'Ders notları']
      },
      {
        type: 'diagram',
        title: 'DOL Starter Şeması',
        description: 'Direkt yol verme devre şeması',
        searchTerms: ['DOL starter wiring diagram', 'direct online starter'],
        sources: ['Wikimedia Commons']
      },
      {
        type: 'photo',
        title: 'Motor Kumanda Panosu',
        description: 'Kontaktör, termik röle görüntüsü',
        searchTerms: ['motor control panel', 'contactor panel'],
        sources: ['Saha fotoğrafı', 'İş yeri']
      }
    ],
    tips: [
      'Güç ve kumanda devrelerini ayrı göster',
      'Kontaktör bağlantılarını detaylı çek'
    ],
    avoid: ['Çok karmaşık PLC şemaları', 'Sadece motor fotoğrafı']
  },

  'aydinlatma': {
    topic: 'Aydınlatma Tesisatı',
    suggestions: [
      {
        type: 'diagram',
        title: 'Anahtar Bağlantı Şeması',
        description: 'Basit/komütatör/vaevien şemaları',
        searchTerms: ['light switch wiring diagram', 'two way switch circuit'],
        sources: ['Wikimedia Commons', 'Ders notları']
      },
      {
        type: 'drawing',
        title: 'Aydınlatma Tesisat Projesi',
        description: 'Kat planı üzerinde aydınlatma noktaları',
        searchTerms: ['lighting plan drawing', 'electrical floor plan'],
        sources: ['AutoCAD projeler', 'İş yeri projeleri']
      },
      {
        type: 'table',
        title: 'Aydınlatma Hesap Tablosu',
        description: 'Lux değerleri ve armatür seçimi',
        searchTerms: ['lux level table', 'lighting calculation'],
        sources: ['Yönetmelikler', 'Armatür katalogları']
      }
    ],
    tips: [
      'Vaevien için şema çok açıklayıcı olur',
      'Proje varsa ekran görüntüsü al'
    ],
    avoid: ['Sadece lamba fotoğrafı', 'Dekoratif aydınlatma görselleri']
  },

  'olcum': {
    topic: 'Ölçüm ve Test',
    suggestions: [
      {
        type: 'photo',
        title: 'Ölçüm Aleti Kullanımı',
        description: 'Multimetre, pensampermetre kullanım fotoğrafı',
        searchTerms: ['multimeter measurement', 'clamp meter usage'],
        sources: ['Kendi çektiğin fotoğraf']
      },
      {
        type: 'table',
        title: 'Ölçüm Değerleri Tablosu',
        description: 'Gerilim, akım, direnç ölçüm sonuçları',
        searchTerms: ['electrical measurement table'],
        sources: ['Kendi oluştur', 'Excel tablosu']
      },
      {
        type: 'diagram',
        title: 'Ölçüm Bağlantı Şeması',
        description: 'Nasıl bağlanır, nereden ölçülür',
        searchTerms: ['how to measure voltage diagram', 'ammeter connection'],
        sources: ['Ders notları', 'Cihaz kullanım kılavuzu']
      }
    ],
    tips: [
      'Ölçüm anında fotoğraf çek',
      'Ekrandaki değer görünsün',
      'Kendi yaptığın ölçüm en iyisi'
    ],
    avoid: ['Stok ölçüm fotoğrafları', 'Katalog görselleri']
  },

  'guvenlik': {
    topic: 'İş Güvenliği',
    suggestions: [
      {
        type: 'safety',
        title: 'Elektrik Uyarı İşaretleri',
        description: 'Yüksek gerilim, tehlike işaretleri',
        searchTerms: ['electrical warning signs ISO 7010', 'high voltage symbol'],
        sources: ['Wikimedia Commons ISO 7010']
      },
      {
        type: 'safety',
        title: 'KKD Görselleri',
        description: 'İzole eldiven, gözlük, ayakkabı',
        searchTerms: ['electrical PPE', 'insulated gloves symbol'],
        sources: ['Wikimedia Commons', 'İSG kaynakları']
      },
      {
        type: 'photo',
        title: 'Güvenlik Uygulaması',
        description: 'Kilitleme/etiketleme, çalışma alanı',
        searchTerms: ['lockout tagout electrical', 'LOTO procedure'],
        sources: ['Saha fotoğrafı', 'İSG eğitim materyalleri']
      }
    ],
    tips: [
      'ISO 7010 sembolleri en güvenilir',
      'İş yerindeki uyarı levhalarını çek',
      'KKD kullanımını göster'
    ],
    avoid: ['Kaza fotoğrafları', 'Şok edici görseller']
  },

  'kompanzasyon': {
    topic: 'Kompanzasyon',
    suggestions: [
      {
        type: 'diagram',
        title: 'Kompanzasyon Şeması',
        description: 'Reaktif güç kompanzasyon devresi',
        searchTerms: ['power factor correction diagram', 'capacitor bank wiring'],
        sources: ['Wikimedia Commons', 'Teknik kitaplar']
      },
      {
        type: 'photo',
        title: 'Kompanzasyon Panosu',
        description: 'Kondansatör grubu fotoğrafı',
        searchTerms: ['capacitor bank panel', 'PFC panel'],
        sources: ['Saha fotoğrafı', 'İş yeri']
      },
      {
        type: 'table',
        title: 'Güç Faktörü Tablosu',
        description: 'Cos φ değerleri ve ceza oranları',
        searchTerms: ['power factor table', 'cos phi values'],
        sources: ['TEDAŞ mevzuatı', 'Enerji yönetmelikleri']
      }
    ],
    tips: [
      'Cos φ değerlerini tabloda göster',
      'Kondansatör kademelerini açıkla'
    ],
    avoid: ['Çok teknik formüller', 'Karmaşık hesaplamalar']
  },

  'proje': {
    topic: 'Proje Çizimi',
    suggestions: [
      {
        type: 'drawing',
        title: 'AutoCAD Elektrik Projesi',
        description: 'Tesisat planı ekran görüntüsü',
        searchTerms: ['electrical CAD drawing', 'AutoCAD electrical plan'],
        sources: ['İş yeri projeleri', 'Kendi ekran görüntün']
      },
      {
        type: 'diagram',
        title: 'Tek Hat Şeması',
        description: 'Tesisin genel elektrik şeması',
        searchTerms: ['single line diagram', 'electrical SLD'],
        sources: ['Wikimedia Commons', 'Proje dosyaları']
      },
      {
        type: 'table',
        title: 'Elektrik Sembolleri Tablosu',
        description: 'Projede kullanılan semboller',
        searchTerms: ['electrical symbols IEC 60617', 'wiring diagram symbols'],
        sources: ['Wikimedia Commons', 'Standart tabloları']
      }
    ],
    tips: [
      'Projenin bir bölümünü ekran görüntüsü al',
      'Sembol tablosu her zaman faydalı',
      'Çok büyük projeler için detay göster'
    ],
    avoid: ['Telif haklı projeler', 'Müşteri bilgisi içeren projeler']
  },

  'genel': {
    topic: 'Genel',
    suggestions: [
      {
        type: 'table',
        title: 'Kablo Kesit Tablosu',
        description: 'Genel amaçlı kesit seçim tablosu',
        searchTerms: ['cable cross section table', 'wire gauge chart'],
        sources: ['Wikimedia Commons', 'Kataloglar']
      },
      {
        type: 'diagram',
        title: 'Temel Elektrik Sembolleri',
        description: 'Sık kullanılan semboller',
        searchTerms: ['electrical symbols basic', 'circuit symbols'],
        sources: ['Wikimedia Commons']
      },
      {
        type: 'safety',
        title: 'Güvenlik İşaretleri',
        description: 'Temel uyarı ve zorunluluk işaretleri',
        searchTerms: ['safety signs electrical', 'ISO 7010 electrical'],
        sources: ['Wikimedia Commons']
      }
    ],
    tips: [
      'Konuyla ilgili en basit görseli seç',
      'Anlaşılır ve net olsun'
    ],
    avoid: ['Karmaşık görseller', 'Alakasız içerikler']
  }
};

// Konu eşleştirme fonksiyonu
const matchTopic = (topic: string): string => {
  const lowerTopic = topic.toLowerCase();
  
  if (lowerTopic.includes('pano') || lowerTopic.includes('dağıtım') || lowerTopic.includes('tablo')) {
    return 'pano';
  }
  if (lowerTopic.includes('kablo') || lowerTopic.includes('kesit') || lowerTopic.includes('iletken')) {
    return 'kablo';
  }
  if (lowerTopic.includes('toprak') || lowerTopic.includes('earth') || lowerTopic.includes('ground')) {
    return 'topraklama';
  }
  if (lowerTopic.includes('motor') || lowerTopic.includes('yıldız') || lowerTopic.includes('üçgen') || lowerTopic.includes('kumanda')) {
    return 'motor';
  }
  if (lowerTopic.includes('aydınlatma') || lowerTopic.includes('lamba') || lowerTopic.includes('anahtar') || lowerTopic.includes('armatür')) {
    return 'aydinlatma';
  }
  if (lowerTopic.includes('ölçüm') || lowerTopic.includes('test') || lowerTopic.includes('multimetre') || lowerTopic.includes('ölçü')) {
    return 'olcum';
  }
  if (lowerTopic.includes('güvenlik') || lowerTopic.includes('isg') || lowerTopic.includes('kkd') || lowerTopic.includes('koruyucu')) {
    return 'guvenlik';
  }
  if (lowerTopic.includes('kompanzasyon') || lowerTopic.includes('reaktif') || lowerTopic.includes('kondansatör') || lowerTopic.includes('cos')) {
    return 'kompanzasyon';
  }
  if (lowerTopic.includes('proje') || lowerTopic.includes('autocad') || lowerTopic.includes('çizim') || lowerTopic.includes('plan')) {
    return 'proje';
  }
  
  return 'genel';
};

// Ana fonksiyon: Görsel rehberi getir
export const getVisualGuide = (topic: string): VisualGuide => {
  const matchedKey = matchTopic(topic);
  const guide = TOPIC_VISUAL_GUIDES[matchedKey] || TOPIC_VISUAL_GUIDES['genel'];
  
  return {
    ...guide,
    topic: topic // Orijinal konuyu koru
  };
};

// AI ile zenginleştirme (opsiyonel)
export const enrichVisualGuideWithAI = async (
  topic: string,
  baseGuide: VisualGuide
): Promise<string[]> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    return [];
  }

  try {
    const prompt = `Sen bir elektrik mühendisliği staj danışmanısın. 

Konu: "${topic}"

Bu konu için staj defterine eklenebilecek 3 ek görsel önerisi ver. Kısa ve pratik ol.

Format:
1. [Görsel türü]: Açıklama
2. [Görsel türü]: Açıklama  
3. [Görsel türü]: Açıklama

Görsel türleri: Tablo, Şema, Fotoğraf, Proje Çizimi, Güvenlik İşareti`;

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.7, maxOutputTokens: 500 }
        })
      }
    );

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    
    // Satırlara böl ve temizle
    const suggestions = text
      .split('\n')
      .filter((line: string) => line.match(/^\d+\./))
      .map((line: string) => line.replace(/^\d+\.\s*/, '').trim());
    
    return suggestions;

  } catch (error) {
    console.error('AI enrichment failed:', error);
    return [];
  }
};

// Tip ikonları
export const getTypeIcon = (type: string): string => {
  switch (type) {
    case 'table': return '📊';
    case 'diagram': return '📐';
    case 'photo': return '📷';
    case 'safety': return '⚠️';
    case 'drawing': return '✏️';
    default: return '📎';
  }
};

// Tip etiketleri
export const getTypeLabel = (type: string): string => {
  switch (type) {
    case 'table': return 'Tablo';
    case 'diagram': return 'Şema';
    case 'photo': return 'Fotoğraf';
    case 'safety': return 'Güvenlik';
    case 'drawing': return 'Çizim';
    default: return 'Diğer';
  }
};
