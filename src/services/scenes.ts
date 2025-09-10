// src/services/scenes.ts
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  orderBy,
  onSnapshot,
  arrayUnion,
  arrayRemove,
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase.client';

export type LocationType = "INT" | "EXT";

export interface Scene {
  id: string;
  number: number;
  slug: string;
  heading: string;
  locationType: LocationType;
  timeOfDay: string;
  durationMins: number;
  elementIds: string[];
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
}

export interface CreateSceneData {
  number: number;
  slug: string;
  heading: string;
  locationType: LocationType;
  timeOfDay: string;
  durationMins: number;
  elementIds?: string[];
}

export interface UpdateSceneData {
  number?: number;
  slug?: string;
  heading?: string;
  locationType?: LocationType;
  timeOfDay?: string;
  durationMins?: number;
}

/**
 * Creates a new scene in Firestore
 * @param projectId - The project ID
 * @param data - Scene creation data
 * @returns Promise with the created scene ID
 */
export async function createScene(projectId: string, data: CreateSceneData): Promise<string> {
  const scenesCollection = collection(db, 'projects', projectId, 'scenes');
  
  const sceneData = {
    number: data.number,
    slug: data.slug,
    heading: data.heading,
    locationType: data.locationType,
    timeOfDay: data.timeOfDay,
    durationMins: data.durationMins,
    elementIds: data.elementIds || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(scenesCollection, sceneData);
  return docRef.id;
}

/**
 * Gets a single scene by ID
 * @param projectId - The project ID
 * @param sceneId - The scene ID to fetch
 * @returns Promise with the scene data or null if not found
 */
export async function getScene(projectId: string, sceneId: string): Promise<Scene | null> {
  const sceneDoc = doc(db, 'projects', projectId, 'scenes', sceneId);
  const docSnap = await getDoc(sceneDoc);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Scene;
  }
  
  return null;
}

/**
 * Updates a scene
 * @param projectId - The project ID
 * @param sceneId - The scene ID to update
 * @param data - Updated scene data
 * @returns Promise that resolves when scene is updated
 */
export async function updateScene(
  projectId: string, 
  sceneId: string, 
  data: UpdateSceneData
): Promise<void> {
  const sceneDoc = doc(db, 'projects', projectId, 'scenes', sceneId);
  
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };

  await updateDoc(sceneDoc, updateData);
}

/**
 * Deletes a scene
 * @param projectId - The project ID
 * @param sceneId - The scene ID to delete
 * @returns Promise that resolves when scene is deleted
 */
export async function deleteScene(projectId: string, sceneId: string): Promise<void> {
  const sceneDoc = doc(db, 'projects', projectId, 'scenes', sceneId);
  await deleteDoc(sceneDoc);
}

/**
 * Lists all scenes for a project, ordered by scene number
 * @param projectId - The project ID
 * @returns Promise with array of scenes
 */
export async function listScenes(projectId: string): Promise<Scene[]> {
  const scenesCollection = collection(db, 'projects', projectId, 'scenes');
  const q = query(scenesCollection, orderBy('number'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Scene[];
}

/**
 * Subscribes to real-time updates for all scenes in a project
 * @param projectId - The project ID
 * @param callback - Function to call when scenes data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeScenes(
  projectId: string,
  callback: (scenes: Scene[]) => void
): Unsubscribe {
  const scenesCollection = collection(db, 'projects', projectId, 'scenes');
  const q = query(scenesCollection, orderBy('number'));
  
  return onSnapshot(q, (querySnapshot) => {
    const scenes = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Scene[];
    callback(scenes);
  });
}

/**
 * Links an element to a scene (bidirectional linking)
 * @param projectId - The project ID
 * @param sceneId - The scene ID
 * @param elementId - The element ID to link
 * @returns Promise that resolves when both links are created
 */
export async function linkElementToScene(
  projectId: string, 
  sceneId: string, 
  elementId: string
): Promise<void> {
  // Add elementId to scene's elementIds array
  const sceneDoc = doc(db, 'projects', projectId, 'scenes', sceneId);
  await updateDoc(sceneDoc, {
    elementIds: arrayUnion(elementId),
    updatedAt: serverTimestamp()
  });

  // Add sceneId to element's linkedSceneIds array
  const elementDoc = doc(db, 'projects', projectId, 'elements', elementId);
  await updateDoc(elementDoc, {
    linkedSceneIds: arrayUnion(sceneId),
    updatedAt: serverTimestamp()
  });
}

/**
 * Unlinks an element from a scene (bidirectional unlinking)
 * @param projectId - The project ID
 * @param sceneId - The scene ID
 * @param elementId - The element ID to unlink
 * @returns Promise that resolves when both links are removed
 */
export async function unlinkElementFromScene(
  projectId: string, 
  sceneId: string, 
  elementId: string
): Promise<void> {
  // Remove elementId from scene's elementIds array
  const sceneDoc = doc(db, 'projects', projectId, 'scenes', sceneId);
  await updateDoc(sceneDoc, {
    elementIds: arrayRemove(elementId),
    updatedAt: serverTimestamp()
  });

  // Remove sceneId from element's linkedSceneIds array
  const elementDoc = doc(db, 'projects', projectId, 'elements', elementId);
  await updateDoc(elementDoc, {
    linkedSceneIds: arrayRemove(sceneId),
    updatedAt: serverTimestamp()
  });
}
