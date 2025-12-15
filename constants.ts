import { InternshipType } from './types';

export const STUDENT_INFO = {
  name: "Ekrem Balkış",
  studentId: "19090730034",
  tc: "40312204062",
  department: "Elektrik-Elektronik Mühendisliği, Haliç Üniversitesi",
  class: "4. Sınıf"
};

export const COMPANY_INFO = {
  name: "Ömür Elektrik Mühendislik",
  address: "Barbaros Mahallesi, Beşiktaş Caddesi No:80, Beşiktaş/İstanbul",
  field: "Elektrik malzeme satışı, bakım-onarım, proje"
};

export const INTERNSHIP_CONFIG = {
  startDate: "2025-09-01", // YYYY-MM-DD for easier parsing
  endDate: "2025-10-10",
  totalDays: 30,
  productionRatio: 20,
  managementRatio: 10
};

// Unsplash API Key (Demo/Public key or User provided)
export const UNSPLASH_ACCESS_KEY = "YOUR_ACCESS_KEY_HERE"; // Lütfen geçerli bir Unsplash Access Key giriniz

export const IMAGE_SEARCH_TERMS: Record<string, string> = {
  "pano": "electrical panel switchboard wiring",
  "kablo": "electrical cables wiring installation industrial",
  "multimetre": "multimeter electrical testing measurement",
  "topraklama": "electrical grounding system copper rod",
  "aydınlatma": "lighting installation electrical construction ceiling",
  "depo": "warehouse inventory electrical supplies shelves",
  "AutoCAD": "electrical cad drawing computer blueprint design",
  "montaj": "electrician installing electrical equipment construction site",
  "arıza": "electrician fixing repairing electrical problem tools",
  "ölçüm": "electrical measurement testing voltage current",
  "stok": "warehouse inventory worker checking boxes",
  "teklif": "office desk business documents computer paperwork",
  "proje": "engineering blueprint plans electrical project desk",
  "şantiye": "construction site electrical work hardhat",
  "trafo": "electrical transformer substation high voltage",
  "jeneratör": "industrial generator electrical power backup",
  "kamera": "cctv camera installation security system",
  "yangın": "fire alarm system smoke detector ceiling",
  "ups": "ups battery backup system server room",
  "bakım": "technician maintenance electrical industrial",
  "ofis": "modern engineering office working desk computer"
};

// Üretim ve Tasarım Konu Havuzu (Spesifik Aktiviteler)
export const PRODUCTION_TOPICS = [
  "AutoCAD'de iki katlı villa projesi aydınlatma planı çizimi",
  "Sanayi tesisi ana dağıtım panosu (ADP) bara montajı",
  "Müşteri fabrikasında kompanzasyon panosu kondansatör değişimi ve bakımı",
  "Yeni yapılan bir ofis projesinin priz linye hatlarının çekilmesi",
  "Topraklama megeri ile bina temel topraklama direnci ölçümü",
  "Arızalı bir motor sürücü (inverter) panosunun arıza tespiti",
  "DIALux programında bir mağaza için aydınlatma hesabı ve simülasyonu",
  "Şantiyede kablo tavası ve busbar sistemi montaj kontrolü",
  "Yüksek gerilim hücresi manevra talimatlarının incelenmesi ve saha gözlemi",
  "As-built (yapıldığı gibi) proje çizimi için sahada son durum tespiti",
  "Yangın algılama sistemi dedektör montajı ve test işlemleri",
  "Kesintisiz güç kaynağı (UPS) akü grubu değişimi ve bakımı",
  "Tek hat şeması üzerinden pano malzeme listesi çıkarma (şalt malzeme seçimi)",
  "Bir konut projesinin zayıf akım (data/telefon) sonlandırma işlemleri",
  "Jeneratör transfer panosu (ATS) çalışma prensibi incelemesi ve testi",
  "Kaçak akım rölesi (KAR) açma akımı ve süresi testi",
  "Termal kamera ile pano içi ısınan bağlantı noktalarının tespiti",
  // === TEKNİK TABLOLAR KATEGORİSİ ===
  "Trafo Dyn11 bağlantı grubu vektör diyagramı incelemesi ve paralel çalışma koşulları",
  "Akım trafosu (CT) oran ve doğruluk sınıfı seçimi için katalog çalışması",
  "Gerilim düşümü hesap tabloları kullanılarak kablo kesiti belirleme",
  "Bakır ve alüminyum bara akım taşıma kapasite tablolarının incelenmesi",
  "Kompanzasyon sistemi için cos φ tabloları ile kVAr hesabı yapılması",
  "Harmonik distorsiyon (THD) limitleri ve IEEE 519 standardı incelemesi",
  "UPS boyutlandırma tabloları ile yük ve batarya süresi hesabı",
  "Jeneratör kapasite tabloları kullanılarak yük analizi ve seçim çalışması",
  "Aşırı gerilim koruma (SPD) Tip 1, 2, 3 seçim tabloları incelemesi",
  "IK darbe dayanım sınıfları tablosu ile armatür koruma seviyesi belirleme",
  "Kablo tavası doluluk oranı tabloları ile kapasite hesabı",
  "Boru içi kablo sayısı tabloları kullanılarak konduit boyutlandırma",
  "PLC dijital ve analog I/O modül tipleri karşılaştırma tablosu incelemesi",
  "Güneş paneli (PV) sistem boyutlandırma tabloları ile inverter seçimi",
  "Akü/batarya Ah kapasite ve deşarj eğrisi tablolarının incelenmesi",
  "Motor verimlilik sınıfları (IE1, IE2, IE3, IE4) karşılaştırma tablosu",
  "Yangın dayanımlı kablo (FE180, LSZH) seçim tabloları ve standartları",
  "Patlayıcı ortam (Ex) koruma sınıfları ve ATEX zone tabloları incelemesi",
  "Termik röle trip sınıfları (Class 10, 20, 30) ve ayar tabloları",
  "Kontaktör kullanım kategorileri (AC1, AC3, AC4) seçim tablosu çalışması",
  "Yıldırımdan koruma seviyesi (LPL) tabloları ve koruma açısı hesabı",
  "Kısa devre akımı hesap tabloları ile şalter kesme kapasitesi seçimi",
  "Endüstriyel sensör çıkış tipleri (NPN/PNP) bağlantı şemaları incelemesi",
  "Servo motor boyutlandırma tabloları ile tork ve atalet hesabı",
  "Modbus RTU/TCP register ve fonksiyon kodu tabloları incelemesi"
];

