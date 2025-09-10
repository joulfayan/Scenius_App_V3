// src/services/projects.ts
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  onSnapshot, 
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase.client';

export interface Project {
  id: string;
  name: string;
  ownerId: string;
  memberIds: string[];
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
}

export interface CreateProjectData {
  name: string;
  ownerId: string;
  memberIds?: string[];
}

/**
 * Creates a new project in Firestore
 * @param data - Project creation data
 * @returns Promise with the created project ID
 */
export async function createProject(data: CreateProjectData): Promise<string> {
  const projectsCollection = collection(db, 'projects');
  
  const projectData = {
    name: data.name,
    ownerId: data.ownerId,
    memberIds: data.memberIds || [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(projectsCollection, projectData);
  return docRef.id;
}

/**
 * Gets a single project by ID
 * @param projectId - The project ID to fetch
 * @returns Promise with the project data or null if not found
 */
export async function getProject(projectId: string): Promise<Project | null> {
  const projectDoc = doc(db, 'projects', projectId);
  const docSnap = await getDoc(projectDoc);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Project;
  }
  
  return null;
}

/**
 * Subscribes to real-time updates for a project
 * @param projectId - The project ID to subscribe to
 * @param callback - Function to call when project data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeProject(
  projectId: string, 
  callback: (project: Project | null) => void
): Unsubscribe {
  const projectDoc = doc(db, 'projects', projectId);
  
  return onSnapshot(projectDoc, (docSnap) => {
    if (docSnap.exists()) {
      const project: Project = {
        id: docSnap.id,
        ...docSnap.data()
      } as Project;
      callback(project);
    } else {
      callback(null);
    }
  });
}
