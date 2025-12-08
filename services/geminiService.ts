
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { DayEntry } from '../types';

// Initialize the API client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing. Please set API_KEY");
    throw new Error("Gemini API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

const fetchImageAsBase64 = async (url: string): Promise<string> => {
  const response = await fetch(url);
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export const analyzeImage = async (imageUrl: string): Promise<string> => {
  const ai = getAiClient();
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Bu görseli analiz et. Bu bir elektrik mühendisliği stajı bağlamında ne gösteriyor? Kısaca açıkla: Bu bir proje çizimi mi, teknik şema mı, saha fotoğrafı mı, eğitim materyali mi? Görselde tam olarak ne var? 2-3 cümle ile açıkla." },
            { inlineData: { mimeType: "image/jpeg", data: await fetchImageAsBase64(imageUrl) } }
          ]
        }
      ]
    });
    
    return response.text || "Görsel analiz edilemedi.";
  } catch (error) {
    console.error("Image analysis error:", error);
    return "Görsel analiz edilemedi.";
  }
};

export const generateDayContent = async (day: DayEntry, previousDays: DayEntry[] = []): Promise<{ text: string; visualDesc?: string; workTitle?: string }> => {
  const ai = getAiClient();
  
  // Önceki günlerin kısa bir özetini oluştur
  // Sadece VERİTABANINA KAYDEDİLMİŞ (isSaved: true) günleri referans al
  // Böylece yapay zeka sadece kesinleşmiş hikaye akışını bilir.
  const contextSummary = previousDays
    .filter(d => d.isSaved && d.dayNumber < day.dayNumber)
    .map(d => `- Gün ${d.dayNumber}: ${d.workTitle || d.specificTopic}`)
    .join('\n');
  
 const userPrompt = `
    Tarih: ${day.date} (Gün ${day.dayNumber})
    Staj Türü: ${day.type}
    GÜNÜN SPESİFİK GÖREVİ: ${day.specificTopic}
    ${day.customPrompt ? `ÖZEL DİREKTİF: ${day.customPrompt}` : ''}
    Görsel Durumu: ${day.hasVisual ? 'Görsel Mevcut' : 'Görsel Yok'}
    
    ${day.imageUrl ? `ÖNEMLİ: Bu gün için seçilen görsel şu konuyu göstermektedir: "${day.specificTopic}".` : ''}
    
    ${day.imageUrl && day.imageAnalysis ? `
SEÇİLEN GÖRSEL ANALİZİ: ${day.imageAnalysis}

KRİTİK KURALLAR:
1. Eğer görsel bir proje çizimi veya AutoCAD çıktısı ise:
   - SADECE "projeyi inceledik", "çizimi analiz ettik", "güzergahları belirledik" gibi ifadeler kullan
   - KESİNLİKLE montaj, kurulum, kablo çekme gibi saha işlerinden bahsetme
   - Çizim üzerinde gördüklerini anlat (hatlar, semboller, ölçüler)

2. Eğer görsel bir saha fotoğrafı ise:
   - Sahada yapılan fiziksel işleri anlat
   - Montaj, kurulum, bağlantı işlemlerini detaylandır

3. Eğer görsel bir eğitim tablosu veya şema ise:
   - Eğitim aldığımızı, tablo/şemayı incelediğimizi anlat
   - Teorik bilgi öğrendiğimizi vurgula

ASLA görselde olmayan işlemleri anlatma. Görselde proje çizimi varsa saha işi anlatma!
` : ''}

    ${contextSummary ? `
    DAHA ÖNCE YAZILAN VE KESİNLEŞEN GÜNLER (Referans ve Bağlam İçin):
    ${contextSummary}
    
    UYARI: Yukarıdaki listede yer alan geçmiş günlerdeki anlatımları birebir tekrar etme.
    Süreklilik hissi yarat ama farklı cümle yapıları kullan.
    ` : ''}

    Lütfen aşağıdaki formatta içerik üret. Başka hiçbir giriş/çıkış konuşması yapma.

    FORMAT:
    ÇALIŞMA RAPORU: [Buraya yapılan işi özetleyen 2-5 kelimelik resmi bir başlık yaz. Örn: "Pano Montajı ve Kablolama"]
    
    [Buraya detaylı staj defteri içeriği gelecek. 2-4 paragraf. Teknik detaylı ve samimi.]

    ${day.hasVisual ? '[GÖRSEL AÇIKLAMASI: Buraya görselin ne olduğunu anlatan kısa bir not]' : ''}
  `;

  try {
    // Permission denied hatalarını önlemek için gemini-2.5-flash kullanıyoruz
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: SYSTEM_PROMPT,
      },
      contents: userPrompt
    });

    const rawText = response.text || "İçerik oluşturulamadı.";
    
    let finalContent = rawText;
    let visualDesc = undefined;
    let workTitle = "Genel Çalışma";

    // 1. Parse Work Title
    // Look for "ÇALIŞMA RAPORU:" at the start
    const lines = rawText.split('\n');
    const titleIndex = lines.findIndex(line => line.trim().toUpperCase().startsWith('ÇALIŞMA RAPORU:'));
    
    if (titleIndex !== -1) {
      const titleLine = lines[titleIndex];
      workTitle = titleLine.replace(/ÇALIŞMA RAPORU:/i, '').trim();
      // Remove the title line from the content array to keep only body
      lines.splice(titleIndex, 1);
      finalContent = lines.join('\n').trim();
    }

    // 2. Parse Visual Description
    if (finalContent.includes('[GÖRSEL AÇIKLAMASI:')) {
      const parts = finalContent.split('[GÖRSEL AÇIKLAMASI:');
      finalContent = parts[0].trim();
      visualDesc = parts[1].replace(']', '').trim();
    }

    return {
      text: finalContent,
      visualDesc: visualDesc,
      workTitle: workTitle
    };

  } catch (error) {
    console.error("Error generating content:", error);
    throw error;
  }
};

export const generateImagePrompt = (description: string): string => {
  const prompt = `Realistic iPhone 13 photo, no filter, natural lighting. First person POV shot by an electrical engineering intern at workplace. Scene: ${description}. Not perfect stock photo quality, slightly imperfect, authentic textures, natural ambient light, casual snapshot feel. Turkish workplace environment.`;
  
  return prompt;
};