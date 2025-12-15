
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, getDoc, collection, deleteDoc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { DayEntry } from "../types";

const firebaseConfig = {
  apiKey: "AIzaSyCVLIW6w0CAxf-86ye7AtNEqhYeN__x54A",
  authDomain: "staj-d197a.firebaseapp.com",
  projectId: "staj-d197a",
  storageBucket: "staj-d197a.firebasestorage.app",
  messagingSenderId: "681571913744",
  appId: "1:681571913744:web:3eb7c26aee96ed195d7a95"
};

// Initialize Firebase (Singleton pattern)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);

// Helper to remove undefined fields which Firestore doesn't support
const cleanUndefinedFields = (obj: any): any => {
  const cleaned: any = {};
  for (const key in obj) {
    if (obj[key] !== undefined) {
      cleaned[key] = obj[key];
    }
  }
  return cleaned;
};

// --- User Specific Helpers ---

// Kullanıcı ID'sini al
const getUserId = (): string => {
  const user = auth.currentUser;
  if (!user) throw new Error('Kullanıcı giriş yapmamış');
  return user.uid;
};

// Kullanıcıya özel collection referansı
const getUserCollection = (collectionName: string) => {
  const userId = getUserId();
  return collection(db, 'users', userId, collectionName);
};

// Kullanıcıya özel document referansı
const getUserDoc = (collectionName: string, docId: string) => {
  const userId = getUserId();
  return doc(db, 'users', userId, collectionName, docId);
};

// --- CRUD Operations ---

// Plan kaydetme
export const savePlanToFirestore = async (days: DayEntry[]): Promise<boolean> => {
  try {
    const planRef = getUserDoc('data', 'plan');
    const planData = days.map(d => ({
      dayNumber: d.dayNumber,
      date: d.date,
      type: d.type,
      specificTopic: d.specificTopic,
      customPrompt: d.customPrompt || '',
      hasVisual: d.hasVisual,
      topic: d.topic || ''
    }));
    
    await setDoc(planRef, { days: planData, updatedAt: new Date().toISOString() });
    return true;
  } catch (error) {
    console.error("Error saving plan:", error);
    return false;
  }
};

// Plan yükleme
export const loadPlanFromFirestore = async (): Promise<DayEntry[] | null> => {
  try {
    const planRef = getUserDoc('data', 'plan');
    const planSnap = await getDoc(planRef);
    if (planSnap.exists()) {
      return planSnap.data().days as DayEntry[];
    }
    return null;
  } catch (error) {
    console.error("Error loading plan:", error);
    return null;
  }
};

// Gün kaydetme
export const saveDayToFirestore = async (day: DayEntry): Promise<boolean> => {
  try {
    const dayRef = getUserDoc('entries', `day-${day.dayNumber}`);
    
    const dayData = {
      ...day,
      isSaved: true,
      isLoading: false,
      isImageLoading: false,
      updatedAt: new Date().toISOString()
    };

    // Firestore undefined sevmez, temizleyelim
    const cleanedData = cleanUndefinedFields(dayData);

    await setDoc(dayRef, cleanedData);
    return true;
  } catch (error) {
    console.error("Error saving day:", error);
    return false;
  }
};

// Tüm günleri yükle
export const loadAllDaysFromFirestore = async (): Promise<DayEntry[]> => {
  try {
    const entriesRef = getUserCollection('entries');
    const snapshot = await getDocs(entriesRef);
    return snapshot.docs.map(doc => doc.data() as DayEntry);
  } catch (error) {
    console.error("Error loading days:", error);
    return [];
  }
};

// Gün silme
export const deleteDayFromFirestore = async (dayNumber: number): Promise<boolean> => {
  try {
    const dayRef = getUserDoc('entries', `day-${dayNumber}`);
    await deleteDoc(dayRef);
    return true;
  } catch (error) {
    console.error("Error deleting day:", error);
    return false;
  }
};

// Verileri Sıfırla
export const resetFirestoreData = async (): Promise<boolean> => {
  try {
    // 1. Delete All Entry Docs
    const entriesRef = getUserCollection('entries');
    const snapshot = await getDocs(entriesRef);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
    // 2. Delete Plan Doc
    const planRef = getUserDoc('data', 'plan');
    await deleteDoc(planRef);
    
    return true;
  } catch (error) {
    console.error("Error resetting data:", error);
    return false;
  }
};
