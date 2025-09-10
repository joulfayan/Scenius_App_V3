// src/services/locations.ts
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

export interface Location {
  id: string;
  name: string;
  address?: string;
  description?: string;
  mapUrl?: string;
  photo?: string; // URL to photo
  coordinates?: {
    lat: number;
    lng: number;
  };
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
}

export interface CreateLocationData {
  name: string;
  address?: string;
  description?: string;
  mapUrl?: string;
  photo?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
}

export interface UpdateLocationData {
  name?: string;
  address?: string;
  description?: string;
  mapUrl?: string;
  photo?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  contactInfo?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  notes?: string;
}

/**
 * Creates a new location in Firestore
 * @param projectId - The project ID
 * @param data - Location creation data
 * @returns Promise with the created location ID
 */
export async function createLocation(projectId: string, data: CreateLocationData): Promise<string> {
  const locationsCollection = collection(db, 'projects', projectId, 'locations');
  
  const locationData = {
    name: data.name,
    address: data.address,
    description: data.description,
    mapUrl: data.mapUrl,
    photo: data.photo,
    coordinates: data.coordinates,
    contactInfo: data.contactInfo,
    notes: data.notes,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(locationsCollection, locationData);
  return docRef.id;
}

/**
 * Gets a single location by ID
 * @param projectId - The project ID
 * @param locationId - The location ID to fetch
 * @returns Promise with the location data or null if not found
 */
export async function getLocation(projectId: string, locationId: string): Promise<Location | null> {
  const locationDoc = doc(db, 'projects', projectId, 'locations', locationId);
  const docSnap = await getDoc(locationDoc);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as Location;
  }
  
  return null;
}

/**
 * Updates a location
 * @param projectId - The project ID
 * @param locationId - The location ID to update
 * @param data - Updated location data
 * @returns Promise that resolves when location is updated
 */
export async function updateLocation(
  projectId: string, 
  locationId: string, 
  data: UpdateLocationData
): Promise<void> {
  const locationDoc = doc(db, 'projects', projectId, 'locations', locationId);
  
  const updateData = {
    ...data,
    updatedAt: serverTimestamp()
  };

  await updateDoc(locationDoc, updateData);
}

/**
 * Deletes a location
 * @param projectId - The project ID
 * @param locationId - The location ID to delete
 * @returns Promise that resolves when location is deleted
 */
export async function deleteLocation(projectId: string, locationId: string): Promise<void> {
  const locationDoc = doc(db, 'projects', projectId, 'locations', locationId);
  await deleteDoc(locationDoc);
}

/**
 * Lists all locations for a project, ordered by name
 * @param projectId - The project ID
 * @returns Promise with array of locations
 */
export async function listLocations(projectId: string): Promise<Location[]> {
  const locationsCollection = collection(db, 'projects', projectId, 'locations');
  const q = query(locationsCollection, orderBy('name'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Location[];
}

/**
 * Subscribes to real-time updates for all locations in a project
 * @param projectId - The project ID
 * @param callback - Function to call when locations data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeLocations(
  projectId: string,
  callback: (locations: Location[]) => void
): Unsubscribe {
  const locationsCollection = collection(db, 'projects', projectId, 'locations');
  const q = query(locationsCollection, orderBy('name'));
  
  return onSnapshot(q, (querySnapshot) => {
    const locations = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Location[];
    callback(locations);
  });
}

/**
 * Generates a Google Maps URL from coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns Google Maps URL
 */
export function generateMapUrl(lat: number, lng: number): string {
  return `https://www.google.com/maps?q=${lat},${lng}`;
}

/**
 * Generates a Google Maps embed URL from coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @param zoom - Zoom level (default: 15)
 * @returns Google Maps embed URL
 */
export function generateMapEmbedUrl(lat: number, lng: number, zoom: number = 15): string {
  return `https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=${lat},${lng}&zoom=${zoom}`;
}

/**
 * Extracts coordinates from a Google Maps URL
 * @param mapUrl - Google Maps URL
 * @returns Coordinates object or null if invalid
 */
export function extractCoordinatesFromMapUrl(mapUrl: string): { lat: number; lng: number } | null {
  try {
    // Handle various Google Maps URL formats
    const patterns = [
      /@(-?\d+\.\d+),(-?\d+\.\d+)/, // @lat,lng format
      /q=(-?\d+\.\d+),(-?\d+\.\d+)/, // q=lat,lng format
      /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/, // !3dlat!4dlng format
    ];

    for (const pattern of patterns) {
      const match = mapUrl.match(pattern);
      if (match) {
        return {
          lat: parseFloat(match[1]),
          lng: parseFloat(match[2])
        };
      }
    }

    return null;
  } catch (error) {
    return null;
  }
}

/**
 * Validates coordinates
 * @param lat - Latitude
 * @param lng - Longitude
 * @returns True if coordinates are valid
 */
export function validateCoordinates(lat: number, lng: number): boolean {
  return (
    lat >= -90 && lat <= 90 &&
    lng >= -180 && lng <= 180 &&
    !isNaN(lat) && !isNaN(lng)
  );
}

/**
 * Calculates distance between two coordinates (in kilometers)
 * @param coord1 - First coordinates
 * @param coord2 - Second coordinates
 * @returns Distance in kilometers
 */
export function calculateDistance(
  coord1: { lat: number; lng: number },
  coord2: { lat: number; lng: number }
): number {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (coord2.lat - coord1.lat) * Math.PI / 180;
  const dLng = (coord2.lng - coord1.lng) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(coord1.lat * Math.PI / 180) * Math.cos(coord2.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Finds locations within a radius of a given point
 * @param locations - Array of locations to search
 * @param center - Center coordinates
 * @param radiusKm - Radius in kilometers
 * @returns Array of locations within radius
 */
export function findLocationsWithinRadius(
  locations: Location[],
  center: { lat: number; lng: number },
  radiusKm: number
): Location[] {
  return locations.filter(location => {
    if (!location.coordinates) return false;
    
    const distance = calculateDistance(center, location.coordinates);
    return distance <= radiusKm;
  });
}
