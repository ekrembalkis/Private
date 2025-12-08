import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateDayList } from './utils/dateUtils';
import { DayEntry, InternshipType } from './types';
import { Stats } from './components/Stats';
import { DayCard } from './components/DayCard';
import { generateDayContent, analyzeImage } from './services/geminiService';
import { searchImages, StockImage } from './services/imageService';
import { saveDayToFirestore, loadAllDaysFromFirestore, deleteDayFromFirestore, savePlanToFirestore, loadPlanFromFirestore, resetFirestoreData } from './services/firebaseService';
import { Wand2, Download, AlertTriangle, Terminal, FileText, FileType, ChevronDown, CheckCircle2, RotateCcw, Trash2, X, Loader2 } from 'lucide-react';
import { STUDENT_INFO, COMPANY_INFO } from './constants';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { pdf } from '@react-pdf/renderer';
import { StajDefteriPDF } from './services/pdfService';

const App: React.FC = () => {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<StockImage[]>([]);
  const [imagePickerDay, setImagePickerDay] = useState<DayEntry | null>(null);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState<string>('autocad');
  const exportMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Initialize Data Logic
    const initializeData = async () => {
        try {
            // 1. Try to load existing PLAN from Firestore
            let baseDays = await loadPlanFromFirestore();

            // 2. If no plan exists, generate new one and save it
            if (!baseDays || baseDays.length === 0) {
                console.log("Plan not found, generating new one...");
                baseDays = generateDayList();
                await savePlanToFirestore(baseDays);
            } else {
                console.log("Plan loaded from Firestore.");
            }

            // Hydrate plan with UI specific fields
            const hydratedDays: DayEntry[] = baseDays.map(d => ({
                ...d,
                content: '',
                isGenerated: false,
                isLoading: false,
                isSaved: false,
                isImageLoading: false
            }));
            
            // 3. Load saved CONTENT from Firestore and merge
            const savedDays = await loadAllDaysFromFirestore();
            
            const mergedDays = hydratedDays.map(day => {
                const savedDay = savedDays.find(s => s.dayNumber === day.dayNumber);
                if (savedDay) {
                    return { ...day, ...savedDay, isSaved: true, isGenerated: true };
                }
                return day;
            });

            setDays(mergedDays);
        } catch (err) {
            console.error("Failed to initialize data", err);
            setError("Veri yüklenirken bir sorun oluştu.");
            // Fallback: generate a fresh list in memory so the app doesn't crash
            const fallbackDays = generateDayList().map(d => ({
                ...d,
                content: '',
                isGenerated: false,
                isLoading: false,
                isSaved: false,
                isImageLoading: false
            }));
            setDays(fallbackDays);
        } finally {
            setIsLoadingFromDb(false);
        }
    };

    initializeData();
  }, []);

  // Close export menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRegenerate = async (day: DayEntry) => {
    // Guard: If day has visual but no image URL is selected, prevent generation
    if (day.hasVisual && !day.imageUrl) {
        alert("Lütfen içerik oluşturmadan önce bir görsel seçin.");
        return;
    }

    // Set Loading State
    const updatedDays = days.map(d => d.dayNumber === day.dayNumber ? { ...d, isLoading: true } : d);
    setDays(updatedDays);

    try {
      const { text, visualDesc, workTitle } = await generateDayContent(day, days);
      
      const finalDays = days.map(d => {
        if (d.dayNumber === day.dayNumber) {
           return {
             ...d,
             content: text,
             visualDescription: visualDesc,
             workTitle: workTitle,
             isGenerated: true,
             isLoading: false,
             // Note: We don't auto-save here to give user a chance to review.
             // But if it was ALREADY saved, we might want to update it? 
             // Current logic: User must click "Save" again to persist changes.
             isSaved: false 
           };
        }
        return d;
    });
    setDays(finalDays);
    } catch (error) {
      console.error("Error regenerating day:", error);
      const errorDays = days.map(d => d.dayNumber === day.dayNumber ? { ...d, isLoading: false } : d);
      setDays(errorDays);
      alert("İçerik oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };


  const handleOpenImagePicker = async (day: DayEntry) => {
    setImagePickerDay(day);
    setShowImagePicker(true);
    setImageSearchResults([]);
    setIsSearchingImages(false);
  };

  const handleSearchWithType = async (imageType: string) => {
    if (!imagePickerDay) return;
    setIsSearchingImages(true);
    
    try {
      const images = await searchImages(imagePickerDay.specificTopic, 15, imageType);
      setImageSearchResults(images);
    } catch (err) {
      console.error("Image Search Error", err);
    } finally {
      setIsSearchingImages(false);
    }
  };

  const handleSelectImage = async (imageUrl: string) => {
    if (!imagePickerDay) return;

    // Görseli analiz et
    let imageAnalysis = "";
    try {
      imageAnalysis = await analyzeImage(imageUrl);
    } catch (err) {
      console.error("Analiz hatası", err);
    }

    const finalDays = days.map(d => {
      if (d.dayNumber === imagePickerDay.dayNumber) {
        const updatedDay = { 
          ...d, 
          imageUrl: imageUrl,
          imageAnalysis: imageAnalysis,
          imageSource: 'stock' as const,
        };
        if (d.isSaved) {
          saveDayToFirestore(updatedDay);
        }
        return updatedDay;
      }
      return d;
    });
    setDays(finalDays);
    setShowImagePicker(false);
    setImagePickerDay(null);
    setImageSearchResults([]);
  };

  const handleSave = async (day: DayEntry) => {
    const success = await saveDayToFirestore(day);
    if (success) {
      const finalDays = days.map(d => d.dayNumber === day.dayNumber ? { ...d, isSaved: true } : d);
      setDays(finalDays);
    } else {
      alert("Kaydetme başarısız oldu.");
    }
  };

  const handleDelete = async (day: DayEntry) => {
    const success = await deleteDayFromFirestore(day.dayNumber);
    if (success) {
      const finalDays = days.map(d => d.dayNumber === day.dayNumber ? { ...d, isSaved: false } : d);
      setDays(finalDays);
    } else {
      alert("Silme işlemi başarısız oldu.");
    }
  };

  const handleUpdatePlan = async (day: DayEntry, newType: InternshipType, newTopic: string, customPrompt: string) => {
    // Update local state
    const updatedDays = days.map(d => {
        if (d.dayNumber === day.dayNumber) {
            return {
                ...d,
                type: newType,
                specificTopic: newTopic,
                customPrompt: customPrompt,
                topic: newType === InternshipType.PRODUCTION_DESIGN 
                    ? 'Üretim/Tasarım/Saha Aktivitesi' 
                    : 'İşletme/Depo/Ofis Aktivitesi',
                // Reset content if topic changes? Ideally yes, but let's keep it until regenerated
                isSaved: false // Mark as unsaved because plan changed
            };
        }
        return d;
    });
    setDays(updatedDays);
    
    // Save new plan structure to Firestore
    await savePlanToFirestore(updatedDays);
  };

  const handleResetAll = async () => {
    const savedCount = days.filter(d => d.isSaved).length;
    let confirmMessage = "Tüm staj planı ve içerikleri sıfırlanacak. Yeni rastgele bir plan oluşturulacak. Emin misiniz?";
    
    if (savedCount > 0) {
      confirmMessage += `\n\nUYARI: ${savedCount} adet kaydedilmiş gün veritabanından tamamen SİLİNECEK.`;
    }

    if (!window.confirm(confirmMessage)) return;

    setIsLoadingFromDb(true);
    setError(null);

    try {
      await resetFirestoreData();
      
      const newDays = generateDayList();
      await savePlanToFirestore(newDays);
      
      const hydratedDays = newDays.map(d => ({
        ...d,
        content: '',
        isGenerated: false,
        isLoading: false,
        isSaved: false,
        isImageLoading: false
      }));
      
      setDays(hydratedDays);
    } catch (err) {
      console.error("Reset failed", err);
      setError("Sıfırlama işlemi başarısız. Sayfayı yenileyip tekrar deneyin.");
    } finally {
      setIsLoadingFromDb(false);
    }
  };

  const handleExport = async () => {
    const savedDays = days.filter(d => d.isSaved && d.isGenerated);
    if (savedDays.length === 0) {
        alert("Dışa aktarılacak kaydedilmiş gün bulunamadı.");
        return;
    }

    const doc = new Document({
        sections: [{
            properties: {},
            children: [
                new Paragraph({
                    text: "STAJ DEFTERİ",
                    heading: HeadingLevel.HEADING_1,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 400 }
                }),
                new Paragraph({
                    text: `Öğrenci: ${STUDENT_INFO.name} (${STUDENT_INFO.studentId})`,
                    alignment: AlignmentType.CENTER
                }),
                new Paragraph({
                    text: `Firma: ${COMPANY_INFO.name}`,
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 800 }
                }),
                ...savedDays.flatMap(day => [
                    new Paragraph({
                        text: `GÜN ${day.dayNumber} - ${day.date}`,
                        heading: HeadingLevel.HEADING_2,
                        spacing: { before: 400, after: 200 }
                    }),
                    new Paragraph({
                        children: [
                            new TextRun({ text: "KONU: ", bold: true }),
                            new TextRun(day.workTitle || day.specificTopic)
                        ],
                        spacing: { after: 200 }
                    }),
                    new Paragraph({
                        text: day.content,
                        spacing: { after: 200 }
                    }),
                    // Add Image if exists
                    ...(day.imageUrl ? [
                        new Paragraph({
                            children: [
                                new TextRun({ text: `[Görsel: ${day.visualDescription || 'Staj görseli'}]`, italics: true, size: 20, color: "666666" })
                            ],
                            spacing: { after: 200 }
                        })
                    ] : []),
                    new Paragraph({
                        text: "________________________________________________",
                        alignment: AlignmentType.CENTER,
                        spacing: { before: 200, after: 200 }
                    })
                ])
            ]
        }]
    });

    try {
        const blob = await Packer.toBlob(doc);
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Staj_Defteri_${STUDENT_INFO.name.replace(' ', '_')}.docx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    } catch (err) {
        console.error("Export failed", err);
        alert("Word dosyası oluşturulurken hata çıktı.");
    }
  };

  const handleExportPDF = async () => {
    const savedDays = days.filter(d => d.isSaved && d.isGenerated);
    if (savedDays.length === 0) {
      alert("Dışa aktarılacak kaydedilmiş gün bulunamadı.");
      return;
    }
  
    try {
      const blob = await pdf(<StajDefteriPDF days={days} />).toBlob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Staj_Defteri_${STUDENT_INFO.name.replace(' ', '_')}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export failed", err);
      alert("PDF oluşturulurken hata çıktı.");
    }
  };

  if (isLoadingFromDb) {
     return (
        <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
           <div className="w-16 h-16 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
           <p className="text-zinc-400 font-mono animate-pulse">SİSTEM BAŞLATILIYOR...</p>
        </div>
     );
  }

  const savedCount = days.filter(d => d.isSaved).length;
  const productionCount = days.filter(d => d.isSaved && d.type === InternshipType.PRODUCTION_DESIGN).length;
  const managementCount = days.filter(d => d.isSaved && d.type === InternshipType.MANAGEMENT).length;

  const stats = {
     totalDays: days.length,
     productionDays: productionCount,
     managementDays: managementCount,
     completed: savedCount
  };

  return (
    <div className="min-h-screen pb-20 relative">
      {/* Header */}
      <header className="bg-zinc-900/50 backdrop-blur-md border-b border-zinc-800 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-900 rounded-lg flex items-center justify-center shadow-lg shadow-blue-900/20">
                <Terminal className="w-5 h-5 text-white" />
             </div>
             <div>
                <h1 className="text-lg font-bold text-white tracking-tight">StajAsistanı <span className="text-blue-500">v2.0</span></h1>
                <p className="text-[10px] text-zinc-500 font-mono">POWERED BY GEMINI 2.0</p>
             </div>
          </div>
          
          <div className="flex items-center gap-3">
             <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-400 transition-colors">
                <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                Database
             </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Sidebar */}
            <div className="lg:col-span-4 space-y-6">
                <Stats stats={stats} />
                
                {/* Actions Panel */}
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-lg space-y-4 sticky top-[30rem]">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">İşlemler</h3>
                    
                    <div className="relative" ref={exportMenuRef}>
                        <button 
                            onClick={() => setShowExportMenu(!showExportMenu)}
                            className="w-full py-3 px-4 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 rounded-xl font-medium transition-all flex items-center justify-between group"
                        >
                            <div className="flex items-center gap-3">
                                <Download className="w-5 h-5 text-blue-500" />
                                <span>Dışa Aktar</span>
                            </div>
                            <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${showExportMenu ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {showExportMenu && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-50 animate-fade-in">
                                <button 
                                    onClick={handleExport}
                                    className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-700/50 text-left transition-colors"
                                >
                                    <FileText className="w-4 h-4 text-blue-400" />
                                    <div>
                                        <p className="text-sm font-medium text-zinc-200">Word (.docx)</p>
                                        <p className="text-[10px] text-zinc-500">Resmi staj defteri formatı</p>
                                    </div>
                                </button>
                                <button 
                                  onClick={handleExportPDF}
                                  className="w-full px-4 py-3 flex items-center gap-3 hover:bg-zinc-700/50 text-left transition-colors"
                                >
                                  <FileType className="w-4 h-4 text-red-400" />
                                  <div>
                                    <p className="text-sm font-medium text-zinc-200">PDF</p>
                                    <p className="text-[10px] text-zinc-500">Profesyonel format</p>
                                  </div>
                                </button>
                            </div>
                        )}
                    </div>

                    <div className="h-px bg-zinc-800 my-4"></div>

                    <button 
                        onClick={handleResetAll}
                        className="w-full py-3 px-4 bg-red-500/5 hover:bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Planı Sıfırla
                    </button>
                    
                    <p className="text-[10px] text-zinc-600 text-center px-4">
                        Planı sıfırlamak tüm veritabanını temizler ve yeni rastgele bir kurgu oluşturur.
                    </p>
                </div>
            </div>

            {/* Day List */}
            <div className="lg:col-span-8 space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                        <FileText className="w-5 h-5 text-zinc-500" />
                        Günlük Raporlar
                    </h2>
                    <span className="text-xs font-mono text-zinc-500 bg-zinc-900 px-2 py-1 rounded border border-zinc-800">
                        Total: {days.length}
                    </span>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-center gap-3 text-red-400 mb-6">
                        <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                        <p className="text-sm">{error}</p>
                    </div>
                )}

                <div className="relative">
                    {/* Connection Line */}
                    <div className="absolute left-6 sm:left-8 top-8 bottom-8 w-px bg-zinc-800 z-0"></div>

                    <div className="space-y-8 relative z-10">
                        {days.map((day, index) => (
                            <DayCard 
                                key={`day-${day.dayNumber}-${day.date}`}
                                day={day}
                                isLast={index === days.length - 1}
                                onRegenerate={handleRegenerate}
                                onSave={handleSave}
                                onDelete={handleDelete}
                                onUpdatePlan={handleUpdatePlan}
                                onSearchImage={handleOpenImagePicker}
                                onImageClick={setSelectedImage}
                            />
                        ))}
                    </div>
                </div>
                
                {days.length > 0 && (
                   <div className="mt-12 p-8 border border-dashed border-zinc-800 rounded-2xl flex flex-col items-center justify-center text-zinc-500 gap-2 bg-zinc-900/30">
                      <CheckCircle2 className="w-8 h-8 opacity-20" />
                      <p className="font-mono text-sm">END OF STREAM</p>
                   </div>
                )}
            </div>
        </div>
      </main>


