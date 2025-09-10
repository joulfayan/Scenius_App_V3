// src/services/__tests__/scenes.test.ts
import { 
  createScene, 
  getScene, 
  updateScene, 
  deleteScene, 
  listScenes, 
  subscribeScenes,
  linkElementToScene,
  unlinkElementFromScene,
  type Scene,
  type CreateSceneData,
  type UpdateSceneData 
} from '../scenes';
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
  arrayUnion,
  arrayRemove 
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
  arrayUnion: jest.fn((value) => ({ type: 'arrayUnion', value })),
  arrayRemove: jest.fn((value) => ({ type: 'arrayRemove', value })),
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
const mockArrayUnion = arrayUnion as jest.MockedFunction<typeof arrayUnion>;
const mockArrayRemove = arrayRemove as jest.MockedFunction<typeof arrayRemove>;

describe('Scenes Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createScene', () => {
    it('should create a new scene with all required fields', async () => {
      const mockDocRef = { id: 'scene-123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const sceneData: CreateSceneData = {
        number: 1,
        slug: 'opening-scene',
        heading: 'INT. LIVING ROOM - DAY',
        locationType: 'INT',
        timeOfDay: 'DAY',
        durationMins: 5,
        elementIds: ['element-1', 'element-2']
      };

      const result = await createScene('project-123', sceneData);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scenes');
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        number: 1,
        slug: 'opening-scene',
        heading: 'INT. LIVING ROOM - DAY',
        locationType: 'INT',
        timeOfDay: 'DAY',
        durationMins: 5,
        elementIds: ['element-1', 'element-2'],
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toBe('scene-123');
    });

    it('should create a scene with empty elementIds if not provided', async () => {
      const mockDocRef = { id: 'scene-456' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const sceneData: CreateSceneData = {
        number: 2,
        slug: 'outdoor-scene',
        heading: 'EXT. PARK - NIGHT',
        locationType: 'EXT',
        timeOfDay: 'NIGHT',
        durationMins: 3
      };

      await createScene('project-123', sceneData);

      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        number: 2,
        slug: 'outdoor-scene',
        heading: 'EXT. PARK - NIGHT',
        locationType: 'EXT',
        timeOfDay: 'NIGHT',
        durationMins: 3,
        elementIds: [],
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('getScene', () => {
    it('should return scene data when document exists', async () => {
      const mockSceneData = {
        number: 1,
        slug: 'opening-scene',
        heading: 'INT. LIVING ROOM - DAY',
        locationType: 'INT',
        timeOfDay: 'DAY',
        durationMins: 5,
        elementIds: ['element-1'],
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'scene-123',
        data: () => mockSceneData
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getScene('project-123', 'scene-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scenes', 'scene-123');
      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc');
      expect(result).toEqual({
        id: 'scene-123',
        ...mockSceneData
      });
    });

    it('should return null when document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getScene('project-123', 'non-existent-scene');

      expect(result).toBeNull();
    });
  });

  describe('updateScene', () => {
    it('should update scene with provided data', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      const updateData: UpdateSceneData = {
        heading: 'Updated heading',
        durationMins: 7
      };

      await updateScene('project-123', 'scene-123', updateData);

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scenes', 'scene-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        heading: 'Updated heading',
        durationMins: 7,
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('deleteScene', () => {
    it('should delete the scene document', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      await deleteScene('project-123', 'scene-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scenes', 'scene-123');
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc');
    });
  });

  describe('listScenes', () => {
    it('should return all scenes ordered by number', async () => {
      const mockScene1 = {
        id: 'scene-1',
        data: () => ({ number: 1, slug: 'scene-1' })
      };
      const mockScene2 = {
        id: 'scene-2',
        data: () => ({ number: 2, slug: 'scene-2' })
      };

      const mockQuerySnapshot = {
        docs: [mockScene1, mockScene2]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const result = await listScenes('project-123');

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scenes');
      expect(mockOrderBy).toHaveBeenCalledWith('number');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockGetDocs).toHaveBeenCalledWith('mock-query');
      expect(result).toEqual([
        { id: 'scene-1', number: 1, slug: 'scene-1' },
        { id: 'scene-2', number: 2, slug: 'scene-2' }
      ]);
    });
  });

  describe('subscribeScenes', () => {
    it('should set up real-time subscription for all scenes', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      mockOnSnapshot.mockImplementation((queryRef, callback) => {
        const mockScene1 = {
          id: 'scene-1',
          data: () => ({ number: 1, slug: 'scene-1' })
        };
        const mockScene2 = {
          id: 'scene-2',
          data: () => ({ number: 2, slug: 'scene-2' })
        };

        const mockQuerySnapshot = {
          docs: [mockScene1, mockScene2]
        };
        
        callback(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const unsubscribe = subscribeScenes('project-123', mockCallback);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scenes');
      expect(mockOrderBy).toHaveBeenCalledWith('number');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockOnSnapshot).toHaveBeenCalledWith('mock-query', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledWith([
        { id: 'scene-1', number: 1, slug: 'scene-1' },
        { id: 'scene-2', number: 2, slug: 'scene-2' }
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('linkElementToScene', () => {
    it('should link element to scene bidirectionally', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      await linkElementToScene('project-123', 'scene-456', 'element-789');

      // Check scene update
      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scenes', 'scene-456');
      expect(mockArrayUnion).toHaveBeenCalledWith('element-789');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        elementIds: { type: 'arrayUnion', value: 'element-789' },
        updatedAt: 'mock-timestamp'
      });

      // Check element update
      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'elements', 'element-789');
      expect(mockArrayUnion).toHaveBeenCalledWith('scene-456');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        linkedSceneIds: { type: 'arrayUnion', value: 'scene-456' },
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('unlinkElementFromScene', () => {
    it('should unlink element from scene bidirectionally', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      await unlinkElementFromScene('project-123', 'scene-456', 'element-789');

      // Check scene update
      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scenes', 'scene-456');
      expect(mockArrayRemove).toHaveBeenCalledWith('element-789');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        elementIds: { type: 'arrayRemove', value: 'element-789' },
        updatedAt: 'mock-timestamp'
      });

      // Check element update
      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'elements', 'element-789');
      expect(mockArrayRemove).toHaveBeenCalledWith('scene-456');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        linkedSceneIds: { type: 'arrayRemove', value: 'scene-456' },
        updatedAt: 'mock-timestamp'
      });
    });
  });
});
