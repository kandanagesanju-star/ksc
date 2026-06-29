import { initializeApp, getApp, getApps } from 'firebase/app';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

export interface FirebaseConfig {
  apiKey: string;
  authDomain?: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
}

const getFirebaseConfig = (): FirebaseConfig | null => {
  const saved = localStorage.getItem('firebase_config');
  if (saved) {
    try {
      const config = JSON.parse(saved) as FirebaseConfig;
      if (config.apiKey && config.projectId) {
        return config;
      }
    } catch (e) {
      console.error('Error parsing firebase_config from localStorage', e);
    }
  }

  // Fallback to env variables if defined
  const envConfig: FirebaseConfig = {
    apiKey: (import.meta.env.VITE_FIREBASE_API_KEY as string) || '',
    authDomain: (import.meta.env.VITE_FIREBASE_AUTH_DOMAIN as string) || '',
    projectId: (import.meta.env.VITE_FIREBASE_PROJECT_ID as string) || '',
    storageBucket: (import.meta.env.VITE_FIREBASE_STORAGE_BUCKET as string) || '',
    messagingSenderId: (import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID as string) || '',
    appId: (import.meta.env.VITE_FIREBASE_APP_ID as string) || ''
  };

  if (envConfig.apiKey && envConfig.projectId) {
    return envConfig;
  }

  return null;
};

const config = getFirebaseConfig();

let app;
let db: any = null;
let isFirebaseEnabled = false;

if (config) {
  try {
    if (getApps().length === 0) {
      app = initializeApp(config);
    } else {
      app = getApp();
    }
    
    // Initialize Firestore with multi-tab offline persistence
    db = initializeFirestore(app, {
      localCache: persistentLocalCache({
        tabManager: persistentMultipleTabManager(),
      }),
    });
    
    isFirebaseEnabled = true;
    console.log('Firebase Cloud Database initialized successfully.');
  } catch (e) {
    console.error('Failed to initialize Firebase:', e);
    isFirebaseEnabled = false;
    db = null;
  }
} else {
  console.log('Firebase not configured. Operating in Local Only Mode.');
}

export { db, isFirebaseEnabled, getFirebaseConfig };
export default db;
