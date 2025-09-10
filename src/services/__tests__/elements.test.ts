// src/services/__tests__/elements.test.ts
import { 
  createElement, 
  getElement, 
  updateElement, 
  deleteElement, 
  listElements,
  queryElements,
  getElementsByType,
  getElementsByCategory,
  getElementsByActor,
  subscribeElements,
  subscribeElementsWithFilters,
  assignActorToElement,
  unassignActorFromElement,
  type Element,
  type CreateElementData,
  type UpdateElementData,
  type ElementFilters 
} from '../elements';
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
  where: jest.fn(),
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
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockOrderBy = orderBy as jest.MockedFunction<typeof orderBy>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

describe('Elements Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createElement', () => {
    it('should create a new element with all required fields', async () => {
      const mockDocRef = { id: 'element-123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const elementData: CreateElementData = {
        type: 'prop',
        name: 'Vintage Camera',
        category: 'camera',
        linkedSceneIds: ['scene-1', 'scene-2'],
        linkedActorId: 'actor-456',
        customFields: { brand: 'Canon', model: 'AE-1' },
        estCostCents: 5000
      };

      const result = await createElement('project-123', elementData);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'elements');
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        type: 'prop',
        name: 'Vintage Camera',
        category: 'camera',
        linkedSceneIds: ['scene-1', 'scene-2'],
        linkedActorId: 'actor-456',
        customFields: { brand: 'Canon', model: 'AE-1' },
        estCostCents: 5000,
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toBe('element-123');
    });

    it('should create an element with minimal required fields', async () => {
      const mockDocRef = { id: 'element-456' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const elementData: CreateElementData = {
        type: 'costume',
        name: 'Evening Gown',
        category: 'clothing'
      };

      await createElement('project-123', elementData);

      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        type: 'costume',
        name: 'Evening Gown',
        category: 'clothing',
        linkedSceneIds: [],
        linkedActorId: undefined,
        customFields: {},
        estCostCents: undefined,
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('getElement', () => {
    it('should return element data when document exists', async () => {
      const mockElementData = {
        type: 'prop',
        name: 'Vintage Camera',
        category: 'camera',
        linkedSceneIds: ['scene-1'],
        linkedActorId: 'actor-456',
        customFields: { brand: 'Canon' },
        estCostCents: 5000,
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'element-123',
        data: () => mockElementData
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getElement('project-123', 'element-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'elements', 'element-123');
      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc');
      expect(result).toEqual({
        id: 'element-123',
        ...mockElementData
      });
    });

    it('should return null when document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getElement('project-123', 'non-existent-element');

      expect(result).toBeNull();
    });
  });

  describe('updateElement', () => {
    it('should update element with provided data', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      const updateData: UpdateElementData = {
        name: 'Updated Camera Name',
        estCostCents: 6000
      };

      await updateElement('project-123', 'element-123', updateData);

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'elements', 'element-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        name: 'Updated Camera Name',
        estCostCents: 6000,
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('deleteElement', () => {
    it('should delete the element document', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      await deleteElement('project-123', 'element-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'elements', 'element-123');
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc');
    });
  });

  describe('listElements', () => {
    it('should return all elements ordered by name', async () => {
      const mockElement1 = {
        id: 'element-1',
        data: () => ({ name: 'Camera A', type: 'prop' })
      };
      const mockElement2 = {
        id: 'element-2',
        data: () => ({ name: 'Camera B', type: 'prop' })
      };

      const mockQuerySnapshot = {
        docs: [mockElement1, mockElement2]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const result = await listElements('project-123');

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'elements');
      expect(mockOrderBy).toHaveBeenCalledWith('name');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockGetDocs).toHaveBeenCalledWith('mock-query');
      expect(result).toEqual([
        { id: 'element-1', name: 'Camera A', type: 'prop' },
        { id: 'element-2', name: 'Camera B', type: 'prop' }
      ]);
    });
  });

  describe('queryElements', () => {
    it('should query elements with type filter', async () => {
      const mockElement = {
        id: 'element-1',
        data: () => ({ name: 'Camera', type: 'prop' })
      };

      const mockQuerySnapshot = {
        docs: [mockElement]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockWhere.mockReturnValue('mock-where' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const filters: ElementFilters = { type: 'prop' };
      const result = await queryElements('project-123', filters);

      expect(mockWhere).toHaveBeenCalledWith('type', '==', 'prop');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-where', 'mock-orderBy');
      expect(result).toEqual([{ id: 'element-1', name: 'Camera', type: 'prop' }]);
    });

    it('should query elements with multiple filters', async () => {
      const mockElement = {
        id: 'element-1',
        data: () => ({ name: 'Camera', type: 'prop', category: 'camera' })
      };

      const mockQuerySnapshot = {
        docs: [mockElement]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockWhere.mockReturnValue('mock-where' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const filters: ElementFilters = { type: 'prop', category: 'camera' };
      const result = await queryElements('project-123', filters);

      expect(mockWhere).toHaveBeenCalledWith('type', '==', 'prop');
      expect(mockWhere).toHaveBeenCalledWith('category', '==', 'camera');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-where', 'mock-where', 'mock-orderBy');
      expect(result).toEqual([{ id: 'element-1', name: 'Camera', type: 'prop', category: 'camera' }]);
    });
  });

  describe('getElementsByType', () => {
    it('should return elements filtered by type', async () => {
      const mockElement = {
        id: 'element-1',
        data: () => ({ name: 'Camera', type: 'prop' })
      };

      const mockQuerySnapshot = {
        docs: [mockElement]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockWhere.mockReturnValue('mock-where' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const result = await getElementsByType('project-123', 'prop');

      expect(mockWhere).toHaveBeenCalledWith('type', '==', 'prop');
      expect(result).toEqual([{ id: 'element-1', name: 'Camera', type: 'prop' }]);
    });
  });

  describe('getElementsByCategory', () => {
    it('should return elements filtered by category', async () => {
      const mockElement = {
        id: 'element-1',
        data: () => ({ name: 'Camera', category: 'camera' })
      };

      const mockQuerySnapshot = {
        docs: [mockElement]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockWhere.mockReturnValue('mock-where' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const result = await getElementsByCategory('project-123', 'camera');

      expect(mockWhere).toHaveBeenCalledWith('category', '==', 'camera');
      expect(result).toEqual([{ id: 'element-1', name: 'Camera', category: 'camera' }]);
    });
  });

  describe('getElementsByActor', () => {
    it('should return elements assigned to specific actor', async () => {
      const mockElement = {
        id: 'element-1',
        data: () => ({ name: 'Camera', linkedActorId: 'actor-123' })
      };

      const mockQuerySnapshot = {
        docs: [mockElement]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockWhere.mockReturnValue('mock-where' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const result = await getElementsByActor('project-123', 'actor-123');

      expect(mockWhere).toHaveBeenCalledWith('linkedActorId', '==', 'actor-123');
      expect(result).toEqual([{ id: 'element-1', name: 'Camera', linkedActorId: 'actor-123' }]);
    });
  });

  describe('subscribeElements', () => {
    it('should set up real-time subscription for all elements', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      mockOnSnapshot.mockImplementation((queryRef, callback) => {
        const mockElement = {
          id: 'element-1',
          data: () => ({ name: 'Camera', type: 'prop' })
        };

        const mockQuerySnapshot = {
          docs: [mockElement]
        };
        
        callback(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const unsubscribe = subscribeElements('project-123', mockCallback);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'elements');
      expect(mockOrderBy).toHaveBeenCalledWith('name');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockOnSnapshot).toHaveBeenCalledWith('mock-query', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledWith([
        { id: 'element-1', name: 'Camera', type: 'prop' }
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('assignActorToElement', () => {
    it('should assign an actor to an element', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      await assignActorToElement('project-123', 'element-456', 'actor-789');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'elements', 'element-456');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        linkedActorId: 'actor-789',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('unassignActorFromElement', () => {
    it('should unassign an actor from an element', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      await unassignActorFromElement('project-123', 'element-456');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'elements', 'element-456');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        linkedActorId: null,
        updatedAt: 'mock-timestamp'
      });
    });
  });
});
