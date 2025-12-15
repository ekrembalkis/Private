/**
 * Electrical Engineering Internship Curriculum
 * 30-Day Progressive Learning Plan
 * 
 * Structure: 6 Weeks, 5 working days each
 * Ratio: 20 Production/Design days, 10 Management days
 */

import { InternshipType } from './types';
import { Curriculum, WeekTheme, CurriculumDay, SkillLevel } from './curriculumTypes';

// ============================================
// WEEK THEMES
// ============================================

export const WEEK_THEMES: WeekTheme[] = [
  {
    weekNumber: 1,
    title: 'Oryantasyon ve Temel Güvenlik',
    titleEN: 'Orientation and Basic Safety',
    description: 'İşyeri tanıtımı, iş güvenliği kuralları, temel el aletleri ve ölçüm cihazları',
    focus: ['İş güvenliği', 'El aletleri', 'Temel ölçüm', 'İşyeri düzeni'],
    expectedSkillLevel: 'beginner'
  },
  {
    weekNumber: 2,
    title: 'Temel Elektrik Uygulamaları',
    titleEN: 'Basic Electrical Applications',
    description: 'Basit devre kurulumları, kablo tanıma, temel bağlantı teknikleri',
    focus: ['Kablo tipleri', 'Basit bağlantılar', 'Aydınlatma devreleri', 'Priz montajı'],
    expectedSkillLevel: 'beginner'
  },
  {
    weekNumber: 3,
    title: 'Proje Okuma ve AutoCAD',
    titleEN: 'Project Reading and AutoCAD',
    description: 'Elektrik proje çizimleri okuma, AutoCAD temelleri, sembol tanıma',
    focus: ['Proje okuma', 'Elektrik sembolleri', 'AutoCAD', 'Tek hat şeması'],
    expectedSkillLevel: 'intermediate'
  },
  {
    weekNumber: 4,
    title: 'Pano Montajı ve Kablolama',
    titleEN: 'Panel Assembly and Wiring',
    description: 'Elektrik panoları, şalt malzemeler, kablolama teknikleri',
    focus: ['Pano montajı', 'Şalt malzemeler', 'Kablolama', 'Etiketleme'],
    expectedSkillLevel: 'intermediate'
  },
  {
    weekNumber: 5,
    title: 'İleri Uygulamalar',
    titleEN: 'Advanced Applications',
    description: 'Kompanzasyon, motor sürücüler, otomasyon sistemleri',
    focus: ['Kompanzasyon', 'Motor sürücü', 'PLC temelleri', 'Arıza tespiti'],
    expectedSkillLevel: 'intermediate'
  },
  {
    weekNumber: 6,
    title: 'Proje Katılımı ve Değerlendirme',
    titleEN: 'Project Participation and Evaluation',
    description: 'Gerçek projelere katılım, bağımsız çalışma, staj değerlendirmesi',
    focus: ['Proje katılımı', 'Bağımsız çalışma', 'Raporlama', 'Değerlendirme'],
    expectedSkillLevel: 'advanced'
  }
];

// ============================================
// 30-DAY CURRICULUM
// ============================================

