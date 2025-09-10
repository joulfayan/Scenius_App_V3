// src/services/__tests__/scripts.test.ts
import { 
  saveScript, 
  saveScriptVersion, 
  subscribeScript,
  type Script,
  type ScriptVersion,
  type SaveScriptData,
  type SaveScriptVersionData 
} from '../scripts';
import { 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot, 
  collection,
  addDoc 
} from 'firebase/firestore';
import { db } from '../../lib/firebase.client';

// Mock Firebase
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  onSnapshot: jest.fn(),
  collection: jest.fn(),
  addDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'mock-timestamp')
}));

jest.mock('../../lib/firebase.client', () => ({
  db: 'mock-db'
}));

const mockDoc = doc as jest.MockedFunction<typeof doc>;
const mockSetDoc = setDoc as jest.MockedFunction<typeof setDoc>;
const mockGetDoc = getDoc as jest.MockedFunction<typeof getDoc>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;
const mockCollection = collection as jest.MockedFunction<typeof collection>;
const mockAddDoc = addDoc as jest.MockedFunction<typeof addDoc>;

describe('Scripts Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveScript', () => {
    it('should save a script with serverTimestamp for updatedAt', async () => {
      mockDoc.mockReturnValue('mock-doc' as any);
      mockSetDoc.mockResolvedValue(undefined);

      const scriptData: SaveScriptData = {
        content: 'FADE IN:\n\nINT. LIVING ROOM - DAY\n\nA cozy living room...',
        version: 1,
        durationMins: 120
      };

      await saveScript('project-123', 'script-456', scriptData);

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scripts', 'script-456');
      expect(mockSetDoc).toHaveBeenCalledWith('mock-doc', {
        content: 'FADE IN:\n\nINT. LIVING ROOM - DAY\n\nA cozy living room...',
        version: 1,
        durationMins: 120,
        updatedAt: 'mock-timestamp'
      }, { merge: true });
    });

    it('should handle different script versions', async () => {
      mockDoc.mockReturnValue('mock-doc' as any);
      mockSetDoc.mockResolvedValue(undefined);

      const scriptData: SaveScriptData = {
        content: 'Updated script content',
        version: 2,
        durationMins: 125
      };

      await saveScript('project-123', 'script-456', scriptData);

      expect(mockSetDoc).toHaveBeenCalledWith('mock-doc', {
        content: 'Updated script content',
        version: 2,
        durationMins: 125,
        updatedAt: 'mock-timestamp'
      }, { merge: true });
    });
  });

  describe('saveScriptVersion', () => {
    it('should save a new script version with auto-generated ID', async () => {
      const mockDocRef = { id: 'version-789' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const versionData: SaveScriptVersionData = {
        content: 'Version 1 of the script',
        note: 'Initial draft'
      };

      const result = await saveScriptVersion('project-123', 'script-456', versionData);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scripts', 'script-456', 'versions');
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        content: 'Version 1 of the script',
        note: 'Initial draft',
        createdAt: 'mock-timestamp'
      });
      expect(result).toBe('version-789');
    });

    it('should save version with different content and note', async () => {
      const mockDocRef = { id: 'version-abc' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const versionData: SaveScriptVersionData = {
        content: 'Revised script with new scenes',
        note: 'Added character development'
      };

      const result = await saveScriptVersion('project-123', 'script-456', versionData);

      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        content: 'Revised script with new scenes',
        note: 'Added character development',
        createdAt: 'mock-timestamp'
      });
      expect(result).toBe('version-abc');
    });
  });

  describe('subscribeScript', () => {
    it('should set up real-time subscription and call callback with script data', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        // Simulate document exists
        const mockDocSnap = {
          exists: () => true,
          id: 'script-456',
          data: () => ({
            content: 'FADE IN:\n\nINT. LIVING ROOM - DAY',
            version: 1,
            durationMins: 120,
            updatedAt: 'mock-timestamp'
          })
        };
        
        // Call the callback immediately to simulate real-time update
        callback(mockDocSnap);
        return mockUnsubscribe;
      });

      mockDoc.mockReturnValue('mock-doc' as any);

      const unsubscribe = subscribeScript('project-123', 'script-456', mockCallback);

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'scripts', 'script-456');
      expect(mockOnSnapshot).toHaveBeenCalledWith('mock-doc', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledWith({
        id: 'script-456',
        content: 'FADE IN:\n\nINT. LIVING ROOM - DAY',
        version: 1,
        durationMins: 120,
        updatedAt: 'mock-timestamp'
      });
      expect(unsubscribe).toBe(mockUnsubscribe);
    });

    it('should call callback with null when script does not exist', () => {
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

      subscribeScript('project-123', 'non-existent-script', mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(null);
    });

    it('should handle script updates in real-time', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      mockOnSnapshot.mockImplementation((docRef, callback) => {
        // Simulate first update
        const mockDocSnap1 = {
          exists: () => true,
          id: 'script-456',
          data: () => ({
            content: 'Original content',
            version: 1,
            durationMins: 120,
            updatedAt: 'mock-timestamp-1'
          })
        };
        
        // Simulate second update
        const mockDocSnap2 = {
          exists: () => true,
          id: 'script-456',
          data: () => ({
            content: 'Updated content',
            version: 2,
            durationMins: 125,
            updatedAt: 'mock-timestamp-2'
          })
        };
        
        // Call callback twice to simulate real-time updates
        callback(mockDocSnap1);
        callback(mockDocSnap2);
        return mockUnsubscribe;
      });

      mockDoc.mockReturnValue('mock-doc' as any);

      subscribeScript('project-123', 'script-456', mockCallback);

      expect(mockCallback).toHaveBeenCalledTimes(2);
      expect(mockCallback).toHaveBeenNthCalledWith(1, {
        id: 'script-456',
        content: 'Original content',
        version: 1,
        durationMins: 120,
        updatedAt: 'mock-timestamp-1'
      });
      expect(mockCallback).toHaveBeenNthCalledWith(2, {
        id: 'script-456',
        content: 'Updated content',
        version: 2,
        durationMins: 125,
        updatedAt: 'mock-timestamp-2'
      });
    });
  });
});
