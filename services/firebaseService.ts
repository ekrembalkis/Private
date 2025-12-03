
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDocs, getDoc, collection, deleteDoc, writeBatch } from "firebase/firestore";
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
const db = getFirestore(app);

const COLLECTION_NAME = "days";
const CONFIG_COLLECTION = "config";
const PLAN_DOC_ID = "plan";

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

export const saveDayToFirestore = async (day: DayEntry): Promise<boolean> => {
  try {
    const docId = `day-${day.dayNumber}`;
    // Prepare data object
    const dayData = {
      ...day,
      isSaved: true,
      isLoading: false,
      isImageLoading: false
    };

    // Clean undefined fields before sending to Firestore
    const cleanedData = cleanUndefinedFields(dayData);

    await setDoc(doc(db, COLLECTION_NAME, docId), cleanedData, { merge: true });
    return true;
  } catch (error) {
    console.error("Error saving day to Firestore:", error);
    return false;
  }
};

export const loadAllDaysFromFirestore = async (): Promise<DayEntry[]> => {
  try {
    const querySnapshot = await getDocs(collection(db, COLLECTION_NAME));
    const days: DayEntry[] = [];
    querySnapshot.forEach((doc) => {
      days.push(doc.data() as DayEntry);
    });
    return days;
  } catch (error) {
    console.error("Error loading days from Firestore:", error);
    return [];
  }
};

export const deleteDayFromFirestore = async (dayNumber: number): Promise<boolean> => {
  try {
    const docId = `day-${dayNumber}`;
    await deleteDoc(doc(db, COLLECTION_NAME, docId));
    return true;
  } catch (error) {
    console.error("Error deleting day from Firestore:", error);
    return false;
  }
};

export const savePlanToFirestore = async (days: DayEntry[]): Promise<boolean> => {
  try {
    // Extract only structural info needed for the plan
    const planData = days.map(d => ({
      dayNumber: d.dayNumber,
      date: d.date,
      type: d.type,
      specificTopic: d.specificTopic,
      hasVisual: d.hasVisual,
      topic: d.topic
    }));

    await setDoc(doc(db, CONFIG_COLLECTION, PLAN_DOC_ID), { days: planData });
    return true;
  } catch (error) {
    console.error("Error saving plan to Firestore:", error);
    return false;
  }
};

export const loadPlanFromFirestore = async (): Promise<DayEntry[] | null> => {
  try {
    const docRef = doc(db, CONFIG_COLLECTION, PLAN_DOC_ID);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.days as DayEntry[];
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error loading plan from Firestore:", error);
    return null;
  }
};

export const resetFirestoreData = async (): Promise<boolean> => {
  try {
    const batch = writeBatch(db);
    let operationCount = 0;

    // 1. Delete Plan
    const planRef = doc(db, CONFIG_COLLECTION, PLAN_DOC_ID);
    batch.delete(planRef);
    operationCount++;

    // 2. Delete All Days
    const daysSnapshot = await getDocs(collection(db, COLLECTION_NAME));
    daysSnapshot.forEach((docSnapshot) => {
      batch.delete(docSnapshot.ref);
      operationCount++;
    });

    if (operationCount > 0) {
        await batch.commit();
    }
    
    return true;
  } catch (error) {
    console.error("Error resetting Firestore data:", error);
    return false;
  }
};
