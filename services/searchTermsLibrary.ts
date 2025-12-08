// services/searchTermsLibrary.ts
// Arama Terimleri Kütüphanesi - Her kategori için optimize edilmiş arama rehberi

export interface SearchStrategy {
  // Öncelik sırası: 1=en yüksek
  priority: number;
  // Arama tipi
  type: 'wikimedia_category' | 'wikimedia_search' | 'google';
  // Sorgu veya kategori adı
  query: string;
  // Dosya tipi filtresi (opsiyonel)
  fileType?: 'svg' | 'png' | 'jpg' | 'any';
  // Ek arama operatörleri
  operators?: string;
}

export interface CategorySearchConfig {
  categoryId: string;
  categoryName: string;
  description: string;
  // Arama stratejileri (öncelik sırasına göre)
  strategies: SearchStrategy[];
  // Kaçınılacak terimler
  excludeTerms?: string[];
  // Minimum görsel boyutu
  minWidth?: number;
}

export const SEARCH_TERMS_LIBRARY: CategorySearchConfig[] = [
  // ==========================================
  // TABLOLAR
  // ==========================================
  {
    categoryId: 'cable-section',
    categoryName: 'Kablo Kesit Tablosu',
    description: 'Wire gauge, AWG, cross section tables',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'wire gauge AWG table', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'cable cross section mm2', fileType: 'png' },
      { priority: 3, type: 'wikimedia_category', query: 'Electrical_wiring_diagrams' },
      { priority: 4, type: 'google', query: 'wire gauge ampacity chart table' },
    ],
    excludeTerms: ['buy', 'shop', 'price', 'amazon'],
    minWidth: 400
  },
  {
    categoryId: 'current-capacity',
    categoryName: 'Akım Taşıma Kapasitesi',
    description: 'Ampacity tables, current rating charts',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'ampacity table', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'current carrying capacity wire' },
      { priority: 3, type: 'wikimedia_category', query: 'Electrical_engineering_diagrams' },
      { priority: 4, type: 'google', query: 'cable ampacity chart AWG mm2' },
    ],
    minWidth: 400
  },
  {
    categoryId: 'voltage-drop',
    categoryName: 'Gerilim Düşümü Tablosu',
    description: 'Voltage drop calculation charts',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'voltage drop formula', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'voltage divider circuit' },
      { priority: 3, type: 'wikimedia_category', query: 'Electrical_circuits' },
      { priority: 4, type: 'google', query: 'voltage drop calculation table chart' },
    ],
    minWidth: 300
  },
  {
    categoryId: 'fuse-selection',
    categoryName: 'Sigorta Seçim Tablosu',
    description: 'Fuse and circuit breaker selection',
    strategies: [
      { priority: 1, type: 'wikimedia_category', query: 'Circuit_breakers' },
      { priority: 2, type: 'wikimedia_search', query: 'circuit breaker symbol', fileType: 'svg' },
      { priority: 3, type: 'wikimedia_search', query: 'fuse symbol electrical' },
      { priority: 4, type: 'google', query: 'MCB selection chart ampere rating' },
    ],
    minWidth: 200
  },
  {
    categoryId: 'cable-colors',
    categoryName: 'Kablo Renk Kodları',
    description: 'Wire color codes IEC standard',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'wire color code IEC', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'cable colour standard' },
      { priority: 3, type: 'wikimedia_category', query: 'Electrical_wiring' },
      { priority: 4, type: 'google', query: 'electrical wire color code chart international' },
    ],
    minWidth: 300
  },

  // ==========================================
  // SEMBOLLER
  // ==========================================
  {
    categoryId: 'installation-symbols',
    categoryName: 'Elektrik Tesisat Sembolleri',
    description: 'IEC 60617 electrical installation symbols',
    strategies: [
      { priority: 1, type: 'wikimedia_category', query: 'IEC_60617' },
      { priority: 2, type: 'wikimedia_search', query: 'electrical symbol IEC 60617', fileType: 'svg' },
      { priority: 3, type: 'wikimedia_category', query: 'Electrical_symbols' },
      { priority: 4, type: 'wikimedia_search', query: 'resistor capacitor inductor symbol', fileType: 'svg' },
    ],
    minWidth: 100
  },
  {
    categoryId: 'single-line-symbols',
    categoryName: 'Tek Hat Şeması Sembolleri',
    description: 'Single line diagram symbols - transformer, breaker, busbar',
    strategies: [
      { priority: 1, type: 'wikimedia_category', query: 'One-line_diagrams' },
      { priority: 2, type: 'wikimedia_search', query: 'transformer symbol electrical', fileType: 'svg' },
      { priority: 3, type: 'wikimedia_search', query: 'single line diagram symbol', fileType: 'svg' },
      { priority: 4, type: 'wikimedia_search', query: 'busbar circuit breaker symbol' },
    ],
    minWidth: 100
  },
  {
    categoryId: 'panel-symbols',
    categoryName: 'Pano Sembolleri',
    description: 'Switchboard and panel schematic symbols',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'contactor symbol', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'circuit breaker symbol', fileType: 'svg' },
      { priority: 3, type: 'wikimedia_category', query: 'Electrical_symbols' },
      { priority: 4, type: 'google', query: 'electrical panel schematic symbols IEC' },
    ],
    minWidth: 100
  },
  {
    categoryId: 'protection-symbols',
    categoryName: 'Koruma Cihazları Sembolleri',
    description: 'Protection relay, overload, fuse symbols',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'relay symbol electrical', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'overload protection symbol', fileType: 'svg' },
      { priority: 3, type: 'wikimedia_search', query: 'fuse symbol', fileType: 'svg' },
      { priority: 4, type: 'wikimedia_category', query: 'Electrical_symbols' },
    ],
    minWidth: 100
  },

  // ==========================================
  // ŞEMALAR
  // ==========================================
  {
    categoryId: 'single-line',
    categoryName: 'Tek Hat Şeması Örnekleri',
    description: 'Single line diagrams, one-line diagrams',
    strategies: [
      { priority: 1, type: 'wikimedia_category', query: 'One-line_diagrams' },
      { priority: 2, type: 'wikimedia_search', query: 'single line diagram electrical' },
      { priority: 3, type: 'wikimedia_search', query: 'power distribution one line' },
      { priority: 4, type: 'google', query: 'electrical single line diagram SLD example' },
    ],
    minWidth: 500
  },
  {
    categoryId: 'panel-wiring',
    categoryName: 'Pano İç Bağlantı Şeması',
    description: 'Distribution board wiring, panel internal connections',
    strategies: [
      { priority: 1, type: 'wikimedia_category', query: 'Wiring_diagrams' },
      { priority: 2, type: 'wikimedia_search', query: 'distribution board wiring' },
      { priority: 3, type: 'wikimedia_search', query: 'electrical panel internal' },
      { priority: 4, type: 'google', query: 'switchboard wiring diagram schematic' },
    ],
    minWidth: 400
  },
  {
    categoryId: 'grounding',
    categoryName: 'Topraklama Şeması',
    description: 'Earthing systems TN TT IT diagrams',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'TN-S earthing system', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'TT earthing system', fileType: 'svg' },
      { priority: 3, type: 'wikimedia_search', query: 'IT earthing grounding', fileType: 'svg' },
      { priority: 4, type: 'wikimedia_category', query: 'Earthing_system' },
    ],
    minWidth: 300
  },
  {
    categoryId: 'compensation',
    categoryName: 'Kompanzasyon Şeması',
    description: 'Power factor correction, capacitor bank',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'power factor correction capacitor', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'capacitor bank diagram' },
      { priority: 3, type: 'wikimedia_category', query: 'Capacitors' },
      { priority: 4, type: 'google', query: 'reactive power compensation diagram schematic' },
    ],
    minWidth: 300
  },
  {
    categoryId: 'motor-control',
    categoryName: 'Motor Kumanda Devresi',
    description: 'Star delta, DOL starter, motor control circuits',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'star delta starter', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'DOL starter motor', fileType: 'svg' },
      { priority: 3, type: 'wikimedia_search', query: 'three phase motor winding' },
      { priority: 4, type: 'wikimedia_category', query: 'Motor_control_circuits' },
    ],
    minWidth: 300
  },

  // ==========================================
  // TESİSAT
  // ==========================================
  {
    categoryId: 'lighting-circuit',
    categoryName: 'Aydınlatma Devresi',
    description: 'Light switch wiring, two-way switch',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'light switch wiring diagram', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'two way switch circuit', fileType: 'svg' },
      { priority: 3, type: 'wikimedia_category', query: 'Electrical_installations' },
      { priority: 4, type: 'google', query: 'lighting circuit diagram wiring schematic' },
    ],
    minWidth: 300
  },
  {
    categoryId: 'socket-circuit',
    categoryName: 'Priz Devresi',
    description: 'Socket outlet wiring, receptacle circuit',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'socket outlet wiring', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'electrical outlet diagram' },
      { priority: 3, type: 'wikimedia_category', query: 'Electrical_installations' },
      { priority: 4, type: 'google', query: 'power outlet receptacle wiring diagram' },
    ],
    minWidth: 250
  },
  {
    categoryId: 'rcd-circuit',
    categoryName: 'Kaçak Akım Koruma',
    description: 'RCD RCCB GFCI wiring diagrams',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'RCD residual current device', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'RCCB wiring diagram' },
      { priority: 3, type: 'wikimedia_search', query: 'ground fault circuit interrupter' },
      { priority: 4, type: 'wikimedia_category', query: 'Circuit_diagrams' },
    ],
    minWidth: 250
  },
  {
    categoryId: 'surge-protection',
    categoryName: 'Parafudr Bağlantısı',
    description: 'Surge protector SPD lightning arrester',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'surge protector SPD', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'lightning arrester symbol' },
      { priority: 3, type: 'wikimedia_search', query: 'overvoltage protection' },
      { priority: 4, type: 'google', query: 'SPD surge protection device wiring Type 1 2' },
    ],
    minWidth: 200
  },

  // ==========================================
  // GÜVENLİK
  // ==========================================
  {
    categoryId: 'warning-signs',
    categoryName: 'Elektrik Uyarı İşaretleri',
    description: 'High voltage warning signs ISO 7010',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'ISO 7010 W012 electricity', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'high voltage warning sign', fileType: 'svg' },
      { priority: 3, type: 'wikimedia_category', query: 'ISO_7010_warning_signs' },
      { priority: 4, type: 'wikimedia_search', query: 'electrical hazard symbol yellow' },
    ],
    minWidth: 150
  },
  {
    categoryId: 'safety-symbols',
    categoryName: 'İş Güvenliği Sembolleri',
    description: 'ISO 7010 safety symbols prohibition mandatory',
    strategies: [
      { priority: 1, type: 'wikimedia_category', query: 'ISO_7010_mandatory_signs' },
      { priority: 2, type: 'wikimedia_category', query: 'ISO_7010_prohibition_signs' },
      { priority: 3, type: 'wikimedia_search', query: 'safety symbol ISO 7010', fileType: 'svg' },
      { priority: 4, type: 'google', query: 'workplace safety signs symbols ISO' },
    ],
    minWidth: 100
  },
  {
    categoryId: 'ppe',
    categoryName: 'Kişisel Koruyucu Donanım',
    description: 'PPE symbols - gloves, boots, helmet, goggles',
    strategies: [
      { priority: 1, type: 'wikimedia_search', query: 'ISO 7010 M009 gloves', fileType: 'svg' },
      { priority: 2, type: 'wikimedia_search', query: 'ISO 7010 M004 eye protection', fileType: 'svg' },
      { priority: 3, type: 'wikimedia_search', query: 'ISO 7010 M008 safety footwear', fileType: 'svg' },
      { priority: 4, type: 'wikimedia_category', query: 'ISO_7010_mandatory_signs' },
    ],
    minWidth: 100
  }
];

// Kategori ID'ye göre arama konfigürasyonu getir
export const getSearchConfig = (categoryId: string): CategorySearchConfig | undefined => {
  return SEARCH_TERMS_LIBRARY.find(c => c.categoryId === categoryId);
};

// Tüm kategori ID'lerini getir
export const getAllCategoryIds = (): string[] => {
  return SEARCH_TERMS_LIBRARY.map(c => c.categoryId);
};