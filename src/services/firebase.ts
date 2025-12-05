import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, addDoc, updateDoc } from 'firebase/firestore';
import { User, TrackingSession } from '../types';

// My Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyBw3uxdvMvtMtHN-Pde1Hjr8oMW180Zuew",
  authDomain: "airlens-64cc2.firebaseapp.com",
  projectId: "airlens-64cc2",
  storageBucket: "airlens-64cc2.firebasestorage.app",
  messagingSenderId: "6453178822",
  appId: "1:6453178822:web:9880201691b128648742c7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export instances
export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();

// --- Firestore Helpers ---

export const createUserProfile = async (uid: string, data: { name: string; email: string }) => {
  try {
    await setDoc(doc(db, "users", uid), {
      uid,
      name: data.name,
      email: data.email,
      createdAt: new Date().toISOString(),
      theme: 'dark', // Default preference
      aqiHistory: []
    });
  } catch (e) {
    console.error("Error creating user profile", e);
  }
};

export const getUserProfile = async (uid: string): Promise<User | null> => {
  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        name: data.name,
        email: data.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
        theme: data.theme
      };
    }
    return null;
  } catch (e) {
    console.error("Error fetching profile", e);
    return null;
  }
};

export const saveQuizScore = async (uid: string, score: number, total: number) => {
  try {
    await addDoc(collection(db, "users", uid, "quiz_scores"), {
      score,
      total,
      date: new Date().toISOString()
    });
  } catch (e) {
    console.error("Error saving quiz score", e);
  }
};

export const saveTrackingSession = async (session: TrackingSession): Promise<boolean> => {
  try {
    // Save to user's personal collection AND a global anonymous collection for heatmaps if needed
    if (session.uid && session.uid !== 'guest') {
       await addDoc(collection(db, "users", session.uid, "exposures"), {
         ...session,
         savedAt: new Date().toISOString()
       });
    }
    // Also save to a global collection for aggregate analysis (optional)
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

export const updateUserTheme = async (uid: string, isDark: boolean) => {
  try {
    await updateDoc(doc(db, "users", uid), {
      theme: isDark ? 'dark' : 'light'
    });
  } catch (e) {
    console.error("Error updating theme", e);
  }
};