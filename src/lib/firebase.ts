import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseConfig } from '@/types/crm';
import { SHARED_FIREBASE_CONFIG } from './firebaseConfig';

export function getFirebaseConfig(): FirebaseConfig {
  return SHARED_FIREBASE_CONFIG;
}

export function getFirebaseDb(): Firestore | null {
  const config = getFirebaseConfig();
  if (!config || !config.apiKey || !config.projectId) {
    return null;
  }

  try {
    const app: FirebaseApp = getApps().length === 0 ? initializeApp(config) : getApp();
    return getFirestore(app);
  } catch (err) {
    console.warn('Firebase initialization error:', err);
    return null;
  }
}
