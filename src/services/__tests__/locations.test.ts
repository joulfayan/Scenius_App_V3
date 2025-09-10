// src/services/__tests__/locations.test.ts
import { 
  createLocation, 
  getLocation, 
  updateLocation, 
  deleteLocation, 
  listLocations,
  subscribeLocations,
  generateMapUrl,
  generateMapEmbedUrl,
  extractCoordinatesFromMapUrl,
  validateCoordinates,
  calculateDistance,
  findLocationsWithinRadius,
  type Location,
  type CreateLocationData,
  type UpdateLocationData 
} from '../locations';
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
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../lib/firebase.client';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  getDocs: jest.fn(),
  query: jest.fn(),
  orderBy: jest.fn(),
  onSnapshot: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp')
}));

jest.mock('../../lib/firebase.client', () => ({
  db: 'mock-db'
}));

const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockUpdateDoc = updateDoc as jest.MockedFunction<typeof updateDoc>;
const mockDeleteDoc = deleteDoc as jest.MockedFunction<typeof deleteDoc>;
const mockGetDocs = getDocs as jest.MockedFunction<typeof getDocs>;
const mockQuery = query as jest.MockedFunction<typeof query>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

describe('Locations Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createLocation', () => {
    it('should create a new location with all fields', async () => {
      const mockDocRef = { id: 'location-123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const locationData: CreateLocationData = {
        name: 'Central Park',
        address: 'Central Park, New York, NY',
        description: 'Large public park in Manhattan',
        mapUrl: 'https://maps.google.com/?q=40.7829,-73.9654',
        photo: 'https://example.com/central-park.jpg',
        coordinates: { lat: 40.7829, lng: -73.9654 },
        contactInfo: {
          name: 'Park Management',
          phone: '+1234567890',
          email: 'info@centralpark.com'
        },
        notes: 'Great for outdoor scenes'
      };

      const result = await createLocation('project-123', locationData);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'locations');
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        name: 'Central Park',
        address: 'Central Park, New York, NY',
        description: 'Large public park in Manhattan',
        mapUrl: 'https://maps.google.com/?q=40.7829,-73.9654',
        photo: 'https://example.com/central-park.jpg',
        coordinates: { lat: 40.7829, lng: -73.9654 },
        contactInfo: {
          name: 'Park Management',
          phone: '+1234567890',
          email: 'info@centralpark.com'
        },
        notes: 'Great for outdoor scenes',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toBe('location-123');
    });

    it('should create a location with minimal required fields', async () => {
      const mockDocRef = { id: 'location-456' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const locationData: CreateLocationData = {
        name: 'Simple Location'
      };

      await createLocation('project-123', locationData);

      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        name: 'Simple Location',
        address: undefined,
        description: undefined,
        mapUrl: undefined,
        photo: undefined,
        coordinates: undefined,
        contactInfo: undefined,
        notes: undefined,
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('getLocation', () => {
    it('should return location data when document exists', async () => {
      const mockLocationData = {
        name: 'Central Park',
        address: 'Central Park, New York, NY',
        coordinates: { lat: 40.7829, lng: -73.9654 },
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'location-123',
        data: () => mockLocationData
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getLocation('project-123', 'location-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'locations', 'location-123');
      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc');
      expect(result).toEqual({
        id: 'location-123',
        ...mockLocationData
      });
    });

    it('should return null when document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getLocation('project-123', 'non-existent-location');

      expect(result).toBeNull();
    });
  });

  describe('updateLocation', () => {
    it('should update location with provided data', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      const updateData: UpdateLocationData = {
        name: 'Updated Location',
        address: 'New Address'
      };

      await updateLocation('project-123', 'location-123', updateData);

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'locations', 'location-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        name: 'Updated Location',
        address: 'New Address',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('deleteLocation', () => {
    it('should delete the location document', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      await deleteLocation('project-123', 'location-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'locations', 'location-123');
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc');
    });
  });

  describe('listLocations', () => {
    it('should return all locations ordered by name', async () => {
      const mockLocation1 = {
        id: 'location-1',
        data: () => ({ name: 'Location A', address: 'Address A' })
      };
      const mockLocation2 = {
        id: 'location-2',
        data: () => ({ name: 'Location B', address: 'Address B' })
      };

      const mockQuerySnapshot = {
        docs: [mockLocation1, mockLocation2]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const result = await listLocations('project-123');

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'locations');
      expect(mockOrderBy).toHaveBeenCalledWith('name');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockGetDocs).toHaveBeenCalledWith('mock-query');
      expect(result).toEqual([
        { id: 'location-1', name: 'Location A', address: 'Address A' },
        { id: 'location-2', name: 'Location B', address: 'Address B' }
      ]);
    });
  });

  describe('subscribeLocations', () => {
    it('should set up real-time subscription for all locations', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      mockOnSnapshot.mockImplementation((queryRef, callback) => {
        const mockLocation = {
          id: 'location-1',
          data: () => ({ name: 'Location A', address: 'Address A' })
        };

        const mockQuerySnapshot = {
          docs: [mockLocation]
        };
        
        callback(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const unsubscribe = subscribeLocations('project-123', mockCallback);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'locations');
      expect(mockOrderBy).toHaveBeenCalledWith('name');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockOnSnapshot).toHaveBeenCalledWith('mock-query', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledWith([
        { id: 'location-1', name: 'Location A', address: 'Address A' }
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('generateMapUrl', () => {
    it('should generate Google Maps URL from coordinates', () => {
      const result = generateMapUrl(40.7829, -73.9654);
      expect(result).toBe('https://www.google.com/maps?q=40.7829,-73.9654');
    });
  });

  describe('generateMapEmbedUrl', () => {
    it('should generate Google Maps embed URL from coordinates', () => {
      const result = generateMapEmbedUrl(40.7829, -73.9654, 15);
      expect(result).toBe('https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=40.7829,-73.9654&zoom=15');
    });

    it('should use default zoom level', () => {
      const result = generateMapEmbedUrl(40.7829, -73.9654);
      expect(result).toBe('https://www.google.com/maps/embed/v1/view?key=YOUR_API_KEY&center=40.7829,-73.9654&zoom=15');
    });
  });

  describe('extractCoordinatesFromMapUrl', () => {
    it('should extract coordinates from @lat,lng format', () => {
      const result = extractCoordinatesFromMapUrl('https://maps.google.com/@40.7829,-73.9654,15z');
      expect(result).toEqual({ lat: 40.7829, lng: -73.9654 });
    });

    it('should extract coordinates from q=lat,lng format', () => {
      const result = extractCoordinatesFromMapUrl('https://maps.google.com/?q=40.7829,-73.9654');
      expect(result).toEqual({ lat: 40.7829, lng: -73.9654 });
    });

    it('should extract coordinates from !3dlat!4dlng format', () => {
      const result = extractCoordinatesFromMapUrl('https://maps.google.com/maps/place/Central+Park/@40.7829,-73.9654,15z/data=!3m1!4b1!4m5!3m4!1s0x89c2589a8839e769:0xea466400891c037b!8m2!3d40.7829!4d-73.9654');
      expect(result).toEqual({ lat: 40.7829, lng: -73.9654 });
    });

    it('should return null for invalid URL', () => {
      const result = extractCoordinatesFromMapUrl('https://example.com/invalid');
      expect(result).toBeNull();
    });
  });

  describe('validateCoordinates', () => {
    it('should validate correct coordinates', () => {
      expect(validateCoordinates(40.7829, -73.9654)).toBe(true);
      expect(validateCoordinates(0, 0)).toBe(true);
      expect(validateCoordinates(90, 180)).toBe(true);
      expect(validateCoordinates(-90, -180)).toBe(true);
    });

    it('should reject invalid coordinates', () => {
      expect(validateCoordinates(91, 0)).toBe(false);
      expect(validateCoordinates(-91, 0)).toBe(false);
      expect(validateCoordinates(0, 181)).toBe(false);
      expect(validateCoordinates(0, -181)).toBe(false);
      expect(validateCoordinates(NaN, 0)).toBe(false);
      expect(validateCoordinates(0, NaN)).toBe(false);
    });
  });

  describe('calculateDistance', () => {
    it('should calculate distance between two points', () => {
      const coord1 = { lat: 40.7829, lng: -73.9654 }; // Central Park
      const coord2 = { lat: 40.7589, lng: -73.9851 }; // Times Square
      
      const distance = calculateDistance(coord1, coord2);
      expect(distance).toBeCloseTo(2.5, 1); // Approximately 2.5 km
    });

    it('should return 0 for same coordinates', () => {
      const coord = { lat: 40.7829, lng: -73.9654 };
      const distance = calculateDistance(coord, coord);
      expect(distance).toBe(0);
    });
  });

  describe('findLocationsWithinRadius', () => {
    it('should find locations within radius', () => {
      const locations: Location[] = [
        {
          id: 'loc1',
          name: 'Central Park',
          coordinates: { lat: 40.7829, lng: -73.9654 },
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        {
          id: 'loc2',
          name: 'Times Square',
          coordinates: { lat: 40.7589, lng: -73.9851 },
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        {
          id: 'loc3',
          name: 'Brooklyn Bridge',
          coordinates: { lat: 40.7061, lng: -73.9969 },
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        }
      ];

      const center = { lat: 40.7829, lng: -73.9654 }; // Central Park
      const radius = 5; // 5 km

      const result = findLocationsWithinRadius(locations, center, radius);

      expect(result).toHaveLength(2); // Central Park and Times Square
      expect(result.map(loc => loc.id)).toContain('loc1');
      expect(result.map(loc => loc.id)).toContain('loc2');
    });

    it('should exclude locations without coordinates', () => {
      const locations: Location[] = [
        {
          id: 'loc1',
          name: 'With Coordinates',
          coordinates: { lat: 40.7829, lng: -73.9654 },
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        {
          id: 'loc2',
          name: 'Without Coordinates',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        }
      ];

      const center = { lat: 40.7829, lng: -73.9654 };
      const radius = 5;

      const result = findLocationsWithinRadius(locations, center, radius);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('loc1');
    });
  });
});
