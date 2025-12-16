/**
 * Semantic Query Service
 * Gemini AI ile Türkçe konuyu İngilizce arama sorgusuna çevirir
 */

import { GoogleGenAI } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("Gemini API Key is missing");
  }
  return new GoogleGenAI({ apiKey });
};

// Retry helper
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1500
): Promise<T> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      const errorMessage = error?.message || String(error);
      const isRetryable = 
        errorMessage.includes('503') || 
        errorMessage.includes('overloaded') ||
        errorMessage.includes('UNAVAILABLE');
      
      if (isRetryable && attempt < maxRetries) {
        const delay = baseDelay * attempt;
        console.log(`[SemanticQuery Retry] Attempt ${attempt}/${maxRetries}. Waiting ${delay}ms...`);
        await sleep(delay);
        continue;
      }
      throw error;
    }
  }
  throw lastError;
};

/**
 * Türkçe staj konusunu İngilizce görsel arama sorgusuna çevirir
 * Keyword map yerine AI ile semantic anlama kullanır
 */
export const generateImageSearchQuery = async (turkishTopic: string): Promise<string> => {
  const ai = getAiClient();
  
  const prompt = `You are an expert at converting Turkish electrical engineering internship topics into optimal English image search queries.

TASK: Convert the following Turkish topic into a SHORT, EFFECTIVE English image search query (3-6 words max).

RULES:
1. Focus on the VISUAL aspect - what would the image show?
2. Use common English technical terms
3. Keep it SHORT (3-6 words) for better search results
4. Add "electrical" or relevant context word if needed
5. NO Turkish words in output
6. NO explanations, just the search query

EXAMPLES:
"Yangın algılama sistemi dedektör montajı ve test işlemleri" → "fire detector installation testing"
"AutoCAD'de iki katlı villa projesi aydınlatma planı çizimi" → "AutoCAD electrical lighting plan drawing"
"Trafo Dyn11 bağlantı grubu vektör diyagramı incelemesi" → "transformer Dyn11 vector group diagram"
"Kompanzasyon sistemi için cos φ tabloları ile kVAr hesabı" → "power factor correction capacitor bank"
"Kesintisiz güç kaynağı (UPS) akü grubu değişimi ve bakımı" → "UPS battery replacement maintenance"
"Pano içi kablolama ve ferüleşme eğitimi" → "electrical panel wiring ferrule crimping"
"Şantiyede kablo tavası ve busbar sistemi montaj kontrolü" → "cable tray busbar installation site"

TURKISH TOPIC: "${turkishTopic}"

ENGLISH SEARCH QUERY:`;

  try {
    const response = await withRetry(async () => {
      return await ai.models.generateContent({
        model: "gemini-2.0-flash",
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        config: {
          temperature: 0.3,
          maxOutputTokens: 50,
        }
      });
    });
    
    const result = response.text?.trim() || '';
    
    // Temizle - sadece İngilizce kelimeler kalsın
    const cleaned = result
      .replace(/["""'']/g, '')
      .replace(/^(English Search Query:|Query:|Search:)/i, '')
      .trim()
      .split('\n')[0] // Sadece ilk satır
      .trim();
    
    console.log(`[SemanticQuery] "${turkishTopic}" → "${cleaned}"`);
    
    // Fallback: eğer çok kısa veya boşsa basit çeviri yap
    if (cleaned.length < 5) {
      return turkishTopic
        .replace(/[ğĞ]/g, 'g')
        .replace(/[üÜ]/g, 'u')
        .replace(/[şŞ]/g, 's')
        .replace(/[ıİ]/g, 'i')
        .replace(/[öÖ]/g, 'o')
        .replace(/[çÇ]/g, 'c')
        .split(' ')
        .slice(0, 4)
        .join(' ') + ' electrical';
    }
    
    return cleaned;
  } catch (error) {
    console.error('[SemanticQuery] Error:', error);
    // Fallback: basit transliteration
    return turkishTopic
      .replace(/[ğĞ]/g, 'g')
      .replace(/[üÜ]/g, 'u')
      .replace(/[şŞ]/g, 's')
      .replace(/[ıİ]/g, 'i')
      .replace(/[öÖ]/g, 'o')
      .replace(/[çÇ]/g, 'c')
      .split(' ')
      .slice(0, 4)
      .join(' ') + ' electrical';
  }
};

/**
 * Birden fazla arama sorgusu varyasyonu üretir
 * Daha fazla görsel bulmak için
 */
export const generateMultipleQueries = async (turkishTopic: string): Promise<string[]> => {
  const ai = getAiClient();
  
  const prompt = `You are an expert at converting Turkish electrical engineering topics into English image search queries.

Generate 3 DIFFERENT search query variations for the same topic. Each should focus on a different visual aspect.

RULES:
1. Each query: 3-6 words max
2. Focus on VISUAL aspects
3. Use common English technical terms
4. Return ONLY the 3 queries, one per line
5. NO numbering, NO explanations

TURKISH TOPIC: "${turkishTopic}"

3 ENGLISH QUERIES:`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        temperature: 0.5,
        maxOutputTokens: 100,
      }
    });
    
    const result = response.text?.trim() || '';
    
    const queries = result
      .split('\n')
      .map(line => line.replace(/^[\d\.\-\*]+\s*/, '').replace(/["""'']/g, '').trim())
      .filter(line => line.length > 3 && line.length < 100)
      .slice(0, 3);
    
    console.log(`[SemanticQuery] Multiple queries for "${turkishTopic}":`, queries);
    
    if (queries.length === 0) {
      const single = await generateImageSearchQuery(turkishTopic);
      return [single];
    }
    
    return queries;
  } catch (error) {
    console.error('[SemanticQuery] Multiple query error:', error);
    const single = await generateImageSearchQuery(turkishTopic);
    return [single];
  }
};