// src/services/__tests__/projects.test.ts
import { 
  createProject, 
  getProject, 
  subscribeProject,
  type Project,
  type CreateProjectData 
} from '../projects';
import { 
  collection, 
  doc, 
  addDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../../lib/firebase.client';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  addDoc: jest.fn(),
  getDoc: jest.fn(),
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
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

describe('Projects Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createProject', () => {
    it('should create a new project with required fields', async () => {
      const mockDocRef = { id: 'test-project-id' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const projectData: CreateProjectData = {
        name: 'Test Project',
        ownerId: 'user-123',
        memberIds: ['user-456', 'user-789']
      };

      const result = await createProject(projectData);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects');
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        name: 'Test Project',
        ownerId: 'user-123',
        memberIds: ['user-456', 'user-789'],
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toBe('test-project-id');
    });

    it('should create a project with empty memberIds if not provided', async () => {
      const mockDocRef = { id: 'test-project-id' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const projectData: CreateProjectData = {
        name: 'Test Project',
        ownerId: 'user-123'
      };

      await createProject(projectData);

      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        name: 'Test Project',
        ownerId: 'user-123',
        memberIds: [],
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('getProject', () => {
    it('should return project data when document exists', async () => {
      const mockProjectData = {
        name: 'Test Project',
        ownerId: 'user-123',
        memberIds: ['user-456'],
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'test-project-id',
        data: () => mockProjectData
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getProject('test-project-id');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'test-project-id');
      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc');
      expect(result).toEqual({
        id: 'test-project-id',
        ...mockProjectData
      });
    });

    it('should return null when document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getProject('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('subscribeProject', () => {
    it('should set up real-time subscription and call callback with project data', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        // Simulate document exists
        const mockDocSnap = {
          exists: () => true,
          id: 'test-project-id',
          data: () => ({
            name: 'Test Project',
            ownerId: 'user-123',
            memberIds: ['user-456'],
            createdAt: 'mock-timestamp',
            updatedAt: 'mock-timestamp'
          })
        };
        
        // Call the callback immediately to simulate real-time update
        callback(mockDocSnap);
        return mockUnsubscribe;
      });

      mockDoc.mockReturnValue('mock-doc' as any);

      const unsubscribe = subscribeProject('test-project-id', mockCallback);

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'test-project-id');
      expect(mockOnSnapshot).toHaveBeenCalledWith('mock-doc', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledWith({
        id: 'test-project-id',
        name: 'Test Project',
        ownerId: 'user-123',
        memberIds: ['user-456'],
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback with null when document does not exist', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        // Simulate document does not exist
        const mockDocSnap = {
          exists: () => false
        };
        
        callback(mockDocSnap);
        return mockUnsubscribe;
      });

      mockDoc.mockReturnValue('mock-doc' as any);

      subscribeProject('non-existent-id', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });
  });
});