export const CURRICULUM_DAYS: CurriculumDay[] = [
  // ========== WEEK 1: Orientation and Basic Safety ==========
  {
    dayNumber: 1,
    weekNumber: 1,
    type: InternshipType.MANAGEMENT,
    primaryTopic: 'İşyeri oryantasyonu ve güvenlik eğitimi',
    primaryTopicEN: 'Workplace orientation and safety training',
    alternativeTopics: [
      'Firma tanıtımı ve organizasyon yapısı',
      'İş sağlığı güvenliği temel eğitimi'
    ],
    objectives: [
      'İşyeri yerleşim planını öğrenmek',
      'Güvenlik kurallarını anlamak',
      'Acil durum prosedürlerini bilmek'
    ],
    objectivesEN: [
      'Learn workplace layout',
      'Understand safety rules',
      'Know emergency procedures'
    ],
    prerequisiteDays: [],
    skillsToLearn: ['İşyeri oryantasyonu', 'Temel İSG bilgisi'],
    toolsToUse: ['KKD tanıtımı'],
    difficulty: 1,
    isKeyMilestone: true,
    suggestedActivities: [
      'İşyeri turu',
      'Güvenlik videosu izleme',
      'KKD tanıtımı',
      'Acil çıkış noktalarını öğrenme'
    ],
    avoidTopics: [],
    buildUponTopics: [],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'İşyeri genel görünümü veya güvenlik panosu'
  },
  {
    dayNumber: 2,
    weekNumber: 1,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Temel el aletleri tanıtımı ve kullanımı',
    primaryTopicEN: 'Basic hand tools introduction and usage',
    alternativeTopics: [
      'Elektrikçi el aletleri seti tanıtımı',
      'Alet bakımı ve güvenli kullanım'
    ],
    objectives: [
      'Temel el aletlerini tanımak',
      'Güvenli kullanım tekniklerini öğrenmek',
      'Alet bakımını kavramak'
    ],
    objectivesEN: [
      'Identify basic hand tools',
      'Learn safe usage techniques',
      'Understand tool maintenance'
    ],
    prerequisiteDays: [1],
    skillsToLearn: ['Pense kullanımı', 'Tornavida çeşitleri', 'Yan keski kullanımı'],
    toolsToUse: ['Pense', 'Yan keski', 'Tornavida seti', 'Kablo soyucu'],
    difficulty: 1,
    isKeyMilestone: false,
    suggestedActivities: [
      'Alet tanıtım eğitimi',
      'Pratik kablo soyma',
      'Aletlerin bakımı'
    ],
    avoidTopics: [],
    buildUponTopics: ['güvenlik kuralları'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Elektrikçi alet seti veya kablo soyma işlemi'
  },
  {
    dayNumber: 3,
    weekNumber: 1,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Ölçü aletleri: Multimetre kullanımı',
    primaryTopicEN: 'Measuring instruments: Multimeter usage',
    alternativeTopics: [
      'Dijital multimetre ile temel ölçümler',
      'Gerilim, akım ve direnç ölçümü'
    ],
    objectives: [
      'Multimetre fonksiyonlarını öğrenmek',
      'Güvenli ölçüm yapmak',
      'Ölçüm sonuçlarını yorumlamak'
    ],
    objectivesEN: [
      'Learn multimeter functions',
      'Perform safe measurements',
      'Interpret measurement results'
    ],
    prerequisiteDays: [1, 2],
    skillsToLearn: ['Gerilim ölçümü', 'Akım ölçümü', 'Direnç ölçümü', 'Süreklilik testi'],
    toolsToUse: ['Dijital multimetre', 'Test kabloları'],
    difficulty: 2,
    isKeyMilestone: true,
    suggestedActivities: [
      'Multimetre tanıtımı',
      'Pil gerilimi ölçme',
      'Kablo sürekliliği testi',
      'Direnç ölçümü'
    ],
    avoidTopics: [],
    buildUponTopics: ['el aletleri', 'güvenlik'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Multimetre ile ölçüm yapılırken'
  },
  {
    dayNumber: 4,
    weekNumber: 1,
    type: InternshipType.MANAGEMENT,
    primaryTopic: 'Depo organizasyonu ve malzeme tanıma',
    primaryTopicEN: 'Warehouse organization and material identification',
    alternativeTopics: [
      'Elektrik malzemelerinin sınıflandırılması',
      'Stok takibi ve depo düzeni'
    ],
    objectives: [
      'Temel elektrik malzemelerini tanımak',
      'Depo düzenini öğrenmek',
      'Stok takip sistemini anlamak'
    ],
    objectivesEN: [
      'Identify basic electrical materials',
      'Learn warehouse layout',
      'Understand inventory tracking'
    ],
    prerequisiteDays: [1],
    skillsToLearn: ['Malzeme tanıma', 'Stok takibi', 'Depo organizasyonu'],
    toolsToUse: ['Stok takip sistemi', 'Etiketleme malzemeleri'],
    difficulty: 1,
    isKeyMilestone: false,
    suggestedActivities: [
      'Depo turu',
      'Kablo tiplerini tanıma',
      'Malzeme etiketleme',
      'Stok sayımı'
    ],
    avoidTopics: [],
    buildUponTopics: ['işyeri oryantasyonu'],
    suggestVisual: false
  },
  {
    dayNumber: 5,
    weekNumber: 1,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Kablo tipleri ve kesit hesabı temelleri',
    primaryTopicEN: 'Cable types and cross-section calculation basics',
    alternativeTopics: [
      'NYM, NYY, NHXMH kablo tanıtımı',
      'Kablo renk kodları ve kullanım alanları'
    ],
    objectives: [
      'Kablo tiplerini ayırt etmek',
      'Renk kodlarını öğrenmek',
      'Kesit seçimi mantığını anlamak'
    ],
    objectivesEN: [
      'Distinguish cable types',
      'Learn color codes',
      'Understand cross-section selection logic'
    ],
    prerequisiteDays: [2, 3, 4],
    skillsToLearn: ['Kablo tanıma', 'Renk kodları', 'Kesit hesabı temelleri'],
    toolsToUse: ['Kablo örnekleri', 'Kesit kataloğu'],
    difficulty: 2,
    isKeyMilestone: true,
    suggestedActivities: [
      'Kablo tiplerini inceleme',
      'Renk kodu eğitimi',
      'Katalog okuma',
      'Basit kesit hesabı'
    ],
    avoidTopics: [],
    buildUponTopics: ['depo malzemeleri', 'el aletleri'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Farklı kablo tipleri yan yana'
  },

  // ========== WEEK 2: Basic Electrical Applications ==========
  {
    dayNumber: 6,
    weekNumber: 2,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Basit aydınlatma devresi kurulumu',
    primaryTopicEN: 'Simple lighting circuit installation',
    alternativeTopics: [
      'Tek kutuplu anahtar ile lamba kontrolü',
      'Aydınlatma devresi bağlantıları'
    ],
    objectives: [
      'Basit devre şemasını okumak',
      'Anahtar ve duy bağlantısı yapmak',
      'Devreyi test etmek'
    ],
    objectivesEN: [
      'Read simple circuit diagram',
      'Connect switch and socket',
      'Test the circuit'
    ],
    prerequisiteDays: [2, 3, 5],
    skillsToLearn: ['Devre kurulumu', 'Anahtar bağlantısı', 'Duy montajı'],
    toolsToUse: ['Tornavida', 'Pense', 'Kablo soyucu', 'Multimetre'],
    difficulty: 2,
    isKeyMilestone: false,
    suggestedActivities: [
      'Devre şeması okuma',
      'Kablo hazırlama',
      'Bağlantı yapma',
      'Test ve kontrol'
    ],
    avoidTopics: ['pano montajı', 'kompanzasyon'],
    buildUponTopics: ['kablo tipleri', 'multimetre kullanımı', 'el aletleri'],
    suggestVisual: true,
    visualType: 'schematic',
    visualDescription: 'Basit aydınlatma devresi şeması'
  },
  {
    dayNumber: 7,
    weekNumber: 2,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Priz montajı ve topraklama bağlantısı',
    primaryTopicEN: 'Socket installation and grounding connection',
    alternativeTopics: [
      'Sıva üstü ve sıva altı priz montajı',
      'Topraklama hattı bağlantısı'
    ],
    objectives: [
      'Priz montaj tekniklerini öğrenmek',
      'Topraklama önemini kavramak',
      'Güvenli bağlantı yapmak'
    ],
    objectivesEN: [
      'Learn socket installation techniques',
      'Understand grounding importance',
      'Make safe connections'
    ],
    prerequisiteDays: [5, 6],
    skillsToLearn: ['Priz montajı', 'Topraklama bağlantısı', 'Sıva altı kutu'],
    toolsToUse: ['Tornavida', 'Su terazisi', 'Kablo soyucu'],
    difficulty: 2,
    isKeyMilestone: false,
    suggestedActivities: [
      'Priz tiplerini inceleme',
      'Montaj uygulaması',
      'Topraklama testi',
      'Kalite kontrolü'
    ],
    avoidTopics: ['pano', 'otomasyon'],
    buildUponTopics: ['aydınlatma devresi', 'kablo tipleri'],
    suggestVisual: false
  },
  {
    dayNumber: 8,
    weekNumber: 2,
    type: InternshipType.MANAGEMENT,
    primaryTopic: 'Malzeme listesi hazırlama ve sipariş süreci',
    primaryTopicEN: 'Material list preparation and ordering process',
    alternativeTopics: [
      'Proje bazlı malzeme çıkarma',
      'Tedarikçi iletişimi'
    ],
    objectives: [
      'Malzeme listesi formatını öğrenmek',
      'Metraj hesabını anlamak',
      'Sipariş sürecini kavramak'
    ],
    objectivesEN: [
      'Learn material list format',
      'Understand quantity calculation',
      'Grasp ordering process'
    ],
    prerequisiteDays: [4, 5],
    skillsToLearn: ['Malzeme listesi', 'Metraj hesabı', 'Sipariş takibi'],
    toolsToUse: ['Excel/Hesap tablosu', 'Proje dosyası'],
    difficulty: 2,
    isKeyMilestone: false,
    suggestedActivities: [
      'Örnek proje inceleme',
      'Malzeme listesi hazırlama',
      'Fiyat teklifi isteme',
      'Sipariş formülasyonu'
    ],
    avoidTopics: [],
    buildUponTopics: ['depo organizasyonu', 'kablo tipleri'],
    suggestVisual: false
  },
  {
    dayNumber: 9,
    weekNumber: 2,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Komütatör ve vaevien devre uygulaması',
    primaryTopicEN: 'Two-way and intermediate switch circuit application',
    alternativeTopics: [
      'Merdiven otomatiği devresi',
      'Çoklu nokta aydınlatma kontrolü'
    ],
    objectives: [
      'Komütatör mantığını anlamak',
      'Vaevien bağlantısı yapmak',
      'Devre testini gerçekleştirmek'
    ],
    objectivesEN: [
      'Understand two-way switch logic',
      'Make intermediate switch connection',
      'Perform circuit testing'
    ],
    prerequisiteDays: [6, 7],
    skillsToLearn: ['Komütatör bağlantısı', 'Vaevien devresi', 'Çoklu kontrol'],
    toolsToUse: ['Tornavida', 'Multimetre', 'Komütatör anahtarlar'],
    difficulty: 3,
    isKeyMilestone: false,
    suggestedActivities: [
      'Devre şeması çizimi',
      'Bağlantı uygulaması',
      'Fonksiyon testi',
      'Hata analizi'
    ],
    avoidTopics: ['PLC', 'otomasyon'],
    buildUponTopics: ['aydınlatma devresi', 'priz montajı'],
    suggestVisual: true,
    visualType: 'schematic',
    visualDescription: 'Komütatör veya vaevien devre şeması'
  },
  {
    dayNumber: 10,
    weekNumber: 2,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Kablo tavası ve boru tesisatı montajı',
    primaryTopicEN: 'Cable tray and conduit installation',
    alternativeTopics: [
      'Sıva altı boru döşeme',
      'Kablo kanalı montajı'
    ],
    objectives: [
      'Kablo taşıma sistemlerini tanımak',
      'Montaj tekniklerini öğrenmek',
      'Standartlara uygun çalışmak'
    ],
    objectivesEN: [
      'Identify cable support systems',
      'Learn installation techniques',
      'Work according to standards'
    ],
    prerequisiteDays: [5, 6, 7],
    skillsToLearn: ['Kablo tavası montajı', 'Boru döşeme', 'Kanal sistemi'],
    toolsToUse: ['Matkap', 'Dübel ve vida', 'Su terazisi', 'Metre'],
    difficulty: 3,
    isKeyMilestone: true,
    suggestedActivities: [
      'Güzergah belirleme',
      'Montaj malzemesi hazırlığı',
      'Tava/boru montajı',
      'Kablo çekme'
    ],
    avoidTopics: ['pano iç montajı'],
    buildUponTopics: ['kablo tipleri', 'el aletleri'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Kablo tavası veya boru tesisatı montajı'
  },

  // ========== WEEK 3: Project Reading and AutoCAD ==========
  {
    dayNumber: 11,
    weekNumber: 3,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Elektrik proje çizimi okuma temelleri',
    primaryTopicEN: 'Electrical project drawing reading basics',
    alternativeTopics: [
      'Elektrik sembolleri ve gösterimleri',
      'Aydınlatma ve kuvvet planları'
    ],
    objectives: [
      'Temel elektrik sembollerini tanımak',
      'Plan ve kesit okumak',
      'Proje notlarını anlamak'
    ],
    objectivesEN: [
      'Identify basic electrical symbols',
      'Read plans and sections',
      'Understand project notes'
    ],
    prerequisiteDays: [5, 6, 10],
    skillsToLearn: ['Sembol okuma', 'Plan okuma', 'Kesit yorumlama'],
    toolsToUse: ['Proje paftaları', 'Sembol kataloğu'],
    difficulty: 3,
    isKeyMilestone: true,
    suggestedActivities: [
      'Sembol eğitimi',
      'Örnek proje inceleme',
      'Plan üzerinde çalışma',
      'Soru-cevap'
    ],
    avoidTopics: ['AutoCAD çizim'],
    buildUponTopics: ['kablo tipleri', 'devre kurulumu'],
    suggestVisual: true,
    visualType: 'diagram',
    visualDescription: 'Elektrik proje paftası veya sembol tablosu'
  },
  {
    dayNumber: 12,
    weekNumber: 3,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'AutoCAD elektrik çizim ortamı tanıtımı',
    primaryTopicEN: 'AutoCAD electrical drawing environment introduction',
    alternativeTopics: [
      'AutoCAD temel komutları',
      'Elektrik şablon kullanımı'
    ],
    objectives: [
      'AutoCAD arayüzünü tanımak',
      'Temel çizim komutlarını öğrenmek',
      'Elektrik şablonlarını kullanmak'
    ],
    objectivesEN: [
      'Know AutoCAD interface',
      'Learn basic drawing commands',
      'Use electrical templates'
    ],
    prerequisiteDays: [11],
    skillsToLearn: ['AutoCAD temelleri', 'Çizim komutları', 'Şablon kullanımı'],
    toolsToUse: ['AutoCAD', 'Elektrik şablonu'],
    difficulty: 3,
    isKeyMilestone: false,
    suggestedActivities: [
      'Program tanıtımı',
      'Basit çizim egzersizleri',
      'Şablon açma',
      'Sembol yerleştirme'
    ],
    avoidTopics: ['ileri AutoCAD'],
    buildUponTopics: ['proje okuma', 'semboller'],
    suggestVisual: true,
    visualType: 'diagram',
    visualDescription: 'AutoCAD ekranı veya elektrik çizimi'
  },
  {
    dayNumber: 13,
    weekNumber: 3,
    type: InternshipType.MANAGEMENT,
    primaryTopic: 'Proje dosyası hazırlama ve arşivleme',
    primaryTopicEN: 'Project file preparation and archiving',
    alternativeTopics: [
      'Teknik dosya düzenleme',
      'Şartname ve doküman yönetimi'
    ],
    objectives: [
      'Proje dosyası içeriğini öğrenmek',
      'Arşivleme sistemini anlamak',
      'Doküman kontrolü yapmak'
    ],
    objectivesEN: [
      'Learn project file contents',
      'Understand archiving system',
      'Perform document control'
    ],
    prerequisiteDays: [8, 11],
    skillsToLearn: ['Dosyalama', 'Arşivleme', 'Doküman kontrolü'],
    toolsToUse: ['Dosyalama sistemi', 'Etiketleme malzemeleri'],
    difficulty: 2,
    isKeyMilestone: false,
    suggestedActivities: [
      'Proje dosyası inceleme',
      'Şartname okuma',
      'Arşiv düzenleme',
      'Klasörleme'
    ],
    avoidTopics: [],
    buildUponTopics: ['malzeme listesi', 'proje okuma'],
    suggestVisual: false
  },
  {
    dayNumber: 14,
    weekNumber: 3,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Tek hat şeması okuma ve yorumlama',
    primaryTopicEN: 'Single line diagram reading and interpretation',
    alternativeTopics: [
      'Ana dağıtım panosu tek hat şeması',
      'Koruma koordinasyonu temelleri'
    ],
    objectives: [
      'Tek hat şeması formatını anlamak',
      'Şalt sembolleri tanımak',
      'Koruma elemanlarını yorumlamak'
    ],
    objectivesEN: [
      'Understand single line format',
      'Identify switchgear symbols',
      'Interpret protection elements'
    ],
    prerequisiteDays: [11, 12],
    skillsToLearn: ['Tek hat okuma', 'Şalt sembolleri', 'Koruma koordinasyonu'],
    toolsToUse: ['Tek hat şeması örnekleri', 'Kataloglar'],
    difficulty: 4,
    isKeyMilestone: true,
    suggestedActivities: [
      'Tek hat şeması inceleme',
      'Sembol eşleştirme',
      'Akış yönü analizi',
      'Koruma seviyeleri'
    ],
    avoidTopics: ['detaylı koruma hesabı'],
    buildUponTopics: ['proje okuma', 'AutoCAD'],
    suggestVisual: true,
    visualType: 'schematic',
    visualDescription: 'Tek hat şeması örneği'
  },
  {
    dayNumber: 15,
    weekNumber: 3,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'AutoCAD ile basit aydınlatma planı çizimi',
    primaryTopicEN: 'Simple lighting plan drawing with AutoCAD',
    alternativeTopics: [
      'Oda aydınlatma projesi çizimi',
      'Armatür yerleşim planı'
    ],
    objectives: [
      'Aydınlatma planı çizmek',
      'Armatür sembolü yerleştirmek',
      'Güzergah çizgisi oluşturmak'
    ],
    objectivesEN: [
      'Draw lighting plan',
      'Place fixture symbols',
      'Create routing lines'
    ],
    prerequisiteDays: [11, 12, 14],
    skillsToLearn: ['Aydınlatma planı çizimi', 'Sembol yerleştirme', 'Katman kullanımı'],
    toolsToUse: ['AutoCAD', 'Elektrik sembol kütüphanesi'],
    difficulty: 3,
    isKeyMilestone: true,
    suggestedActivities: [
      'Mimari plan açma',
      'Armatür yerleştirme',
      'Hat çizimi',
      'Boyutlandırma'
    ],
    avoidTopics: ['hesap programları'],
    buildUponTopics: ['AutoCAD temelleri', 'tek hat şeması'],
    suggestVisual: true,
    visualType: 'diagram',
    visualDescription: 'AutoCAD aydınlatma planı çizimi'
  },

  // ========== WEEK 4: Panel Assembly and Wiring ==========
  {
    dayNumber: 16,
    weekNumber: 4,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Elektrik panosu iç yerleşim planlaması',
    primaryTopicEN: 'Electrical panel internal layout planning',
    alternativeTopics: [
      'Pano içi malzeme yerleşimi',
      'Ray ve kanal sistemi'
    ],
    objectives: [
      'Pano iç düzenini planlamak',
      'Malzeme yerleşimini öğrenmek',
      'Ergonomi kurallarını anlamak'
    ],
    objectivesEN: [
      'Plan panel internal layout',
      'Learn component placement',
      'Understand ergonomics rules'
    ],
    prerequisiteDays: [10, 14],
    skillsToLearn: ['Pano yerleşimi', 'Ray montajı', 'Kanal sistemi'],
    toolsToUse: ['Pano', 'DIN ray', 'Kablo kanalı', 'Tornavida'],
    difficulty: 3,
    isKeyMilestone: false,
    suggestedActivities: [
      'Yerleşim planı inceleme',
      'Ray montajı',
      'Kanal kesimi',
      'Malzeme yerleştirme'
    ],
    avoidTopics: ['kablolama'],
    buildUponTopics: ['tek hat şeması', 'kablo tavası'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Pano iç yerleşimi veya ray montajı'
  },
  {
    dayNumber: 17,
    weekNumber: 4,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Şalt malzemeleri: Sigorta ve şalter montajı',
    primaryTopicEN: 'Switchgear materials: Fuse and circuit breaker installation',
    alternativeTopics: [
      'Otomatik sigorta seçimi ve montajı',
      'Kaçak akım rölesi bağlantısı'
    ],
    objectives: [
      'Şalt malzemelerini tanımak',
      'Doğru montaj yapmak',
      'Etiketleme kurallarını uygulamak'
    ],
    objectivesEN: [
      'Identify switchgear materials',
      'Perform correct installation',
      'Apply labeling rules'
    ],
    prerequisiteDays: [14, 16],
    skillsToLearn: ['Sigorta montajı', 'Şalter bağlantısı', 'KAR montajı'],
    toolsToUse: ['Tornavida', 'Etiket makinesi', 'Multimetre'],
    difficulty: 3,
    isKeyMilestone: false,
    suggestedActivities: [
      'Malzeme tanıma',
      'Ray montajı',
      'Bağlantı yapma',
      'Etiketleme'
    ],
    avoidTopics: ['ayar ve test'],
    buildUponTopics: ['pano yerleşimi', 'tek hat okuma'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Pano içi şalt malzeme montajı'
  },
  {
    dayNumber: 18,
    weekNumber: 4,
    type: InternshipType.MANAGEMENT,
    primaryTopic: 'İş programı ve hakediş takibi',
    primaryTopicEN: 'Work schedule and progress payment tracking',
    alternativeTopics: [
      'Şantiye iş programı hazırlama',
      'Hakediş dosyası düzenleme'
    ],
    objectives: [
      'İş programı formatını öğrenmek',
      'Hakediş sistemini anlamak',
      'Maliyet takibi yapmak'
    ],
    objectivesEN: [
      'Learn work schedule format',
      'Understand progress payment system',
      'Track costs'
    ],
    prerequisiteDays: [8, 13],
    skillsToLearn: ['İş programı', 'Hakediş hazırlığı', 'Maliyet analizi'],
    toolsToUse: ['Excel', 'Proje yönetim yazılımı'],
    difficulty: 3,
    isKeyMilestone: false,
    suggestedActivities: [
      'İş programı inceleme',
      'Hakediş dosyası hazırlama',
      'Birim fiyat analizi',
      'Raporlama'
    ],
    avoidTopics: [],
    buildUponTopics: ['malzeme listesi', 'proje dosyası'],
    suggestVisual: false
  },
  {
    dayNumber: 19,
    weekNumber: 4,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Pano kablolama teknikleri ve bağlantılar',
    primaryTopicEN: 'Panel wiring techniques and connections',
    alternativeTopics: [
      'Pano içi kablo düzeni',
      'Klemens bağlantıları'
    ],
    objectives: [
      'Düzgün kablolama yapmak',
      'Klemens bağlantısı gerçekleştirmek',
      'Kablo numaralama sistemini uygulamak'
    ],
    objectivesEN: [
      'Perform neat wiring',
      'Make terminal connections',
      'Apply cable numbering system'
    ],
    prerequisiteDays: [16, 17],
    skillsToLearn: ['Pano kablolaması', 'Klemens bağlantısı', 'Kablo düzeni'],
    toolsToUse: ['Kablo kesici', 'Pabuç sıkma pensesi', 'Numaratör'],
    difficulty: 4,
    isKeyMilestone: true,
    suggestedActivities: [
      'Kablo hazırlığı',
      'Pabuç takma',
      'Klemens bağlantısı',
      'Düzen kontrolü'
    ],
    avoidTopics: ['test ve devreye alma'],
    buildUponTopics: ['şalt malzemeleri', 'pano yerleşimi'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Pano içi kablolama çalışması'
  },
  {
    dayNumber: 20,
    weekNumber: 4,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Pano testi ve devreye alma hazırlığı',
    primaryTopicEN: 'Panel testing and commissioning preparation',
    alternativeTopics: [
      'Görsel ve elektriksel kontroller',
      'Test prosedürü uygulama'
    ],
    objectives: [
      'Test prosedürlerini öğrenmek',
      'Görsel kontrol yapmak',
      'Ölçüm ve kayıt tutmak'
    ],
    objectivesEN: [
      'Learn test procedures',
      'Perform visual inspection',
      'Measure and record'
    ],
    prerequisiteDays: [17, 19],
    skillsToLearn: ['Pano testi', 'Görsel kontrol', 'Ölçüm raporu'],
    toolsToUse: ['Multimetre', 'Megometre', 'Test formu'],
    difficulty: 4,
    isKeyMilestone: true,
    suggestedActivities: [
      'Görsel kontrol',
      'Süreklilik testi',
      'İzolasyon ölçümü',
      'Rapor hazırlama'
    ],
    avoidTopics: [],
    buildUponTopics: ['kablolama', 'multimetre kullanımı'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Pano test ve ölçüm işlemi'
  },

  // ========== WEEK 5: Advanced Applications ==========
  {
    dayNumber: 21,
    weekNumber: 5,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Kompanzasyon sistemi ve reaktif güç',
    primaryTopicEN: 'Compensation system and reactive power',
    alternativeTopics: [
      'Güç faktörü düzeltme',
      'Kondansatör panosu inceleme'
    ],
    objectives: [
      'Reaktif güç kavramını anlamak',
      'Kompanzasyon sistemini tanımak',
      'Kondansatör panolarını incelemek'
    ],
    objectivesEN: [
      'Understand reactive power concept',
      'Know compensation system',
      'Examine capacitor panels'
    ],
    prerequisiteDays: [14, 19, 20],
    skillsToLearn: ['Reaktif güç', 'Kompanzasyon', 'Güç faktörü'],
    toolsToUse: ['Güç analizörü', 'Kompanzasyon panosu'],
    difficulty: 4,
    isKeyMilestone: false,
    suggestedActivities: [
      'Teori eğitimi',
      'Pano inceleme',
      'Ölçüm yapma',
      'Hesap kontrolü'
    ],
    avoidTopics: ['detaylı hesap'],
    buildUponTopics: ['pano testi', 'tek hat şeması'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Kompanzasyon panosu veya kondansatörler'
  },
  {
    dayNumber: 22,
    weekNumber: 5,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Motor sürücü (inverter) panosu inceleme',
    primaryTopicEN: 'Motor drive (inverter) panel examination',
    alternativeTopics: [
      'Frekans konvertörü çalışma prensibi',
      'Hız kontrol uygulamaları'
    ],
    objectives: [
      'Motor sürücü prensibini anlamak',
      'Parametre ayarlarını görmek',
      'Bağlantı şemasını incelemek'
    ],
    objectivesEN: [
      'Understand motor drive principle',
      'See parameter settings',
      'Examine wiring diagram'
    ],
    prerequisiteDays: [19, 20, 21],
    skillsToLearn: ['Motor sürücü', 'Parametre ayarı', 'Hız kontrol'],
    toolsToUse: ['Motor sürücü', 'Kullanım kılavuzu'],
    difficulty: 4,
    isKeyMilestone: false,
    suggestedActivities: [
      'Cihaz inceleme',
      'Şema okuma',
      'Parametre izleme',
      'Çalıştırma gözlemi'
    ],
    avoidTopics: ['PLC programlama'],
    buildUponTopics: ['kompanzasyon', 'pano kablolaması'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Motor sürücü (inverter) panosu'
  },
  {
    dayNumber: 23,
    weekNumber: 5,
    type: InternshipType.MANAGEMENT,
    primaryTopic: 'Teklif hazırlama ve maliyet analizi',
    primaryTopicEN: 'Quotation preparation and cost analysis',
    alternativeTopics: [
      'Birim fiyat hesaplama',
      'Rekabetçi teklif stratejisi'
    ],
    objectives: [
      'Teklif formatını öğrenmek',
      'Maliyet kalemlerini hesaplamak',
      'Kar marjı belirlemeyi anlamak'
    ],
    objectivesEN: [
      'Learn quotation format',
      'Calculate cost items',
      'Understand profit margin'
    ],
    prerequisiteDays: [8, 18],
    skillsToLearn: ['Teklif hazırlama', 'Maliyet analizi', 'Fiyatlandırma'],
    toolsToUse: ['Excel', 'Birim fiyat listesi'],
    difficulty: 3,
    isKeyMilestone: false,
    suggestedActivities: [
      'Örnek teklif inceleme',
      'Maliyet hesaplama',
      'Teklif yazımı',
      'Karşılaştırma'
    ],
    avoidTopics: [],
    buildUponTopics: ['hakediş takibi', 'malzeme listesi'],
    suggestVisual: false
  },
  {
    dayNumber: 24,
    weekNumber: 5,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Arıza tespit ve giderme metodları',
    primaryTopicEN: 'Fault detection and troubleshooting methods',
    alternativeTopics: [
      'Sistematik arıza arama',
      'Elektrik arıza türleri'
    ],
    objectives: [
      'Arıza türlerini sınıflandırmak',
      'Sistematik arama yapmak',
      'Güvenli müdahale etmek'
    ],
    objectivesEN: [
      'Classify fault types',
      'Perform systematic search',
      'Intervene safely'
    ],
    prerequisiteDays: [3, 19, 20],
    skillsToLearn: ['Arıza tespiti', 'Problem çözme', 'Güvenli müdahale'],
    toolsToUse: ['Multimetre', 'Pens ampermetre', 'El aletleri'],
    difficulty: 4,
    isKeyMilestone: true,
    suggestedActivities: [
      'Arıza senaryoları',
      'Ölçüm ve analiz',
      'Çözüm uygulama',
      'Dokümantasyon'
    ],
    avoidTopics: ['yüksek gerilim'],
    buildUponTopics: ['pano testi', 'multimetre kullanımı'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Arıza tespit çalışması veya ölçüm'
  },
  {
    dayNumber: 25,
    weekNumber: 5,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Topraklama ve yıldırımdan korunma sistemleri',
    primaryTopicEN: 'Grounding and lightning protection systems',
    alternativeTopics: [
      'Topraklama ölçümü',
      'Paratoner sistemi inceleme'
    ],
    objectives: [
      'Topraklama sistemlerini anlamak',
      'Ölçüm yapmak',
      'Yıldırımdan korunma prensiplerini kavramak'
    ],
    objectivesEN: [
      'Understand grounding systems',
      'Perform measurements',
      'Grasp lightning protection principles'
    ],
    prerequisiteDays: [7, 20, 24],
    skillsToLearn: ['Topraklama ölçümü', 'Toprak direnci', 'Yıldırımdan korunma'],
    toolsToUse: ['Toprak megeri', 'Multimetre', 'Topraklama çubuğu'],
    difficulty: 4,
    isKeyMilestone: false,
    suggestedActivities: [
      'Sistem inceleme',
      'Direnç ölçümü',
      'Bağlantı kontrolü',
      'Raporlama'
    ],
    avoidTopics: ['hesap detayları'],
    buildUponTopics: ['arıza tespiti', 'priz topraklama'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Topraklama ölçümü veya topraklama çubuğu'
  },

  // ========== WEEK 6: Project Participation and Evaluation ==========
  {
    dayNumber: 26,
    weekNumber: 6,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Şantiye saha çalışmasına katılım',
    primaryTopicEN: 'Participation in construction site field work',
    alternativeTopics: [
      'Gerçek proje saha uygulaması',
      'Montaj ekibiyle çalışma'
    ],
    objectives: [
      'Saha koşullarını deneyimlemek',
      'Ekip çalışması yapmak',
      'Pratik uygulama kazanmak'
    ],
    objectivesEN: [
      'Experience field conditions',
      'Work as a team',
      'Gain practical application'
    ],
    prerequisiteDays: [10, 19, 24],
    skillsToLearn: ['Saha çalışması', 'Ekip koordinasyonu', 'Pratik uygulama'],
    toolsToUse: ['Tüm el aletleri', 'KKD seti'],
    difficulty: 4,
    isKeyMilestone: true,
    suggestedActivities: [
      'Saha hazırlığı',
      'Montaj çalışması',
      'Kalite kontrolü',
      'Gün sonu raporu'
    ],
    avoidTopics: [],
    buildUponTopics: ['tüm önceki konular'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Şantiye çalışma ortamı'
  },
  {
    dayNumber: 27,
    weekNumber: 6,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'As-built proje hazırlama ve revizyon',
    primaryTopicEN: 'As-built project preparation and revision',
    alternativeTopics: [
      'Saha tespiti ve proje güncelleme',
      'Değişiklik yönetimi'
    ],
    objectives: [
      'Saha farklarını tespit etmek',
      'Proje revizyonu yapmak',
      'As-built dokümantasyon öğrenmek'
    ],
    objectivesEN: [
      'Detect field differences',
      'Make project revisions',
      'Learn as-built documentation'
    ],
    prerequisiteDays: [12, 15, 26],
    skillsToLearn: ['As-built hazırlama', 'Proje revizyonu', 'Saha tespiti'],
    toolsToUse: ['AutoCAD', 'Metre', 'Proje paftası'],
    difficulty: 4,
    isKeyMilestone: false,
    suggestedActivities: [
      'Saha ölçümü',
      'Fark tespiti',
      'Çizim güncelleme',
      'Onay süreci'
    ],
    avoidTopics: [],
    buildUponTopics: ['AutoCAD çizim', 'şantiye çalışması'],
    suggestVisual: true,
    visualType: 'diagram',
    visualDescription: 'As-built proje çizimi veya revizyon işareti'
  },
  {
    dayNumber: 28,
    weekNumber: 6,
    type: InternshipType.MANAGEMENT,
    primaryTopic: 'Proje kapanış ve dokümantasyon',
    primaryTopicEN: 'Project closure and documentation',
    alternativeTopics: [
      'Teslim dosyası hazırlama',
      'Garanti belgesi düzenleme'
    ],
    objectives: [
      'Proje kapanış sürecini öğrenmek',
      'Teslim dosyası hazırlamak',
      'Arşivleme yapmak'
    ],
    objectivesEN: [
      'Learn project closure process',
      'Prepare handover file',
      'Perform archiving'
    ],
    prerequisiteDays: [13, 18, 27],
    skillsToLearn: ['Proje kapanışı', 'Teslim dosyası', 'Son arşivleme'],
    toolsToUse: ['Dosyalama malzemeleri', 'Yazıcı', 'Arşiv sistemi'],
    difficulty: 3,
    isKeyMilestone: false,
    suggestedActivities: [
      'Dosya kontrolü',
      'Eksik tamamlama',
      'Teslim hazırlığı',
      'Arşivleme'
    ],
    avoidTopics: [],
    buildUponTopics: ['proje dosyası', 'as-built'],
    suggestVisual: false
  },
  {
    dayNumber: 29,
    weekNumber: 6,
    type: InternshipType.PRODUCTION_DESIGN,
    primaryTopic: 'Bağımsız görev: Basit proje çözümü',
    primaryTopicEN: 'Independent task: Simple project solution',
    alternativeTopics: [
      'Verilen problemi çözme',
      'Bireysel proje çalışması'
    ],
    objectives: [
      'Bağımsız problem çözmek',
      'Öğrenilenleri uygulamak',
      'Özgüven kazanmak'
    ],
    objectivesEN: [
      'Solve problems independently',
      'Apply learned skills',
      'Gain confidence'
    ],
    prerequisiteDays: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28],
    skillsToLearn: ['Bağımsız çalışma', 'Problem çözme', 'Karar verme'],
    toolsToUse: ['Tüm öğrenilen aletler'],
    difficulty: 5,
    isKeyMilestone: true,
    suggestedActivities: [
      'Görev alma',
      'Planlama',
      'Uygulama',
      'Sonuç sunumu'
    ],
    avoidTopics: [],
    buildUponTopics: ['tüm staj boyunca öğrenilenler'],
    suggestVisual: true,
    visualType: 'photo',
    visualDescription: 'Bağımsız çalışma sonucu'
  },
  {
    dayNumber: 30,
    weekNumber: 6,
    type: InternshipType.MANAGEMENT,
    primaryTopic: 'Staj değerlendirme ve kapanış',
    primaryTopicEN: 'Internship evaluation and closure',
    alternativeTopics: [
      'Staj özeti ve değerlendirme',
      'Geri bildirim toplantısı'
    ],
    objectives: [
      'Stajı değerlendirmek',
      'Geri bildirim almak',
      'Gelecek hedefleri belirlemek'
    ],
    objectivesEN: [
      'Evaluate internship',
      'Receive feedback',
      'Set future goals'
    ],
    prerequisiteDays: [29],
    skillsToLearn: ['Öz değerlendirme', 'Profesyonel kapanış'],
    toolsToUse: ['Değerlendirme formu'],
    difficulty: 2,
    isKeyMilestone: true,
    suggestedActivities: [
      'Staj özeti hazırlama',
      'Değerlendirme toplantısı',
      'Teşekkür ve vedalaşma',
      'Belge teslimi'
    ],
    avoidTopics: [],
    buildUponTopics: ['tüm staj deneyimi'],
    suggestVisual: false
  }
];

// ============================================
// COMPLETE CURRICULUM OBJECT
// ============================================

export const ELECTRICAL_INTERNSHIP_CURRICULUM: Curriculum = {
  version: '1.0.0',
  totalDays: 30,
  totalWeeks: 6,
  weeks: WEEK_THEMES,
  days: CURRICULUM_DAYS,
  createdAt: new Date().toISOString(),
  description: 'Elektrik-Elektronik Mühendisliği 2. Staj Müfredatı - 30 Günlük Progresif Öğrenme Planı'
};

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get curriculum day by day number
 */
export const getCurriculumDay = (dayNumber: number): CurriculumDay | undefined => {
  return CURRICULUM_DAYS.find(d => d.dayNumber === dayNumber);
};

/**
 * Get week theme by week number
 */
export const getWeekTheme = (weekNumber: number): WeekTheme | undefined => {
  return WEEK_THEMES.find(w => w.weekNumber === weekNumber);
};

/**
 * Get all days for a specific week
 */
export const getDaysForWeek = (weekNumber: number): CurriculumDay[] => {
  return CURRICULUM_DAYS.filter(d => d.weekNumber === weekNumber);
};

/**
 * Get prerequisite days for a specific day
 */
export const getPrerequisiteDays = (dayNumber: number): CurriculumDay[] => {
  const day = getCurriculumDay(dayNumber);
  if (!day) return [];
  return day.prerequisiteDays
    .map(pn => getCurriculumDay(pn))
    .filter((d): d is CurriculumDay => d !== undefined);
};

/**
 * Check if all prerequisites are completed
 */
export const arePrerequisitesCompleted = (
  dayNumber: number,
  completedDays: number[]
): boolean => {
  const day = getCurriculumDay(dayNumber);
  if (!day) return false;
  return day.prerequisiteDays.every(pd => completedDays.includes(pd));
};

/**
 * Get skills accumulated up to a specific day
 */
export const getAccumulatedSkills = (upToDayNumber: number): string[] => {
  const skills: string[] = [];
  CURRICULUM_DAYS
    .filter(d => d.dayNumber <= upToDayNumber)
    .forEach(d => {
      d.skillsToLearn.forEach(skill => {
        if (!skills.includes(skill)) {
          skills.push(skill);
        }
      });
    });
  return skills;
};

/**
 * Get tools used up to a specific day
 */
export const getAccumulatedTools = (upToDayNumber: number): string[] => {
  const tools: string[] = [];
  CURRICULUM_DAYS
    .filter(d => d.dayNumber <= upToDayNumber)
    .forEach(d => {
      d.toolsToUse.forEach(tool => {
        if (!tools.includes(tool)) {
          tools.push(tool);
        }
      });
    });
  return tools;
};

/**
 * Get topics to avoid (already covered) for a specific day
 */
export const getTopicsToAvoid = (dayNumber: number): string[] => {
  const previousDays = CURRICULUM_DAYS.filter(d => d.dayNumber < dayNumber);
  const coveredTopics: string[] = [];
  previousDays.forEach(d => {
    coveredTopics.push(d.primaryTopic);
    d.alternativeTopics.forEach(t => coveredTopics.push(t));
  });
  return coveredTopics;
};

/**
 * Calculate skill level based on completed days
 */
export const calculateSkillLevel = (completedDays: number[]): SkillLevel => {
  const count = completedDays.length;
  if (count >= 20) return 'advanced';
  if (count >= 10) return 'intermediate';
  return 'beginner';
};
