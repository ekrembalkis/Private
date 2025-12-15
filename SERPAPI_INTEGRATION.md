# 🔄 Emity Image Search Entegrasyonu - Staj Defteri Oluşturucu

Bu döküman, Emity v2'deki kusursuz SerpAPI tabanlı görsel arama sisteminin Staj Defteri Oluşturucu uygulamasına entegrasyonunu açıklar.

## 📦 Neler Değişti?

### Eski Sistem
- Google Custom Search API kullanıyordu
- CORS sorunları yaşanabiliyordu
- Günlük 100 arama limiti vardı
- Bazen alakasız sonuçlar geliyordu

### Yeni Sistem (Emity v2'den)
- **SerpAPI** kullanıyor (Vercel Proxy ile)
- CORS sorunları tamamen çözüldü
- Daha alakalı ve kaliteli sonuçlar
- Domain filtreleme (stok foto siteleri engellendi)
- Tercih edilen kaynaklar öncelikli (Wikipedia, .edu vs.)
- Wikimedia Commons desteği korundu (fallback)

---

## 🛠️ Kurulum Adımları

### Adım 1: Dosyaları Güncelle

Aşağıdaki dosyaları projenize ekleyin/güncelleyin:

```
staj-defteri-oluşturucu/
├── api/
│   └── serpapi.ts          ← YENİ (Vercel Serverless Function)
├── services/
│   ├── serpApiService.ts   ← YENİ (Frontend SerpAPI servisi)
│   └── imageService.ts     ← GÜNCELLENDİ (SerpAPI entegreli)
├── vercel.json             ← GÜNCELLENDİ (API routes eklendi)
├── package.json            ← GÜNCELLENDİ (@vercel/node eklendi)
└── .env.example            ← YENİ (Environment variables rehberi)
```

### Adım 2: SerpAPI Key Alın

