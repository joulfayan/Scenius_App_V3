// Firebase Mock Utilities for Testing
// This module provides mock implementations of Firebase services for testing

export class MockFirestore {
  constructor() {
    this.data = new Map();
    this.collections = new Map();
  }

  collection(path) {
    const collectionPath = path.split('/').join('/');
    if (!this.collections.has(collectionPath)) {
      this.collections.set(collectionPath, new Map());
    }
    return new MockCollectionReference(this.collections.get(collectionPath), collectionPath);
  }

  doc(path) {
    const pathParts = path.split('/');
    const collectionPath = pathParts.slice(0, -1).join('/');
    const docId = pathParts[pathParts.length - 1];
    
    if (!this.collections.has(collectionPath)) {
      this.collections.set(collectionPath, new Map());
    }
    
    const collection = this.collections.get(collectionPath);
    if (!collection.has(docId)) {
      collection.set(docId, { id: docId, data: {} });
    }
    
    return new MockDocumentReference(collection.get(docId), collectionPath, docId);
  }

  // Helper methods for testing
  setTestData(collectionPath, docId, data) {
    if (!this.collections.has(collectionPath)) {
      this.collections.set(collectionPath, new Map());
    }
    this.collections.get(collectionPath).set(docId, { id: docId, data });
  }

  getTestData(collectionPath, docId) {
    const collection = this.collections.get(collectionPath);
    return collection ? collection.get(docId) : null;
  }

  getAllTestData(collectionPath) {
    const collection = this.collections.get(collectionPath);
    return collection ? Array.from(collection.values()) : [];
  }

  clear() {
    this.collections.clear();
  }
}

class MockCollectionReference {
  constructor(data, path) {
    this.data = data;
    this.path = path;
  }

  doc(id) {
    if (!this.data.has(id)) {
      this.data.set(id, { id, data: {} });
    }
    return new MockDocumentReference(this.data.get(id), this.path, id);
  }

  add(data) {
    const id = `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const docData = { id, data: { ...data, createdAt: new Date(), updatedAt: new Date() } };
    this.data.set(id, docData);
    return Promise.resolve({ id });
  }

  where(field, operator, value) {
    return new MockQuery(this.data, this.path, [{ field, operator, value }]);
  }

  orderBy(field, direction = 'asc') {
    return new MockQuery(this.data, this.path, [], [{ field, direction }]);
  }
}

class MockDocumentReference {
  constructor(docData, collectionPath, docId) {
    this.docData = docData;
    this.collectionPath = collectionPath;
    this.docId = docId;
  }

  get() {
    return Promise.resolve({
      exists: () => !!this.docData.data,
      data: () => this.docData.data,
      id: this.docData.id
    });
  }

  set(data, options = {}) {
    if (options.merge) {
      this.docData.data = { ...this.docData.data, ...data };
    } else {
      this.docData.data = data;
    }
    this.docData.data.updatedAt = new Date();
    return Promise.resolve();
  }

  update(data) {
    this.docData.data = { ...this.docData.data, ...data };
    this.docData.data.updatedAt = new Date();
    return Promise.resolve();
  }

  delete() {
    this.docData.data = null;
    return Promise.resolve();
  }
}

class MockQuery {
  constructor(data, path, whereClauses = [], orderByClauses = []) {
    this.data = data;
    this.path = path;
    this.whereClauses = whereClauses;
    this.orderByClauses = orderByClauses;
  }

  where(field, operator, value) {
    return new MockQuery(this.data, this.path, [...this.whereClauses, { field, operator, value }], this.orderByClauses);
  }

  orderBy(field, direction = 'asc') {
    return new MockQuery(this.data, this.path, this.whereClauses, [...this.orderByClauses, { field, direction }]);
  }

  get() {
    let results = Array.from(this.data.values()).filter(doc => doc.data !== null);

    // Apply where clauses
    for (const clause of this.whereClauses) {
      results = results.filter(doc => {
        const value = doc.data[clause.field];
        switch (clause.operator) {
          case '==':
            return value === clause.value;
          case '!=':
            return value !== clause.value;
          case '>':
            return value > clause.value;
          case '>=':
            return value >= clause.value;
          case '<':
            return value < clause.value;
          case '<=':
            return value <= clause.value;
          case 'array-contains':
            return Array.isArray(value) && value.includes(clause.value);
          default:
            return true;
        }
      });
    }

    // Apply order by clauses
    for (const clause of this.orderByClauses) {
      results.sort((a, b) => {
        const aVal = a.data[clause.field];
        const bVal = b.data[clause.field];
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0;
        return clause.direction === 'desc' ? -comparison : comparison;
      });
    }

    return Promise.resolve({
      docs: results.map(doc => ({
        id: doc.id,
        data: () => doc.data,
        exists: () => true
      }))
    });
  }
}

// Mock Firebase Auth
export class MockAuth {
  constructor() {
    this.currentUser = null;
    this.authStateListeners = [];
  }

  signInWithEmailAndPassword(email, password) {
    this.currentUser = {
      uid: 'test-user-123',
      email,
      displayName: 'Test User'
    };
    this.notifyAuthStateChange();
    return Promise.resolve({ user: this.currentUser });
  }

  signOut() {
    this.currentUser = null;
    this.notifyAuthStateChange();
    return Promise.resolve();
  }

  onAuthStateChanged(callback) {
    this.authStateListeners.push(callback);
    // Call immediately with current state
    callback(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authStateListeners.indexOf(callback);
      if (index > -1) {
        this.authStateListeners.splice(index, 1);
      }
    };
  }

  notifyAuthStateChange() {
    this.authStateListeners.forEach(callback => callback(this.currentUser));
  }

  setCurrentUser(user) {
    this.currentUser = user;
    this.notifyAuthStateChange();
  }
}

// Mock Firebase App
export class MockFirebaseApp {
  constructor() {
    this.firestore = new MockFirestore();
    this.auth = new MockAuth();
  }

  clearAllData() {
    this.firestore.clear();
    this.auth.setCurrentUser(null);
  }
}

// Global mock instance
export const mockFirebase = new MockFirebaseApp();

// Helper functions for tests
export function setupFirebaseMocks() {
  // Mock Firebase modules
  global.firebase = {
    firestore: mockFirebase.firestore,
    auth: mockFirebase.auth
  };

  // Mock react-firebase-hooks
  global.useAuthState = () => [mockFirebase.auth.currentUser, false, null];
  
  return mockFirebase;
}

export function cleanupFirebaseMocks() {
  mockFirebase.clearAllData();
}
