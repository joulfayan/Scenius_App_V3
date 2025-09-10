// src/lib/firebase.client.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore, connectFirestoreEmulator } from "firebase/firestore";
import { getAuth, connectAuthEmulator } from "firebase/auth";
import { getStorage, connectStorageEmulator } from "firebase/storage";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

// Initialize Firebase app if not already initialized
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Initialize Firebase services
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app);

// Connect to Firebase Emulators in development mode
if (import.meta.env.DEV) {
  // Connect to Auth Emulator (port 9099)
  connectAuthEmulator(auth, 'http://127.0.0.1:9099');
  
  // Connect to Firestore Emulator (port 8080)
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
  
  // Connect to Storage Emulator (port 9199)
  connectStorageEmulator(storage, '127.0.0.1', 9199);
}

// Export Firebase services
export { db, auth, storage };