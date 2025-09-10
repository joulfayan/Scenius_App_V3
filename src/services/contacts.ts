// src/services/contacts.ts
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

export interface Contact {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  company?: string;
  notes?: string;
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
}

export interface CreateContactData {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  company?: string;
  notes?: string;
}

export interface UpdateContactData {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  company?: string;
  notes?: string;
}

export interface CSVContactRow {
  name: string;
  email?: string;
  phone?: string;
  role?: string;
  company?: string;
  notes?: string;
}

/**
 * Creates a new contact in Firestore
 * @param projectId - The project ID
 * @param data - Contact creation data
 * @returns Promise with the created contact ID
 */
export async function createContact(projectId: string, data: CreateContactData): Promise<string> {
  const contactsCollection = collection(db, 'projects', projectId, 'contacts');
  
  const contactData = {
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    company: data.company,
    notes: data.notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(contactsCollection, contactData);
  return docRef.id;
}

/**
 * Gets a single contact by ID
 * @param projectId - The project ID
 * @param contactId - The contact ID to fetch
 * @returns Promise with the contact data or null if not found
 */
export async function getContact(projectId: string, contactId: string): Promise<Contact | null> {
  const contactDoc = doc(db, 'projects', projectId, 'contacts', contactId);
  const docSnap = await getDoc(contactDoc);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Contact;
  }
  
  return null;
}

/**
 * Updates a contact
 * @param projectId - The project ID
 * @param contactId - The contact ID to update
 * @param data - Updated contact data
 * @returns Promise that resolves when contact is updated
 */
export async function updateContact(
  projectId: string, 
  contactId: string, 
  data: UpdateContactData
): Promise<void> {
  const contactDoc = doc(db, 'projects', projectId, 'contacts', contactId);
  
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };

  await updateDoc(contactDoc, updateData);
}

/**
 * Deletes a contact
 * @param projectId - The project ID
 * @param contactId - The contact ID to delete
 * @returns Promise that resolves when contact is deleted
 */
export async function deleteContact(projectId: string, contactId: string): Promise<void> {
  const contactDoc = doc(db, 'projects', projectId, 'contacts', contactId);
  await deleteDoc(contactDoc);
}

/**
 * Lists all contacts for a project, ordered by name
 * @param projectId - The project ID
 * @returns Promise with array of contacts
 */
export async function listContacts(projectId: string): Promise<Contact[]> {
  const contactsCollection = collection(db, 'projects', projectId, 'contacts');
  const q = query(contactsCollection, orderBy('name'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Contact[];
}

/**
 * Subscribes to real-time updates for all contacts in a project
 * @param projectId - The project ID
 * @param callback - Function to call when contacts data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeContacts(
  projectId: string,
  callback: (contacts: Contact[]) => void
): Unsubscribe {
  const contactsCollection = collection(db, 'projects', projectId, 'contacts');
  const q = query(contactsCollection, orderBy('name'));
  
  return onSnapshot(q, (querySnapshot) => {
    const contacts = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Contact[];
    callback(contacts);
  });
}

/**
 * Parses CSV content into contact rows
 * @param csvContent - Raw CSV content as string
 * @returns Array of parsed contact rows
 */
export function parseCSVContacts(csvContent: string): CSVContactRow[] {
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  // Parse header row
  const headers = lines[0].split(',').map(header => header.trim().toLowerCase());
  const dataRows = lines.slice(1);

  return dataRows.map(row => {
    const values = row.split(',').map(value => value.trim());
    const contact: CSVContactRow = { name: '' };

    headers.forEach((header, index) => {
      const value = values[index] || '';
      
      switch (header) {
        case 'name':
          contact.name = value;
          break;
        case 'email':
          contact.email = value || undefined;
          break;
        case 'phone':
          contact.phone = value || undefined;
          break;
        case 'role':
          contact.role = value || undefined;
          break;
        case 'company':
          contact.company = value || undefined;
          break;
        case 'notes':
          contact.notes = value || undefined;
          break;
      }
    });

    return contact;
  }).filter(contact => contact.name); // Only include contacts with names
}

/**
 * Imports contacts from CSV content
 * @param projectId - The project ID
 * @param csvContent - Raw CSV content as string
 * @returns Promise with array of created contact IDs
 */
export async function importContactsFromCSV(
  projectId: string, 
  csvContent: string
): Promise<string[]> {
  const contacts = parseCSVContacts(csvContent);
  const createdIds: string[] = [];

  for (const contact of contacts) {
    try {
      const contactId = await createContact(projectId, contact);
      createdIds.push(contactId);
    } catch (error) {
      console.error(`Error creating contact ${contact.name}:`, error);
    }
  }

  return createdIds;
}

/**
 * Generates CSV content from contacts
 * @param contacts - Array of contacts to export
 * @returns CSV content as string
 */
export function exportContactsToCSV(contacts: Contact[]): string {
  const headers = ['name', 'email', 'phone', 'role', 'company', 'notes'];
  const csvRows = [headers.join(',')];

  contacts.forEach(contact => {
    const row = headers.map(header => {
      const value = contact[header as keyof Contact] || '';
      // Escape commas and quotes in CSV
      return `"${String(value).replace(/"/g, '""')}"`;
    });
    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

/**
 * Validates CSV content before import
 * @param csvContent - Raw CSV content as string
 * @returns Object with validation result and errors
 */
export function validateCSVContacts(csvContent: string): {
  isValid: boolean;
  errors: string[];
  contactCount: number;
} {
  const errors: string[] = [];
  
  try {
    const contacts = parseCSVContacts(csvContent);
    
    if (contacts.length === 0) {
      errors.push('No valid contacts found in CSV');
    }

    // Check for required fields
    const hasName = contacts.every(contact => contact.name);
    if (!hasName) {
      errors.push('All contacts must have a name');
    }

    // Check for duplicate names
    const names = contacts.map(contact => contact.name.toLowerCase());
    const uniqueNames = new Set(names);
    if (names.length !== uniqueNames.size) {
      errors.push('Duplicate contact names found');
    }

    return {
      isValid: errors.length === 0,
      errors,
      contactCount: contacts.length
    };
  } catch (error) {
    return {
      isValid: false,
      errors: ['Invalid CSV format'],
      contactCount: 0
    };
  }
}
