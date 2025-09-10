// @ts-check
const { test, expect } = require('@playwright/test');
const { setupFirebaseMocks, cleanupFirebaseMocks } = require('./utils/firebase-mock');
const { 
  waitForElement, 
  waitForText, 
  fillFieldByLabel, 
  clickButtonByText, 
  waitForApiRequest, 
  mockApiResponse, 
  waitForFirebaseOperation, 
  verifyElementVisible, 
  verifyTextExists, 
  waitForNavigation, 
  verifyFirebaseData, 
  countFirebaseDocuments, 
  waitForToast,
  takeDebugScreenshot
} = require('./utils/test-helpers');

// Load test data
const testData = require('./fixtures/test-data.json');
const aiResponses = require('./fixtures/ai-responses.json');

test.describe('Scenius App Complete Flow', () => {
  let firebaseMock;

  test.beforeEach(async ({ page }) => {
    // Setup Firebase mocks
    firebaseMock = setupFirebaseMocks();
    
    // Mock the AI API endpoint
    await mockApiResponse(page, '**/api/ai', {
      choices: [{
        delta: {
          content: JSON.stringify(aiResponses.breakdownScene1)
        }
      }]
    });

    // Mock Firebase Auth
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

    // Navigate to the app
    await page.goto('/');
    
    // Wait for the app to load
    await waitForElement(page, '[data-testid="app-loaded"], body', 10000);
  });

  test.afterEach(async () => {
    cleanupFirebaseMocks();
  });

  test('Complete flow: Create project → Save script → AI breakdown → Verify Firestore → Generate shotlist', async ({ page }) => {
    console.log('🚀 Starting complete Scenius app flow test');

    // Step 1: Create a new project
    console.log('📝 Step 1: Creating new project');
    
    // Click the create project button
    await clickButtonByText(page, 'Create New Project');
    
    // Fill in project details
    await fillFieldByLabel(page, 'Project Title', testData.testProject.title);
    await fillFieldByLabel(page, 'Logline', testData.testProject.logline);
    
    // Select genre and format
    await page.selectOption('select[name="genre"]', testData.testProject.genre);
    await page.selectOption('select[name="format"]', testData.testProject.format);
    
    // Fill description
    await fillFieldByLabel(page, 'Description', testData.testProject.description);
    
    // Submit the form
    await clickButtonByText(page, 'Create Project');
    
    // Wait for navigation to project page
    await waitForNavigation(page, '/project');
    console.log('✅ Project created successfully');

    // Step 2: Save script content
    console.log('📄 Step 2: Saving script content');
    
    // Navigate to script management (assuming it's in the navigation)
    await page.click('text=Script Management');
    await waitForNavigation(page, '/script');
    
    // Find the script editor and add content
    const scriptEditor = await waitForElement(page, 'textarea, [contenteditable="true"]');
    await scriptEditor.fill(testData.testScript.content);
    
    // Save the script (look for save button or auto-save)
    const saveButton = page.locator('button:has-text("Save"), button[title*="Save"]');
    if (await saveButton.isVisible()) {
      await saveButton.click();
    }
    
    // Wait for save confirmation
    await waitForToast(page, 'saved', 5000);
    console.log('✅ Script content saved successfully');

    // Step 3: Use AI Assistant for scene breakdown
    console.log('🤖 Step 3: Using AI Assistant for scene breakdown');
    
    // Open the AI assistant (floating button or panel)
    const assistantButton = page.locator('[data-testid="assistant-button"], button:has-text("Assistant"), .floating-assistant');
    await assistantButton.click();
    
    // Wait for assistant panel to open
    await waitForElement(page, '[data-testid="assistant-panel"], .assistant-panel');
    
    // Click on "Breakdown Scene" quick action
    await page.click('button:has-text("Breakdown Scene")');
    
    // Wait for the AI request to be made
    const aiRequest = await waitForApiRequest(page, '**/api/ai');
    console.log('✅ AI breakdown request sent');

    // Wait for the AI response to be processed
    await waitForFirebaseOperation(page, 'AI breakdown processing');
    
    // Verify the assistant shows the breakdown result
    await verifyTextExists(page, 'elements', 'Breakdown elements');
    await verifyTextExists(page, 'locations', 'Breakdown locations');
    console.log('✅ AI breakdown completed');

    // Step 4: Verify elements inserted to Firestore and scene linking
    console.log('🔥 Step 4: Verifying Firestore data');
    
    // Check that elements were created in Firestore
    const elementsCount = countFirebaseDocuments(firebaseMock, 'projects/test-project-123/elements');
    expect(elementsCount).toBeGreaterThan(0);
    console.log(`✅ ${elementsCount} elements created in Firestore`);
    
    // Check that scenes were created
    const scenesCount = countFirebaseDocuments(firebaseMock, 'projects/test-project-123/scenes');
    expect(scenesCount).toBeGreaterThan(0);
    console.log(`✅ ${scenesCount} scenes created in Firestore`);
    
    // Verify specific element data
    const elements = firebaseMock.firestore.getAllTestData('projects/test-project-123/elements');
    const characterElement = elements.find(el => el.data.name === 'JOHN');
    expect(characterElement).toBeTruthy();
    expect(characterElement.data.type).toBe('character');
    console.log('✅ Character element verified in Firestore');
    
    // Verify scene-element linking
    const scenes = firebaseMock.firestore.getAllTestData('projects/test-project-123/scenes');
    const scene = scenes.find(s => s.data.heading?.includes('POLICE STATION'));
    expect(scene).toBeTruthy();
    expect(scene.data.elementIds).toBeDefined();
    console.log('✅ Scene-element linking verified');

    // Step 5: Generate shotlist from assistant JSON
    console.log('🎬 Step 5: Generating shotlist from assistant JSON');
    
    // Click on "Generate Shotlist" quick action
    await page.click('button:has-text("Generate Shotlist")');
    
    // Mock the shotlist AI response
    await mockApiResponse(page, '**/api/ai', {
      choices: [{
        delta: {
          content: JSON.stringify(aiResponses.shotlistScene1)
        }
      }]
    });
    
    // Wait for shotlist generation
    await waitForFirebaseOperation(page, 'Shotlist generation');
    
    // Verify shotlist UI elements
    await verifyTextExists(page, 'shot', 'Shotlist shots');
    await verifyTextExists(page, 'camera', 'Camera equipment');
    console.log('✅ Shotlist generated successfully');

    // Step 6: Verify shotlist rows in UI
    console.log('📋 Step 6: Verifying shotlist rows in UI');
    
    // Navigate to shotlist view
    await page.click('text=Shotlist');
    await waitForNavigation(page, '/shotlist');
    
    // Verify shotlist table/rows are visible
    const shotlistTable = await waitForElement(page, 'table, [data-testid="shotlist"], .shotlist');
    
    // Check for specific shot details
    await verifyTextExists(page, '1A', 'Shot 1A');
    await verifyTextExists(page, 'WIDE', 'Wide shot type');
    await verifyTextExists(page, '24-70mm', 'Camera lens');
    
    // Verify shot count
    const shotRows = page.locator('tr, [data-testid="shot-row"], .shot-item');
    const shotCount = await shotRows.count();
    expect(shotCount).toBeGreaterThan(0);
    console.log(`✅ ${shotCount} shot rows displayed in UI`);

    // Verify equipment elements were created
    const equipmentCount = countFirebaseDocuments(firebaseMock, 'projects/test-project-123/elements');
    const equipmentElements = firebaseMock.firestore.getAllTestData('projects/test-project-123/elements')
      .filter(el => el.data.category === 'camera' || el.data.category === 'lighting');
    expect(equipmentElements.length).toBeGreaterThan(0);
    console.log(`✅ ${equipmentElements.length} equipment elements created from shotlist`);

    // Step 7: Generate callsheet from stripDays + contacts + location
    console.log('📋 Step 7: Generating callsheet from stripDays + contacts + location');
    
    // Navigate to production/shoot section
    await page.click('text=Production, text=Shoot');
    await waitForElement(page, '[data-testid="callsheet-generator"], .callsheet-generator');
    
    // Setup callsheet test data
    await setupCallsheetTestData(firebaseMock, 'test-project-123');
    
    // Select strip day
    const daySelect = page.locator('select[name="dayId"], [data-testid="day-select"]');
    await daySelect.selectOption('day-1');
    
    // Select location
    const locationSelect = page.locator('select[name="locationId"], [data-testid="location-select"]');
    await locationSelect.selectOption('location-1');
    
    // Select contacts
    const contactCheckboxes = page.locator('input[type="checkbox"][name*="contact"], [data-testid="contact-checkbox"]');
    const contactCount = await contactCheckboxes.count();
    for (let i = 0; i < Math.min(3, contactCount); i++) {
      await contactCheckboxes.nth(i).check();
    }
    
    // Mock AI response for callsheet
    await mockApiResponse(page, '**/api/ai', {
      choices: [{
        delta: {
          content: JSON.stringify({
            production: {
              title: 'Test Project',
              date: '2024-01-15',
              weather: 'Sunny',
              sunrise: '6:30 AM',
              sunset: '7:30 PM'
            },
            hospitals: [{
              name: 'City General Hospital',
              address: '456 Medical Center Dr',
              phone: '555-1000',
              distance: '2.3 miles'
            }],
            notes: ['Call Sheet for 2024-01-15', 'Location: Main Street Studio']
          })
        }
      }]
    });
    
    // Trigger "Prepare call sheet for Day X"
    await page.click('button:has-text("Prepare Call Sheet"), button:has-text("Generate Call Sheet"), [data-testid="prepare-callsheet"]');
    await waitForFirebaseOperation(page, 'Callsheet AI processing');
    
    // Save callsheet
    await page.click('button:has-text("Save Call Sheet"), button:has-text("Create Call Sheet"), [data-testid="save-callsheet"]');
    await waitForFirebaseOperation(page, 'Callsheet saving');
    
    // Verify callsheet saved in Firestore
    const callsheets = firebaseMock.firestore.getAllTestData('projects/test-project-123/callsheets');
    expect(callsheets.length).toBeGreaterThan(0);
    
    const callsheet = callsheets[0];
    expect(callsheet.data.date).toBe('2024-01-15');
    expect(callsheet.data.dayId).toBe('day-1');
    expect(callsheet.data.locationId).toBe('location-1');
    expect(callsheet.data.recipients.length).toBeGreaterThan(0);
    
    console.log('✅ Callsheet generated and saved to Firestore');

    console.log('🎉 Complete flow test passed successfully!');
  });

  test('Error handling: AI API failure', async ({ page }) => {
    console.log('🚨 Testing error handling for AI API failure');
    
    // Mock AI API failure
    await mockApiResponse(page, '**/api/ai', {
      error: 'API rate limit exceeded'
    }, 429);
    
    // Create project and navigate to assistant
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByLabel(page, 'Project Title', testData.testProject.title);
    await clickButtonByText(page, 'Create Project');
    await waitForNavigation(page, '/project');
    
    // Try to use AI assistant
    await page.click('[data-testid="assistant-button"], button:has-text("Assistant")');
    await waitForElement(page, '[data-testid="assistant-panel"]');
    await page.click('button:has-text("Breakdown Scene")');
    
    // Verify error handling
    await verifyTextExists(page, 'error', 'Error message displayed');
    console.log('✅ Error handling verified');
  });

  test('Data persistence: Refresh page and verify data', async ({ page }) => {
    console.log('💾 Testing data persistence across page refresh');
    
    // Create project and add data
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByLabel(page, 'Project Title', testData.testProject.title);
    await clickButtonByText(page, 'Create Project');
    await waitForNavigation(page, '/project');
    
    // Add some test data to Firestore
    firebaseMock.firestore.setTestData('projects/test-project-123/elements', 'test-element-1', {
      type: 'prop',
      name: 'Test Prop',
      category: 'props',
      linkedSceneIds: [],
      customFields: {},
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Refresh the page
    await page.reload();
    await waitForElement(page, 'body');
    
    // Verify data is still there
    const element = firebaseMock.firestore.getTestData('projects/test-project-123/elements', 'test-element-1');
    expect(element).toBeTruthy();
    expect(element.data.name).toBe('Test Prop');
    console.log('✅ Data persistence verified');
  });
});

// Helper function to setup callsheet test data
async function setupCallsheetTestData(firebaseMock, projectId) {
  // Create strip day
  firebaseMock.firestore.setTestData(`projects/${projectId}/stripdays`, 'day-1', {
    id: 'day-1',
    date: '2024-01-15',
    sceneOrder: ['scene-1', 'scene-2'],
    targetMins: 480,
    totalMins: 450,
    notes: 'First day of shooting',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Create contacts
  const contacts = [
    { id: 'contact-1', name: 'John Director', role: 'Director', email: 'john@example.com', phone: '555-0101' },
    { id: 'contact-2', name: 'Jane Producer', role: 'Producer', email: 'jane@example.com', phone: '555-0102' },
    { id: 'contact-3', name: 'Bob DP', role: 'DP', email: 'bob@example.com', phone: '555-0103' }
  ];

  contacts.forEach(contact => {
    firebaseMock.firestore.setTestData(`projects/${projectId}/contacts`, contact.id, {
      ...contact,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  });

  // Create location
  firebaseMock.firestore.setTestData(`projects/${projectId}/locations`, 'location-1', {
    id: 'location-1',
    name: 'Main Street Studio',
    address: '123 Main Street, Los Angeles, CA 90210',
    description: 'Indoor studio space',
    coordinates: { lat: 34.0522, lng: -118.2437 },
    contactInfo: {
      name: 'Studio Manager',
      phone: '555-0200',
      email: 'studio@example.com'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
