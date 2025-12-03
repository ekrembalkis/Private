
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { generateDayList } from './utils/dateUtils';
import { DayEntry, InternshipType } from './types';
import { Stats } from './components/Stats';
import { DayCard } from './components/DayCard';
import { generateDayContent, generateImage } from './services/geminiService';
import { saveDayToFirestore, loadAllDaysFromFirestore, deleteDayFromFirestore, savePlanToFirestore, loadPlanFromFirestore, resetFirestoreData } from './services/firebaseService';
import { Wand2, Download, AlertTriangle, Terminal, FileText, FileType, ChevronDown, CheckCircle2, RotateCcw, Trash2 } from 'lucide-react';
import { STUDENT_INFO, COMPANY_INFO } from './constants';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';

const App: React.FC = () => {
  const [days, setDays] = useState<DayEntry[]>([]);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
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
            // Fallback just in case everything fails
            setDays(generateDayList());
        } finally {
            setIsLoadingFromDb(false);
        }
    };

    initializeData();

    // Close export menu when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (exportMenuRef.current && !exportMenuRef.current.contains(event.target as Node)) {
        setShowExportMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []); 

  const handleSaveDay = async (day: DayEntry) => {
      const success = await saveDayToFirestore(day);
      if (success) {
          setDays(prev => prev.map(d => {
              if (d.dayNumber === day.dayNumber) {
                  return { ...d, isSaved: true };
              }
              // If the day is AFTER the saved day AND is NOT saved, reset it.
              if (d.dayNumber > day.dayNumber && !d.isSaved && d.isGenerated) {
                  return {
                      ...d,
                      isGenerated: false,
                      content: '',
                      workTitle: undefined,
                      visualDescription: undefined,
                      imageUrl: undefined
                  };
              }
              return d;
          }));
      } else {
          setError("Kaydetme başarısız oldu. İnternet bağlantınızı kontrol edin.");
      }
  };

  const handleDeleteDay = async (day: DayEntry) => {
      const success = await deleteDayFromFirestore(day.dayNumber);
      if (success) {
          setDays(prev => prev.map(d => d.dayNumber === day.dayNumber ? { ...d, isSaved: false } : d));
      } else {
          setError("Silme işlemi başarısız oldu. İnternet bağlantınızı kontrol edin.");
      }
  };

  const handleUpdateDayPlan = async (day: DayEntry, newType: InternshipType, newTopic: string) => {
    const updatedDay: DayEntry = {
        ...day,
        type: newType,
        specificTopic: newTopic,
        topic: newType === InternshipType.PRODUCTION_DESIGN ? 'Üretim/Tasarım/Saha Aktivitesi' : 'İşletme/Depo/Ofis Aktivitesi',
        isGenerated: false,
        content: '',
        workTitle: undefined,
        visualDescription: undefined,
        imageUrl: undefined,
        isLoading: false,
        isSaved: false
    };

    const updatedDays = days.map(d => d.dayNumber === day.dayNumber ? updatedDay : d);
    setDays(updatedDays);

    const success = await savePlanToFirestore(updatedDays);
    if (!success) {
        setError("Plan güncellenirken hata oluştu.");
    }
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
      
      // Direkt yeni günleri set et, useEffect'i tetikleme
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

  const handleRegenerateDay = async (dayToUpdate: DayEntry) => {
    setError(null);
    setDays(prev => prev.map(d => d.dayNumber === dayToUpdate.dayNumber ? { ...d, isLoading: true, isSaved: false } : d));

    try {
      const result = await generateDayContent(dayToUpdate, days);
      
      let updatedDay: DayEntry = {
        ...dayToUpdate,
        content: result.text,
        visualDescription: result.visualDesc,
        workTitle: result.workTitle,
        isGenerated: true,
        isLoading: false,
        isSaved: false
      };

      setDays(prev => prev.map(d => d.dayNumber === dayToUpdate.dayNumber ? updatedDay : d));

      if (updatedDay.hasVisual && updatedDay.visualDescription) {
        setDays(prev => prev.map(d => d.dayNumber === updatedDay.dayNumber ? { ...d, isImageLoading: true } : d));
        try {
            const base64Image = await generateImage(updatedDay.visualDescription);
            setDays(prev => prev.map(d => d.dayNumber === updatedDay.dayNumber ? { ...d, imageUrl: base64Image || undefined, isImageLoading: false } : d));
        } catch (imgErr) {
            console.error("Image generation failed", imgErr);
            setDays(prev => prev.map(d => d.dayNumber === updatedDay.dayNumber ? { ...d, isImageLoading: false } : d));
        }
      }

    } catch (err) {
      setError("İçerik üretilirken hata oluştu. API Key kontrol ediniz.");
      setDays(prev => prev.map(d => d.dayNumber === dayToUpdate.dayNumber ? { ...d, isLoading: false } : d));
    }
  };

  const handleGenerateAll = useCallback(async () => {
    if (isGeneratingAll) return;
    setIsGeneratingAll(true);
    setError(null);

    let currentDays = [...days];
    const daysToGenerateIndices = currentDays
        .map((d, index) => !d.isGenerated ? index : -1)
        .filter(i => i !== -1);
    
    for (const index of daysToGenerateIndices) {
       setDays(prev => prev.map((d, i) => i === index ? { ...d, isLoading: true } : d));
       const day = currentDays[index];

       try {
         const result = await generateDayContent(day, currentDays);
         
         const updatedDay = { 
            ...day, 
            content: result.text, 
            visualDescription: result.visualDesc,
            workTitle: result.workTitle,
            isGenerated: true, 
            isLoading: false,
            isSaved: false
         };

         currentDays[index] = updatedDay;
         setDays(prev => {
             const newDays = [...prev];
             newDays[index] = updatedDay;
             return newDays;
         });

         if (updatedDay.hasVisual && updatedDay.visualDescription) {
            setDays(prev => prev.map((d, i) => i === index ? { ...d, isImageLoading: true } : d));
            try {
                const base64Image = await generateImage(updatedDay.visualDescription);
                updatedDay.imageUrl = base64Image || undefined;
                updatedDay.isImageLoading = false;
                
                currentDays[index] = updatedDay;
                setDays(prev => {
                    const newDays = [...prev];
                    newDays[index] = updatedDay;
                    return newDays;
                });
            } catch (imgErr) {
                console.error("Auto image generation failed", imgErr);
                setDays(prev => prev.map((d, i) => i === index ? { ...d, isImageLoading: false } : d));
            }
         }
         await new Promise(r => setTimeout(r, 1000));
       } catch (err) {
         setError("Toplu üretim sırasında hata oluştu. İşlem durduruldu.");
         setDays(prev => prev.map((d, i) => i === index ? { ...d, isLoading: false } : d));
         break;
       }
    }
    setIsGeneratingAll(false);
  }, [days, isGeneratingAll]);

  const handleExportTxt = () => {
    const textContent = days
      .filter(d => d.isGenerated)
      .map(d => `TARİH: ${d.date}\nÇALIŞMA RAPORU: ${d.workTitle || d.specificTopic}\n\n${d.content}\n${d.visualDescription ? `[GÖRSEL NOTU: ${d.visualDescription}]` : ''}\n\n-------------------\n\n`)
      .join('');
      
    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `staj_defteri_${STUDENT_INFO.name.replace(' ', '_').toLowerCase()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const handleExportDocx = async () => {
    const generatedDays = days.filter(d => d.isGenerated);
    const children = [];

    children.push(
      new Paragraph({ text: "STAJ DEFTERİ", heading: HeadingLevel.HEADING_1, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "" }),
      new Paragraph({ text: `Öğrenci: ${STUDENT_INFO.name}`, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `Numara: ${STUDENT_INFO.studentId}`, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: `Firma: ${COMPANY_INFO.name}`, alignment: AlignmentType.CENTER }),
      new Paragraph({ text: "", pageBreakBefore: true })
    );

    for (const day of generatedDays) {
      children.push(
        new Paragraph({ children: [new TextRun({ text: "TARİH: ", bold: true }), new TextRun({ text: day.date })] }),
        new Paragraph({ children: [new TextRun({ text: "ÇALIŞMA RAPORU: ", bold: true }), new TextRun({ text: day.workTitle || day.specificTopic })] }),
        new Paragraph({ text: "" }),
        new Paragraph({ children: [new TextRun({ text: day.content })] })
      );

      if (day.hasVisual && day.visualDescription) {
         children.push(new Paragraph({ text: "" }));
         if (day.imageUrl) {
            const response = await fetch(day.imageUrl);
            const blob = await response.blob();
            const buffer = await blob.arrayBuffer();
            children.push(new Paragraph({ children: [new ImageRun({ data: buffer, transformation: { width: 300, height: 300 } })], alignment: AlignmentType.CENTER }));
         }
        children.push(new Paragraph({ children: [new TextRun({ text: "GÖRSEL NOTU: ", bold: true, italics: true }), new TextRun({ text: day.visualDescription, italics: true })] }));
      }
      children.push(new Paragraph({ text: "" }), new Paragraph({ children: [new TextRun({ text: "------------------------------------------------" })], alignment: AlignmentType.CENTER }), new Paragraph({ text: "" }));
    }

    const doc = new Document({ sections: [{ properties: {}, children: children }] });
    const blob = await Packer.toBlob(doc);
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `staj_defteri_${STUDENT_INFO.name.replace(' ', '_').toLowerCase()}.docx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowExportMenu(false);
  };

  const stats = {
    totalDays: days.length,
    productionDays: days.filter(d => d.type === InternshipType.PRODUCTION_DESIGN).length,
    managementDays: days.filter(d => d.type === InternshipType.MANAGEMENT).length,
    completed: days.filter(d => d.isGenerated).length
  };

  if (isLoadingFromDb) {
      return (
          <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-zinc-400">
              <div className="flex flex-col items-center gap-4">
                <Wand2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="font-mono text-sm tracking-wider animate-pulse">VERİTABANI BAĞLANTISI KURULUYOR...</p>
              </div>
          </div>
      )
  }

  return (
    <div className="min-h-screen font-sans selection:bg-blue-500/30">
      <nav className="sticky top-0 z-30 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-tr from-blue-600 to-indigo-600 text-white p-2 rounded-lg shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                 <Terminal className="w-5 h-5" />
              </div>
              <div>
                 <h1 className="text-xl font-bold text-white leading-none tracking-tight">Staj<span className="text-blue-500">Defteri</span></h1>
                 <p className="text-[10px] text-zinc-500 font-mono mt-0.5 tracking-wider uppercase">Engineering Logbook v2.0</p>
              </div>
            </div>
            
            <div className="flex gap-3">
               <button onClick={handleResetAll} className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-red-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all" title="Tüm planı sil ve sıfırla">
                 <RotateCcw className="w-4 h-4" />
                 <span className="hidden sm:inline">Planı Sıfırla</span>
               </button>

              <button onClick={handleGenerateAll} disabled={isGeneratingAll || stats.completed === stats.totalDays} className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${isGeneratingAll ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-700' : stats.completed === stats.totalDays ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-default' : 'bg-white text-zinc-950 hover:bg-zinc-200 shadow-lg shadow-white/5 active:scale-95'}`}>
                {isGeneratingAll ? <><Wand2 className="w-4 h-4 animate-spin" /><span className="font-mono">PROCESSING...</span></> : <><Wand2 className="w-4 h-4" /><span>Otomatik Doldur</span></>}
              </button>
              
              {stats.completed > 0 && (
                <div className="relative" ref={exportMenuRef}>
                  <button onClick={() => setShowExportMenu(!showExportMenu)} className="flex items-center gap-2 px-4 py-2.5 border border-zinc-700 bg-zinc-900 rounded-lg text-sm font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors">
                    <Download className="w-4 h-4" />
                    <span className="hidden sm:inline">Dışa Aktar</span>
                    <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                  </button>

                  {showExportMenu && (
                    <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-700 rounded-xl shadow-2xl py-1 z-50 animate-fade-in">
                      <button onClick={handleExportTxt} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left">
                        <FileText className="w-4 h-4 text-zinc-500" />
                        <div><p className="font-medium">Metin Dosyası</p><p className="text-[10px] text-zinc-500">.txt formatında indir</p></div>
                      </button>
                      <div className="h-px bg-zinc-800 mx-2"></div>
                      <button onClick={handleExportDocx} className="flex items-center gap-3 w-full px-4 py-3 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors text-left">
                        <FileType className="w-4 h-4 text-blue-500" />
                        <div><p className="font-medium">Word Belgesi</p><p className="text-[10px] text-zinc-500">.docx formatında indir</p></div>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {error && (
            <div className="mb-8 p-4 bg-red-950/30 border border-red-900/50 rounded-lg flex items-center gap-3 text-red-400 animate-fade-in">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <p className="font-medium text-sm font-mono">{error}</p>
            </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
          <div className="lg:col-span-8">
            <div className="mb-8 pl-2 border-l-2 border-zinc-800">
                <h2 className="text-2xl font-bold text-white tracking-tight ml-4">Günlük Akış</h2>
                <p className="text-zinc-500 mt-1 ml-4 text-sm">Staj süresince yapılan mühendislik ve işletme faaliyetlerinin kronolojik kaydı.</p>
            </div>

            <div className="relative">
              <div className="absolute left-[23px] sm:left-[31px] top-4 bottom-0 w-px bg-zinc-800 hidden lg:block" />
              <div className="space-y-0">
                {days.map((day, index) => (
                  <DayCard 
                    key={day.dayNumber}
                    day={day} 
                    onRegenerate={handleRegenerateDay}
                    onSave={handleSaveDay}
                    onDelete={handleDeleteDay}
                    onUpdatePlan={handleUpdateDayPlan}
                    isLast={index === days.length - 1}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 lg:sticky lg:top-24 transition-all duration-300">
            <Stats stats={stats} />
            <div className="mt-6 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5 rounded-xl border border-zinc-800/60 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <div className="bg-amber-500/10 p-1.5 rounded-md text-amber-500 border border-amber-500/20">
                     <Terminal className="w-4 h-4" />
                  </div>
                  <p className="font-bold text-zinc-300 text-sm">Bulut Senkronizasyonu</p>
                </div>
                <div className="text-xs text-zinc-500 space-y-3 leading-relaxed font-mono">
                    <p>Oluşturulan içerikleri <span className="text-blue-500">Kaydet</span> butonu ile buluta yedekleyebilirsiniz. Sayfa yenilendiğinde verileriniz kaybolmaz.</p>
                    <div className="flex items-center gap-2 text-emerald-500/80">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Firebase Bağlantısı Aktif</span>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
