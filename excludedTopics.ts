/**
 * Hariç Tutulan Konular - 1. Staj Dönemi
 * Bu konular zaten öğrenildiği için 2. staj döneminde tekrar önerilmemeli
 */

// 1. Staj Döneminde İşlenen Konu Başlıkları
export const EXCLUDED_TOPIC_TITLES: string[] = [
  'Temel teknik eğitim ve cihaz tanıtımı',
  'Ölçü aletleri işlevsel kullanım eğitimi',
  'Kablo ve bağlantı elemanları tanıtımı',
  'Elektrik devre şemaları okuma eğitimi',
  'Elektriksel koruma cihazları ve IP koruma sınıfları eğitimi',
  'Elektrik şemaları',
  'Anahtarlama',
  'Topraklama sistemleri',
  'Ölçü aletleri uygulama eğitimi',
  'Pano içi kablolama ve ferüleşme eğitimi',
  'Aydınlatma projelendirme ve ölçüm',
  'Kumanda ve gösterge sistemleri',
  'Malzeme kontrol ve sipariş',
  'Devre tasarımı ve çizim',
  'Üç faz pano çizimi',
  'Proje plan çizimi',
  'Elektrik Pano İnceleme',
  'Ölçü Aletleri Kullanımı',
  'Motor Sürücü ve Kontrol Sistemleri',
  'Proje Kontrol ve Onay',
  'Sigorta ve Koruma Devreleri İncelemesi',
  'Pano Bağlantı ve Koruma Sistemleri',
  'Proje ve Bağlantı Hattı Çizimi',
  'Teknik Doküman İnceleme',
  'Malzeme Teknik Özellik Analizi',
  'Sayaç Tipleri ve Bağlantıları',
  'Günlük Teknik Değerlendirme',
  'Faz Sırası Kontrolü ve Dönüş Yönü',
  'Klima Hattı Çekimi ve Devre Oluşturma',
  'Genel Değerlendirme'
];

// 1. Staj Döneminde Öğrenilen Anahtar Kelimeler
export const EXCLUDED_KEYWORDS: string[] = [
  // Ölçü Aletleri
  'multimetre',
  'pens ampermetre',
  'megger',
  'ölçü aletleri',
  'ölçüm cihazları',
  'lux ölçer',
  'luxmetre',
  
  // Kablo Tipleri
  'NYA',
  'NYM',
  'TTR',
  'NYY',
  'kablo tipleri',
  'kablo kesitleri',
  'kablo renk kodları',
  'damar yapısı',
  
  // Devre Şemaları
  'devre şemaları okuma',
  'şema okuma',
  'elektrik sembolleri',
  'devre sembolleri',
  'hat çizim kuralları',
  
  // Koruma Sistemleri
  'kaçak akım rölesi',
  'kaçak akım koruma',
  'IP koruma sınıfları',
  'IP20',
  'IP65',
  
  // Anahtarlama Elemanları
  'anahtarlama elemanları',
  'buton',
  'seçici anahtar',
  'sinyal lambası',
  'acil stop',
  'acil durdurma',
  
  // Topraklama
  'topraklama sistemleri',
  'topraklama',
  'TN sistemi',
  'TT sistemi',
  'IT sistemi',
  'topraklama çubuğu',
  'topraklama iletkeni',
  
  // Pano Kablolama
  'pano kablolama',
  'pano içi kablolama',
  'ferüleşme',
  'kablo düzeni',
  'kablo etiketleme',
  'klemens bağlantı',
  
  // Aydınlatma
  'aydınlatma projelendirme',
  'lux ölçümü',
  'aydınlatma hesabı',
  'aydınlatma seviyesi',
  
  // Kumanda Sistemleri
  'kumanda elemanları',
  'gösterge sistemleri',
  'endüstriyel kumanda',
  'kontrol paneli',
  
  // Elektronik Bileşenler
  'transistör',
  'diyot',
  'kondansatör',
  'direnç',
  'bobin',
  
  // Üç Faz Sistemler
  'üç faz pano',
  'üç fazlı sistem',
  'R S T fazları',
  'faz sırası',
  'voltmetre',
  'ampermetre',
  
  // Tesisat Elemanları
  'priz yerleşimi',
  'anahtar yerleşimi',
  'aydınlatma noktası',
  'metraj hesabı',
  'kablo metrajı',
  
  // Pano Elemanları
  'ana şalter',
  'sigorta grupları',
  'kontaktör',
  'frekans konvertör',
  'güç kaynağı modülü',
  
  // Motor Sürücü
  'inverter',
  'motor sürücü',
  'frekans ayarı',
  'hız kontrolü',
  'hızlanma süresi',
  'yavaşlama süresi',
  'trifaze motor',
  
  // Sigortalar
  'MCB',
  'otomatik sigorta',
  'sigorta karakteristik',
  'B tipi sigorta',
  'C tipi sigorta',
  
  // Sayaçlar
  'elektrik sayacı',
  'mekanik sayaç',
  'dijital sayaç',
  'akıllı sayaç',
  'sayaç bağlantısı',
  'tek faz sayaç',
  'üç faz sayaç',
  
  // Klima
  'klima hattı',
  'split klima',
  'klima besleme'
];

