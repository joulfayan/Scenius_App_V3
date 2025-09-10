// src/services/scripts.ts
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  collection,
  addDoc,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase.client';

export interface Script {
  id: string;
  content: string;
  version: number;
  durationMins: number;
  updatedAt: any; // serverTimestamp
}

export interface ScriptVersion {
  id: string;
  content: string;
  note: string;
  createdAt: any; // serverTimestamp
}

export interface SaveScriptData {
  content: string;
  version: number;
  durationMins: number;
}

export interface SaveScriptVersionData {
  content: string;
  note: string;
}

/**
 * Gets a single script by ID
 * @param projectId - The project ID
 * @param scriptId - The script ID to fetch
 * @returns Promise with the script data or null if not found
 */
export async function getScript(projectId: string, scriptId: string): Promise<Script | null> {
  const scriptDoc = doc(db, 'projects', projectId, 'scripts', scriptId);
  const docSnap = await getDoc(scriptDoc);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Script;
  }
  
  return null;
}

/**
 * Saves or updates a script in Firestore
 * @param projectId - The project ID
 * @param scriptId - The script ID
 * @param data - Script data to save
 * @returns Promise that resolves when script is saved
 */
export async function saveScript(
  projectId: string, 
  scriptId: string, 
  data: SaveScriptData
): Promise<void> {
  const scriptDoc = doc(db, 'projects', projectId, 'scripts', scriptId);
  
  const scriptData = {
    content: data.content,
    version: data.version,
    durationMins: data.durationMins,
    updatedAt: serverTimestamp()
  };

  await setDoc(scriptDoc, scriptData, { merge: true });
}

/**
 * Saves a new version of a script
 * @param projectId - The project ID
 * @param scriptId - The script ID
 * @param data - Script version data to save
 * @returns Promise with the created version ID
 */
export async function saveScriptVersion(
  projectId: string, 
  scriptId: string, 
  data: SaveScriptVersionData
): Promise<string> {
  const versionsCollection = collection(db, 'projects', projectId, 'scripts', scriptId, 'versions');
  
  const versionData = {
    content: data.content,
    note: data.note,
    createdAt: serverTimestamp()
  };

  const docRef = await addDoc(versionsCollection, versionData);
  return docRef.id;
}

/**
 * Subscribes to real-time updates for a script
 * @param projectId - The project ID
 * @param scriptId - The script ID
 * @param callback - Function to call when script data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeScript(
  projectId: string,
  scriptId: string,
  callback: (script: Script | null) => void
): Unsubscribe {
  const scriptDoc = doc(db, 'projects', projectId, 'scripts', scriptId);
  
  return onSnapshot(scriptDoc, (docSnap) => {
    if (docSnap.exists()) {
      const script: Script = {
        id: docSnap.id,
        ...docSnap.data()
      } as Script;
      callback(script);
    } else {
      callback(null);
    }
  });
}
