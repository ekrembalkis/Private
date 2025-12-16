import React, { useState, useEffect, useRef } from 'react';
import { generateDayList } from './utils/dateUtils';
import { DayEntry, InternshipType } from './types';
import { Stats } from './components/Stats';
import { DayCard } from './components/DayCard';
import { LoginScreen } from './components/LoginScreen';
import { BatchProgress } from './components/BatchProgress';
import { ToastContainer, useToast } from './components/Toast';
import { ConfirmDialog } from './components/ConfirmDialog';
import { LoadingScreen } from './components/Skeleton';
import { ImageAnalysisModal } from './components/ImageAnalysisModal';
import { VisualGuideModal } from './components/VisualGuideModal';
import { WeekProgress } from './components/WeekProgress';
import { generateDayContent, analyzeImage } from './services/geminiService';
import { searchImages, StockImage, searchByCategory, PRESET_CATEGORIES, CategoryItem } from './services/imageService';
import { ImageAnalysisResult } from './services/imageAnalysisService';
import { saveDayToFirestore, loadAllDaysFromFirestore, deleteDayFromFirestore, savePlanToFirestore, loadPlanFromFirestore, resetFirestoreData } from './services/firebaseService';
import { onAuthChange, logOut } from './services/authService';
import { User } from 'firebase/auth';
import { Wand2, Download, AlertTriangle, Terminal, FileText, FileType, ChevronDown, CheckCircle2, RotateCcw, Trash2, X, Loader2, LogOut, User as UserIcon, Info } from 'lucide-react';
import { STUDENT_INFO, COMPANY_INFO } from './constants';
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType, ImageRun } from 'docx';
import { pdf } from '@react-pdf/renderer';
import { StajDefteriPDF } from './services/pdfService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [days, setDays] = useState<DayEntry[]>([]);
  const [isLoadingFromDb, setIsLoadingFromDb] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showImagePicker, setShowImagePicker] = useState(false);
  const [imageSearchResults, setImageSearchResults] = useState<StockImage[]>([]);
  const [imagePickerDay, setImagePickerDay] = useState<DayEntry | null>(null);
  const [isSearchingImages, setIsSearchingImages] = useState(false);
  const [selectedImageType, setSelectedImageType] = useState<string>('autocad');
  const [selectedCategoryGroup, setSelectedCategoryGroup] = useState<string | null>(null);
  const [categorySearching, setCategorySearching] = useState<string | null>(null);
  const [selectedCategoryItem, setSelectedCategoryItem] = useState<CategoryItem | null>(null);
  
  // Image Analysis State
  const [imageAnalysisOpen, setImageAnalysisOpen] = useState(false);
  const [imageAnalysisDay, setImageAnalysisDay] = useState<number | null>(null);

  // Visual Guide State
  const [visualGuideState, setVisualGuideState] = useState<{isOpen: boolean, topic: string, dayNumber: number}>({
      isOpen: false, topic: '', dayNumber: 0
  });

  const exportMenuRef = useRef<HTMLDivElement>(null);
  
  // Toast Hook
  const { toasts, removeToast, success, error: toastError, warning, info } = useToast();

  // Confirm Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
  } | null>(null);

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setConfirmDialog({ isOpen: true, title, message, onConfirm });
  };

  const closeConfirm = () => {
    setConfirmDialog(null);
  };

  // Batch processing states
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchPaused, setBatchPaused] = useState(false);
  const [batchCompleted, setBatchCompleted] = useState(0);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCurrentDay, setBatchCurrentDay] = useState<number | null>(null);
  const [batchEta, setBatchEta] = useState(0);
  const batchCancelRef = useRef(false);
  const batchPauseRef = useRef(false);

  // Auth Listener
  useEffect(() => {
    const unsubscribe = onAuthChange((currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Data Initialization
  useEffect(() => {
    if (!user) return;

    const initializeData = async () => {
        setIsLoadingFromDb(true);
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
  }, [user]);

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

  const handleLogout = async () => {
    try {
      await logOut();
      setDays([]);
      info("Çıkış Yapıldı", "Oturum başarıyla kapatıldı.");
    } catch (error) {
      console.error('Logout error:', error);
      toastError("Çıkış Hatası", "Çıkış yapılırken bir sorun oluştu.");
    }
  };

  const handleBatchGenerate = async () => {
    // Görseli olmayan ve üretilmemiş günleri bul
    const pendingDays = days.filter(d => !d.isGenerated && !d.hasVisual);
    
    if (pendingDays.length === 0) {
      warning("Üretilecek gün bulunamadı", "Tüm günler zaten oluşturulmuş veya görsel gerektiriyor.");
      return;
    }

    // Görsel gerektiren günleri uyar
    const visualDays = days.filter(d => !d.isGenerated && d.hasVisual);
    if (visualDays.length > 0) {
      const proceed = window.confirm(
        `${pendingDays.length} gün otomatik üretilecek.\n\n` +
        `Not: ${visualDays.length} gün görsel gerektirdiği için manuel işlenecek.\n\n` +
        `Devam edilsin mi?`
      );
      if (!proceed) return;
    }

    // Batch başlat
    setBatchRunning(true);
    setBatchPaused(false);
    setBatchCompleted(0);
    setBatchTotal(pendingDays.length);
    setBatchCurrentDay(null);
    setBatchEta(pendingDays.length * 8); // Ortalama 8 saniye/gün
    batchCancelRef.current = false;
    batchPauseRef.current = false;

    const startTime = Date.now();
    let successCount = 0;

    for (let i = 0; i < pendingDays.length; i++) {
      // İptal kontrolü
      if (batchCancelRef.current) {
        console.log('Batch cancelled');
        break;
      }

      // Pause kontrolü
      while (batchPauseRef.current) {
        await new Promise(r => setTimeout(r, 500));
        if (batchCancelRef.current) break;
      }

      const day = pendingDays[i];
      setBatchCurrentDay(day.dayNumber);

      try {
        const { text, visualDesc, workTitle } = await generateDayContent(day, days);

        if (text) {
          const updatedDay: DayEntry = {
            ...day,
            content: text,
            visualDescription: visualDesc,
            workTitle: workTitle,
            isGenerated: true,
            isSaved: true
          };

          setDays(prev => prev.map(d => 
            d.dayNumber === day.dayNumber ? updatedDay : d
          ));

          await saveDayToFirestore(updatedDay);
          successCount++;
          setBatchCompleted(successCount);

          // ETA güncelle
          const elapsed = (Date.now() - startTime) / 1000;
          const avgPerDay = elapsed / successCount;
          const remaining = pendingDays.length - successCount;
          setBatchEta(Math.round(avgPerDay * remaining));
        }
      } catch (error) {
        console.error(`Day ${day.dayNumber} failed:`, error);
      }

      // Rate limiting: 2 saniye bekle (Gemini API limiti için)
      if (i < pendingDays.length - 1 && !batchCancelRef.current) {
        await new Promise(r => setTimeout(r, 2000));
      }
    }

    setBatchRunning(false);
    setBatchCurrentDay(null);
    
    // 5 saniye sonra progress'i gizle
    setTimeout(() => {
      setBatchCompleted(0);
      setBatchTotal(0);
    }, 5000);
    
    if (successCount > 0) {
      success("Toplu İşlem Tamamlandı", `${successCount} gün başarıyla üretildi.`);
    }
  };

  const handleBatchPause = () => {
    batchPauseRef.current = true;
    setBatchPaused(true);
  };

  const handleBatchResume = () => {
    batchPauseRef.current = false;
    setBatchPaused(false);
  };

  const handleBatchCancel = () => {
    batchCancelRef.current = true;
    batchPauseRef.current = false;
    setBatchRunning(false);
    setBatchPaused(false);
    info("İşlem İptal Edildi", "Toplu üretim durduruldu.");
  };

  const handleRegenerate = async (day: DayEntry) => {
    // Guard: If day has visual but no image URL is selected, prevent generation
    if (day.hasVisual && !day.imageUrl) {
        warning("Görsel Gerekli", "Lütfen içerik oluşturmadan önce bir görsel seçin.");
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
      toastError("İçerik Oluşturma Hatası", "İçerik oluşturulurken bir hata oluştu. Lütfen tekrar deneyin.");
    }
  };


  const handleOpenImagePicker = async (day: DayEntry) => {
    setImagePickerDay(day);
    setShowImagePicker(true);
    setImageSearchResults([]);
    setIsSearchingImages(false);
    setSelectedCategoryGroup(null);
    setSelectedCategoryItem(null);
  };

  // Yeni fonksiyon: Görsel Analiz Modalını aç
  const openImageAnalysis = (dayNumber: number) => {
    setImageAnalysisDay(dayNumber);
    setImageAnalysisOpen(true);
    setShowImagePicker(false); // Picker açıksa kapat
  };

  const handleOpenVisualGuide = (day: DayEntry) => {
    setVisualGuideState({
        isOpen: true,
        topic: day.specificTopic,
        dayNumber: day.dayNumber
    });
  };

  // Yeni handler: Analiz sonucu görseli kullan
  const handleImageAnalysisUse = (result: ImageAnalysisResult, imageUrl: string) => {
    if (imageAnalysisDay === null) return;
    
    const updatedDays = [...days];
    const dayIndex = updatedDays.findIndex(d => d.dayNumber === imageAnalysisDay);
    
    if (dayIndex !== -1) {
      // Görseli ayarla
      updatedDays[dayIndex].imageUrl = imageUrl;
      updatedDays[dayIndex].imageSource = 'stock'; // or 'ai' if uploaded
      
      // Konuyu ayarla
      updatedDays[dayIndex].specificTopic = result.suggestedTopic;
      updatedDays[dayIndex].topic = result.suggestedTopic; // Optional, keep sync
      
      // Custom prompt'a analiz bilgilerini ekle
      const analysisPrompt = `
[Görsel Analiz Sonucu]
Görsel Türü: ${result.imageType}
Tespit Edilen Elemanlar: ${result.detectedElements.join(', ')}
Teknik Açıklama: ${result.technicalDescription}
Önerilen İçerik: ${result.suggestedContent}
`;
      updatedDays[dayIndex].customPrompt = analysisPrompt;
      updatedDays[dayIndex].imageAnalysis = result.technicalDescription;
      
      setDays(updatedDays);
      success('Başarılı', 'Görsel ve konu analiz sonucuna göre ayarlandı!');
    }
    
    setImageAnalysisOpen(false);
    setImageAnalysisDay(null);
  };

  const handleSearchWithType = async (imageType: string) => {
    if (!imagePickerDay) return;
    setIsSearchingImages(true);
    
    try {
      const images = await searchImages(imagePickerDay.specificTopic, 15, imageType);
      setImageSearchResults(images);
    } catch (err) {
      console.error("Image Search Error", err);
      toastError("Arama Hatası", "Görseller aranırken bir sorun oluştu.");
    } finally {
      setIsSearchingImages(false);
    }
  };

  const handleCategorySearch = async (categoryId: string) => {
    setCategorySearching(categoryId);
    setIsSearchingImages(true);

    // Kategori bilgisini bul ve sakla
    let foundCategory: CategoryItem | null = null;
    for (const group of PRESET_CATEGORIES) {
      const found = group.items.find(item => item.id === categoryId);
      if (found) {
        foundCategory = found;
        break;
      }
    }
    setSelectedCategoryItem(foundCategory);
    
    try {
      const results = await searchByCategory(categoryId, 15);
      setImageSearchResults(results);
      if (results.length === 0) {
        info('Sonuç Yok', 'Bu kategoride görsel bulunamadı');
      }
    } catch (error) {
      console.error('Category search failed:', error);
      toastError('Hata', 'Kategori araması başarısız');
    } finally {
      setIsSearchingImages(false);
      setCategorySearching(null);
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

        // Kategori seçildiyse otomatik konu ve prompt ayarla
        if (selectedCategoryItem) {
          updatedDay.specificTopic = selectedCategoryItem.suggestedTopic;
          
          const existingPrompt = updatedDay.customPrompt || '';
          if (!existingPrompt.includes(selectedCategoryItem.suggestedPrompt)) {
            updatedDay.customPrompt = existingPrompt 
              ? existingPrompt + '\n\n' + selectedCategoryItem.suggestedPrompt
              : selectedCategoryItem.suggestedPrompt;
          }
        }

        if (d.isSaved) {
          saveDayToFirestore(updatedDay);
        }
        return updatedDay;
      }
      return d;
    });
    setDays(finalDays);

    if (selectedCategoryItem) {
      success('Otomatik Ayarlandı', `Konu ve prompt güncellendi: ${selectedCategoryItem.name}`);
    }

    setShowImagePicker(false);
    setImagePickerDay(null);
    setImageSearchResults([]);
    setSelectedCategoryItem(null);
  };

  // Yeni: Konuya göre otomatik görsel bulma
  const handleQuickImageSearch = async (day: DayEntry) => {
    try {
      // Konuya göre görsel ara (saha tipi varsayılan)
      const images = await searchImages(day.specificTopic, 15, 'saha');
      
      if (images.length > 0) {
        // İlk görseli seç ve ata
        const imageUrl = images[0].url;
        
        // Görseli analiz et
        let imageAnalysis = "";
        try {
          imageAnalysis = await analyzeImage(imageUrl);
        } catch (err) {
          console.error("Analiz hatası", err);
        }
        
        const finalDays = days.map(d => {
          if (d.dayNumber === day.dayNumber) {
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
        success('Görsel Bulundu', 'Konuya uygun görsel otomatik seçildi');
      } else {
        toastError('Görsel Bulunamadı', 'Bu konu için uygun görsel bulunamadı. Manuel arama yapın.');
      }
    } catch (err) {
      console.error("Quick Image Search Error", err);
      toastError("Arama Hatası", "Görseller aranırken bir sorun oluştu.");
    }
  };

  const handleSave = async (day: DayEntry) => {
    const result = await saveDayToFirestore(day);
    if (result) {
      const finalDays = days.map(d => d.dayNumber === day.dayNumber ? { ...d, isSaved: true } : d);
      setDays(finalDays);
      success('Kaydedildi', `Gün ${day.dayNumber} başarıyla kaydedildi`);
    } else {
      toastError('Hata', 'Kaydetme sırasında bir hata oluştu');
    }
  };

  const handleDelete = async (day: DayEntry) => {
    showConfirm(
      'Günü Sil',
      `Gün ${day.dayNumber} içeriği silinecek. Devam edilsin mi?`,
      async () => {
        closeConfirm();
        const result = await deleteDayFromFirestore(day.dayNumber);
        if (result) {
          const finalDays = days.map(d => d.dayNumber === day.dayNumber 
            ? { ...d, content: '', isGenerated: false, isSaved: false } 
            : d
          );
          setDays(finalDays);
          success('Silindi', `Gün ${day.dayNumber} başarıyla silindi`);
        } else {
          toastError('Hata', 'Silme sırasında bir hata oluştu');
        }
      }
    );
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
    success("Plan Güncellendi", "Değişiklikler kaydedildi.");
  };

  const handleResetAll = async () => {
    showConfirm(
      'Tüm Verileri Sıfırla',
      'Bu işlem tüm içerikleri ve planı silecek. Bu işlem geri alınamaz!',
      async () => {
        closeConfirm();
        setIsLoadingFromDb(true);
        setError(null);
        try {
          const result = await resetFirestoreData();
          if (result) {
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
            success('Sıfırlandı', 'Tüm veriler başarıyla sıfırlandı');
          } else {
            toastError('Hata', 'Sıfırlama sırasında bir hata oluştu');
          }
        } catch (err) {
          console.error("Reset failed", err);
          setError("Sıfırlama işlemi başarısız. Sayfayı yenileyip tekrar deneyin.");
          toastError("Hata", "Sıfırlama işlemi başarısız oldu.");
        } finally {
          setIsLoadingFromDb(false);
        }
      }
    );
  };

  const handleExport = async () => {
    const savedDays = days.filter(d => d.isSaved && d.isGenerated);
    if (savedDays.length === 0) {
      warning("Veri Yok", "Dışa aktarılacak kaydedilmiş gün bulunamadı.");
      return;
    }
  
    // Görsel URL'lerini base64'e çevir (CORS sorunlarını çözmek için)
    const fetchImageAsBase64 = async (url: string): Promise<ArrayBuffer | null> => {
      try {
        // Proxy kullanarak CORS bypass
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`;
        const response = await fetch(proxyUrl);
        if (!response.ok) return null;
        return await response.arrayBuffer();
      } catch (error) {
        console.error('Image fetch failed:', error);
        return null;
      }
    };
  
    // Tüm günler için içerik oluştur
    const dayContents = await Promise.all(savedDays.map(async (day) => {
      const paragraphs: any[] = [
        new Paragraph({
          children: [
            new TextRun({ text: `GÜN ${day.dayNumber}`, bold: true, size: 28 }),
            new TextRun({ text: ` - ${day.date}`, size: 24, color: "666666" }),
          ],
          spacing: { before: 400, after: 100 },
          border: {
            bottom: { color: "1e40af", size: 6, style: "single", space: 1 }
          }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "Staj Türü: ", bold: true }),
            new TextRun({ text: day.type === InternshipType.PRODUCTION_DESIGN ? "Üretim/Tasarım" : "İşletme" }),
          ],
          spacing: { after: 100 }
        }),
        new Paragraph({
          children: [
            new TextRun({ text: "ÇALIŞMA RAPORU: ", bold: true, color: "1e40af" }),
            new TextRun({ text: day.workTitle || day.specificTopic, bold: true })
          ],
          spacing: { after: 200 }
        }),
      ];
  
      // İçerik paragrafları
      const contentParagraphs = day.content.split('\n\n').filter(p => p.trim());
      contentParagraphs.forEach(para => {
        paragraphs.push(
          new Paragraph({
            text: para.trim(),
            spacing: { after: 150 },
            alignment: AlignmentType.JUSTIFIED
          })
        );
      });
  
      // Görsel varsa ekle
      if (day.imageUrl) {
        const imageBuffer = await fetchImageAsBase64(day.imageUrl);
        if (imageBuffer) {
          paragraphs.push(
            new Paragraph({
              children: [
                new ImageRun({
                  data: imageBuffer,
                  transformation: { width: 400, height: 300 },
                  type: 'png'
                })
              ],
              alignment: AlignmentType.CENTER,
              spacing: { before: 200, after: 100 }
            })
          );
          
          if (day.visualDescription) {
            paragraphs.push(
              new Paragraph({
                children: [
                  new TextRun({ text: day.visualDescription, italics: true, size: 20, color: "666666" })
                ],
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 }
              })
            );
          }
        }
      }
  
      // Ayırıcı çizgi
      paragraphs.push(
        new Paragraph({
          text: "",
          border: {
            bottom: { color: "cccccc", size: 1, style: "single", space: 1 }
          },
          spacing: { before: 200, after: 200 }
        })
      );
  
      return paragraphs;
    }));
  
    const doc = new Document({
      sections: [{
        properties: {},
        children: [
          // Başlık sayfası
          new Paragraph({
            text: "STAJ DEFTERİ",
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            spacing: { after: 200 }
          }),
          new Paragraph({
            text: "2. Staj (Üretim/Tasarım/İşletme)",
            alignment: AlignmentType.CENTER,
            spacing: { after: 400 }
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Öğrenci: ", bold: true }),
              new TextRun(`${STUDENT_INFO.name} (${STUDENT_INFO.studentId})`),
            ],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Bölüm: ", bold: true }),
              new TextRun(STUDENT_INFO.department),
            ],
            alignment: AlignmentType.CENTER
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Firma: ", bold: true }),
              new TextRun(COMPANY_INFO.name),
            ],
            alignment: AlignmentType.CENTER,
            spacing: { after: 800 }
          }),
          // Tüm günlerin içerikleri
          ...dayContents.flat()
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
      success("Word Dosyası Hazır", "İndirme işlemi başlatıldı.");
    } catch (err) {
      console.error("Export failed", err);
      toastError("Hata", "Word dosyası oluşturulurken hata çıktı.");
    }
  };

  const handleExportPDF = async () => {
    const savedDays = days.filter(d => d.isSaved && d.isGenerated);
    if (savedDays.length === 0) {
      warning("Veri Yok", "Dışa aktarılacak kaydedilmiş gün bulunamadı.");
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
      success("PDF Hazır", "İndirme işlemi başlatıldı.");
    } catch (err) {
      console.error("PDF export failed", err);
      toastError("Hata", "PDF oluşturulurken hata çıktı.");
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Escape tuşu - modalları kapat
      if (e.key === 'Escape') {
        if (confirmDialog) {
          closeConfirm();
        }
        if (showExportMenu) {
          setShowExportMenu(false);
        }
      }
      
      // Ctrl+Shift+S - Tümünü kaydet (Export)
      if (e.ctrlKey && e.shiftKey && e.key === 'S') {
        e.preventDefault();
        setShowExportMenu(prev => !prev);
      }
      
      // Ctrl+Shift+G - Toplu üret
      if (e.ctrlKey && e.shiftKey && e.key === 'G') {
        e.preventDefault();
        if (!batchRunning) {
          handleBatchGenerate();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [confirmDialog, showExportMenu, batchRunning, handleBatchGenerate]);

  // Auth Loading Screen
  if (authLoading) {
    return <LoadingScreen message="Oturum kontrol ediliyor..." />;
  }

  // Not Authenticated -> Show Login
  if (!user) {
    return <LoginScreen onLoginSuccess={() => success("Giriş Başarılı", "Hoş geldiniz!")} />;
  }

  // App Loading Screen (Data Fetching)
  if (isLoadingFromDb) {
     return <LoadingScreen message={`Veriler yükleniyor... (${user.email})`} />;
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
          
          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-800 text-xs text-zinc-400">
              <UserIcon className="w-3.5 h-3.5" />
              <span className="max-w-[120px] truncate">{user.displayName || user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/30 hover:text-red-400 text-zinc-400 text-xs transition-colors"
              title="Çıkış Yap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Çıkış</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
            
            {/* Left Sidebar */}
            <div className="lg:col-span-4 space-y-6 sticky top-24 h-fit">
                <Stats stats={stats} />
                
                {/* Curriculum Progress */}
                <WeekProgress 
                  completedDays={days.filter(d => d.isSaved).map(d => d.dayNumber)}
                  isExpanded={true}
                />
                
                {/* Actions Panel */}
                <div className="bg-zinc-900 p-6 rounded-2xl border border-zinc-800 shadow-lg space-y-4">
                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-4">İşlemler</h3>
                    
                    <button 
                        onClick={handleBatchGenerate}
                        disabled={batchRunning}
                        className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white rounded-xl font-medium transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/20 mb-4 disabled:opacity-50 disabled:cursor-not-allowed group"
                    >
                        <Wand2 className="w-5 h-5 group-hover:scale-110 transition-transform" />
                        Otomatik Üret
                    </button>

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
                                savedDays={days.filter(d => d.isSaved)}
                                isLast={index === days.length - 1}
                                onRegenerate={handleRegenerate}
                                onSave={handleSave}
                                onDelete={handleDelete}
                                onUpdatePlan={handleUpdatePlan}
                                onSearchImage={handleOpenImagePicker}
                                onQuickImageSearch={handleQuickImageSearch}
                                onImageClick={setSelectedImage}
                                onOpenVisualGuide={handleOpenVisualGuide}
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
                onClick={() => { setShowImagePicker(false); setImagePickerDay(null); setImageSearchResults([]); setSelectedCategoryGroup(null); setSelectedCategoryItem(null); }}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4">
              {!isSearchingImages && imageSearchResults.length === 0 && (
                <div className="p-4 space-y-4">
                  {/* AI Analysis Option */}
                  <div className="mb-6 p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-purple-400 flex items-center gap-2">
                        <span className="text-lg">🧠</span> AI Görsel Analizi
                      </h4>
                      <p className="text-xs text-zinc-400 mt-1">
                        Kendi görselinizi yükleyin, AI analiz etsin ve günü yazsın.
                      </p>
                    </div>
                    <button
                      onClick={() => openImageAnalysis(imagePickerDay!.dayNumber)}
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-lg shadow-purple-900/20"
                    >
                      🔍 Görsel Analiz
                    </button>
                  </div>

                  <p className="text-sm text-zinc-400 text-center">Veya aramak istediğiniz görsel tipini seçin:</p>
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

                  {/* HAZIR KATEGORİLER */}
                  <div className="mt-8 pt-6 border-t border-zinc-800">
                      <h4 className="text-sm font-bold text-zinc-400 mb-3 flex items-center gap-2">
                        📚 Hazır Kategoriler
                      </h4>
                      
                      {/* Kategori Grupları */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {PRESET_CATEGORIES.map(group => (
                          <button
                            key={group.id}
                            onClick={() => setSelectedCategoryGroup(selectedCategoryGroup === group.id ? null : group.id)}
                            className={`
                              px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center gap-2 border
                              ${selectedCategoryGroup === group.id 
                                ? 'bg-blue-500/10 border-blue-500/50 text-blue-400' 
                                : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'}
                            `}
                          >
                            <span>{group.icon}</span>
                            <span>{group.name}</span>
                          </button>
                        ))}
                      </div>

                      {/* Seçili Grubun Alt Kategorileri */}
                      {selectedCategoryGroup && (
                        <div className="bg-zinc-950/50 rounded-xl p-4 border border-zinc-800 animate-fade-in">
                          <div className="flex flex-wrap gap-2">
                            {PRESET_CATEGORIES
                              .find(g => g.id === selectedCategoryGroup)
                              ?.items.map(item => (
                                <button
                                  key={item.id}
                                  onClick={() => handleCategorySearch(item.id)}
                                  disabled={categorySearching !== null}
                                  title={item.description}
                                  className={`
                                    px-3 py-1.5 rounded-md text-xs border transition-all
                                    ${categorySearching === item.id 
                                      ? 'bg-blue-600 border-blue-600 text-white' 
                                      : 'bg-zinc-800 border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500'}
                                    ${categorySearching !== null && categorySearching !== item.id ? 'opacity-50 cursor-not-allowed' : ''}
                                  `}
                                >
                                  {categorySearching === item.id ? (
                                    <span className="flex items-center gap-1">
                                      <Loader2 className="w-3 h-3 animate-spin" /> Aranıyor...
                                    </span>
                                  ) : item.name}
                                </button>
                              ))}
                          </div>
                          
                          {/* Kategori açıklaması */}
                          <p className="mt-3 text-[10px] text-zinc-600 flex items-center gap-1.5 italic">
                            <Info className="w-3 h-3" /> Wikimedia Commons ve Google'dan teknik görseller aranır
                          </p>
                        </div>
                      )}
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
      
      <BatchProgress
        isRunning={batchRunning}
        isPaused={batchPaused}
        completed={batchCompleted}
        total={batchTotal}
        currentDay={batchCurrentDay}
        eta={batchEta}
        onPause={handleBatchPause}
        onResume={handleBatchResume}
        onCancel={handleBatchCancel}
      />
      
      <ToastContainer toasts={toasts} onClose={removeToast} />

      {confirmDialog && (
        <ConfirmDialog
          isOpen={confirmDialog.isOpen}
          title={confirmDialog.title}
          message={confirmDialog.message}
          type="danger"
          confirmText="Evet, Sil"
          cancelText="Vazgeç"
          onConfirm={confirmDialog.onConfirm}
          onCancel={closeConfirm}
        />
      )}

      {/* Image Analysis Modal */}
      <ImageAnalysisModal
        isOpen={imageAnalysisOpen}
        onClose={() => {
          setImageAnalysisOpen(false);
          setImageAnalysisDay(null);
        }}
        onUseImage={handleImageAnalysisUse}
        dayNumber={imageAnalysisDay || 1}
      />

      {/* Visual Guide Modal */}
      <VisualGuideModal 
          isOpen={visualGuideState.isOpen}
          onClose={() => setVisualGuideState(prev => ({ ...prev, isOpen: false }))}
          topic={visualGuideState.topic}
          dayNumber={visualGuideState.dayNumber}
      />
    </div>
  );
};

export default App;