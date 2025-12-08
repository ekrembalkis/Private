
import { 
  signInWithPopup, 
  signInWithRedirect,
  signOut, 
  onAuthStateChanged,
  GoogleAuthProvider,
  User
} from 'firebase/auth';
import { auth } from './firebaseService';

const googleProvider = new GoogleAuthProvider();

// Mobil cihaz kontrolü
const isMobileDevice = (): boolean => {
  return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
};

// Google ile giriş
export const signInWithGoogle = async (): Promise<User | null> => {
  try {
    if (isMobileDevice()) {
      // Mobilde redirect kullan
      await signInWithRedirect(auth, googleProvider);
      return null;
    } else {
      // Desktop'ta popup kullan
      const result = await signInWithPopup(auth, googleProvider);
      return result.user;
    }
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw error;
  }
};

// Çıkış yap
export const logOut = async (): Promise<void> => {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Sign out error:', error);
    throw error;
  }
};

// Auth durumu dinle
export const onAuthChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Mevcut kullanıcıyı al
export const getCurrentUser = (): User | null => {
  return auth.currentUser;
};
