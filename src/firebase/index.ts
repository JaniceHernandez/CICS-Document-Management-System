'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// Robust initialization to avoid 'app/no-options' during build/SSR
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  let firebaseApp;
  
  // Check if config exists and is valid (not placeholders)
  const isConfigValid = firebaseConfig && 
                        firebaseConfig.apiKey && 
                        firebaseConfig.apiKey !== "YOUR_API_KEY" && 
                        firebaseConfig.apiKey !== "";

  if (isConfigValid) {
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    try {
      // Fallback to automatic environment detection (e.g. Firebase App Hosting)
      firebaseApp = initializeApp();
    } catch (e) {
      // Final fallback to potentially empty config to satisfy SDK requirements, 
      // but only if we have no other choice.
      firebaseApp = initializeApp(firebaseConfig || {});
    }
  }

  return getSdks(firebaseApp);
}

export function getSdks(firebaseApp: FirebaseApp) {
  return {
    firebaseApp,
    auth: getAuth(firebaseApp),
    firestore: getFirestore(firebaseApp),
    storage: getStorage(firebaseApp)
  };
}

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './non-blocking-updates';
export * from './non-blocking-login';
export * from './errors';
export * from './error-emitter';
