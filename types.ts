
export enum InternshipType {
  PRODUCTION_DESIGN = 'Üretim/Tasarım',
  MANAGEMENT = 'İşletme'
}

export interface DayEntry {
  dayNumber: number;
  date: string; // DD.MM.YYYY
  type: InternshipType;
  specificTopic: string; // Günün spesifik konusu (Prompt girdisi)
  workTitle?: string; // Oluşturulan kısa başlık (Çalışma Raporu çıktısı)
  content: string;
  isGenerated: boolean;
  isSaved?: boolean; // Firestore'a kaydedildi mi?
  isLoading: boolean;
  hasVisual: boolean;
  visualDescription?: string;
  imagePrompt?: string;
  imageUrl?: string;
  imageSource?: 'ai' | 'stock';
  isImageLoading?: boolean;
  topic?: string;
}

export interface GenerationStats {
  totalDays: number;
  productionDays: number;
  managementDays: number;
  completed: number;
}