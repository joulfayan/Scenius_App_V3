// src/services/budget.ts
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
  onSnapshot,
  serverTimestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from '../lib/firebase.client';

export type BudgetScope = 'project' | 'day' | 'scene' | 'element';

export interface BudgetLineItem {
  id: string;
  scope: BudgetScope;
  refId: string; // Reference to day, scene, or element ID
  description: string;
  category: string;
  qty: number;
  unitCents: number; // Price per unit in cents
  totalCents: number; // Total cost in cents (qty * unitCents)
  currency: string; // ISO currency code (e.g., 'USD', 'EUR')
  createdAt: any; // serverTimestamp
  updatedAt: any; // serverTimestamp
}

export interface CreateBudgetLineItemData {
  scope: BudgetScope;
  refId: string;
  description: string;
  category: string;
  qty: number;
  unitCents: number;
  currency?: string;
}

export interface UpdateBudgetLineItemData {
  scope?: BudgetScope;
  refId?: string;
  description?: string;
  category?: string;
  qty?: number;
  unitCents?: number;
  currency?: string;
}

export interface BudgetTotals {
  totalCents: number;
  currency: string;
  lineItemCount: number;
  categoryBreakdown: Record<string, number>;
}

export interface DayBudgetTotals {
  dayId: string;
  date: string;
  totalCents: number;
  currency: string;
  lineItemCount: number;
}

/**
 * Creates a new budget line item in Firestore
 * @param projectId - The project ID
 * @param data - Budget line item creation data
 * @returns Promise with the created line item ID
 */
