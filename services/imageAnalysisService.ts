// services/imageAnalysisService.ts
// Görsel Analiz Servisi - Gemini 3 Pro + YouTube API

// YouTube API Key
const YOUTUBE_API_KEY = 'AIzaSyDuXDx7djLjPGtA9Rsbh85igk4dy2eHCvI';

// Model listesi - sırayla denenecek
const MODELS = [
  'gemini-3-pro-preview',
  'gemini-2.5-pro-preview-05-06',
  'gemini-2.0-flash'
];

// Analiz sonuç tipleri
export interface ImageAnalysisResult {
  // Temel bilgiler
  imageType: string;           // "Tek Hat Şeması", "Pano Fotoğrafı", "Tablo" vs.
  imageTypeConfidence: number; // 0-100
  
  // Uygunluk değerlendirmesi
  suitabilityScore: number;    // 0-100
  suitabilityReason: string;   // Neden uygun/uygun değil
  qualityAssessment: 'low' | 'medium' | 'high';
  
  // Teknik içerik
  detectedElements: string[];  // Tespit edilen elemanlar
  technicalDescription: string;
  
  // Gün yazımı için öneriler
  suggestedTopic: string;
  suggestedContent: string;
  
  // Alternatif öneriler
  alternativeSearchTerms: string[];
  
  // Thinking süreci
  thinkingProcess: string;
}

export interface VideoRecommendation {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  duration: string;
  viewCount: string;
  suggestedTimestamp?: string;
  relevanceNote: string;
}

export interface SourceRecommendation {
  type: 'wikimedia' | 'website' | 'pdf' | 'youtube';
  title: string;
  url: string;
  description: string;
  reliability: 'high' | 'medium' | 'low';
}

// Görsel analiz fonksiyonu
export const analyzeImage = async (
  imageBase64: string,
  mimeType: string,
  onThinkingUpdate?: (thought: string) => void
): Promise<ImageAnalysisResult> => {
  const apiKey = process.env.API_KEY;
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }

  const prompt = `Sen bir elektrik mühendisliği staj defteri uzmanısın. Bu görseli analiz et ve aşağıdaki bilgileri JSON formatında döndür.

GÖREV:
1. Görselin türünü tespit et (tek hat şeması, pano fotoğrafı, devre şeması, tablo, sembol, saha fotoğrafı vs.)
2. Staj defteri için uygunluğunu değerlendir (0-100 puan)
3. Görseldeki teknik elemanları tespit et
4. Bu görsele dayalı olarak yazılabilecek staj günü içeriği öner
5. Daha iyi alternatif görseller için arama terimleri öner

TÜRKÇE YANIT VER.

JSON FORMATI:
{
  "imageType": "Görselin türü",
  "imageTypeConfidence": 85,
  "suitabilityScore": 75,
  "suitabilityReason": "Neden bu puan verildi, detaylı açıklama",
  "qualityAssessment": "high|medium|low",
  "detectedElements": ["Eleman 1", "Eleman 2", "Eleman 3"],
  "technicalDescription": "Görselin teknik açıklaması, ne gösterdiği",
  "suggestedTopic": "Önerilen staj günü konusu",
  "suggestedContent": "Bu görsel için yazılabilecek staj günü içeriği özeti (2-3 cümle)",
  "alternativeSearchTerms": ["arama terimi 1", "arama terimi 2"]
}

ÖNEMLİ NOTLAR:
- Staj defteri için uygun görseller: teknik şemalar, projeler, tablolar, eğitim materyalleri
- Uygun olmayan görseller: stok fotoğraflar, düşük çözünürlük, alakasız içerik
- Kalite değerlendirmesi: çözünürlük, okunabilirlik, profesyonellik
- Türkçe içerik üret`;

  let lastError: Error | null = null;

  // Her modeli sırayla dene
  for (const modelName of MODELS) {
    try {
      console.log(`Trying model: ${modelName}`);
      
      if (onThinkingUpdate) {
        onThinkingUpdate(`${modelName} modeli ile analiz ediliyor...`);
      }

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{
              parts: [
                { text: prompt },
                {
                  inlineData: {
                    mimeType: mimeType,
                    data: imageBase64
                  }
                }
              ]
            }],
            generationConfig: {
              temperature: 0.7,
              maxOutputTokens: 4096
            }
          })
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Model ${modelName} failed:`, errorData);
        
        // 503 veya 429 ise sonraki modele geç
        if (response.status === 503 || response.status === 429) {
          lastError = new Error(`${modelName}: ${errorData.error?.message || 'Service unavailable'}`);
          continue;
        }
        throw new Error(errorData.error?.message || 'API error');
      }

      const data = await response.json();
      const responseText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // JSON parse
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Invalid JSON response');
      }

      const result = JSON.parse(jsonMatch[0]);
      
      return {
        ...result,
        thinkingProcess: `✅ ${modelName} modeli ile analiz tamamlandı.`
      };

    } catch (error) {
      console.error(`Model ${modelName} error:`, error);
      lastError = error as Error;
      // Sonraki modele geç
      continue;
    }
  }

  // Tüm modeller başarısız oldu
  throw lastError || new Error('Tüm modeller başarısız oldu. Lütfen daha sonra tekrar deneyin.');
};

// YouTube video arama
export const searchYouTubeVideos = async (
  query: string,
  maxResults: number = 5
): Promise<VideoRecommendation[]> => {
  try {
    // Elektrik mühendisliği odaklı arama
    const searchQuery = `${query} elektrik mühendisliği tutorial eğitim`;
    
    const url = `https://www.googleapis.com/youtube/v3/search?` +
      `part=snippet` +
      `&q=${encodeURIComponent(searchQuery)}` +
      `&type=video` +
      `&maxResults=${maxResults}` +
      `&relevanceLanguage=tr` +
      `&videoDefinition=high` +
      `&key=${YOUTUBE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (!data.items?.length) {
      return [];
    }

    // Video detayları için ikinci API çağrısı
    const videoIds = data.items.map((item: any) => item.id.videoId).join(',');
    const detailsUrl = `https://www.googleapis.com/youtube/v3/videos?` +
      `part=contentDetails,statistics` +
      `&id=${videoIds}` +
      `&key=${YOUTUBE_API_KEY}`;

    const detailsResponse = await fetch(detailsUrl);
    const detailsData = await detailsResponse.json();

    const videos: VideoRecommendation[] = data.items.map((item: any, index: number) => {
      const details = detailsData.items?.[index];
      const duration = details?.contentDetails?.duration || 'PT0M';
      const viewCount = details?.statistics?.viewCount || '0';

      // ISO 8601 duration parse
      const durationMatch = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      const hours = durationMatch?.[1] || '0';
      const minutes = durationMatch?.[2] || '0';
      const seconds = durationMatch?.[3] || '0';
      const formattedDuration = hours !== '0' 
        ? `${hours}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`
        : `${minutes}:${seconds.padStart(2, '0')}`;

      return {
        videoId: item.id.videoId,
        title: item.snippet.title,
        channelTitle: item.snippet.channelTitle,
        thumbnailUrl: item.snippet.thumbnails.medium.url,
        duration: formattedDuration,
        viewCount: parseInt(viewCount).toLocaleString('tr-TR'),
        relevanceNote: 'Konuyla ilgili eğitim videosu'
      };
    });

    return videos;

  } catch (error) {
    console.error('YouTube search failed:', error);
    return [];
  }
};

