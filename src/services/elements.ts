// src/services/elements.ts
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  query, 
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase.client';

export interface Element {
  id: string;
  type: string;
  name: string;
  category: string;
  linkedSceneIds: string[];
  linkedActorId?: string;
  customFields: Record<string, any>;
  estCostCents?: number;
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
}

export interface CreateElementData {
  type: string;
  name: string;
  category: string;
  linkedSceneIds?: string[];
  linkedActorId?: string;
  customFields?: Record<string, any>;
  estCostCents?: number;
}

export interface UpdateElementData {
  type?: string;
  name?: string;
  category?: string;
  linkedSceneIds?: string[];
  linkedActorId?: string;
  customFields?: Record<string, any>;
  estCostCents?: number;
}

export interface ElementFilters {
  type?: string;
  category?: string;
  linkedActorId?: string;
}

/**
 * Creates a new element in Firestore
 * @param projectId - The project ID
 * @param data - Element creation data
 * @returns Promise with the created element ID
 */
export async function createElement(projectId: string, data: CreateElementData): Promise<string> {
  const elementsCollection = collection(db, 'projects', projectId, 'elements');
  
  const elementData = {
    type: data.type,
    name: data.name,
    category: data.category,
    linkedSceneIds: data.linkedSceneIds || [],
    linkedActorId: data.linkedActorId,
    customFields: data.customFields || {},
    estCostCents: data.estCostCents,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(elementsCollection, elementData);
  return docRef.id;
}

/**
 * Gets a single element by ID
 * @param projectId - The project ID
 * @param elementId - The element ID to fetch
 * @returns Promise with the element data or null if not found
 */
export async function getElement(projectId: string, elementId: string): Promise<Element | null> {
  const elementDoc = doc(db, 'projects', projectId, 'elements', elementId);
  const docSnap = await getDoc(elementDoc);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Element;
  }
  
  return null;
}

/**
 * Updates an element
 * @param projectId - The project ID
 * @param elementId - The element ID to update
 * @param data - Updated element data
 * @returns Promise that resolves when element is updated
 */
export async function updateElement(
  projectId: string, 
  elementId: string, 
  data: UpdateElementData
): Promise<void> {
  const elementDoc = doc(db, 'projects', projectId, 'elements', elementId);
  
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };

  await updateDoc(elementDoc, updateData);
}

/**
 * Deletes an element
 * @param projectId - The project ID
 * @param elementId - The element ID to delete
 * @returns Promise that resolves when element is deleted
 */
export async function deleteElement(projectId: string, elementId: string): Promise<void> {
  const elementDoc = doc(db, 'projects', projectId, 'elements', elementId);
  await deleteDoc(elementDoc);
}

/**
 * Lists all elements for a project, ordered by name
 * @param projectId - The project ID
 * @returns Promise with array of elements
 */
export async function listElements(projectId: string): Promise<Element[]> {
  const elementsCollection = collection(db, 'projects', projectId, 'elements');
  const q = query(elementsCollection, orderBy('name'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Element[];
}

/**
 * Queries elements with filters
 * @param projectId - The project ID
 * @param filters - Filter criteria
 * @returns Promise with array of filtered elements
 */
export async function queryElements(
  projectId: string, 
  filters: ElementFilters
): Promise<Element[]> {
  const elementsCollection = collection(db, 'projects', projectId, 'elements');
  const whereConditions = [];
  
  if (filters.type) {
    whereConditions.push(where('type', '==', filters.type));
  }
  
  if (filters.category) {
    whereConditions.push(where('category', '==', filters.category));
  }
  
  if (filters.linkedActorId) {
    whereConditions.push(where('linkedActorId', '==', filters.linkedActorId));
  }
  
  const q = query(elementsCollection, ...whereConditions, orderBy('name'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Element[];
}

/**
 * Gets elements by type
 * @param projectId - The project ID
 * @param type - The element type to filter by
 * @returns Promise with array of elements of the specified type
 */
export async function getElementsByType(projectId: string, type: string): Promise<Element[]> {
  return queryElements(projectId, { type });
}

/**
 * Gets elements by category
 * @param projectId - The project ID
 * @param category - The element category to filter by
 * @returns Promise with array of elements of the specified category
 */
export async function getElementsByCategory(projectId: string, category: string): Promise<Element[]> {
  return queryElements(projectId, { category });
}

/**
 * Gets elements assigned to a specific actor
 * @param projectId - The project ID
 * @param actorId - The actor ID to filter by
 * @returns Promise with array of elements assigned to the actor
 */
export async function getElementsByActor(projectId: string, actorId: string): Promise<Element[]> {
  return queryElements(projectId, { linkedActorId: actorId });
}

/**
 * Subscribes to real-time updates for all elements in a project
 * @param projectId - The project ID
 * @param callback - Function to call when elements data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeElements(
  projectId: string,
  callback: (elements: Element[]) => void
): Unsubscribe {
  const elementsCollection = collection(db, 'projects', projectId, 'elements');
  const q = query(elementsCollection, orderBy('name'));
  
  return onSnapshot(q, (querySnapshot) => {
    const elements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Element[];
    callback(elements);
  });
}

/**
 * Subscribes to real-time updates for filtered elements
 * @param projectId - The project ID
 * @param filters - Filter criteria
 * @param callback - Function to call when elements data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeElementsWithFilters(
  projectId: string,
  filters: ElementFilters,
  callback: (elements: Element[]) => void
): Unsubscribe {
  const elementsCollection = collection(db, 'projects', projectId, 'elements');
  const whereConditions = [];
  
  if (filters.type) {
    whereConditions.push(where('type', '==', filters.type));
  }
  
  if (filters.category) {
    whereConditions.push(where('category', '==', filters.category));
  }
  
  if (filters.linkedActorId) {
    whereConditions.push(where('linkedActorId', '==', filters.linkedActorId));
  }
  
  const q = query(elementsCollection, ...whereConditions, orderBy('name'));
  
  return onSnapshot(q, (querySnapshot) => {
    const elements = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Element[];
    callback(elements);
  });
}

/**
 * Assigns an actor to an element
 * @param projectId - The project ID
 * @param elementId - The element ID
 * @param actorId - The actor ID to assign
 * @returns Promise that resolves when actor is assigned
 */
export async function assignActorToElement(
  projectId: string, 
  elementId: string, 
  actorId: string
): Promise<void> {
  const elementDoc = doc(db, 'projects', projectId, 'elements', elementId);
  
  await updateDoc(elementDoc, {
    linkedActorId: actorId,
    updatedAt: serverTimestamp()
  });
}

/**
 * Unassigns an actor from an element
 * @param projectId - The project ID
 * @param elementId - The element ID
 * @returns Promise that resolves when actor is unassigned
 */
export async function unassignActorFromElement(
  projectId: string, 
  elementId: string
): Promise<void> {
  const elementDoc = doc(db, 'projects', projectId, 'elements', elementId);
  
  await updateDoc(elementDoc, {
    linkedActorId: null,
    updatedAt: serverTimestamp()
  });
}
