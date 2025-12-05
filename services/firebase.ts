
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc } from 'firebase/firestore';
import { TrackingSession } from '../types';

// Placeholder config - User should replace with real keys from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSy_PLACEHOLDER_KEY",
  authDomain: "airlens-app.firebaseapp.com",
  projectId: "airlens-app",
  storageBucket: "airlens-app.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let db: any = null;

try {
  const app = initializeApp(firebaseConfig);
  db = getFirestore(app);
} catch (e) {
  console.warn("Firebase initialization failed. Ensure valid config.", e);
}

export const saveTrackingSession = async (session: TrackingSession): Promise<boolean> => {
  if (!db) {
    console.warn("Firestore not initialized, skipping save.");
    return false;
  }
  
  try {
    await addDoc(collection(db, "exposures"), {
      ...session,
      savedAt: new Date().toISOString()
    });
    return true;
  } catch (error) {
    console.error("Error saving tracking session:", error);
    return false;
  }
};