/**
 * Verilen konu metninin hariç tutulan konularla eşleşip eşleşmediğini kontrol eder
 * @param topic Kontrol edilecek konu metni
 * @returns true ise konu hariç tutulmalı
 */
export const isTopicExcluded = (topic: string): boolean => {
  const lowerTopic = topic.toLowerCase();
  
  // Başlık eşleşmesi kontrol et
  for (const excludedTitle of EXCLUDED_TOPIC_TITLES) {
    if (lowerTopic.includes(excludedTitle.toLowerCase())) {
      return true;
    }
  }
  
  // Anahtar kelime eşleşmesi kontrol et
  for (const keyword of EXCLUDED_KEYWORDS) {
    if (lowerTopic.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  
  return false;
};

/**
 * Gemini prompt'una eklenecek hariç tutma metni
 */
export const getExclusionPromptText = (): string => {
  const topKeywords = EXCLUDED_KEYWORDS.slice(0, 30).join(', ');
  
  return `
ÖNEMLİ: Aşağıdaki konular 1. staj döneminde zaten işlendiği için ÖNERİLMEMELİ ve içerikte yer almamalı:

Hariç Tutulan Konular:
- Ölçü aletleri (multimetre, pens ampermetre, megger, lux ölçer)
- Kablo tipleri ve kesitleri (NYA, NYM, TTR, NYY)
- Temel devre şemaları okuma ve semboller
- IP koruma sınıfları ve kaçak akım röleleri
- Anahtarlama elemanları (buton, seçici anahtar, sinyal lambası, acil stop)
- Topraklama sistemleri (TN, TT, IT)
- Pano içi kablolama ve ferüleşme
- Temel aydınlatma ve lux ölçümü
- Kumanda ve gösterge sistemleri
- Temel elektronik bileşenler (transistör, diyot, kondansatör, direnç, bobin)
- Üç faz pano çizimi ve R-S-T fazları
- Tesisat plan çizimi (priz, anahtar, aydınlatma noktası)
- Motor sürücü/inverter temel kullanımı
- MCB ve sigorta bağlantıları
- Sayaç tipleri ve bağlantıları
- Faz sırası kontrolü
- Klima hattı çekimi

Bunların yerine daha ileri düzey, farklı ve 2. staj dönemine uygun konular öner.
`;
};

/**
 * Konu önerisi filtreleme - hariç tutulan konuları çıkarır
 */
export const filterExcludedTopics = (topics: string[]): string[] => {
  return topics.filter(topic => !isTopicExcluded(topic));
};
