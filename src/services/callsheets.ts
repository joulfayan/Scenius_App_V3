// src/services/callsheets.ts
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
import { getStripDay, type StripDay } from './stripboard';
import { listContacts, type Contact } from './contacts';
import { listLocations, type Location } from './locations';

export interface CallSheet {
  id: string;
  date: string; // ISO date string (YYYY-MM-DD)
  unitName: string;
  dayId: string; // Reference to strip day
  locationId: string; // Reference to location
  recipients: string[]; // Array of contact IDs
  weather?: {
    high: number;
    low: number;
    condition: string;
    sunrise: string;
    sunset: string;
  };
  hospitals?: {
    name: string;
    address: string;
    phone: string;
    distance: string;
  }[];
  notes: string;
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
}

export interface CreateCallSheetData {
  date: string;
  unitName: string;
  dayId: string;
  locationId: string;
  recipients?: string[];
  weather?: {
    high: number;
    low: number;
    condition: string;
    sunrise: string;
    sunset: string;
  };
  hospitals?: {
    name: string;
    address: string;
    phone: string;
    distance: string;
  }[];
  notes?: string;
}

export interface UpdateCallSheetData {
  date?: string;
  unitName?: string;
  dayId?: string;
  locationId?: string;
  recipients?: string[];
  weather?: {
    high: number;
    low: number;
    condition: string;
    sunrise: string;
    sunset: string;
  };
  hospitals?: {
    name: string;
    address: string;
    phone: string;
    distance: string;
  }[];
  notes?: string;
}

export interface CallSheetWithDetails extends CallSheet {
  stripDay?: StripDay;
  location?: Location;
  recipientContacts?: Contact[];
}

/**
 * Creates a new call sheet in Firestore
 * @param projectId - The project ID
 * @param data - Call sheet creation data
 * @returns Promise with the created call sheet ID
 */
export async function createCallSheet(projectId: string, data: CreateCallSheetData): Promise<string> {
  const callSheetsCollection = collection(db, 'projects', projectId, 'callsheets');
  
  const callSheetData = {
    date: data.date,
    unitName: data.unitName,
    dayId: data.dayId,
    locationId: data.locationId,
    recipients: data.recipients || [],
    weather: data.weather,
    hospitals: data.hospitals,
    notes: data.notes || '',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(callSheetsCollection, callSheetData);
  return docRef.id;
}

/**
 * Gets a single call sheet by ID
 * @param projectId - The project ID
 * @param callSheetId - The call sheet ID to fetch
 * @returns Promise with the call sheet data or null if not found
 */
export async function getCallSheet(projectId: string, callSheetId: string): Promise<CallSheet | null> {
  const callSheetDoc = doc(db, 'projects', projectId, 'callsheets', callSheetId);
  const docSnap = await getDoc(callSheetDoc);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as CallSheet;
  }
  
  return null;
}

/**
 * Gets a call sheet with populated details
 * @param projectId - The project ID
 * @param callSheetId - The call sheet ID to fetch
 * @returns Promise with the call sheet data with populated details or null if not found
 */
export async function getCallSheetWithDetails(projectId: string, callSheetId: string): Promise<CallSheetWithDetails | null> {
  const callSheet = await getCallSheet(projectId, callSheetId);
  if (!callSheet) return null;

  // Populate strip day
  const stripDay = await getStripDay(projectId, callSheet.dayId);
  
  // Populate location
  const locations = await listLocations(projectId);
  const location = locations.find(loc => loc.id === callSheet.locationId);
  
  // Populate recipient contacts
  const contacts = await listContacts(projectId);
  const recipientContacts = contacts.filter(contact => 
    callSheet.recipients.includes(contact.id)
  );

  return {
    ...callSheet,
    stripDay,
    location,
    recipientContacts
  };
}

/**
 * Updates a call sheet
 * @param projectId - The project ID
 * @param callSheetId - The call sheet ID to update
 * @param data - Updated call sheet data
 * @returns Promise that resolves when call sheet is updated
 */
export async function updateCallSheet(
  projectId: string, 
  callSheetId: string, 
  data: UpdateCallSheetData
): Promise<void> {
  const callSheetDoc = doc(db, 'projects', projectId, 'callsheets', callSheetId);
  
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };

  await updateDoc(callSheetDoc, updateData);
}

/**
 * Deletes a call sheet
 * @param projectId - The project ID
 * @param callSheetId - The call sheet ID to delete
 * @returns Promise that resolves when call sheet is deleted
 */
export async function deleteCallSheet(projectId: string, callSheetId: string): Promise<void> {
  const callSheetDoc = doc(db, 'projects', projectId, 'callsheets', callSheetId);
  await deleteDoc(callSheetDoc);
}

/**
 * Lists all call sheets for a project, ordered by date
 * @param projectId - The project ID
 * @returns Promise with array of call sheets
 */
