// src/services/__tests__/contacts.test.ts
import { 
  createContact, 
  getContact, 
  updateContact, 
  deleteContact, 
  listContacts,
  subscribeContacts,
  parseCSVContacts,
  importContactsFromCSV,
  exportContactsToCSV,
  validateCSVContacts,
  type Contact,
  type CreateContactData,
  type UpdateContactData,
  type CSVContactRow 
} from '../contacts';
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

describe('Contacts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createContact', () => {
    it('should create a new contact with all fields', async () => {
      const mockDocRef = { id: 'contact-123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const contactData: CreateContactData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Director',
        company: 'ABC Productions',
        notes: 'Main contact for the project'
      };

      const result = await createContact('project-123', contactData);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'contacts');
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Director',
        company: 'ABC Productions',
        notes: 'Main contact for the project',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toBe('contact-123');
    });

    it('should create a contact with minimal required fields', async () => {
      const mockDocRef = { id: 'contact-456' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const contactData: CreateContactData = {
        name: 'Jane Smith'
      };

      await createContact('project-123', contactData);

      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        name: 'Jane Smith',
        email: undefined,
        phone: undefined,
        role: undefined,
        company: undefined,
        notes: undefined,
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('getContact', () => {
    it('should return contact data when document exists', async () => {
      const mockContactData = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        role: 'Director',
        company: 'ABC Productions',
        notes: 'Main contact',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'contact-123',
        data: () => mockContactData
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getContact('project-123', 'contact-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'contacts', 'contact-123');
      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc');
      expect(result).toEqual({
        id: 'contact-123',
        ...mockContactData
      });
    });

    it('should return null when document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getContact('project-123', 'non-existent-contact');

      expect(result).toBeNull();
    });
  });

  describe('updateContact', () => {
    it('should update contact with provided data', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      const updateData: UpdateContactData = {
        name: 'John Updated',
        email: 'john.updated@example.com'
      };

      await updateContact('project-123', 'contact-123', updateData);

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'contacts', 'contact-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        name: 'John Updated',
        email: 'john.updated@example.com',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('deleteContact', () => {
    it('should delete the contact document', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      await deleteContact('project-123', 'contact-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'contacts', 'contact-123');
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc');
    });
  });

  describe('listContacts', () => {
    it('should return all contacts ordered by name', async () => {
      const mockContact1 = {
        id: 'contact-1',
        data: () => ({ name: 'Alice', email: 'alice@example.com' })
      };
      const mockContact2 = {
        id: 'contact-2',
        data: () => ({ name: 'Bob', email: 'bob@example.com' })
      };

      const mockQuerySnapshot = {
        docs: [mockContact1, mockContact2]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const result = await listContacts('project-123');

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'contacts');
      expect(mockOrderBy).toHaveBeenCalledWith('name');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockGetDocs).toHaveBeenCalledWith('mock-query');
      expect(result).toEqual([
        { id: 'contact-1', name: 'Alice', email: 'alice@example.com' },
        { id: 'contact-2', name: 'Bob', email: 'bob@example.com' }
      ]);
    });
  });

  describe('subscribeContacts', () => {
    it('should set up real-time subscription for all contacts', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      mockOnSnapshot.mockImplementation((queryRef, callback) => {
        const mockContact = {
          id: 'contact-1',
          data: () => ({ name: 'Alice', email: 'alice@example.com' })
        };

        const mockQuerySnapshot = {
          docs: [mockContact]
        };
        
        callback(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const unsubscribe = subscribeContacts('project-123', mockCallback);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'contacts');
      expect(mockOrderBy).toHaveBeenCalledWith('name');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockOnSnapshot).toHaveBeenCalledWith('mock-query', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledWith([
        { id: 'contact-1', name: 'Alice', email: 'alice@example.com' }
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('parseCSVContacts', () => {
    it('should parse valid CSV content', () => {
      const csvContent = `name,email,phone,role,company,notes
John Doe,john@example.com,+1234567890,Director,ABC Productions,Main contact
Jane Smith,jane@example.com,+0987654321,Producer,XYZ Films,Secondary contact`;

      const result = parseCSVContacts(csvContent);

      expect(result).toEqual([
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: 'Director',
          company: 'ABC Productions',
          notes: 'Main contact'
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
          role: 'Producer',
          company: 'XYZ Films',
          notes: 'Secondary contact'
        }
      ]);
    });

    it('should handle CSV with missing fields', () => {
      const csvContent = `name,email
John Doe,john@example.com
Jane Smith,`;

      const result = parseCSVContacts(csvContent);

      expect(result).toEqual([
        {
          name: 'John Doe',
          email: 'john@example.com',
          phone: undefined,
          role: undefined,
          company: undefined,
          notes: undefined
        },
        {
          name: 'Jane Smith',
          email: '',
          phone: undefined,
          role: undefined,
          company: undefined,
          notes: undefined
        }
      ]);
    });

    it('should filter out contacts without names', () => {
      const csvContent = `name,email
,invalid@example.com
Valid Name,valid@example.com`;

      const result = parseCSVContacts(csvContent);

      expect(result).toEqual([
        {
          name: 'Valid Name',
          email: 'valid@example.com',
          phone: undefined,
          role: undefined,
          company: undefined,
          notes: undefined
        }
      ]);
    });
  });

  describe('exportContactsToCSV', () => {
    it('should export contacts to CSV format', () => {
      const contacts: Contact[] = [
        {
          id: 'contact-1',
          name: 'John Doe',
          email: 'john@example.com',
          phone: '+1234567890',
          role: 'Director',
          company: 'ABC Productions',
          notes: 'Main contact',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        {
          id: 'contact-2',
          name: 'Jane Smith',
          email: 'jane@example.com',
          phone: '+0987654321',
          role: 'Producer',
          company: 'XYZ Films',
          notes: 'Secondary contact',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        }
      ];

      const result = exportContactsToCSV(contacts);

      expect(result).toContain('name,email,phone,role,company,notes');
      expect(result).toContain('"John Doe","john@example.com","+1234567890","Director","ABC Productions","Main contact"');
      expect(result).toContain('"Jane Smith","jane@example.com","+0987654321","Producer","XYZ Films","Secondary contact"');
    });
  });

  describe('validateCSVContacts', () => {
    it('should validate correct CSV content', () => {
      const csvContent = `name,email,phone
John Doe,john@example.com,+1234567890
Jane Smith,jane@example.com,+0987654321`;

      const result = validateCSVContacts(csvContent);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
      expect(result.contactCount).toBe(2);
    });

    it('should detect duplicate names', () => {
      const csvContent = `name,email
John Doe,john@example.com
John Doe,john2@example.com`;

      const result = validateCSVContacts(csvContent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Duplicate contact names found');
    });

    it('should detect missing names', () => {
      const csvContent = `name,email
,john@example.com
Jane Smith,jane@example.com`;

      const result = validateCSVContacts(csvContent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('All contacts must have a name');
    });

    it('should handle empty CSV', () => {
      const csvContent = '';

      const result = validateCSVContacts(csvContent);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('No valid contacts found in CSV');
    });
  });
});
