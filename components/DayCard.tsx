
import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { DayEntry, InternshipType } from '../types';
import { RefreshCw, Camera, PenTool, Loader2, Calendar, ChevronRight, Save, CheckCircle2, CloudUpload, Trash2, Copy, Check, Pencil, X, ChevronDown, ImagePlus, Sparkles, Image as ImageIcon, Lightbulb } from 'lucide-react';
import { PRODUCTION_TOPICS, MANAGEMENT_TOPICS, TECHNICAL_TABLE_TOPICS } from '../constants';
import { CurriculumBadge, CurriculumBadgeCompact } from './CurriculumBadge';
import { getDayContextInfo, generateSmartPlanSuggestion, SmartPlanSuggestion } from '../services/geminiService';

interface DayCardProps {
  day: DayEntry;
  savedDays: DayEntry[];
  onRegenerate: (day: DayEntry) => void;
  onSave: (day: DayEntry) => Promise<void>;
  onDelete: (day: DayEntry) => Promise<void>;
  onUpdatePlan: (day: DayEntry, newType: InternshipType, newTopic: string, customPrompt: string) => Promise<void>;
  onSearchImage: (day: DayEntry) => Promise<void>;
  onQuickImageSearch: (day: DayEntry) => Promise<void>;
  onImageClick: (imageUrl: string) => void;
  onOpenVisualGuide: (day: DayEntry) => void;
  isLast: boolean;
}