{/* Image Picker Modal */}
      {showImagePicker && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Görsel Seç</h3>
                <p className="text-sm text-zinc-500">Gün {imagePickerDay?.dayNumber}: {imagePickerDay?.specificTopic}</p>
              </div>
              <button 
                onClick={() => { setShowImagePicker(false); setImagePickerDay(null); setImageSearchResults([]); }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {!isSearchingImages && imageSearchResults.length === 0 && (
                <div className="p-4 space-y-4">
                  <p className="text-sm text-zinc-400 text-center">Aramak istediğiniz görsel tipini seçin:</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <button
                      onClick={() => { setSelectedImageType('autocad'); handleSearchWithType('autocad'); }}
                      className="p-6 bg-zinc-800 hover:bg-zinc-700 hover:border-blue-500 rounded-xl border border-zinc-700 text-center transition-all group"
                    >
                      <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">📐</span>
                      <p className="font-bold text-zinc-200">AutoCAD / Proje</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Teknik çizim, DWG, plan</p>
                    </button>
                    <button
                      onClick={() => { setSelectedImageType('saha'); handleSearchWithType('saha'); }}
                      className="p-6 bg-zinc-800 hover:bg-zinc-700 hover:border-amber-500 rounded-xl border border-zinc-700 text-center transition-all group"
                    >
                      <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">🔧</span>
                      <p className="font-bold text-zinc-200">Saha Fotoğrafı</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Montaj, kurulum, şantiye</p>
                    </button>
                    <button
                      onClick={() => { setSelectedImageType('tablo'); handleSearchWithType('tablo'); }}
                      className="p-6 bg-zinc-800 hover:bg-zinc-700 hover:border-purple-500 rounded-xl border border-zinc-700 text-center transition-all group"
                    >
                      <span className="text-3xl block mb-3 group-hover:scale-110 transition-transform">📊</span>
                      <p className="font-bold text-zinc-200">Eğitim / Şema</p>
                      <p className="text-[10px] text-zinc-500 mt-1">Diyagram, tablo, pano şeması</p>
                    </button>
                  </div>
                </div>
              )}

              {isSearchingImages ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 animate-spin mb-3" />
                  <p className="text-zinc-400">Görseller aranıyor...</p>
                </div>
              ) : imageSearchResults.length > 0 ? (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {imageSearchResults.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => handleSelectImage(img.url)}
                      className="aspect-square rounded-lg overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all hover:scale-105 bg-zinc-800 relative group"
                    >
                      <img 
                        src={img.thumbUrl} 
                        alt={img.title || `Seçenek ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded">Seç</span>
                      </div>
                    </button>
                  ))}
                  
                  {/* Reset Search Button */}
                   <button
                      onClick={() => setImageSearchResults([])}
                      className="aspect-square rounded-lg border-2 border-dashed border-zinc-700 hover:border-zinc-500 hover:bg-zinc-800 transition-all flex flex-col items-center justify-center text-zinc-500"
                    >
                      <RotateCcw className="w-6 h-6 mb-2" />
                      <span className="text-xs">Tekrar Ara</span>
                    </button>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* Lightbox / Image Viewer */}
      {selectedImage && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedImage(null)}>
           <button 
             onClick={() => setSelectedImage(null)}
             className="absolute top-4 right-4 p-3 bg-zinc-900 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800 transition-all z-10"
           >
             <X className="w-6 h-6" />
           </button>
           
           <div className="relative max-w-7xl max-h-screen w-full h-full flex items-center justify-center p-4">
             <img 
               src={selectedImage} 
               alt="Full View" 
               className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl shadow-black border border-zinc-800"
               onClick={(e) => e.stopPropagation()} // Prevent closing when clicking the image itself
             />
             <div className="absolute bottom-10 left-1/2 -translate-x-1/2 px-6 py-3 bg-zinc-900/80 backdrop-blur rounded-full border border-zinc-700 text-zinc-300 text-sm font-medium">
               Görseli kapatmak için boşluğa tıklayın
             </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default App;