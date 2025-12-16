/**
 * Technical Terms Validation Service
 * Elektrik tesisat terminolojisi doğrulama ve düzeltme
 */

// ============================================
// YANLIŞ KULLANIM TESPİTİ VE DÜZELTMESİ
// ============================================

interface TermCorrection {
  wrong: RegExp;
  correct: string;
  context?: string; // Hangi bağlamda yanlış
}

/**
 * Bağlam dışı kullanılan terimler ve düzeltmeleri
 */
const CONTEXT_CORRECTIONS: TermCorrection[] = [
  // Komütatör - sadece DC motorlarda kullanılır, aydınlatmada YANLIŞ
  {
    wrong: /komütatör(lü|le|ler|den|e|ün|ü)?\s*(anahtar|devre|aydınlatma|lamba)/gi,
    correct: 'vaviyen $2',
    context: 'Komütatör DC motor parçasıdır, aydınlatma anahtarlamasında vaviyen kullanılır'
  },
  {
    wrong: /komütatör\s*(bağlantı|şema)/gi,
    correct: 'vaviyen $1',
    context: 'Aydınlatma devre şemalarında vaviyen kullanılır'
  },
  
  // Yanlış terim: "komütatörlü aydınlatma" → "vaviyen devre"
  {
    wrong: /komütatörlü\s*aydınlatma/gi,
    correct: 'vaviyen aydınlatma devresi',
    context: 'Komütatör aydınlatmada kullanılmaz'
  },
];

/**
 * Yazım hataları düzeltmeleri
 */
const SPELLING_CORRECTIONS: [RegExp, string][] = [
  // Vaviyen yazım hataları
  [/\bvavien\b/gi, 'vaviyen'],
  [/\bvavyen\b/gi, 'vaviyen'],
  [/\bvaviyen\b/gi, 'vaviyen'], // Doğru hali (normalize)
  [/\bva-et-vien\b/gi, 'va-et-vient'],
  [/\bvaevien\b/gi, 'vaviyen'],
  
  // Permütatör yazım hataları
  [/\bpermutator\b/gi, 'permütatör'],
  [/\bpermutatör\b/gi, 'permütatör'],
  [/\bpermütator\b/gi, 'permütatör'],
  [/\bpermitatör\b/gi, 'permütatör'],
  
  // Komütatör yazım hataları
  [/\bkomutator\b/gi, 'komütatör'],
  [/\bkomutatör\b/gi, 'komütatör'],
  [/\bkommütatör\b/gi, 'komütatör'],
  
  // Diğer yaygın yazım hataları
  [/\bkontaktör\b/gi, 'kontaktör'], // Normalize
  [/\bkontaktor\b/gi, 'kontaktör'],
  [/\bkontaktür\b/gi, 'kontaktör'],
  
  [/\btermik\s*röle\b/gi, 'termik röle'],
  [/\btermal\s*röle\b/gi, 'termik röle'],
  
  [/\botomat\b/gi, 'otomatik sigorta'],
  [/\bşalter\b/gi, 'şalter'], // Normalize
  [/\bsalter\b/gi, 'şalter'],
  
  [/\bdiazed\b/gi, 'Diazed'],
  [/\bneozed\b/gi, 'Neozed'],
  
  [/\btopraklama\b/gi, 'topraklama'], // Normalize
  [/\btoprak\s*hattı\b/gi, 'topraklama hattı'],
  
  [/\bnötr\b/gi, 'nötr'], // Normalize
  [/\bnotr\b/gi, 'nötr'],
  [/\bnötür\b/gi, 'nötr'],
  
  [/\bfaz\b/gi, 'faz'], // Normalize
  [/\bfas\b/gi, 'faz'],
  
  // Ölçü aletleri
  [/\bmultimetre\b/gi, 'multimetre'],
  [/\bmultimete\b/gi, 'multimetre'],
  [/\bavometre\b/gi, 'avometre'],
  
  [/\bampermetre\b/gi, 'ampermetre'],
  [/\bamper\s*metre\b/gi, 'ampermetre'],
  
  [/\bvoltmetre\b/gi, 'voltmetre'],
  [/\bvolt\s*metre\b/gi, 'voltmetre'],
  
  [/\bmegger\b/gi, 'megger'],
  [/\bmeger\b/gi, 'megger'],
  [/\bmeğer\b/gi, 'megger'],
  
  // Kablo tipleri
  [/\bNYA\b/g, 'NYA'],
  [/\bnya\b/g, 'NYA'],
  [/\bNYM\b/g, 'NYM'],
  [/\bnym\b/g, 'NYM'],
  [/\bNYY\b/g, 'NYY'],
  [/\bnyy\b/g, 'NYY'],
  [/\bTTR\b/g, 'TTR'],
  [/\bttr\b/g, 'TTR'],
  
  // Pano terimleri
  [/\bAG\s*pano\b/gi, 'AG pano'],
  [/\bOG\s*pano\b/gi, 'OG pano'],
  [/\bkompanzasyon\b/gi, 'kompanzasyon'],
  [/\bkompazasyon\b/gi, 'kompanzasyon'],
  
  // Diğer
  [/\binverter\b/gi, 'inverter'],
  [/\binvertör\b/gi, 'inverter'],
  [/\bfrekans\s*konvertör\b/gi, 'frekans dönüştürücü'],
  [/\bsürücü\b/gi, 'sürücü'],
  [/\bsurucu\b/gi, 'sürücü'],
];