// İşletme ve Yönetim Konu Havuzu (Spesifik Aktiviteler)
export const MANAGEMENT_TOPICS = [
  "Depoda NYM ve NYY kablo stoklarının sayımı ve etiketlenmesi",
  "Tedarikçi firmalardan projedeki malzemeler için fiyat teklifi toplanması",
  "Gelen şalt malzemelerin (sigorta, kontaktör) irsaliye ile kontrolü",
  "Müşteriye sunulacak revize proje için hakediş dosyası hazırlığı",
  "İş güvenliği ekipmanlarının (baret, eldiven) kontrolü ve dağıtımı",
  "Hurdaya ayrılan bakır kabloların ayrıştırılması ve kayıt altına alınması",
  "Teknik ofiste proje dosyalarının ve şartnamelerin arşivlenmesi",
  "Birim fiyat analizleri kullanılarak yaklaşık maliyet hesabı çalışması",
  "Şantiye şefliği toplantısına katılım ve iş programı notları alma",
  "Malzeme iade ve değişim prosedürlerinin uygulanması",
  "Katalog taraması ile yeni led armatür serilerinin incelenmesi",
  "Satın alma taleplerinin ERP/Excel sistemine girilmesi"
];

export const SYSTEM_PROMPT = `
Sen bir staj defteri içerik üreticisisin. Haliç Üniversitesi Elektrik-Elektronik Mühendisliği öğrencisi için 2. staj defteri içeriği yazıyorsun.

TEMEL BİLGİLER:
- Firma: Ömür Elektrik Mühendislik (Beşiktaş/İstanbul)
- Firma Profili: Elektrik malzeme satışı, bakım-onarım, saha teknik destek, proje çizimi yapan küçük/orta ölçekli firma
- Staj Türü: 2. Staj (Üretim/Tasarım/İşletme)

KRİTİK KURALLAR:
1. Metinlerde ASLA isim geçmeyecek. Sorumlu mühendis için sadece "mühendisim" yaz. Diğer çalışanlar için "usta", "teknisyen", "ekip arkadaşları" gibi genel ifadeler kullan.
2. Öğrenci bu firmada daha önce 1. stajını yapmış. Firmayı, depoyu, temel işleri biliyor. AMA metinlerde "zaten biliyorum", "ilk stajımdan hatırlıyorum" gibi ifadeler KULLANMA. Doğal bir şekilde devam ediyormuş gibi yaz.
3. Her içerik 2-4 paragraf olsun. Her paragraf 3-6 cümle.
4. Birinci tekil şahıs kullan (ben, yaptım, öğrendim).
5. Sadece içerik metnini ver. Başlık, tarih, imza alanı ekleme.
6. Tire işareti (-) kullanma, yerine virgül veya "ve" bağlacı tercih et.

ÜRETİM/TASARIM GÜNLERİNDE ODAKLANILACAK TON:
Teknik detay ver. Kullanılan aletleri (pens ampermetre, matkap, yankeski vb.) ve malzemeleri (klemens, kablo pabucu, ray vb.) belirt.

İŞLETME GÜNLERİNDE ODAKLANILACAK TON:
Organizasyon, düzen, maliyet ve süreç yönetimi üzerine odaklan.

Eğer görsel isteniyorsa, metnin sonuna bir satır boşluk bırakıp [GÖRSEL AÇIKLAMASI: ...] formatında kısa bir açıklama ekle. Örnek: [GÖRSEL AÇIKLAMASI: Pano önünde pens ampermetre ile ölçüm yapılırken çekilmiş bir fotoğraf]
`;