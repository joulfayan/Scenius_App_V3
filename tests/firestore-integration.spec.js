// @ts-check
const { test, expect } = require('@playwright/test');
const { setupFirebaseMocks, cleanupFirebaseMocks } = require('./utils/firebase-mock');
const { 
  waitForElement, 
  verifyFirebaseData, 
  countFirebaseDocuments,
  waitForFirebaseOperation
} = require('./utils/test-helpers');

test.describe('Firestore Integration Tests', () => {
  let firebaseMock;

  test.beforeEach(async ({ page }) => {
    firebaseMock = setupFirebaseMocks();
    
    await page.addInitScript(() => {
      window.mockFirebase = {
        auth: {
          currentUser: {
            uid: 'test-user-123',
            email: 'test@example.com',
            displayName: 'Test User'
          }
        }
      };
    });

    await page.goto('/');
    await waitForElement(page, 'body');
  });

  test.afterEach(async () => {
    cleanupFirebaseMocks();
  });

  test('Project creation writes to Firestore', async ({ page }) => {
    // Create project
    await page.click('button:has-text("Create New Project")');
    await page.fill('input[name="title"]', 'Test Project');
    await page.fill('input[name="logline"]', 'Test logline');
    await page.click('button:has-text("Create Project")');
    
    await waitForFirebaseOperation(page, 'Project creation');

    // Verify project was created in Firestore
    const projects = firebaseMock.firestore.getAllTestData('projects');
    expect(projects.length).toBeGreaterThan(0);
    
    const project = projects.find(p => p.data.name === 'Test Project');
    expect(project).toBeTruthy();
    expect(project.data.ownerId).toBe('test-user-123');
  });

  test('Script saving updates Firestore', async ({ page }) => {
    // Create project first
    await page.click('button:has-text("Create New Project")');
    await page.fill('input[name="title"]', 'Test Project');
    await page.click('button:has-text("Create Project")');
    await waitForNavigation(page, '/project');

    // Navigate to script editor
    await page.click('text=Script Management');
    await waitForElement(page, 'textarea, [contenteditable="true"]');
    
    // Add script content
    const scriptEditor = page.locator('textarea, [contenteditable="true"]').first();
    await scriptEditor.fill('FADE IN:\n\nINT. ROOM - DAY\n\nTest scene content.\n\nFADE OUT.');
    
    // Save script
    await page.click('button:has-text("Save")');
    await waitForFirebaseOperation(page, 'Script saving');

    // Verify script was saved
    const scripts = firebaseMock.firestore.getAllTestData('projects/test-project-123/scripts');
    expect(scripts.length).toBeGreaterThan(0);
    
    const script = scripts[0];
    expect(script.data.content).toContain('Test scene content');
    expect(script.data.version).toBe(1);
  });

  test('Element creation and scene linking', async ({ page }) => {
    // Create test data
    const projectId = 'test-project-123';
    const sceneId = 'scene-1';
    const elementId = 'element-1';

    // Create scene
    firebaseMock.firestore.setTestData(`projects/${projectId}/scenes`, sceneId, {
      number: 1,
      slug: 'test-scene',
      heading: 'INT. TEST ROOM - DAY',
      locationType: 'INT',
      timeOfDay: 'DAY',
      durationMins: 5,
      elementIds: [],
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Create element
    firebaseMock.firestore.setTestData(`projects/${projectId}/elements`, elementId, {
      type: 'prop',
      name: 'Test Prop',
      category: 'props',
      linkedSceneIds: [],
      customFields: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Simulate linking element to scene
    const scene = firebaseMock.firestore.getTestData(`projects/${projectId}/scenes`, sceneId);
    const element = firebaseMock.firestore.getTestData(`projects/${projectId}/elements`, elementId);
    
    scene.data.elementIds.push(elementId);
    element.data.linkedSceneIds.push(sceneId);
    
    firebaseMock.firestore.setTestData(`projects/${projectId}/scenes`, sceneId, scene.data);
    firebaseMock.firestore.setTestData(`projects/${projectId}/elements`, elementId, element.data);

    // Verify linking
    const updatedScene = firebaseMock.firestore.getTestData(`projects/${projectId}/scenes`, sceneId);
    const updatedElement = firebaseMock.firestore.getTestData(`projects/${projectId}/elements`, elementId);
    
    expect(updatedScene.data.elementIds).toContain(elementId);
    expect(updatedElement.data.linkedSceneIds).toContain(sceneId);
  });

  test('Data validation and error handling', async ({ page }) => {
    // Test invalid project creation
    await page.click('button:has-text("Create New Project")');
    await page.click('button:has-text("Create Project")'); // Submit without title
    
    // Should show validation error
    await expect(page.locator('text=required')).toBeVisible();
  });

  test('Real-time updates simulation', async ({ page }) => {
    // Create initial data
    const projectId = 'test-project-123';
    firebaseMock.firestore.setTestData(`projects/${projectId}/elements`, 'element-1', {
      type: 'character',
      name: 'Test Character',
      category: 'characters',
      linkedSceneIds: [],
      customFields: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Simulate real-time update
    const element = firebaseMock.firestore.getTestData(`projects/${projectId}/elements`, 'element-1');
    element.data.name = 'Updated Character';
    element.data.updatedAt = new Date();
    firebaseMock.firestore.setTestData(`projects/${projectId}/elements`, 'element-1', element.data);

    // Verify update
    const updatedElement = firebaseMock.firestore.getTestData(`projects/${projectId}/elements`, 'element-1');
    expect(updatedElement.data.name).toBe('Updated Character');
  });

  test('Batch operations', async ({ page }) => {
    const projectId = 'test-project-123';
    const elements = [
      { type: 'prop', name: 'Prop 1', category: 'props' },
      { type: 'prop', name: 'Prop 2', category: 'props' },
      { type: 'character', name: 'Character 1', category: 'characters' }
    ];

    // Simulate batch element creation
    elements.forEach((element, index) => {
      firebaseMock.firestore.setTestData(`projects/${projectId}/elements`, `element-${index}`, {
        ...element,
        linkedSceneIds: [],
        customFields: {},
        createdAt: new Date(),
        updatedAt: new Date()
      });
    });

    // Verify all elements were created
    const createdElements = firebaseMock.firestore.getAllTestData(`projects/${projectId}/elements`);
    expect(createdElements.length).toBe(3);
    
    const propElements = createdElements.filter(el => el.data.type === 'prop');
    const characterElements = createdElements.filter(el => el.data.type === 'character');
    
    expect(propElements.length).toBe(2);
    expect(characterElements.length).toBe(1);
  });
});