// Kaynak önerileri oluştur
export const generateSourceRecommendations = (
  imageType: string,
  alternativeTerms: string[]
): SourceRecommendation[] => {
  const recommendations: SourceRecommendation[] = [];

  // Wikimedia önerileri
  const wikimediaCategories: Record<string, string> = {
    'Tek Hat Şeması': 'One-line_diagrams',
    'Pano': 'Electrical_installations',
    'Devre Şeması': 'Circuit_diagrams',
    'Sembol': 'Electrical_symbols',
    'Topraklama': 'Earthing_system',
    'Motor': 'Electric_motors',
    'Tablo': 'Electrical_engineering_diagrams'
  };

  // İlgili Wikimedia kategorisi bul
  for (const [key, category] of Object.entries(wikimediaCategories)) {
    if (imageType.toLowerCase().includes(key.toLowerCase())) {
      recommendations.push({
        type: 'wikimedia',
        title: `Wikimedia Commons: ${key}`,
        url: `https://commons.wikimedia.org/wiki/Category:${category}`,
        description: 'Ücretsiz, yüksek kaliteli teknik görseller',
        reliability: 'high'
      });
      break;
    }
  }

  // Genel Wikimedia önerisi
  if (recommendations.length === 0) {
    recommendations.push({
      type: 'wikimedia',
      title: 'Wikimedia Commons: Electrical Diagrams',
      url: 'https://commons.wikimedia.org/wiki/Category:Electrical_diagrams',
      description: 'Elektrik mühendisliği diyagramları koleksiyonu',
      reliability: 'high'
    });
  }

  // Türk kaynakları
  recommendations.push({
    type: 'website',
    title: 'EMO Teknik Yayınlar',
    url: 'https://www.emo.org.tr/genel/bizden_detay.php?kod=88LPQnfp1d1S&tiession=1',
    description: 'Elektrik Mühendisleri Odası resmi kaynakları',
    reliability: 'high'
  });

  recommendations.push({
    type: 'website',
    title: 'Elektrikport',
    url: 'https://www.elektrikport.com',
    description: 'Türkçe elektrik mühendisliği portalı',
    reliability: 'medium'
  });

  // Arama terimleri bazlı Google önerisi
  if (alternativeTerms.length > 0) {
    const searchQuery = alternativeTerms.slice(0, 2).join(' ');
    recommendations.push({
      type: 'website',
      title: 'Google Görseller Araması',
      url: `https://www.google.com/search?tbm=isch&q=${encodeURIComponent(searchQuery + ' filetype:svg OR filetype:png')}`,
      description: `"${searchQuery}" için görsel arama`,
      reliability: 'medium'
    });
  }

  return recommendations;
};

// Dosyayı base64'e çevir
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // data:image/png;base64, kısmını kaldır
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};