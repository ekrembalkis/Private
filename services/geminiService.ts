import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { DayEntry } from '../types';

// Initialize the API client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key is missing. Please set process.env.API_KEY");
    throw new Error("Gemini API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
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
    Görsel İsteği: ${day.hasVisual ? 'Evet' : 'Hayır'}
    
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
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
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

export const generateImage = async (description: string): Promise<string | null> => {
  const ai = getAiClient();
  
  // Prompt güncellendi: iPhone 13 doğallığı ve amatör çekim hissi
  const prompt = `iPhone 13 kamerasıyla çekilmiş, filtresiz, doğal ve gerçekçi bir fotoğraf. Elektrik mühendisliği staj ortamı. POV açısı (birinci şahıs, stajyerin gözünden). Sahne: ${description}. Stok fotoğraf gibi mükemmel değil, hafif kusurlu, gerçekçi dokular, doğal ortam ışığı.`;

  try {
    // Model güncellendi: gemini-3-pro-image-preview (Nano Banana Pro)
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-image-preview',
      contents: prompt,
      config: {
        // İsteğe bağlı olarak aspect ratio veya size ayarlanabilir, şimdilik varsayılan bırakıyoruz.
        // imageConfig: { aspectRatio: "1:1" } 
      }
    });

    if (response.candidates && response.candidates[0].content.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (error) {
    console.error("Image generation error:", error);
    return null;
  }
};