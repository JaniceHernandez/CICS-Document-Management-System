'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore'
import { getStorage } from 'firebase/storage'

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
export function initializeFirebase() {
  if (getApps().length > 0) {
    return getSdks(getApp());
  }

  let firebaseApp;
  
  // Prioritize the config object if it's populated to avoid initialization errors during build/dev
  const hasConfig = firebaseConfig && firebaseConfig.apiKey && firebaseConfig.apiKey !== "YOUR_API_KEY" && firebaseConfig.apiKey !== "";

  if (hasConfig) {
    // If we have a config, use it directly. This avoids the app/no-options error during build.
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    try {
      // Fallback to automatic environment detection (e.g. Firebase App Hosting)
      firebaseApp = initializeApp();
    } catch (e) {
      // Only warn if we absolutely have no other choice
      if (process.env.NODE_ENV === "production") {
        console.warn('Firebase initialization: Attempting fallback to potentially empty config object.', e);
      }
      firebaseApp = initializeApp(firebaseConfig);
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
