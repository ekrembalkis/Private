/**
 * Gemini Service v2.0 - Curriculum Integrated
 * Progressive learning with context memory
 */

import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from '../constants';
import { DayEntry } from '../types';
import { 
  getCurriculumDay, 
  getWeekTheme,
  getAccumulatedSkills,
  getAccumulatedTools
} from '../curriculum';
import { GenerationContext } from '../curriculumTypes';
import { getExclusionPromptText, EXCLUDED_KEYWORDS } from '../excludedTopics';

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

// ============================================
// CONTEXT BUILDING
// ============================================

/**
 * Build rich context from curriculum and previous days
 */
const buildContextFromCurriculum = (
  day: DayEntry,
  previousDays: DayEntry[]
): GenerationContext | null => {
  const curriculumDay = getCurriculumDay(day.dayNumber);
  if (!curriculumDay) return null;

  const weekTheme = getWeekTheme(curriculumDay.weekNumber);
  
  // Get saved previous days sorted by day number
  const savedDays = previousDays
    .filter(d => d.isSaved && d.dayNumber < day.dayNumber)
    .sort((a, b) => a.dayNumber - b.dayNumber);

  // Build previous days summary (last 5 days)
  const previousDaysSummary = savedDays
    .slice(-5)
    .map(d => `Day ${d.dayNumber}: ${d.workTitle || d.specificTopic}`);

  // Get last day for continuity
  const lastDay = savedDays[savedDays.length - 1];

  // Get next day preview
  const nextCurriculumDay = getCurriculumDay(day.dayNumber + 1);

  // Calculate skill level based on completed days
  const completedCount = savedDays.length;
  let skillLevel: 'beginner' | 'intermediate' | 'advanced' = 'beginner';
  if (completedCount >= 20) skillLevel = 'advanced';
  else if (completedCount >= 10) skillLevel = 'intermediate';

  return {
    currentDay: day.dayNumber,
    currentWeek: curriculumDay.weekNumber,
    skillLevel,
    previousDaysSummary,
    learnedSkills: getAccumulatedSkills(day.dayNumber - 1),
    usedTools: getAccumulatedTools(day.dayNumber - 1),
    todayObjectives: curriculumDay.objectives,
    suggestedActivities: curriculumDay.suggestedActivities,
    topicsToReference: curriculumDay.buildUponTopics,
    topicsToAvoid: curriculumDay.avoidTopics,
    lastDayTopic: lastDay?.specificTopic || '',
    lastDayWorkTitle: lastDay?.workTitle || '',
    nextDayPreview: nextCurriculumDay?.primaryTopic
  };
};

/**
 * Generate the curriculum context section for AI prompt
 */
const generateCurriculumPrompt = (context: GenerationContext): string => {
  const lines: string[] = [];

  // Position info
  lines.push('=== STAJ BAĞLAMI (INTERNSHIP CONTEXT) ===');
  lines.push('');
  lines.push(`Bu stajın ${context.currentDay}. günü (Hafta ${context.currentWeek}).`);
  lines.push(`Stajyerin mevcut seviyesi: ${context.skillLevel.toUpperCase()}`);
  lines.push('');

  // Previous days for continuity
  if (context.previousDaysSummary.length > 0) {
    lines.push('ÖNCEKİ GÜNLER (süreklilik için):');
    context.previousDaysSummary.forEach(summary => {
      lines.push(`  • ${summary}`);
    });
    lines.push('');
  }

  // Yesterday's work for direct continuity
  if (context.lastDayTopic && context.currentDay > 1) {
    lines.push(`DÜN (Gün ${context.currentDay - 1}):`);
    lines.push(`  Konu: ${context.lastDayTopic}`);
    if (context.lastDayWorkTitle) {
      lines.push(`  Başlık: ${context.lastDayWorkTitle}`);
    }
    lines.push('');
  }

  // Today's objectives from curriculum
  if (context.todayObjectives.length > 0) {
    lines.push('BUGÜNÜN ÖĞRENME HEDEFLERİ:');
    context.todayObjectives.forEach(obj => {
      lines.push(`  • ${obj}`);
    });
    lines.push('');
  }

  // Suggested activities
  if (context.suggestedActivities.length > 0) {
    lines.push('ÖNERİLEN AKTİVİTELER:');
    context.suggestedActivities.forEach(activity => {
      lines.push(`  • ${activity}`);
    });
    lines.push('');
  }

  // Skills already learned (for natural reference)
  if (context.learnedSkills.length > 0) {
    const recentSkills = context.learnedSkills.slice(-8);
    lines.push('DAHA ÖNCE ÖĞRENİLEN BECERİLER (doğal şekilde referans verilebilir):');
    lines.push(`  ${recentSkills.join(', ')}`);
    lines.push('');
  }

  // Topics to build upon
  if (context.topicsToReference.length > 0) {
    lines.push('ÜZERİNE İNŞA EDİLECEK KONULAR (önceki öğrenmelere referans ver):');
    context.topicsToReference.forEach(topic => {
      lines.push(`  • ${topic}`);
    });
    lines.push('');
  }

  // Topics to avoid repeating
  if (context.topicsToAvoid.length > 0) {
    lines.push('KAÇINILACAK KONULAR (zaten detaylı işlendi):');
    context.topicsToAvoid.forEach(topic => {
      lines.push(`  • ${topic}`);
    });
    lines.push('');
  }

  // Tomorrow preview for foreshadowing
  if (context.nextDayPreview) {
    lines.push('YARININ ÖN İZLEMESİ:');
    lines.push(`  Sonraki konu: ${context.nextDayPreview}`);
    lines.push('  (İsteğe bağlı: yarına hazırlık veya ipucu verilebilir)');
    lines.push('');
  }

  // Continuity rules
  lines.push('=== SÜREKLİLİK KURALLARI ===');
  lines.push('1. Önceki günlerde detaylı anlatılan konuları TEKRAR ETME');
  lines.push('2. Önceki öğrenmelere doğal referans ver ("daha önce öğrendiğim...", "geçen hafta gördüğümüz...")');
  lines.push('3. İlerleme hissi oluştur, bugünün işi dünün devamı gibi hissettirmeli');
  lines.push('4. Gün 1 ise, gerçek bir ilk gün oryantasyonu olarak yaz');
  lines.push(`5. Seviyeye uygun detay ver: ${context.skillLevel} seviyesi`);
  lines.push('');

  return lines.join('\n');
};

