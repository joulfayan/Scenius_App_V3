// src/services/stripboard.ts
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
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase.client';

export interface StripDay {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  sceneOrder: string[]; // Array of scene IDs in shooting order
  targetMins: number; // Target shooting time in minutes
  totalMins: number; // Calculated total scene duration in minutes
  updatedAt: any; // serverTimestamp
}

export interface CreateStripDayData {
  date: string;
  sceneOrder?: string[];
  targetMins: number;
  totalMins?: number;
}

export interface UpdateStripDayData {
  date?: string;
  sceneOrder?: string[];
  targetMins?: number;
  totalMins?: number;
}

export interface SceneDuration {
  sceneId: string;
  durationMins: number;
}

/**
 * Creates a new strip day in Firestore
 * @param projectId - The project ID
 * @param data - Strip day creation data
 * @returns Promise with the created strip day ID
 */
export async function createStripDay(projectId: string, data: CreateStripDayData): Promise<string> {
  const stripDaysCollection = collection(db, 'projects', projectId, 'stripDays');
  
  const stripDayData = {
    date: data.date,
    sceneOrder: data.sceneOrder || [],
    targetMins: data.targetMins,
    totalMins: data.totalMins || 0,
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(stripDaysCollection, stripDayData);
  return docRef.id;
}

/**
 * Gets a single strip day by ID
 * @param projectId - The project ID
 * @param dayId - The strip day ID to fetch
 * @returns Promise with the strip day data or null if not found
 */
export async function getStripDay(projectId: string, dayId: string): Promise<StripDay | null> {
  const stripDayDoc = doc(db, 'projects', projectId, 'stripDays', dayId);
  const docSnap = await getDoc(stripDayDoc);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as StripDay;
  }
  
  return null;
}

/**
 * Updates a strip day
 * @param projectId - The project ID
 * @param dayId - The strip day ID to update
 * @param data - Updated strip day data
 * @returns Promise that resolves when strip day is updated
 */
export async function updateStripDay(
  projectId: string, 
  dayId: string, 
  data: UpdateStripDayData
): Promise<void> {
  const stripDayDoc = doc(db, 'projects', projectId, 'stripDays', dayId);
  
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };

  await updateDoc(stripDayDoc, updateData);
}

/**
 * Deletes a strip day
 * @param projectId - The project ID
 * @param dayId - The strip day ID to delete
 * @returns Promise that resolves when strip day is deleted
 */
export async function deleteStripDay(projectId: string, dayId: string): Promise<void> {
  const stripDayDoc = doc(db, 'projects', projectId, 'stripDays', dayId);
  await deleteDoc(stripDayDoc);
}

/**
 * Lists all strip days for a project, ordered by date
 * @param projectId - The project ID
 * @returns Promise with array of strip days
 */
export async function listStripDays(projectId: string): Promise<StripDay[]> {
  const stripDaysCollection = collection(db, 'projects', projectId, 'stripDays');
  const q = query(stripDaysCollection, orderBy('date'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as StripDay[];
}

/**
 * Subscribes to real-time updates for all strip days in a project
 * @param projectId - The project ID
 * @param callback - Function to call when strip days data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeStripDays(
  projectId: string,
  callback: (stripDays: StripDay[]) => void
): Unsubscribe {
  const stripDaysCollection = collection(db, 'projects', projectId, 'stripDays');
  const q = query(stripDaysCollection, orderBy('date'));
  
  return onSnapshot(q, (querySnapshot) => {
    const stripDays = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as StripDay[];
    callback(stripDays);
  });
}

/**
 * Updates the scene order for a strip day
 * @param projectId - The project ID
 * @param dayId - The strip day ID
 * @param sceneOrder - New scene order array
 * @returns Promise that resolves when scene order is updated
 */
export async function updateSceneOrder(
  projectId: string,
  dayId: string,
  sceneOrder: string[]
): Promise<void> {
  await updateStripDay(projectId, dayId, { sceneOrder });
}

/**
 * Calculates total duration for a strip day based on scene durations
 * @param sceneOrder - Array of scene IDs
 * @param sceneDurations - Map of scene ID to duration in minutes
 * @returns Total duration in minutes
 */
export function calculateTotalDuration(
  sceneOrder: string[],
  sceneDurations: Map<string, number>
): number {
  return sceneOrder.reduce((total, sceneId) => {
    return total + (sceneDurations.get(sceneId) || 0);
  }, 0);
}

/**
 * Updates the total duration for a strip day
 * @param projectId - The project ID
 * @param dayId - The strip day ID
 * @param totalMins - New total duration in minutes
 * @returns Promise that resolves when total duration is updated
 */
export async function updateTotalDuration(
  projectId: string,
  dayId: string,
  totalMins: number
): Promise<void> {
  await updateStripDay(projectId, dayId, { totalMins });
}

/**
 * Checks if a strip day exceeds its target duration
 * @param stripDay - The strip day to check
 * @returns True if totalMins > targetMins
 */
export function isOverTarget(stripDay: StripDay): boolean {
  return stripDay.totalMins > stripDay.targetMins;
}

/**
 * Gets the overage amount for a strip day
 * @param stripDay - The strip day to check
 * @returns Minutes over target (0 if not over)
 */
export function getOverageMinutes(stripDay: StripDay): number {
  return Math.max(0, stripDay.totalMins - stripDay.targetMins);
}

/**
 * Reorders scenes in a strip day using drag and drop
 * @param projectId - The project ID
 * @param dayId - The strip day ID
 * @param fromIndex - Source index
 * @param toIndex - Destination index
 * @param sceneDurations - Map of scene durations for recalculation
 * @returns Promise that resolves when reorder is complete
 */
export async function reorderScenes(
  projectId: string,
  dayId: string,
  fromIndex: number,
  toIndex: number,
  sceneDurations: Map<string, number>
): Promise<void> {
  // Get current strip day
  const stripDay = await getStripDay(projectId, dayId);
  if (!stripDay) {
    throw new Error('Strip day not found');
  }

  // Create new scene order
  const newSceneOrder = [...stripDay.sceneOrder];
  const [movedScene] = newSceneOrder.splice(fromIndex, 1);
  newSceneOrder.splice(toIndex, 0, movedScene);

  // Calculate new total duration
  const newTotalMins = calculateTotalDuration(newSceneOrder, sceneDurations);

  // Update strip day
  await updateStripDay(projectId, dayId, {
    sceneOrder: newSceneOrder,
    totalMins: newTotalMins
  });
}
