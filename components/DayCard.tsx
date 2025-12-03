
import React, { useState, useEffect } from 'react';
import { DayEntry, InternshipType } from '../types';
import { RefreshCw, Camera, PenTool, Loader2, Calendar, ChevronRight, Save, CheckCircle2, CloudUpload, Trash2, Copy, Check, Pencil, X, ChevronDown } from 'lucide-react';
import { PRODUCTION_TOPICS, MANAGEMENT_TOPICS } from '../constants';

interface DayCardProps {
  day: DayEntry;
  onRegenerate: (day: DayEntry) => void;
  onSave: (day: DayEntry) => Promise<void>;
  onDelete: (day: DayEntry) => Promise<void>;
  onUpdatePlan: (day: DayEntry, newType: InternshipType, newTopic: string) => Promise<void>;
  isLast: boolean;
}

export const DayCard: React.FC<DayCardProps> = ({ day, onRegenerate, onSave, onDelete, onUpdatePlan, isLast }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editType, setEditType] = useState<InternshipType>(day.type);
  const [editTopic, setEditTopic] = useState<string>(day.specificTopic);

  // Sync state with props when day changes
  useEffect(() => {
    setEditType(day.type);
    setEditTopic(day.specificTopic);
  }, [day.type, day.specificTopic]);

  const isProduction = day.type === InternshipType.PRODUCTION_DESIGN;
  const isCompleted = day.isGenerated;

  const handleSave = async () => {
    setIsSaving(true);
    await onSave(day);
    setIsSaving(false);
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
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    setIsEditing(false); 
    await onUpdatePlan(day, editType, editTopic);
  };

  const handleTypeChange = (type: InternshipType) => {
    setEditType(type);
    if (type === InternshipType.PRODUCTION_DESIGN) {
        setEditTopic(PRODUCTION_TOPICS[0]);
    } else {
        setEditTopic(MANAGEMENT_TOPICS[0]);
    }
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

              <button 
                onClick={() => onRegenerate(day)}
                disabled={day.isLoading || day.isImageLoading}
                className="p-2 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-all border border-transparent"
                title={isCompleted ? "Yeniden Yaz" : "İçeriği Oluştur"}
              >
                {day.isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
              </button>
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
                
                {day.hasVisual && day.visualDescription && (
                  <div className="mt-6 flex flex-col sm:flex-row gap-4 p-4 bg-black/20 border border-zinc-800 rounded-xl relative overflow-hidden">
                     <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500/50"></div>
                     <div className="flex-shrink-0 self-start sm:self-center">
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-lg bg-zinc-800 border border-zinc-700 p-1 flex items-center justify-center overflow-hidden">
                          {day.isImageLoading ? (
                            <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                          ) : day.imageUrl ? (
                            <img 
                              src={day.imageUrl} 
                              alt="Generated Visual" 
                              className="w-full h-full object-cover rounded hover:scale-110 transition-transform duration-500 cursor-zoom-in"
                            />
                          ) : (
                            <div className="text-zinc-600 text-[10px] text-center px-1">Görsel Bekleniyor</div>
                          )}
                        </div>
                     </div>
                     <div className="flex-1">
                        <h4 className="text-xs font-bold text-purple-400 uppercase tracking-wide mb-1 flex items-center gap-1.5">
                          <Camera className="w-3.5 h-3.5" /> Görsel Açıklaması
                        </h4>
                        <p className="text-sm text-zinc-500 italic">
                          "{day.visualDescription}"
                        </p>
                     </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="py-8 flex flex-col items-center justify-center text-zinc-600">
                <div className="w-12 h-12 rounded-full bg-zinc-800/50 border border-zinc-800 flex items-center justify-center mb-4">
                  <PenTool className="w-5 h-5 text-zinc-500" />
                </div>
                <div className="flex flex-col items-center gap-1 mb-4">
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-zinc-800 text-zinc-500 border border-zinc-700">GÖREV BEKLİYOR</span>
                  <span className="text-sm font-medium text-zinc-400 text-center max-w-xs">{day.specificTopic}</span>
                </div>
                <button 
                  onClick={() => onRegenerate(day)}
                  className="group/btn relative px-4 py-2 bg-zinc-100 text-zinc-900 rounded-lg text-sm font-semibold hover:bg-white transition-all overflow-hidden flex items-center gap-2"
                >
                  <span className="relative z-10">İçeriği Oluştur</span>
                  <ChevronRight className="w-4 h-4 relative z-10 group-hover/btn:translate-x-0.5 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-blue-600 opacity-0 group-hover/btn:opacity-10 transition-opacity" />
                </button>
              </div>
            )}
          </div>
          
          {day.isLoading && (
            <div className="absolute inset-0 bg-zinc-950/60 backdrop-blur-[2px] flex items-center justify-center z-20">
               <div className="bg-zinc-900 px-4 py-3 rounded-xl shadow-2xl border border-zinc-700 flex items-center gap-3">
                 <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                 <span className="text-sm font-mono text-zinc-300">WRITING LOG...</span>
               </div>
            </div>
          )}

          {showDeleteConfirm && (
             <div className="absolute inset-0 bg-zinc-950/90 backdrop-blur-sm z-30 flex items-center justify-center p-4">
                <div className="bg-zinc-900 border border-zinc-800 p-6 rounded-xl shadow-2xl max-w-sm w-full text-center animate-fade-in">
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
             </div>
          )}

           {isEditing && (
              <div className="absolute inset-0 bg-zinc-950/95 backdrop-blur-sm z-30 flex items-center justify-center p-4">
                 <div className="bg-zinc-900 border border-zinc-700 p-6 rounded-xl shadow-2xl max-w-lg w-full text-left animate-fade-in relative">
                    <button onClick={() => setIsEditing(false)} className="absolute top-4 right-4 text-zinc-500 hover:text-white">
                        <X className="w-5 h-5" />
                    </button>
                    
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        <Pencil className="w-5 h-5 text-amber-500" />
                        Planı Düzenle
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Staj Türü</label>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => handleTypeChange(InternshipType.PRODUCTION_DESIGN)}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                                        editType === InternshipType.PRODUCTION_DESIGN 
                                        ? 'bg-amber-500/10 border-amber-500 text-amber-500' 
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                    }`}
                                >
                                    Üretim/Tasarım
                                </button>
                                <button
                                    onClick={() => handleTypeChange(InternshipType.MANAGEMENT)}
                                    className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                                        editType === InternshipType.MANAGEMENT 
                                        ? 'bg-blue-500/10 border-blue-500 text-blue-500' 
                                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-800'
                                    }`}
                                >
                                    İşletme
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                             <label className="text-xs font-bold text-zinc-500 uppercase tracking-wide">Günlük Konu / Görev</label>
                             <div className="relative">
                                <select 
                                    value={editTopic}
                                    onChange={(e) => setEditTopic(e.target.value)}
                                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 px-4 text-sm text-zinc-300 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 appearance-none"
                                >
                                    {(editType === InternshipType.PRODUCTION_DESIGN ? PRODUCTION_TOPICS : MANAGEMENT_TOPICS).map((t, i) => (
                                        <option key={i} value={t}>{t}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                             </div>
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
              </div>
           )}
        </div>
      </div>
    </div>
  );
};