export async function createBudgetLineItem(projectId: string, data: CreateBudgetLineItemData): Promise<string> {
  const lineItemsCollection = collection(db, 'projects', projectId, 'budgets', 'main', 'lineItems');
  
  const totalCents = data.qty * data.unitCents;
  
  const lineItemData = {
    scope: data.scope,
    refId: data.refId,
    description: data.description,
    category: data.category,
    qty: data.qty,
    unitCents: data.unitCents,
    totalCents,
    currency: data.currency || 'USD',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  const docRef = await addDoc(lineItemsCollection, lineItemData);
  return docRef.id;
}

/**
 * Gets a single budget line item by ID
 * @param projectId - The project ID
 * @param itemId - The line item ID to fetch
 * @returns Promise with the line item data or null if not found
 */
export async function getBudgetLineItem(projectId: string, itemId: string): Promise<BudgetLineItem | null> {
  const lineItemDoc = doc(db, 'projects', projectId, 'budgets', 'main', 'lineItems', itemId);
  const docSnap = await getDoc(lineItemDoc);
  
  if (docSnap.exists()) {
    return {
      id: docSnap.id,
      ...docSnap.data()
    } as BudgetLineItem;
  }
  
  return null;
}

/**
 * Updates a budget line item
 * @param projectId - The project ID
 * @param itemId - The line item ID to update
 * @param data - Updated line item data
 * @returns Promise that resolves when line item is updated
 */
export async function updateBudgetLineItem(
  projectId: string, 
  itemId: string, 
  data: UpdateBudgetLineItemData
): Promise<void> {
  const lineItemDoc = doc(db, 'projects', projectId, 'budgets', 'main', 'lineItems', itemId);
  
  // Recalculate total if qty or unitCents changed
  const updateData = { ...data };
  if (data.qty !== undefined || data.unitCents !== undefined) {
    // Get current item to calculate new total
    const currentItem = await getBudgetLineItem(projectId, itemId);
    if (currentItem) {
      const newQty = data.qty !== undefined ? data.qty : currentItem.qty;
      const newUnitCents = data.unitCents !== undefined ? data.unitCents : currentItem.unitCents;
      updateData.totalCents = newQty * newUnitCents;
    }
  }
  
  updateData.updatedAt = serverTimestamp();

  await updateDoc(lineItemDoc, updateData);
}

/**
 * Deletes a budget line item
 * @param projectId - The project ID
 * @param itemId - The line item ID to delete
 * @returns Promise that resolves when line item is deleted
 */
export async function deleteBudgetLineItem(projectId: string, itemId: string): Promise<void> {
  const lineItemDoc = doc(db, 'projects', projectId, 'budgets', 'main', 'lineItems', itemId);
  await deleteDoc(lineItemDoc);
}

/**
 * Lists all budget line items for a project, ordered by category
 * @param projectId - The project ID
 * @returns Promise with array of line items
 */
export async function listBudgetLineItems(projectId: string): Promise<BudgetLineItem[]> {
  const lineItemsCollection = collection(db, 'projects', projectId, 'budgets', 'main', 'lineItems');
  const q = query(lineItemsCollection, orderBy('category'));
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as BudgetLineItem[];
}

/**
 * Gets budget line items by scope and reference ID
 * @param projectId - The project ID
 * @param scope - The budget scope
 * @param refId - The reference ID
 * @returns Promise with array of line items
 */
export async function getBudgetLineItemsByScope(
  projectId: string, 
  scope: BudgetScope, 
  refId: string
): Promise<BudgetLineItem[]> {
  const lineItemsCollection = collection(db, 'projects', projectId, 'budgets', 'main', 'lineItems');
  const q = query(
    lineItemsCollection, 
    where('scope', '==', scope),
    where('refId', '==', refId),
    orderBy('category')
  );
  const querySnapshot = await getDocs(q);
  
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as BudgetLineItem[];
}

/**
 * Gets budget line items for a specific day
 * @param projectId - The project ID
 * @param dayId - The strip day ID
 * @returns Promise with array of line items for the day
 */
export async function getDayBudgetLineItems(projectId: string, dayId: string): Promise<BudgetLineItem[]> {
  return getBudgetLineItemsByScope(projectId, 'day', dayId);
}

/**
 * Subscribes to real-time updates for all budget line items in a project
 * @param projectId - The project ID
 * @param callback - Function to call when line items data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeBudgetLineItems(
  projectId: string,
  callback: (lineItems: BudgetLineItem[]) => void
): Unsubscribe {
  const lineItemsCollection = collection(db, 'projects', projectId, 'budgets', 'main', 'lineItems');
  const q = query(lineItemsCollection, orderBy('category'));
  
  return onSnapshot(q, (querySnapshot) => {
    const lineItems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BudgetLineItem[];
    callback(lineItems);
  });
}

/**
 * Subscribes to real-time updates for budget line items by scope
 * @param projectId - The project ID
 * @param scope - The budget scope
 * @param refId - The reference ID
 * @param callback - Function to call when line items data changes
 * @returns Unsubscribe function to stop listening
 */
export function subscribeBudgetLineItemsByScope(
  projectId: string,
  scope: BudgetScope,
  refId: string,
  callback: (lineItems: BudgetLineItem[]) => void
): Unsubscribe {
  const lineItemsCollection = collection(db, 'projects', projectId, 'budgets', 'main', 'lineItems');
  const q = query(
    lineItemsCollection, 
    where('scope', '==', scope),
    where('refId', '==', refId),
    orderBy('category')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const lineItems = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as BudgetLineItem[];
    callback(lineItems);
  });
}

/**
 * Calculates budget totals for a project
 * @param lineItems - Array of budget line items
 * @returns Budget totals object
 */
export function calculateBudgetTotals(lineItems: BudgetLineItem[]): BudgetTotals {
  const totals: BudgetTotals = {
    totalCents: 0,
    currency: 'USD',
    lineItemCount: lineItems.length,
    categoryBreakdown: {}
  };

  lineItems.forEach(item => {
    totals.totalCents += item.totalCents;
    totals.currency = item.currency; // Use the currency from the last item (assuming all are the same)
    
    if (totals.categoryBreakdown[item.category]) {
      totals.categoryBreakdown[item.category] += item.totalCents;
    } else {
      totals.categoryBreakdown[item.category] = item.totalCents;
    }
  });

  return totals;
}