/**
 * Doğru terim kullanımı rehberi (System Prompt için)
 */
export const TECHNICAL_TERMS_GUIDE = `
TESİSAT TERİMLERİ KULLANIM REHBERİ:

AYDINLATMA ANAHTARLAMA TERİMLERİ:
- Anahtar: Tek noktadan açma/kapama (basit anahtar)
- Vaviyen (va-et-vient): İKİ noktadan kontrol (merdiven, koridor)
- Permütatör: ÜÇ veya daha fazla noktadan kontrol
- Komütatör: SADECE DC motorlarda kullanılır, AYDINLATMADA KULLANILMAZ!

DOĞRU KULLANIM ÖRNEKLERİ:
✓ "Merdiven aydınlatması için vaviyen devre kuruldu"
✓ "Koridor iki uçtan kontrol için vaviyen bağlantı yapıldı"
✓ "Üç noktadan kontrol için permütatör devresi çizildi"
✗ "Komütatörlü aydınlatma devresi" (YANLIŞ - komütatör motor parçasıdır)

KORUMA EKİPMANLARI:
- MCB (Minyatür Devre Kesici): Kısa devre ve aşırı akım koruması
- Termik Röle: Motor aşırı akım koruması (termal röle DEĞİL)
- Kaçak Akım Rölesi (KAR): 30mA hassasiyetli can güvenliği
- Topraklama: TN-S, TN-C-S, TT sistemleri

KABLO TİPLERİ (büyük harfle yazılır):
- NYA: Tek damarlı, sert, PVC izoleli
- NYM: Çok damarlı, sert, PVC kılıflı
- NYY: Yeraltı kablosu, PVC izoleli ve kılıflı
- TTR: Çok damarlı, esnek, bükülgen
- NHXMH: Halojen free, yangın dayanımlı

Bu terimleri DOĞRU bağlamda kullan. Komütatörü aydınlatma devrelerinde ASLA kullanma.
`;

/**
 * İçerikte bağlam dışı terim kullanımını düzeltir
 */
export const correctContextualTerms = (content: string): string => {
  let corrected = content;
  
  for (const correction of CONTEXT_CORRECTIONS) {
    if (correction.wrong.test(corrected)) {
      console.log(`[TermCorrection] Bağlam hatası düzeltildi: ${correction.context}`);
      corrected = corrected.replace(correction.wrong, correction.correct);
    }
  }
  
  return corrected;
};

/**
 * Yazım hatalarını düzeltir
 */
export const correctSpelling = (content: string): string => {
  let corrected = content;
  
  for (const [wrong, correct] of SPELLING_CORRECTIONS) {
    corrected = corrected.replace(wrong, correct);
  }
  
  return corrected;
};

/**
 * Tüm teknik düzeltmeleri uygular
 */
export const validateAndCorrectContent = (content: string): {
  corrected: string;
  hasCorrections: boolean;
  corrections: string[];
} => {
  const corrections: string[] = [];
  let result = content;
  
  // 1. Bağlam düzeltmeleri
  for (const correction of CONTEXT_CORRECTIONS) {
    if (correction.wrong.test(result)) {
      corrections.push(correction.context || 'Bağlam hatası düzeltildi');
      result = result.replace(correction.wrong, correction.correct);
    }
  }
  
  // 2. Yazım düzeltmeleri
  const beforeSpelling = result;
  result = correctSpelling(result);
  
  if (beforeSpelling !== result) {
    corrections.push('Yazım hataları düzeltildi');
  }
  
  return {
    corrected: result,
    hasCorrections: corrections.length > 0,
    corrections
  };
};

/**
 * Belirli bir terimin doğru kullanılıp kullanılmadığını kontrol eder
 */
export const checkTermUsage = (content: string, term: string): {
  isCorrect: boolean;
  suggestion?: string;
} => {
  const termLower = term.toLowerCase();
  
  // Komütatör kontrolü
  if (termLower === 'komütatör') {
    const wrongContext = /komütatör.*(aydınlatma|anahtar|lamba|devre|merdiven|koridor)/i;
    if (wrongContext.test(content)) {
      return {
        isCorrect: false,
        suggestion: 'Aydınlatma devrelerinde "vaviyen" veya "permütatör" kullanın. Komütatör sadece DC motorlarda kullanılır.'
      };
    }
  }
  
  return { isCorrect: true };
};