export const DayCard: React.FC<DayCardProps> = ({ 
  day, 
  savedDays,
  onRegenerate, 
  onSave, 
  onDelete, 
  onUpdatePlan, 
  onSearchImage,
  onQuickImageSearch,
  onImageClick,
  onOpenVisualGuide,
  isLast 
}) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isQuickSearching, setIsQuickSearching] = useState(false);
  
  // AI Suggestion States
  const [isLoadingAISuggestion, setIsLoadingAISuggestion] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<SmartPlanSuggestion | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<InternshipType>(day.type);
  const [editTopic, setEditTopic] = useState<string>(day.specificTopic);
  const [editCustomPrompt, setEditCustomPrompt] = useState<string>(day.customPrompt || '');
  const [isCustomTopic, setIsCustomTopic] = useState(false);
  const [topicCategory, setTopicCategory] = useState<'production' | 'tables' | 'management'>('production');
  
  // Curriculum State
  const [showCurriculum, setShowCurriculum] = useState(false);
  const curriculumInfo = getDayContextInfo(day.dayNumber, savedDays);

  // Sync state with props when day changes
  useEffect(() => {
    setEditType(day.type);
    setEditTopic(day.specificTopic);
    setEditCustomPrompt(day.customPrompt || '');

    // Check which list the topic belongs to
    if (TECHNICAL_TABLE_TOPICS.includes(day.specificTopic)) {
      setTopicCategory('tables');
      setIsCustomTopic(false);
    } else if (PRODUCTION_TOPICS.includes(day.specificTopic)) {
      setTopicCategory('production');
      setIsCustomTopic(false);
    } else if (MANAGEMENT_TOPICS.includes(day.specificTopic)) {
      setTopicCategory('management');
      setIsCustomTopic(false);
    } else {
      // Custom topic
      if (day.type === InternshipType.PRODUCTION_DESIGN) {
        setTopicCategory('production');
      } else {
        setTopicCategory('management');
      }
      setIsCustomTopic(true);
    }
  }, [day.type, day.specificTopic, day.customPrompt]);

  const isProduction = day.type === InternshipType.PRODUCTION_DESIGN;
  const isCompleted = day.isGenerated;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(day);
    setIsSaving(false);
  };

  const handleQuickSearch = async () => {
    setIsQuickSearching(true);
    await onQuickImageSearch(day);
    setIsQuickSearching(false);
  };

  // AI Önerisi Al
  const handleGetAISuggestion = async () => {
    setIsLoadingAISuggestion(true);
    setAiSuggestion(null);
    
    try {
      const internshipType = editType === InternshipType.PRODUCTION_DESIGN ? 'production' : 'management';
      const suggestion = await generateSmartPlanSuggestion(day.dayNumber, savedDays, internshipType);
      
      setAiSuggestion(suggestion);
      
      // Öneriyi otomatik olarak alanlara doldur
      setEditTopic(suggestion.suggestedTopic);
      setEditCustomPrompt(suggestion.suggestedDirective);
      setIsCustomTopic(true); // Custom topic moduna geç
    } catch (error) {
      console.error('AI Suggestion Error:', error);
    } finally {
      setIsLoadingAISuggestion(false);
    }
  };

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    await onDelete(day);
    setIsDeleting(false);
    setShowDeleteConfirm(false);
  };

  const handleCopy = async () => {
    if (!day.content) return;
    
    try {
      const textToCopy = `TARİH: ${day.date}\nÇALIŞMA RAPORU: ${day.workTitle || day.specificTopic}\n\n${day.content}`;
      await navigator.clipboard.writeText(textToCopy);
      
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000); 
    } catch (err) {
      console.error("Failed to copy text", err);
    }
  };

  const handleEditClick = () => {
    setEditType(day.type);
    setEditTopic(day.specificTopic);
    setEditCustomPrompt(day.customPrompt || '');
    setAiSuggestion(null); // Reset AI suggestion
    
    // Determine which category the topic belongs to
    if (TECHNICAL_TABLE_TOPICS.includes(day.specificTopic)) {
      setTopicCategory('tables');
      setIsCustomTopic(false);
    } else if (PRODUCTION_TOPICS.includes(day.specificTopic)) {
      setTopicCategory('production');
      setIsCustomTopic(false);
    } else if (MANAGEMENT_TOPICS.includes(day.specificTopic)) {
      setTopicCategory('management');
      setIsCustomTopic(false);
    } else {
      if (day.type === InternshipType.PRODUCTION_DESIGN) {
        setTopicCategory('production');
      } else {
        setTopicCategory('management');
      }
      setIsCustomTopic(true);
    }
    
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsEditing(false); 
    await onUpdatePlan(day, editType, editTopic, editCustomPrompt);
  };

  const handleCategoryChange = (category: 'production' | 'tables' | 'management') => {
    setTopicCategory(category);
    
    // Set the internship type based on category
    if (category === 'management') {
      setEditType(InternshipType.MANAGEMENT);
    } else {
      // Both 'production' and 'tables' are PRODUCTION_DESIGN type
      setEditType(InternshipType.PRODUCTION_DESIGN);
    }
    
    // If we are NOT in custom mode, update the topic to the first item of the new list
    if (!isCustomTopic) {
      if (category === 'production') {
        setEditTopic(PRODUCTION_TOPICS[0]);
      } else if (category === 'tables') {
        setEditTopic(TECHNICAL_TABLE_TOPICS[0]);
      } else {
        setEditTopic(MANAGEMENT_TOPICS[0]);
      }
    }
  };

  const toggleCustomTopic = () => {
      const newCustomState = !isCustomTopic;
      setIsCustomTopic(newCustomState);
      
      if (!newCustomState) {
          // Switching back to list: reset topic to first item of current category
          if (topicCategory === 'production') {
              setEditTopic(PRODUCTION_TOPICS[0]);
          } else if (topicCategory === 'tables') {
              setEditTopic(TECHNICAL_TABLE_TOPICS[0]);
          } else {
              setEditTopic(MANAGEMENT_TOPICS[0]);
          }
      } else {
          // Switching to custom: clear the text to let user type fresh
          setEditTopic("");
      }
  };
  
  // Get current topic list based on category
  const getCurrentTopicList = () => {
    if (topicCategory === 'production') return PRODUCTION_TOPICS;
    if (topicCategory === 'tables') return TECHNICAL_TABLE_TOPICS;
    return MANAGEMENT_TOPICS;
  };

  return (
    <div className="flex gap-4 sm:gap-6 group animate-fade-in relative">
      <div className="flex flex-col items-center flex-shrink-0 w-12 sm:w-16">
        <div 
          className={`
            w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-sm sm:text-base font-bold shadow-lg z-10 transition-all duration-300 border
            ${day.isLoading 
              ? 'bg-blue-900/20 border-blue-500/50 text-blue-400' 
              : isCompleted 
                ? (isProduction 
                    ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 shadow-amber-900/20' 
                    : 'bg-blue-500/10 border-blue-500/50 text-blue-500 shadow-blue-900/20')
                : 'bg-zinc-900 border-zinc-700 text-zinc-600'}
            ${day.isSaved && isCompleted ? 'ring-2 ring-emerald-500/50' : ''}
          `}
        >
          {day.isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : day.dayNumber}
        </div>
        {!isLast && (
          <div className="w-px flex-1 bg-zinc-800 my-2 group-hover:bg-zinc-700 transition-colors" style={{ minHeight: '3rem' }} />
        )}
      </div>

      <div className="flex-1 pb-12 min-w-0">
        <div className={`
          relative rounded-2xl border transition-all duration-300 overflow-hidden
          ${day.isSaved && isCompleted
            ? 'bg-zinc-900 border-emerald-900/30 shadow-[0_0_15px_rgba(16,185,129,0.05)]' 
            : isCompleted 
                ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 shadow-sm' 
                : 'bg-zinc-900/30 border-zinc-800/50 border-dashed hover:bg-zinc-900/50'}
        `}>
          
          <div className="px-5 py-4 border-b border-zinc-800/50 flex flex-wrap justify-between items-center gap-3 bg-zinc-900/50">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="bg-zinc-800 p-2 rounded-lg text-zinc-400 flex-shrink-0">
                <Calendar className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-zinc-200 text-sm sm:text-base font-sans tracking-wide">{day.date}</h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`w-1.5 h-1.5 rounded-full ${isProduction ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' : 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]'}`}></span>
                    <p className={`text-xs font-bold uppercase tracking-wider ${isProduction ? 'text-amber-500/80' : 'text-blue-500/80'}`}>
                      {isProduction ? 'Üretim' : 'İşletme'}
                    </p>
                  </div>
                  {/* Curriculum Badge Compact */}
                  <div className="hidden sm:block">
                    <CurriculumBadgeCompact info={curriculumInfo} />
                  </div>
                </div>
                {isCompleted ? (
                   <p className="text-sm font-medium text-zinc-300 mt-0.5 truncate max-w-[200px] sm:max-w-md">
                     <span className="text-zinc-500 mr-1 text-xs uppercase tracking-wide">RAPOR:</span>
                     {day.workTitle}
                   </p>
                ) : (
                   <p className="text-xs text-zinc-500 mt-0.5 truncate max-w-[200px] sm:max-w-md">
                     Konu: {day.specificTopic}
                   </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {day.hasVisual && (
                <div className="hidden sm:flex px-2.5 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-medium rounded-full items-center gap-1.5">
                  <Camera className="w-3 h-3" />
                  Görsel
                </div>
              )}
              
              {isCompleted ? (
                <>
                  <button
                    onClick={handleCopy}
                    className={`
                      p-2 rounded-lg transition-all
                      ${isCopied 
                        ? 'text-emerald-400 bg-emerald-500/10 border border-emerald-500/20' 
                        : 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 border border-transparent'}
                    `}
                    title="Metni Kopyala"
                  >
                    {isCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving || day.isSaved}
                    className={`
                      flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                      ${day.isSaved 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default' 
                          : 'bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20 active:scale-95'}
                    `}
                  >
                    {isSaving ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : day.isSaved ? (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Kaydedildi</span>
                      </>
                    ) : (
                      <>
                        <CloudUpload className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Kaydet</span>
                      </>
                    )}
                  </button>

                  {day.isSaved && (
                     <button 
                       onClick={handleDeleteClick}
                       disabled={isDeleting}
                       className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all border border-transparent"
                       title="Veritabanından Sil"
                     >
                       <Trash2 className="w-4 h-4" />
                     </button>
                  )}
                  
                  {!day.isSaved && (
                     <button 
                       onClick={handleEditClick}
                       className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all border border-transparent"
                       title="Planı Düzenle"
                     >
                       <Pencil className="w-4 h-4" />
                     </button>
                  )}
                </>
              ) : (
                <button 
                   onClick={handleEditClick}
                   className="p-2 text-zinc-500 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all border border-transparent"
                   title="Planı Düzenle"
                 >
                   <Pencil className="w-4 h-4" />
                 </button>
              )}

              {isCompleted && (
                <button 
                  onClick={() => onRegenerate(day)}
                  disabled={day.isLoading || day.isImageLoading}
                  className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all border border-transparent"
                  title="Yeniden Yaz"
                >
                  {day.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                </button>
              )}
            </div>
          </div>

          <div className="p-5 sm:p-6">
            {isCompleted ? (
              <div className="space-y-4">
                <div className="prose prose-sm prose-invert max-w-none">
                  {day.content.split('\n\n').map((paragraph, idx) => (
                    <p key={idx} className="leading-relaxed text-zinc-400 text-[15px]">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                {day.hasVisual && (
                  <div className="mt-6 p-4 bg-black/20 border border-zinc-800 rounded-xl relative overflow-hidden">
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/50"></div>
                     
                     <div className="flex flex-col gap-4">
                        <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wide flex items-center gap-1.5">
                              <Camera className="w-3.5 h-3.5" /> 
                              {day.imageUrl ? 'Seçilen Görsel' : 'Görsel Seç'}
                            </h4>
                            
                            <button 
                                onClick={() => onOpenVisualGuide(day)}
                                className="text-[10px] text-white hover:bg-amber-600 flex items-center gap-1 bg-amber-500 px-2.5 py-1.5 rounded-lg shadow-sm transition-colors"
                            >
                                <Camera className="w-3 h-3" />
                                Görsel Rehberi
                            </button>
                        </div>
                        
                        {day.imageUrl ? (
                          <div className="flex items-center gap-4">
                            <img 
                              src={day.imageUrl} 
                              alt="Seçilen Görsel" 
                              className="w-24 h-24 object-cover rounded-lg border border-zinc-700 cursor-pointer hover:opacity-80 transition-opacity"
                              onClick={() => onImageClick(day.imageUrl!)}
                            />
                            <div className="flex-1">
                              <p className="text-sm text-zinc-400 mb-2">Görsel seçildi</p>
                              <button 
                                onClick={() => onSearchImage(day)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium border border-zinc-700 transition-all"
                              >
                                <ImageIcon className="w-3 h-3" />
                                Değiştir
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button 
                            onClick={() => onSearchImage(day)}
                            disabled={day.isImageLoading}
                            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-all w-full"
                          >
                            {day.isImageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                            Görsel Seç
                          </button>
                        )}
                     </div>
                  </div>
                )}

                {/* Opsiyonel Görsel - Görsel zorunlu olmayan günlerde */}
                {!day.hasVisual && (
                  <div className="mt-4 flex justify-center">
                    {day.imageUrl ? (
                      <div className="flex items-center gap-3 p-3 bg-zinc-900/50 border border-zinc-800/50 rounded-lg">
                        <img 
                          src={day.imageUrl} 
                          alt="Opsiyonel Görsel" 
                          className="w-14 h-14 object-cover rounded-md border border-zinc-700/50 cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => onImageClick(day.imageUrl!)}
                        />
                        <div className="flex flex-col gap-1">
                          <span className="text-[10px] text-zinc-500 italic">opsiyonel görsel</span>
                          <button 
                            onClick={() => onSearchImage(day)}
                            className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-300 transition-colors"
                          >
                            <RefreshCw className="w-2.5 h-2.5" />
                            değiştir
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2 opacity-40 hover:opacity-100 transition-opacity">
                        <span className="text-[10px] text-zinc-500 italic">görsel ekle (opsiyonel)</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => onQuickImageSearch(day)}
                            disabled={day.isImageLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 text-zinc-400 rounded-lg text-[11px] hover:bg-zinc-700/50 hover:text-zinc-300 transition-all border border-zinc-700/50"
                            title="Konuya göre otomatik görsel bul"
                          >
                            <Sparkles className="w-3 h-3" />
                            Otomatik
                          </button>
                          <button
                            onClick={() => onSearchImage(day)}
                            disabled={day.isImageLoading}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 text-zinc-400 rounded-lg text-[11px] hover:bg-zinc-700/50 hover:text-zinc-300 transition-all border border-zinc-700/50"
                            title="Manuel görsel ara"
                          >
                            {day.isImageLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                            Manuel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-600">
                <div className="w-12 h-12 rounded-full bg-zinc-800/50 border border-zinc-800 flex items-center justify-center mb-4">
                  <PenTool className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="flex flex-col items-center gap-1 mb-6">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-500 border border-zinc-700">GÖREV BEKLİYOR</span>
                  <span className="text-sm font-medium text-zinc-400 text-center max-w-xs">{day.specificTopic}</span>
                  
                  {day.hasVisual && (
                    <button 
                        onClick={() => onOpenVisualGuide(day)}
                        className="text-[10px] text-white hover:bg-amber-600 flex items-center gap-1.5 mt-2 bg-amber-500 px-3 py-1.5 rounded-full shadow-lg shadow-amber-900/20 transition-all"
                    >
                        <Camera className="w-3 h-3" />
                        <span>Görsel Rehberi</span>
                    </button>
                  )}
                </div>

                {/* Workflow Logic: Visual First */}
                {day.hasVisual && !day.imageUrl ? (
                  <div className="flex flex-col items-center gap-3 w-full max-w-xs animate-in fade-in slide-in-from-bottom-2">
                    <p className="text-xs text-purple-400 font-medium bg-purple-500/10 px-3 py-1.5 rounded-full border border-purple-500/20 mb-1">
                      Bu gün için önce görsel seçmelisiniz
                    </p>
                    <div className="flex gap-2 w-full">
                      <button 
                        onClick={handleQuickSearch}
                        disabled={day.isImageLoading || isQuickSearching}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-900/20"
                        title="Konuya göre otomatik görsel bul"
                      >
                        {isQuickSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        Otomatik Bul
                      </button>
                      <button 
                        onClick={() => onSearchImage(day)}
                        disabled={day.isImageLoading}
                        className="flex-1 flex items-center justify-center gap-2 px-3 py-3 bg-purple-600 text-white rounded-xl text-xs font-bold hover:bg-purple-500 transition-all shadow-lg shadow-purple-900/20"
                      >
                        {day.isImageLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                        Manuel Seç
                      </button>
                    </div>
                    <button 
                       disabled
                       className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-zinc-800 text-zinc-500 rounded-xl text-sm font-semibold cursor-not-allowed border border-zinc-700"
                    >
                      İçeriği Oluştur
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 w-full max-w-xs animate-in fade-in slide-in-from-bottom-2">
                     {day.imageUrl && (
                        <div className="relative group/img mb-2">
                           <img 
                              src={day.imageUrl} 
                              alt="Seçilen Referans" 
                              className="w-20 h-20 object-cover rounded-lg border-2 border-purple-500/50 shadow-lg shadow-purple-900/20" 
                           />
                           <button 
                             onClick={() => onSearchImage(day)}
                             className="absolute -top-2 -right-2 bg-zinc-800 text-zinc-300 p-1 rounded-full border border-zinc-600 hover:text-white hover:bg-zinc-700 shadow-md"
                             title="Görseli Değiştir"
                           >
                              <RefreshCw className="w-3 h-3" />
                           </button>
                        </div>
                     )}

                     {/* Opsiyonel Görsel Ekleme - Sadece görsel zorunlu olmayan günlerde */}
                     {!day.hasVisual && !day.imageUrl && (
                       <div className="flex flex-col items-center gap-2 mb-2 opacity-50 hover:opacity-100 transition-opacity">
                         <span className="text-[10px] text-zinc-500 italic">görsel ekle (opsiyonel)</span>
                         <div className="flex gap-2">
                           <button
                             onClick={handleQuickSearch}
                             disabled={day.isImageLoading || isQuickSearching}
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 text-zinc-400 rounded-lg text-[11px] hover:bg-zinc-700/50 hover:text-zinc-300 transition-all border border-zinc-700/50"
                             title="Konuya göre otomatik görsel bul"
                           >
                             {isQuickSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                             Otomatik
                           </button>
                           <button
                             onClick={() => onSearchImage(day)}
                             disabled={day.isImageLoading}
                             className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800/50 text-zinc-400 rounded-lg text-[11px] hover:bg-zinc-700/50 hover:text-zinc-300 transition-all border border-zinc-700/50"
                             title="Manuel görsel ara"
                           >
                             {day.isImageLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImageIcon className="w-3 h-3" />}
                             Manuel
                           </button>
                         </div>
                       </div>
                     )}

                    <button 
                      onClick={() => onRegenerate(day)}
                      disabled={day.isLoading}
                      className="group/btn relative w-full px-4 py-3 bg-zinc-100 text-zinc-900 rounded-xl text-sm font-bold hover:bg-white transition-all overflow-hidden flex items-center justify-center gap-2 shadow-lg shadow-white/5"
                    >
                      {day.isLoading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                           <span className="relative z-10">İçeriği Oluştur</span>
                           <ChevronRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-0.5 transition-transform" />
                        </>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
          
          {/* Curriculum Badge - Expandable */}
          <CurriculumBadge 
            info={curriculumInfo}
            isExpanded={showCurriculum}
            onToggle={() => setShowCurriculum(!showCurriculum)}
          />
          
          {day.isLoading && (
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center z-20">
               <div className="bg-zinc-900 px-4 py-3 rounded-xl shadow-2xl border border-zinc-700 flex items-center gap-3">
                 <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                 <span className="text-sm font-mono text-zinc-300">WRITING LOG...</span>
               </div>
            </div>
          )}

          {showDeleteConfirm && createPortal(
             <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center relative">
                    <div className="w-12 h-12 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                        <Trash2 className="w-6 h-6 text-red-500" />
                    </div>
                    <h4 className="text-white font-bold mb-2">Kaydı Sil?</h4>
                    <p className="text-zinc-400 text-xs mb-6 leading-relaxed">
                        Bu günü veritabanından silmek üzeresiniz. İçerik yerel olarak kalacak ancak 'Kaydedilmedi' durumuna dönecek.
                    </p>
                    <div className="flex gap-3 justify-center">
                        <button 
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 px-4 py-2 text-xs font-medium text-zinc-300 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors border border-zinc-800"
                        >
                            İptal
                        </button>
                        <button 
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="flex-1 px-4 py-2 text-xs font-medium bg-red-600 hover:bg-red-500 text-white rounded-lg shadow-lg shadow-red-900/20 flex items-center justify-center gap-2"
                        >
                            {isDeleting ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Evet, Sil'}
                        </button>
                    </div>
                </div>
             </div>,
             document.body
          )}

           {isEditing && createPortal(
              <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-in fade-in duration-200">
                 <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl max-w-md w-full text-left relative">
                    <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                    
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-amber-500" />
                        Planı Düzenle
                    </h3>

                    {/* AI Önerisi Bölümü */}
                    <div className="mb-6 p-4 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 border border-emerald-500/20 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">🧠</span>
                          <span className="text-sm font-bold text-emerald-400">AI Önerisi</span>
                        </div>
                        <button
                          onClick={handleGetAISuggestion}
                          disabled={isLoadingAISuggestion}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                        >
                          {isLoadingAISuggestion ? (
                            <>
                              <Loader2 className="w-3 h-3 animate-spin" />
                              Düşünüyor...
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-3 h-3" />
                              Öneri Al
                            </>
                          )}
                        </button>
                      </div>
                      <p className="text-xs text-zinc-400">
                        Önceki günlere bakarak bu gün için mantıklı bir konu ve direktif önerir.
                      </p>
                      
                      {aiSuggestion && (
                        <div className="mt-3 pt-3 border-t border-emerald-500/20 space-y-2">
                          <div className="flex items-start gap-2">
                            <span className="text-emerald-400 text-xs">💡</span>
                            <p className="text-xs text-zinc-300">{aiSuggestion.reasoning}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Staj Türü</label>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleCategoryChange('production')}
                                    className={`flex-1 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                                        topicCategory === 'production'
                                        ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                    }`}
                                >
                                    Üretim/Tasarım
                                </button>
                                <button
                                    onClick={() => handleCategoryChange('tables')}
                                    className={`flex-1 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                                        topicCategory === 'tables'
                                        ? 'bg-purple-500/10 border-purple-500 text-purple-500' 
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                    }`}
                                >
                                    📋 Tablolar
                                </button>
                                <button
                                    onClick={() => handleCategoryChange('management')}
                                    className={`flex-1 py-2.5 px-3 rounded-lg border text-xs font-medium transition-all ${
                                        topicCategory === 'management'
                                        ? 'bg-blue-500/10 border-blue-500 text-blue-500' 
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                    }`}
                                >
                                    İşletme
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <div className="flex items-center justify-between">
                                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Günlük Konu / Görev</label>
                                <button 
                                    onClick={toggleCustomTopic}
                                    className="text-[10px] text-blue-400 hover:text-blue-300 transition-colors font-medium hover:underline"
                                >
                                    {isCustomTopic ? 'Listeden Seç' : '+ Kendi Konumu Yaz'}
                                </button>
                             </div>
                             
                             {isCustomTopic ? (
                                <input 
                                    type="text"
                                    value={editTopic}
                                    onChange={(e) => setEditTopic(e.target.value)}
                                    placeholder="Bugünün ana konusu ne olsun?"
                                    autoFocus
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 placeholder-zinc-600"
                                />
                             ) : (
                                <div className="relative">
                                    <select 
                                        value={editTopic}
                                        onChange={(e) => setEditTopic(e.target.value)}
                                        className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none"
                                    >
                                        {getCurrentTopicList().map((t, i) => (
                                            <option key={i} value={t}>{t}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                                </div>
                             )}
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Özel Direktif (Opsiyonel)</label>
                             <textarea
                                value={editCustomPrompt}
                                onChange={(e) => setEditCustomPrompt(e.target.value)}
                                placeholder="Örn: Bugün 3 fazlı pano montajı yaptık..."
                                className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none"
                                rows={2}
                             />
                             <p className="text-xs text-zinc-600">Bu direktif AI'ın içerik yazarken rehber olarak kullanacağı ek bilgidir</p>
                        </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-zinc-800 flex justify-end gap-3">
                        <button 
                            onClick={() => setIsEditing(false)}
                            className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                            İptal
                        </button>
                        <button 
                            onClick={handleSaveEdit}
                            className="px-6 py-2 text-sm font-medium bg-amber-600 hover:bg-amber-500 text-white rounded-lg shadow-lg shadow-amber-900/20"
                        >
                            Değişiklikleri Kaydet
                        </button>
                    </div>
                 </div>
              </div>,
              document.body
           )}
        </div>
      </div>
    </div>
  );
};