/**
 * Calculates budget totals for a specific day
 * @param projectId - The project ID
 * @param dayId - The strip day ID
 * @returns Promise with day budget totals
 */
export async function calculateDayBudgetTotals(
  projectId: string, 
  dayId: string
): Promise<DayBudgetTotals> {
  const lineItems = await getDayBudgetLineItems(projectId, dayId);
  const totals = calculateBudgetTotals(lineItems);
  
  return {
    dayId,
    date: '', // This would need to be populated from strip day data
    totalCents: totals.totalCents,
    currency: totals.currency,
    lineItemCount: totals.lineItemCount
  };
}

/**
 * Calculates budget totals for multiple days
 * @param projectId - The project ID
 * @param dayIds - Array of strip day IDs
 * @returns Promise with array of day budget totals
 */
export async function calculateMultipleDayBudgetTotals(
  projectId: string, 
  dayIds: string[]
): Promise<DayBudgetTotals[]> {
  const dayTotals: DayBudgetTotals[] = [];
  
  for (const dayId of dayIds) {
    const totals = await calculateDayBudgetTotals(projectId, dayId);
    dayTotals.push(totals);
  }
  
  return dayTotals;
}

/**
 * Converts cents to dollars
 * @param cents - Amount in cents
 * @returns Amount in dollars
 */
export function centsToDollars(cents: number): number {
  return cents / 100;
}

/**
 * Converts dollars to cents
 * @param dollars - Amount in dollars
 * @returns Amount in cents
 */
export function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

/**
 * Formats money amount for display
 * @param cents - Amount in cents
 * @param currency - Currency code (default: 'USD')
 * @param showCents - Whether to show cents (default: true)
 * @returns Formatted money string
 */
export function formatMoney(cents: number, currency: string = 'USD', showCents: boolean = true): string {
  const dollars = centsToDollars(cents);
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: showCents ? 2 : 0,
    maximumFractionDigits: showCents ? 2 : 0
  });
  
  return formatter.format(dollars);
}

/**
 * Formats money amount for display with compact notation
 * @param cents - Amount in cents
 * @param currency - Currency code (default: 'USD')
 * @returns Formatted money string with compact notation
 */
export function formatMoneyCompact(cents: number, currency: string = 'USD'): string {
  const dollars = centsToDollars(cents);
  
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    notation: 'compact',
    maximumFractionDigits: 1
  });
  
  return formatter.format(dollars);
}

/**
 * Validates money input
 * @param input - Input string or number
 * @returns Validated amount in cents
 */
export function validateMoneyInput(input: string | number): number {
  const value = typeof input === 'string' ? parseFloat(input) : input;
  
  if (isNaN(value) || value < 0) {
    throw new Error('Invalid money amount');
  }
  
  return dollarsToCents(value);
}

/**
 * Gets unique categories from line items
 * @param lineItems - Array of budget line items
 * @returns Array of unique categories
 */
export function getUniqueCategories(lineItems: BudgetLineItem[]): string[] {
  const categories = new Set(lineItems.map(item => item.category));
  return Array.from(categories).sort();
}

/**
 * Gets budget summary by category
 * @param lineItems - Array of budget line items
 * @returns Object with category summaries
 */
export function getBudgetSummaryByCategory(lineItems: BudgetLineItem[]): Record<string, {
  totalCents: number;
  itemCount: number;
  percentage: number;
}> {
  const totals = calculateBudgetTotals(lineItems);
  const summary: Record<string, { totalCents: number; itemCount: number; percentage: number }> = {};
  
  Object.entries(totals.categoryBreakdown).forEach(([category, totalCents]) => {
    const itemCount = lineItems.filter(item => item.category === category).length;
    const percentage = totals.totalCents > 0 ? (totalCents / totals.totalCents) * 100 : 0;
    
    summary[category] = {
      totalCents,
      itemCount,
      percentage
    };
  });
  
  return summary;
}