export async function listCallSheets(projectId: string): Promise<CallSheet[]> {
  const callSheetsCollection = collection(db, 'projects', projectId, 'callsheets');
  const q = query(callSheetsCollection, orderBy('date'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as CallSheet[];
}

/**
 * Lists all call sheets with populated details
 * @param projectId - The project ID
 * @returns Promise with array of call sheets with details
 */
export async function listCallSheetsWithDetails(projectId: string): Promise<CallSheetWithDetails[]> {
  const callSheets = await listCallSheets(projectId);
  const callSheetsWithDetails: CallSheetWithDetails[] = [];

  for (const callSheet of callSheets) {
    const details = await getCallSheetWithDetails(projectId, callSheet.id);
    if (details) {
      callSheetsWithDetails.push(details);
    }
  }

  return callSheetsWithDetails;
}

/**
 * Subscribes to real-time updates for all call sheets in a project
 * @param projectId - The project ID
 * @param callback - Function to call when call sheets data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeCallSheets(
  projectId: string,
  callback: (callSheets: CallSheet[]) => void
): Unsubscribe {
  const callSheetsCollection = collection(db, 'projects', projectId, 'callsheets');
  const q = query(callSheetsCollection, orderBy('date'));
  
  return onSnapshot(q, (querySnapshot) => {
    const callSheets = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as CallSheet[];
    callback(callSheets);
  });
}

/**
 * Auto-populates call sheet data from strip day, contacts, and locations
 * @param projectId - The project ID
 * @param dayId - The strip day ID to populate from
 * @param locationId - The location ID to populate from
 * @param additionalRecipients - Additional contact IDs to include
 * @returns Promise with populated call sheet data
 */
export async function autoPopulateCallSheet(
  projectId: string,
  dayId: string,
  locationId: string,
  additionalRecipients: string[] = []
): Promise<CreateCallSheetData> {
  // Get strip day data
  const stripDay = await getStripDay(projectId, dayId);
  if (!stripDay) {
    throw new Error('Strip day not found');
  }

  // Get location data
  const locations = await listLocations(projectId);
  const location = locations.find(loc => loc.id === locationId);
  if (!location) {
    throw new Error('Location not found');
  }

  // Get contacts for auto-population
  const contacts = await listContacts(projectId);
  
  // Auto-select relevant contacts based on role
  const relevantContacts = contacts.filter(contact => 
    contact.role && ['Director', 'Producer', 'AD', 'DP', 'Sound', 'Grip', 'Electric'].includes(contact.role)
  );

  const recipientIds = [
    ...relevantContacts.map(contact => contact.id),
    ...additionalRecipients
  ];

  // Generate default unit name
  const unitName = `Unit 1 - ${stripDay.date}`;

  // Generate default notes
  const notes = `Call Sheet for ${stripDay.date}\n\n` +
    `Location: ${location.name}\n` +
    `Address: ${location.address || 'TBD'}\n` +
    `Scenes: ${stripDay.sceneOrder.length} scenes scheduled\n` +
    `Target Duration: ${Math.floor(stripDay.targetMins / 60)}h ${stripDay.targetMins % 60}m\n\n` +
    `Notes: ${stripDay.notes || 'No additional notes'}`;

  return {
    date: stripDay.date,
    unitName,
    dayId,
    locationId,
    recipients: recipientIds,
    notes
  };
}

/**
 * Generates call sheet content for export
 * @param callSheet - The call sheet data
 * @param details - The call sheet with populated details
 * @returns Formatted call sheet content
 */
export function generateCallSheetContent(
  callSheet: CallSheet,
  details: CallSheetWithDetails
): string {
  const { stripDay, location, recipientContacts } = details;
  
  let content = `CALL SHEET\n`;
  content += `================\n\n`;
  
  content += `Date: ${callSheet.date}\n`;
  content += `Unit: ${callSheet.unitName}\n`;
  content += `Location: ${location?.name || 'TBD'}\n`;
  content += `Address: ${location?.address || 'TBD'}\n\n`;
  
  if (callSheet.weather) {
    content += `WEATHER\n`;
    content += `-------\n`;
    content += `High: ${callSheet.weather.high}°F\n`;
    content += `Low: ${callSheet.weather.low}°F\n`;
    content += `Condition: ${callSheet.weather.condition}\n`;
    content += `Sunrise: ${callSheet.weather.sunrise}\n`;
    content += `Sunset: ${callSheet.weather.sunset}\n\n`;
  }
  
  if (stripDay) {
    content += `SCHEDULE\n`;
    content += `--------\n`;
    content += `Scenes: ${stripDay.sceneOrder.length}\n`;
    content += `Target Duration: ${Math.floor(stripDay.targetMins / 60)}h ${stripDay.targetMins % 60}m\n`;
    content += `Total Duration: ${Math.floor(stripDay.totalMins / 60)}h ${stripDay.totalMins % 60}m\n\n`;
  }
  
  if (recipientContacts && recipientContacts.length > 0) {
    content += `CREW CONTACTS\n`;
    content += `-------------\n`;
    recipientContacts.forEach(contact => {
      content += `${contact.name}`;
      if (contact.role) content += ` (${contact.role})`;
      if (contact.phone) content += ` - ${contact.phone}`;
      if (contact.email) content += ` - ${contact.email}`;
      content += `\n`;
    });
    content += `\n`;
  }
  
  if (callSheet.hospitals && callSheet.hospitals.length > 0) {
    content += `NEARBY HOSPITALS\n`;
    content += `----------------\n`;
    callSheet.hospitals.forEach(hospital => {
      content += `${hospital.name}\n`;
      content += `${hospital.address}\n`;
      content += `Phone: ${hospital.phone}\n`;
      content += `Distance: ${hospital.distance}\n\n`;
    });
  }
  
  if (callSheet.notes) {
    content += `NOTES\n`;
    content += `-----\n`;
    content += `${callSheet.notes}\n`;
  }
  
  return content;
}

/**
 * Exports call sheet as text file
 * @param callSheet - The call sheet data
 * @param details - The call sheet with populated details
 * @param filename - Optional filename (defaults to call sheet date)
 */
export function exportCallSheetAsText(
  callSheet: CallSheet,
  details: CallSheetWithDetails,
  filename?: string
): void {
  const content = generateCallSheetContent(callSheet, details);
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || `callsheet-${callSheet.date}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}