1. [SerpAPI](https://serpapi.com) adresine gidin
2. Ücretsiz hesap oluşturun (aylık 100 arama ücretsiz)
3. Dashboard'dan API key'inizi kopyalayın

### Adım 3: Environment Variables

#### Lokal Geliştirme (.env.local):
```env
VITE_SERPAPI_KEY=your_serpapi_key_here
```

#### Vercel Dashboard:
1. **Project Settings** > **Environment Variables**
2. Aşağıdaki değişkeni ekleyin:
   - **Key:** `VITE_SERPAPI_KEY`
   - **Value:** `your_serpapi_key`
   - **Environment:** Production, Preview, Development (hepsini işaretleyin)

### Adım 4: Dependencies Yükle

```bash
npm install @vercel/node --save-dev
```

### Adım 5: Deploy

```bash
# Vercel CLI ile
vercel --prod

# Veya GitHub push ile otomatik deploy
git add .
git commit -m "SerpAPI entegrasyonu eklendi"
git push origin main
```

---

## 📁 Dosya Detayları

### `/api/serpapi.ts` - Vercel Serverless Proxy

Bu dosya SerpAPI isteklerini proxy'ler ve CORS sorunlarını çözer.

**Özellikler:**
- Tüm SerpAPI istekleri bu proxy üzerinden geçer
- CORS headers otomatik eklenir
- Domain filtreleme (stok foto siteleri engellenir)
- Tercih edilen domainler öncelikli sıralanır
- Rate limiting koruması

**Engellenen Domainler:**
- shutterstock.com, istockphoto.com, gettyimages.com
- pinterest.com, instagram.com, facebook.com
- aliexpress.com, alibaba.com
- tiktok.com, twitter.com

**Tercih Edilen Domainler:**
- wikipedia.org, wikimedia.org
- .edu, .gov
- elektrikport.com, allaboutcircuits.com

### `/services/serpApiService.ts` - Frontend Servisi

Frontend'den SerpAPI'ye istek atmak için kullanılır.

```typescript
import { searchImagesSerpAPI, buildTechnicalQuery } from './serpApiService';

// Basit arama
const results = await searchImagesSerpAPI('elektrik panosu', apiKey, {
  count: 15,
  imageType: 'photo',
  safeSearch: true
});

// Teknik query oluşturma
const query = buildTechnicalQuery('transformatör', 'autocad');
// Sonuç: "transformatör AutoCAD elektrik proje çizim teknik"
```

### `/services/imageService.ts` - Ana Image Service

Tüm görsel arama mantığını yönetir.

**Arama Hiyerarşisi:**
1. **SerpAPI** (Primer) - En kaliteli sonuçlar
2. **Wikimedia Commons** (Sekonder) - Ücretsiz teknik görseller
3. **Google Custom Search** (Fallback) - Eski sistem

**Kullanım:**
```typescript
import { searchImages, searchByCategory } from './services/imageService';

// Genel arama
const images = await searchImages('elektrik panosu', 15, 'saha');

// Kategori bazlı arama
const categoryImages = await searchByCategory('transformers', 15);
```

---

## 🔧 Vercel Konfigürasyonu

### `vercel.json`:
```json
{
  "buildCommand": "npm install --legacy-peer-deps && npm run build",
  "outputDirectory": "dist",
  "framework": "vite",
  "rewrites": [
    {
      "source": "/api/:path*",
      "destination": "/api/:path*"
    }
  ],
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Access-Control-Allow-Methods", "value": "GET, POST, OPTIONS" },
        { "key": "Access-Control-Allow-Headers", "value": "Content-Type" }
      ]
    }
  ]
}
```

---

## 🧪 Test Etme

### 1. Lokal Test
```bash
npm run dev
```

Tarayıcı konsolunda şunları görmelisiniz:
```
[SerpAPI] 🔍 Searching: elektrik panosu
[SerpAPI] ✓ Found 15 images
```

### 2. API Proxy Test
Browser'da açın:
```
http://localhost:5173/api/serpapi?api_key=YOUR_KEY&engine=google_images&q=test
```

### 3. Vercel Test
Deploy sonrası:
```
https://your-app.vercel.app/api/serpapi?api_key=YOUR_KEY&engine=google_images&q=test
```

---

## ❓ Sorun Giderme

### "SerpAPI key not found" hatası
- `.env.local` dosyasında `VITE_SERPAPI_KEY` tanımlı mı kontrol edin
- Vercel'de Environment Variables ekli mi kontrol edin
- Değişken adının başında `VITE_` prefix'i olmalı

### "Proxy request failed" hatası
- `/api/serpapi.ts` dosyası doğru konumda mı kontrol edin
- `@vercel/node` yüklü mü: `npm install @vercel/node --save-dev`
- Vercel redeploy yapın

### Görsel bulunamıyor
- SerpAPI'de kalan arama hakkınızı kontrol edin
- Farklı arama terimleri deneyin
- Wikimedia fallback çalışıyor mu logları kontrol edin

### CORS hatası (lokal)
- Vite proxy ayarları güncel mi kontrol edin
- `/api/serpapi` yerine tam URL kullanmayın

---

## 📊 Maliyet ve Limitler

### SerpAPI Ücretsiz Plan
- Aylık 100 arama
- Tüm özellikler kullanılabilir
- Tek sınırlama: arama sayısı

### Ücretli Planlar
- Developer: $50/ay - 5,000 arama
- Business: $130/ay - 15,000 arama
- Enterprise: Özel fiyatlandırma

### Optimizasyon İpuçları
- Arama sonuçlarını cache'leyin
- Gereksiz aramaları engelleyin (debounce)
- Wikimedia'yı primer olarak kullanın (ücretsiz)

---

## 🔗 Faydalı Linkler

- [SerpAPI Dashboard](https://serpapi.com/dashboard)
- [SerpAPI Google Images API](https://serpapi.com/google-images-api)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Wikimedia Commons API](https://commons.wikimedia.org/w/api.php)

---

## 📝 Changelog

### v2.0.0 (Güncel)
- SerpAPI entegrasyonu eklendi
- Vercel Serverless Proxy oluşturuldu
- Domain filtreleme sistemi
- Tercih edilen kaynak sıralaması
- Wikimedia fallback korundu

### v1.0.0 (Önceki)
- Google Custom Search API
- Wikimedia Commons desteği
- Kategori bazlı arama
