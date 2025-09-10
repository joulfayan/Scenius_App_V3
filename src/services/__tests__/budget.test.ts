// src/services/__tests__/budget.test.ts
import { 
  createBudgetLineItem, 
  getBudgetLineItem, 
  updateBudgetLineItem, 
  deleteBudgetLineItem, 
  listBudgetLineItems,
  getBudgetLineItemsByScope,
  getDayBudgetLineItems,
  subscribeBudgetLineItems,
  subscribeBudgetLineItemsByScope,
  calculateBudgetTotals,
  calculateDayBudgetTotals,
  calculateMultipleDayBudgetTotals,
  centsToDollars,
  dollarsToCents,
  formatMoney,
  formatMoneyCompact,
  validateMoneyInput,
  getUniqueCategories,
  getBudgetSummaryByCategory,
  type BudgetLineItem,
  type CreateBudgetLineItemData,
  type UpdateBudgetLineItemData,
  type BudgetTotals,
  type DayBudgetTotals 
} from '../budget';
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
  where,
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
  where: jest.fn(),
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
const mockWhere = where as jest.MockedFunction<typeof where>;
const mockOnSnapshot = onSnapshot as jest.MockedFunction<typeof onSnapshot>;

describe('Budget Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createBudgetLineItem', () => {
    it('should create a new budget line item with all fields', async () => {
      const mockDocRef = { id: 'lineitem-123' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const lineItemData: CreateBudgetLineItemData = {
        scope: 'day',
        refId: 'day-123',
        description: 'Camera Rental',
        category: 'Equipment',
        qty: 2,
        unitCents: 5000, // $50.00
        currency: 'USD'
      };

      const result = await createBudgetLineItem('project-123', lineItemData);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'budgets', 'main', 'lineItems');
      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        scope: 'day',
        refId: 'day-123',
        description: 'Camera Rental',
        category: 'Equipment',
        qty: 2,
        unitCents: 5000,
        totalCents: 10000, // 2 * 5000
        currency: 'USD',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
      expect(result).toBe('lineitem-123');
    });

    it('should create a line item with default currency', async () => {
      const mockDocRef = { id: 'lineitem-456' };
      mockAddDoc.mockResolvedValue(mockDocRef);
      mockCollection.mockReturnValue('mock-collection' as any);

      const lineItemData: CreateBudgetLineItemData = {
        scope: 'project',
        refId: 'project-123',
        description: 'Production Design',
        category: 'Creative',
        qty: 1,
        unitCents: 10000 // $100.00
      };

      await createBudgetLineItem('project-123', lineItemData);

      expect(mockAddDoc).toHaveBeenCalledWith('mock-collection', {
        scope: 'project',
        refId: 'project-123',
        description: 'Production Design',
        category: 'Creative',
        qty: 1,
        unitCents: 10000,
        totalCents: 10000,
        currency: 'USD',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('getBudgetLineItem', () => {
    it('should return line item data when document exists', async () => {
      const mockLineItemData = {
        scope: 'day',
        refId: 'day-123',
        description: 'Camera Rental',
        category: 'Equipment',
        qty: 2,
        unitCents: 5000,
        totalCents: 10000,
        currency: 'USD',
        createdAt: 'mock-timestamp',
        updatedAt: 'mock-timestamp'
      };

      const mockDocSnap = {
        exists: () => true,
        id: 'lineitem-123',
        data: () => mockLineItemData
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getBudgetLineItem('project-123', 'lineitem-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'budgets', 'main', 'lineItems', 'lineitem-123');
      expect(mockGetDoc).toHaveBeenCalledWith('mock-doc');
      expect(result).toEqual({
        id: 'lineitem-123',
        ...mockLineItemData
      });
    });

    it('should return null when document does not exist', async () => {
      const mockDocSnap = {
        exists: () => false
      };

      mockGetDoc.mockResolvedValue(mockDocSnap as any);
      mockDoc.mockReturnValue('mock-doc' as any);

      const result = await getBudgetLineItem('project-123', 'non-existent-item');

      expect(result).toBeNull();
    });
  });

  describe('updateBudgetLineItem', () => {
    it('should update line item with provided data', async () => {
      mockUpdateDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      // Mock getBudgetLineItem for recalculation
      const mockCurrentItem = {
        id: 'lineitem-123',
        qty: 2,
        unitCents: 5000,
        totalCents: 10000
      };

      // Mock the getBudgetLineItem call
      jest.spyOn(require('../budget'), 'getBudgetLineItem').mockResolvedValue(mockCurrentItem);

      const updateData: UpdateBudgetLineItemData = {
        description: 'Updated Camera Rental',
        qty: 3
      };

      await updateBudgetLineItem('project-123', 'lineitem-123', updateData);

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'budgets', 'main', 'lineItems', 'lineitem-123');
      expect(mockUpdateDoc).toHaveBeenCalledWith('mock-doc', {
        description: 'Updated Camera Rental',
        qty: 3,
        totalCents: 15000, // 3 * 5000
        updatedAt: 'mock-timestamp'
      });
    });
  });

  describe('deleteBudgetLineItem', () => {
    it('should delete the line item document', async () => {
      mockDeleteDoc.mockResolvedValue(undefined);
      mockDoc.mockReturnValue('mock-doc' as any);

      await deleteBudgetLineItem('project-123', 'lineitem-123');

      expect(mockDoc).toHaveBeenCalledWith(db, 'projects', 'project-123', 'budgets', 'main', 'lineItems', 'lineitem-123');
      expect(mockDeleteDoc).toHaveBeenCalledWith('mock-doc');
    });
  });

  describe('listBudgetLineItems', () => {
    it('should return all line items ordered by category', async () => {
      const mockLineItem1 = {
        id: 'lineitem-1',
        data: () => ({ description: 'Camera Rental', category: 'Equipment' })
      };
      const mockLineItem2 = {
        id: 'lineitem-2',
        data: () => ({ description: 'Lighting', category: 'Equipment' })
      };

      const mockQuerySnapshot = {
        docs: [mockLineItem1, mockLineItem2]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const result = await listBudgetLineItems('project-123');

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'budgets', 'main', 'lineItems');
      expect(mockOrderBy).toHaveBeenCalledWith('category');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockGetDocs).toHaveBeenCalledWith('mock-query');
      expect(result).toEqual([
        { id: 'lineitem-1', description: 'Camera Rental', category: 'Equipment' },
        { id: 'lineitem-2', description: 'Lighting', category: 'Equipment' }
      ]);
    });
  });

  describe('getBudgetLineItemsByScope', () => {
    it('should return line items filtered by scope and refId', async () => {
      const mockLineItem = {
        id: 'lineitem-1',
        data: () => ({ scope: 'day', refId: 'day-123', description: 'Camera Rental' })
      };

      const mockQuerySnapshot = {
        docs: [mockLineItem]
      };

      mockGetDocs.mockResolvedValue(mockQuerySnapshot as any);
      mockQuery.mockReturnValue('mock-query' as any);
      mockWhere.mockReturnValue('mock-where' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const result = await getBudgetLineItemsByScope('project-123', 'day', 'day-123');

      expect(mockWhere).toHaveBeenCalledWith('scope', '==', 'day');
      expect(mockWhere).toHaveBeenCalledWith('refId', '==', 'day-123');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-where', 'mock-where', 'mock-orderBy');
      expect(result).toEqual([{ id: 'lineitem-1', scope: 'day', refId: 'day-123', description: 'Camera Rental' }]);
    });
  });

  describe('subscribeBudgetLineItems', () => {
    it('should set up real-time subscription for all line items', () => {
      const mockUnsubscribe = jest.fn();
      const mockCallback = jest.fn();
      
      mockOnSnapshot.mockImplementation((queryRef, callback) => {
        const mockLineItem = {
          id: 'lineitem-1',
          data: () => ({ description: 'Camera Rental', category: 'Equipment' })
        };

        const mockQuerySnapshot = {
          docs: [mockLineItem]
        };
        
        callback(mockQuerySnapshot);
        return mockUnsubscribe;
      });

      mockQuery.mockReturnValue('mock-query' as any);
      mockOrderBy.mockReturnValue('mock-orderBy' as any);
      mockCollection.mockReturnValue('mock-collection' as any);

      const unsubscribe = subscribeBudgetLineItems('project-123', mockCallback);

      expect(mockCollection).toHaveBeenCalledWith(db, 'projects', 'project-123', 'budgets', 'main', 'lineItems');
      expect(mockOrderBy).toHaveBeenCalledWith('category');
      expect(mockQuery).toHaveBeenCalledWith('mock-collection', 'mock-orderBy');
      expect(mockOnSnapshot).toHaveBeenCalledWith('mock-query', expect.any(Function));
      expect(mockCallback).toHaveBeenCalledWith([
        { id: 'lineitem-1', description: 'Camera Rental', category: 'Equipment' }
      ]);
      expect(unsubscribe).toBe(mockUnsubscribe);
    });
  });

  describe('calculateBudgetTotals', () => {
    it('should calculate budget totals correctly', () => {
      const lineItems: BudgetLineItem[] = [
        {
          id: 'item-1',
          scope: 'day',
          refId: 'day-123',
          description: 'Camera Rental',
          category: 'Equipment',
          qty: 2,
          unitCents: 5000,
          totalCents: 10000,
          currency: 'USD',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        {
          id: 'item-2',
          scope: 'day',
          refId: 'day-123',
          description: 'Lighting',
          category: 'Equipment',
          qty: 1,
          unitCents: 3000,
          totalCents: 3000,
          currency: 'USD',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        {
          id: 'item-3',
          scope: 'day',
          refId: 'day-123',
          description: 'Catering',
          category: 'Food',
          qty: 1,
          unitCents: 2000,
          totalCents: 2000,
          currency: 'USD',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        }
      ];

      const result = calculateBudgetTotals(lineItems);

      expect(result.totalCents).toBe(15000);
      expect(result.currency).toBe('USD');
      expect(result.lineItemCount).toBe(3);
      expect(result.categoryBreakdown).toEqual({
        'Equipment': 13000,
        'Food': 2000
      });
    });

    it('should handle empty line items', () => {
      const result = calculateBudgetTotals([]);

      expect(result.totalCents).toBe(0);
      expect(result.currency).toBe('USD');
      expect(result.lineItemCount).toBe(0);
      expect(result.categoryBreakdown).toEqual({});
    });
  });

  describe('centsToDollars', () => {
    it('should convert cents to dollars correctly', () => {
      expect(centsToDollars(10000)).toBe(100);
      expect(centsToDollars(5000)).toBe(50);
      expect(centsToDollars(1250)).toBe(12.5);
      expect(centsToDollars(0)).toBe(0);
    });
  });

  describe('dollarsToCents', () => {
    it('should convert dollars to cents correctly', () => {
      expect(dollarsToCents(100)).toBe(10000);
      expect(dollarsToCents(50)).toBe(5000);
      expect(dollarsToCents(12.5)).toBe(1250);
      expect(dollarsToCents(0)).toBe(0);
    });
  });

  describe('formatMoney', () => {
    it('should format money correctly for USD', () => {
      expect(formatMoney(10000)).toBe('$100.00');
      expect(formatMoney(5000)).toBe('$50.00');
      expect(formatMoney(1250)).toBe('$12.50');
      expect(formatMoney(0)).toBe('$0.00');
    });

    it('should format money correctly for different currencies', () => {
      expect(formatMoney(10000, 'EUR')).toBe('€100.00');
      expect(formatMoney(10000, 'GBP')).toBe('£100.00');
    });

    it('should handle showCents parameter', () => {
      expect(formatMoney(10000, 'USD', true)).toBe('$100.00');
      expect(formatMoney(10000, 'USD', false)).toBe('$100');
    });
  });

  describe('formatMoneyCompact', () => {
    it('should format money with compact notation', () => {
      expect(formatMoneyCompact(100000)).toBe('$1K');
      expect(formatMoneyCompact(1000000)).toBe('$1M');
      expect(formatMoneyCompact(10000)).toBe('$100');
    });
  });

  describe('validateMoneyInput', () => {
    it('should validate valid money input', () => {
      expect(validateMoneyInput('100')).toBe(10000);
      expect(validateMoneyInput('50.50')).toBe(5050);
      expect(validateMoneyInput(100)).toBe(10000);
      expect(validateMoneyInput(50.5)).toBe(5050);
    });

    it('should throw error for invalid input', () => {
      expect(() => validateMoneyInput('invalid')).toThrow('Invalid money amount');
      expect(() => validateMoneyInput(-100)).toThrow('Invalid money amount');
      expect(() => validateMoneyInput(NaN)).toThrow('Invalid money amount');
    });
  });

  describe('getUniqueCategories', () => {
    it('should return unique categories sorted alphabetically', () => {
      const lineItems: BudgetLineItem[] = [
        {
          id: 'item-1',
          scope: 'day',
          refId: 'day-123',
          description: 'Camera Rental',
          category: 'Equipment',
          qty: 1,
          unitCents: 5000,
          totalCents: 5000,
          currency: 'USD',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        {
          id: 'item-2',
          scope: 'day',
          refId: 'day-123',
          description: 'Catering',
          category: 'Food',
          qty: 1,
          unitCents: 2000,
          totalCents: 2000,
          currency: 'USD',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        {
          id: 'item-3',
          scope: 'day',
          refId: 'day-123',
          description: 'Lighting',
          category: 'Equipment',
          qty: 1,
          unitCents: 3000,
          totalCents: 3000,
          currency: 'USD',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        }
      ];

      const result = getUniqueCategories(lineItems);

      expect(result).toEqual(['Equipment', 'Food']);
    });
  });

  describe('getBudgetSummaryByCategory', () => {
    it('should return budget summary by category', () => {
      const lineItems: BudgetLineItem[] = [
        {
          id: 'item-1',
          scope: 'day',
          refId: 'day-123',
          description: 'Camera Rental',
          category: 'Equipment',
          qty: 2,
          unitCents: 5000,
          totalCents: 10000,
          currency: 'USD',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        },
        {
          id: 'item-2',
          scope: 'day',
          refId: 'day-123',
          description: 'Catering',
          category: 'Food',
          qty: 1,
          unitCents: 2000,
          totalCents: 2000,
          currency: 'USD',
          createdAt: 'mock-timestamp',
          updatedAt: 'mock-timestamp'
        }
      ];

      const result = getBudgetSummaryByCategory(lineItems);

      expect(result).toEqual({
        'Equipment': {
          totalCents: 10000,
          itemCount: 1,
          percentage: 83.33
        },
        'Food': {
          totalCents: 2000,
          itemCount: 1,
          percentage: 16.67
        }
      });
    });
  });
});
