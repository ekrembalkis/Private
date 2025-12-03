
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
  "Termal kamera ile pano içi ısınan bağlantı noktalarının tespiti"
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
