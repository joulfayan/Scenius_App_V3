// src/services/__tests__/callsheets.test.ts
import { 
  createCallSheet, 
  getCallSheet, 
  getCallSheetWithDetails,
  updateCallSheet, 
  deleteCallSheet, 
  listCallSheets,
  listCallSheetsWithDetails,
  subscribeCallSheets,
  autoPopulateCallSheet,
  generateCallSheetContent,
  exportCallSheetAsText,
  type CallSheet,
  type CallSheetWithDetails,
  type CreateCallSheetData,
  type UpdateCallSheetData 
} from '../callsheets';
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

// Mock dependencies
jest.mock('../stripboard');
jest.mock('../contacts');
jest.mock('../locations');

import { getStripDay } from '../stripboard';
import { listContacts } from '../contacts';
import { listLocations } from '../locations';

const mockGetStripDay = getStripDay as jest.MockedFunction<typeof getStripDay>;
const mockListContacts = listContacts as jest.MockedFunction<typeof listContacts>;
const mockListLocations = listLocations as jest.MockedFunction<typeof listLocations>;

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

describe('CallSheets Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createCallSheet', () => {
    it('should create a new call sheet with all fields', async () => {
      const mockDocRef = { id: 'callsheet-123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const callSheetData: CreateCallSheetData = {
        date: '2024-01-15',
        unitName: 'Unit 1',
        dayId: 'day-123',
        locationId: 'location-123',
        recipients: ['contact-1', 'contact-2'],
        weather: {
          high: 75,
          low: 60,
          condition: 'Sunny',
          sunrise: '6:30 AM',
          sunset: '7:30 PM'
        },
        hospitals: [{
          name: 'General Hospital',
          address: '123 Main St',
          phone: '555-1234',
          distance: '2 miles'
        }],
        notes: 'Call sheet notes'
      };

      const result = await createCallSheet('project-123', callSheetData);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'callsheets');
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        date: '2024-01-15',
        unitName: 'Unit 1',
        dayId: 'day-123',
        locationId: 'location-123',
        recipients: ['contact-1', 'contact-2'],
        weather: {
          high: 75,
          low: 60,
          condition: 'Sunny',
          sunrise: '6:30 AM',
          sunset: '7:30 PM'
        },
        hospitals: [{
          name: 'General Hospital',
          address: '123 Main St',
          phone: '555-1234',
          distance: '2 miles'
        }],
        notes: 'Call sheet notes',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toBe('callsheet-123');
    });

    it('should create a call sheet with minimal required fields', async () => {
      const mockDocRef = { id: 'callsheet-456' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const callSheetData: CreateCallSheetData = {
        date: '2024-01-15',
        unitName: 'Unit 1',
        dayId: 'day-123',
        locationId: 'location-123'
      };

      await createCallSheet('project-123', callSheetData);

      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        date: '2024-01-15',
        unitName: 'Unit 1',
        dayId: 'day-123',
        locationId: 'location-123',
        recipients: [],
        weather: undefined,
        hospitals: undefined,
        notes: '',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('getCallSheet', () => {
    it('should return call sheet data when document exists', async () => {
      const mockCallSheetData = {
        date: '2024-01-15',
        unitName: 'Unit 1',
        dayId: 'day-123',
        locationId: 'location-123',
        recipients: ['contact-1'],
        notes: 'Call sheet notes',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'callsheet-123',
        data: () => mockCallSheetData
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getCallSheet('project-123', 'callsheet-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'callsheets', 'callsheet-123');
      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc');
      expect(result).toEqual({
        id: 'callsheet-123',
        ...mockCallSheetData
      });
    });

    it('should return null when document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getCallSheet('project-123', 'non-existent-callsheet');

      expect(result).toBeNull();
    });
  });

  describe('getCallSheetWithDetails', () => {
    it('should return call sheet with populated details', async () => {
      const mockCallSheet = {
        id: 'callsheet-123',
        date: '2024-01-15',
        unitName: 'Unit 1',
        dayId: 'day-123',
        locationId: 'location-123',
        recipients: ['contact-1'],
        notes: 'Call sheet notes',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockStripDay = {
        id: 'day-123',
        date: '2024-01-15',
        sceneOrder: ['scene-1', 'scene-2'],
        targetMins: 480,
        totalMins: 450,
        updatedAt: 'mock-timestamp'
      };

      const mockLocation = {
        id: 'location-123',
        name: 'Central Park',
        address: 'Central Park, NY',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockContacts = [
        {
          id: 'contact-1',
          name: 'John Doe',
          role: 'Director',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        }
      ];

      // Mock the service calls
      mockGetDoc.mockResolvedValueOnce({
        exists: () => true,
        id: 'callsheet-123',
        data: () => mockCallSheet
      } as any);

      mockGetStripDay.mockResolvedValue(mockStripDay as any);
      mockListLocations.mockResolvedValue([mockLocation] as any);
      mockListContacts.mockResolvedValue(mockContacts as any);

      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getCallSheetWithDetails('project-123', 'callsheet-123');

      expect(result).toEqual({
        ...mockCallSheet,
        stripDay: mockStripDay,
        location: mockLocation,
        recipientContacts: mockContacts
      });
    });

    it('should return null when call sheet does not exist', async () => {
      mockGetDoc.mockResolvedValue({
        exists: () => false
      } as any);

      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getCallSheetWithDetails('project-123', 'non-existent-callsheet');

      expect(result).toBeNull();
    });
  });

  describe('updateCallSheet', () => {
    it('should update call sheet with provided data', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      const updateData: UpdateCallSheetData = {
        unitName: 'Updated Unit',
        notes: 'Updated notes'
      };

      await updateCallSheet('project-123', 'callsheet-123', updateData);

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'callsheets', 'callsheet-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        unitName: 'Updated Unit',
        notes: 'Updated notes',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('deleteCallSheet', () => {
    it('should delete the call sheet document', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      await deleteCallSheet('project-123', 'callsheet-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'callsheets', 'callsheet-123');
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc');
    });
  });

  describe('listCallSheets', () => {
    it('should return all call sheets ordered by date', async () => {
      const mockCallSheet1 = {
        id: 'callsheet-1',
        data: () => ({ date: '2024-01-15', unitName: 'Unit 1' })
      };
      const mockCallSheet2 = {
        id: 'callsheet-2',
        data: () => ({ date: '2024-01-16', unitName: 'Unit 2' })
      };

      const mockQuerySnapshot = {
        docs: [mockCallSheet1, mockCallSheet2]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const result = await listCallSheets('project-123');

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'callsheets');
      expect(mockOrderBy).toHaveBeenCalledWith('date');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockGetDocs).toHaveBeenCalledWith('mock-query');
      expect(result).toEqual([
        { id: 'callsheet-1', date: '2024-01-15', unitName: 'Unit 1' },
        { id: 'callsheet-2', date: '2024-01-16', unitName: 'Unit 2' }
      ]);
    });
  });

  describe('subscribeCallSheets', () => {
    it('should set up real-time subscription for all call sheets', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      mockOnSnapshot.mockImplementation((queryRef, callback) => {
        const mockCallSheet = {
          id: 'callsheet-1',
          data: () => ({ date: '2024-01-15', unitName: 'Unit 1' })
        };

        const mockQuerySnapshot = {
          docs: [mockCallSheet]
        };
        
        callback(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const unsubscribe = subscribeCallSheets('project-123', mockCallback);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'callsheets');
      expect(mockOrderBy).toHaveBeenCalledWith('date');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockOnSnapshot).toHaveBeenCalledWith('mock-query', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledWith([
        { id: 'callsheet-1', date: '2024-01-15', unitName: 'Unit 1' }
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('autoPopulateCallSheet', () => {
    it('should auto-populate call sheet data from strip day and location', async () => {
      const mockStripDay = {
        id: 'day-123',
        date: '2024-01-15',
        sceneOrder: ['scene-1', 'scene-2'],
        targetMins: 480,
        totalMins: 450,
        notes: 'Strip day notes',
        updatedAt: 'mock-timestamp'
      };

      const mockLocation = {
        id: 'location-123',
        name: 'Central Park',
        address: 'Central Park, NY',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockContacts = [
        {
          id: 'contact-1',
          name: 'John Doe',
          role: 'Director',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        {
          id: 'contact-2',
          name: 'Jane Smith',
          role: 'Producer',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        }
      ];

      mockGetStripDay.mockResolvedValue(mockStripDay as any);
      mockListLocations.mockResolvedValue([mockLocation] as any);
      mockListContacts.mockResolvedValue(mockContacts as any);

      const result = await autoPopulateCallSheet('project-123', 'day-123', 'location-123');

      expect(result).toEqual({
        date: '2024-01-15',
        unitName: 'Unit 1 - 2024-01-15',
        dayId: 'day-123',
        locationId: 'location-123',
        recipients: ['contact-1', 'contact-2'],
        notes: expect.stringContaining('Call Sheet for 2024-01-15')
      });
    });

    it('should throw error when strip day not found', async () => {
      mockGetStripDay.mockResolvedValue(null);

      await expect(autoPopulateCallSheet('project-123', 'invalid-day', 'location-123'))
        .rejects.toThrow('Strip day not found');
    });

    it('should throw error when location not found', async () => {
      const mockStripDay = {
        id: 'day-123',
        date: '2024-01-15',
        sceneOrder: ['scene-1'],
        targetMins: 480,
        totalMins: 450,
        updatedAt: 'mock-timestamp'
      };

      mockGetStripDay.mockResolvedValue(mockStripDay as any);
      mockListLocations.mockResolvedValue([]);

      await expect(autoPopulateCallSheet('project-123', 'day-123', 'invalid-location'))
        .rejects.toThrow('Location not found');
    });
  });

  describe('generateCallSheetContent', () => {
    it('should generate formatted call sheet content', () => {
      const mockCallSheet: CallSheet = {
        id: 'callsheet-123',
        date: '2024-01-15',
        unitName: 'Unit 1',
        dayId: 'day-123',
        locationId: 'location-123',
        recipients: ['contact-1'],
        weather: {
          high: 75,
          low: 60,
          condition: 'Sunny',
          sunrise: '6:30 AM',
          sunset: '7:30 PM'
        },
        hospitals: [{
          name: 'General Hospital',
          address: '123 Main St',
          phone: '555-1234',
          distance: '2 miles'
        }],
        notes: 'Call sheet notes',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockDetails: CallSheetWithDetails = {
        ...mockCallSheet,
        stripDay: {
          id: 'day-123',
          date: '2024-01-15',
          sceneOrder: ['scene-1', 'scene-2'],
          targetMins: 480,
          totalMins: 450,
          updatedAt: 'mock-timestamp'
        },
        location: {
          id: 'location-123',
          name: 'Central Park',
          address: 'Central Park, NY',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        recipientContacts: [{
          id: 'contact-1',
          name: 'John Doe',
          role: 'Director',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        }]
      };

      const result = generateCallSheetContent(mockCallSheet, mockDetails);

      expect(result).toContain('CALL SHEET');
      expect(result).toContain('Date: 2024-01-15');
      expect(result).toContain('Unit: Unit 1');
      expect(result).toContain('Location: Central Park');
      expect(result).toContain('WEATHER');
      expect(result).toContain('High: 75°F');
      expect(result).toContain('SCHEDULE');
      expect(result).toContain('Scenes: 2');
      expect(result).toContain('CREW CONTACTS');
      expect(result).toContain('John Doe (Director)');
      expect(result).toContain('NEARBY HOSPITALS');
      expect(result).toContain('General Hospital');
      expect(result).toContain('NOTES');
      expect(result).toContain('Call sheet notes');
    });
  });

  describe('exportCallSheetAsText', () => {
    it('should create and download text file', () => {
      const mockCallSheet: CallSheet = {
        id: 'callsheet-123',
        date: '2024-01-15',
        unitName: 'Unit 1',
        dayId: 'day-123',
        locationId: 'location-123',
        recipients: [],
        notes: 'Test notes',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockDetails: CallSheetWithDetails = {
        ...mockCallSheet,
        stripDay: undefined,
        location: undefined,
        recipientContacts: []
      };

      // Mock DOM methods
      const mockLink = {
        href: '',
        download: '',
        click: jest.fn()
      };
      const mockCreateElement = jest.fn(() => mockLink);
      const mockAppendChild = jest.fn();
      const mockRemoveChild = jest.fn();
      const mockRevokeObjectURL = jest.fn();

      Object.defineProperty(document, 'createElement', {
        value: mockCreateElement,
        writable: true
      });
      Object.defineProperty(document.body, 'appendChild', {
        value: mockAppendChild,
        writable: true
      });
      Object.defineProperty(document.body, 'removeChild', {
        value: mockRemoveChild,
        writable: true
      });
      Object.defineProperty(URL, 'createObjectURL', {
        value: jest.fn(() => 'mock-url'),
        writable: true
      });
      Object.defineProperty(URL, 'revokeObjectURL', {
        value: mockRevokeObjectURL,
        writable: true
      });

      exportCallSheetAsText(mockCallSheet, mockDetails, 'test-callsheet.txt');

      expect(mockCreateElement).toHaveBeenCalledWith('a');
      expect(mockLink.download).toBe('test-callsheet.txt');
      expect(mockAppendChild).toHaveBeenCalledWith(mockLink);
      expect(mockLink.click).toHaveBeenCalled();
      expect(mockRemoveChild).toHaveBeenCalledWith(mockLink);
      expect(mockRevokeObjectURL).toHaveBeenCalledWith('mock-url');
    });
  });
});
