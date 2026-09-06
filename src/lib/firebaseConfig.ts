import { FirebaseConfig } from '@/types/crm';

/**
 * Centrally configured Firebase credentials.
 * Both Adem and Abdou share this single database configuration across all phones and devices.
 * Hardcoded directly in code and backed by .env.local for seamless cloud sync.
 */
export const SHARED_FIREBASE_CONFIG: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyAZbV2rH7pUiYeCub2RaoTJniy97lhaqyA',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'crm-digital-d9106.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'crm-digital-d9106',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'crm-digital-d9106.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '499705643677',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:499705643677:web:618a59e248aeaa57410a74',
};