// ============================================
// ENHANCED SYSTEM PROMPT
// ============================================

const ENHANCED_SYSTEM_PROMPT = `
${SYSTEM_PROMPT}

EK KURALLAR (PROGRESSIVE LEARNING):
1. Bu staj 30 günlük bir öğrenme sürecidir. Her gün bir öncekinin üzerine inşa edilir.
2. İlk günlerde (1-5) temel kavramlar ve oryantasyon ağırlıklı yaz.
3. Orta günlerde (6-20) pratik uygulamalar ve teknik detaylar artmalı.
4. Son günlerde (21-30) bağımsız çalışma ve ileri konular işlenmeli.
5. "Bugün ilk kez..." ifadesini sadece gerçekten ilk kez yapılan işler için kullan.
6. Daha önce kullanılan aletlere "artık aşina olduğum multimetre ile..." gibi doğal referanslar ver.
7. Hafta başlarında hafta temasına uygun giriş yap.
8. Önemli milestone günlerinde (5, 10, 15, 20, 25, 30) özet/değerlendirme hissi ver.

${getExclusionPromptText()}
`;

// ============================================
// MAIN GENERATION FUNCTION
// ============================================

export const generateDayContent = async (
  day: DayEntry, 
  previousDays: DayEntry[] = []
): Promise<{ text: string; visualDesc?: string; workTitle?: string }> => {
  const ai = getAiClient();
  
  // Build curriculum context
  const context = buildContextFromCurriculum(day, previousDays);
  const curriculumDay = getCurriculumDay(day.dayNumber);
  const weekTheme = curriculumDay ? getWeekTheme(curriculumDay.weekNumber) : null;
  
  // Generate curriculum context prompt
  const curriculumPrompt = context ? generateCurriculumPrompt(context) : '';
  
  // Legacy context summary (kept for backwards compatibility)
  const legacyContextSummary = previousDays
    .filter(d => d.isSaved && d.dayNumber < day.dayNumber)
    .map(d => `- Gün ${d.dayNumber}: ${d.workTitle || d.specificTopic}`)
    .join('\n');
  
  // Build the complete prompt
  const userPrompt = `
${curriculumPrompt}

=== BUGÜNÜN DETAYLARI ===
Tarih: ${day.date} (Gün ${day.dayNumber}${weekTheme ? ` / Hafta ${curriculumDay?.weekNumber}: ${weekTheme.title}` : ''})
Staj Türü: ${day.type}
GÜNÜN SPESİFİK GÖREVİ: ${day.specificTopic}
${curriculumDay ? `Müfredat Konusu: ${curriculumDay.primaryTopic}` : ''}
${curriculumDay ? `Zorluk Seviyesi: ${curriculumDay.difficulty}/5` : ''}
${curriculumDay?.isKeyMilestone ? '⭐ Bu gün önemli bir MILESTONE günüdür!' : ''}
${day.customPrompt ? `ÖZEL DİREKTİF: ${day.customPrompt}` : ''}
Görsel Durumu: ${day.hasVisual ? 'Görsel Mevcut' : 'Görsel Yok'}

${day.imageUrl ? `ÖNEMLİ: Bu gün için seçilen görsel şu konuyu göstermektedir: "${day.specificTopic}".` : ''}

${day.imageUrl && day.imageAnalysis ? `
SEÇİLEN GÖRSEL ANALİZİ: ${day.imageAnalysis}

GÖRSEL KURALLARI:
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

ASLA görselde olmayan işlemleri anlatma!
` : ''}

${!context && legacyContextSummary ? `
DAHA ÖNCE YAZILAN GÜNLER (Referans):
${legacyContextSummary}

UYARI: Geçmiş günlerdeki anlatımları birebir tekrar etme.
` : ''}

=== ÇIKTI FORMATI ===
Lütfen aşağıdaki formatta içerik üret. Başka hiçbir giriş/çıkış konuşması yapma.

FORMAT:
ÇALIŞMA RAPORU: [Yapılan işi özetleyen 2-5 kelimelik resmi başlık. Örn: "Pano Montajı ve Kablolama"]

[Detaylı staj defteri içeriği. 2-4 paragraf. Teknik detaylı ve samimi.]
${context && context.currentDay === 1 ? '\n(İlk gün olduğu için oryantasyon ve tanışma ağırlıklı olmalı)' : ''}
${context && context.currentDay === 30 ? '\n(Son gün olduğu için değerlendirme ve veda havası olmalı)' : ''}
${curriculumDay?.isKeyMilestone ? '\n(Milestone günü - öğrenilenlerin kısa özeti ve ilerleme hissi ver)' : ''}

${day.hasVisual ? '[GÖRSEL AÇIKLAMASI: Görselin ne olduğunu anlatan kısa not]' : ''}
`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction: ENHANCED_SYSTEM_PROMPT,
      },
      contents: userPrompt
    });

    const rawText = response.text || "İçerik oluşturulamadı.";
    
    let finalContent = rawText;
    let visualDesc = undefined;
    let workTitle = "Genel Çalışma";

    // 1. Parse Work Title
    const lines = rawText.split('\n');
    const titleIndex = lines.findIndex(line => line.trim().toUpperCase().startsWith('ÇALIŞMA RAPORU:'));
    
    if (titleIndex !== -1) {
      const titleLine = lines[titleIndex];
      workTitle = titleLine.replace(/ÇALIŞMA RAPORU:/i, '').trim();
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

// ============================================
// BATCH GENERATION WITH CONTEXT
// ============================================

/**
 * Generate content for multiple days in sequence
 * Each day uses context from previously generated days
 */
export const generateDaysInSequence = async (
  days: DayEntry[],
  existingSavedDays: DayEntry[],
  onProgress?: (dayNumber: number, result: { text: string; workTitle?: string }) => void
): Promise<Map<number, { text: string; visualDesc?: string; workTitle?: string }>> => {
  const results = new Map();
  
  // Sort days by day number
  const sortedDays = [...days].sort((a, b) => a.dayNumber - b.dayNumber);
  
  // Combine existing saved days with newly generated ones for context
  let allDays = [...existingSavedDays];
  
  for (const day of sortedDays) {
    try {
      // Generate with all available context
      const result = await generateDayContent(day, allDays);
      results.set(day.dayNumber, result);
      
      // Add to context for next days
      allDays = [...allDays, { 
        ...day, 
        content: result.text, 
        workTitle: result.workTitle,
        isSaved: true,
        isGenerated: true
      }];
      
      // Callback for progress tracking
      if (onProgress) {
        onProgress(day.dayNumber, result);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
      
    } catch (error) {
      console.error(`Error generating day ${day.dayNumber}:`, error);
      results.set(day.dayNumber, { 
        text: `Gün ${day.dayNumber} içeriği oluşturulamadı.`, 
        workTitle: 'Hata' 
      });
    }
  }
  
  return results;
};

// ============================================
// UTILITY EXPORTS
// ============================================

export const generateImagePrompt = (description: string): string => {
  const prompt = `Realistic iPhone 13 photo, no filter, natural lighting. First person POV shot by an electrical engineering intern at workplace. Scene: ${description}. Not perfect stock photo quality, slightly imperfect, authentic textures, natural ambient light, casual snapshot feel. Turkish workplace environment.`;
  
  return prompt;
};

/**
 * Get curriculum info for UI display
 */
export const getDayContextInfo = (dayNumber: number, savedDays: DayEntry[]) => {
  const curriculumDay = getCurriculumDay(dayNumber);
  if (!curriculumDay) return null;

  const weekTheme = getWeekTheme(curriculumDay.weekNumber);
  const completedPrereqs = curriculumDay.prerequisiteDays.filter(
    pd => savedDays.some(d => d.dayNumber === pd && d.isSaved)
  );

  return {
    weekNumber: curriculumDay.weekNumber,
    weekTitle: weekTheme?.title || '',
    primaryTopic: curriculumDay.primaryTopic,
    objectives: curriculumDay.objectives,
    difficulty: curriculumDay.difficulty,
    isKeyMilestone: curriculumDay.isKeyMilestone,
    prerequisiteDays: curriculumDay.prerequisiteDays,
    completedPrereqs,
    allPrereqsMet: completedPrereqs.length === curriculumDay.prerequisiteDays.length,
    suggestVisual: curriculumDay.suggestVisual,
    visualType: curriculumDay.visualType
  };
};