// @ts-check
const { test, expect } = require('@playwright/test');
const { setupFirebaseMocks, cleanupFirebaseMocks } = require('../utils/firebase-mock');
const { 
  waitForElement, 
  clickButtonByText, 
  fillFieldByLabel, 
  mockApiResponse, 
  verifyTextExists,
  waitForFirebaseOperation,
  verifyFirebaseData,
  countFirebaseDocuments
} = require('../utils/test-helpers');
const testConfig = require('../config/test-config');
const callsheetFixtures = require('../fixtures/callsheet-fixtures.json');

test.describe('Callsheet Generation Example', () => {
  let firebaseMock;

  test.beforeEach(async ({ page }) => {
    firebaseMock = setupFirebaseMocks();
    
    await page.addInitScript(() => {
      window.mockFirebase = {
        auth: {
          currentUser: testConfig.testData.user
        }
      };
    });

    // Mock AI API for callsheet generation
    await mockApiResponse(page, '**/api/ai', {
      choices: [{
        delta: {
          content: JSON.stringify(callsheetFixtures.aiCallsheetResponse)
        }
      }]
    });

    await page.goto('/');
    await waitForElement(page, 'body');
  });

  test.afterEach(async () => {
    cleanupFirebaseMocks();
  });

  test('Example: Complete callsheet generation workflow', async ({ page }) => {
    console.log('📋 Example: Complete callsheet generation workflow');
    
    // Step 1: Create project
    console.log('1️⃣ Creating project');
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByLabel(page, 'Project Title', 'Callsheet Example Project');
    await fillFieldByLabel(page, 'Logline', 'Example project for callsheet generation');
    await clickButtonByText(page, 'Create Project');
    await page.waitForURL(url => url.pathname.includes('/project'));
    console.log('✅ Project created');

    // Step 2: Setup test data
    console.log('2️⃣ Setting up test data');
    const projectId = 'test-project-123';
    await setupCallsheetTestData(firebaseMock, projectId);
    console.log('✅ Test data setup complete');

    // Step 3: Navigate to callsheet generator
    console.log('3️⃣ Navigating to callsheet generator');
    await page.click('text=Production, text=Shoot');
    await waitForElement(page, testConfig.selectors.callsheetGenerator);
    console.log('✅ Callsheet generator loaded');

    // Step 4: Select strip day
    console.log('4️⃣ Selecting strip day');
    const daySelect = page.locator(testConfig.selectors.daySelect);
    await daySelect.selectOption(testConfig.testData.callsheet.stripDay.id);
    console.log('✅ Strip day selected');

    // Step 5: Select location
    console.log('5️⃣ Selecting location');
    const locationSelect = page.locator(testConfig.selectors.locationSelect);
    await locationSelect.selectOption(testConfig.testData.callsheet.location.id);
    console.log('✅ Location selected');

    // Step 6: Select contacts
    console.log('6️⃣ Selecting contacts');
    const contactCheckboxes = page.locator(testConfig.selectors.contactCheckbox);
    const contactCount = await contactCheckboxes.count();
    
    // Select all available contacts
    for (let i = 0; i < contactCount; i++) {
      await contactCheckboxes.nth(i).check();
    }
    console.log(`✅ ${contactCount} contacts selected`);

    // Step 7: Generate callsheet with AI
    console.log('7️⃣ Generating callsheet with AI');
    const prepareButton = page.locator(testConfig.selectors.prepareCallsheetButton);
    await prepareButton.click();
    
    // Wait for AI processing
    await waitForFirebaseOperation(page, 'AI callsheet generation');
    console.log('✅ AI callsheet generation completed');

    // Step 8: Verify AI data populated form
    console.log('8️⃣ Verifying AI data populated form');
    await verifyTextExists(page, 'Unit 1 - 2024-01-15', 'Unit name from AI');
    await verifyTextExists(page, 'Sunny', 'Weather condition from AI');
    await verifyTextExists(page, '6:30 AM', 'Sunrise time from AI');
    await verifyTextExists(page, '7:30 PM', 'Sunset time from AI');
    await verifyTextExists(page, 'City General Hospital', 'Hospital from AI');
    console.log('✅ AI data verified in form');

    // Step 9: Save callsheet
    console.log('9️⃣ Saving callsheet to Firestore');
    const saveButton = page.locator(testConfig.selectors.saveCallsheetButton);
    await saveButton.click();
    
    await waitForFirebaseOperation(page, 'Callsheet saving');
    console.log('✅ Callsheet saved to Firestore');

    // Step 10: Verify Firestore document
    console.log('🔟 Verifying Firestore document');
    const callsheets = firebaseMock.firestore.getAllTestData(`projects/${projectId}/callsheets`);
    expect(callsheets.length).toBeGreaterThan(0);
    
    const callsheet = callsheets[0];
    
    // Verify basic structure
    expect(callsheet.data.date).toBe('2024-01-15');
    expect(callsheet.data.unitName).toBe('Unit 1 - 2024-01-15');
    expect(callsheet.data.dayId).toBe('day-1');
    expect(callsheet.data.locationId).toBe('location-1');
    
    // Verify recipients
    expect(callsheet.data.recipients).toContain('contact-1');
    expect(callsheet.data.recipients).toContain('contact-2');
    expect(callsheet.data.recipients).toContain('contact-3');
    
    // Verify weather data from AI
    expect(callsheet.data.weather).toBeDefined();
    expect(callsheet.data.weather.high).toBe(75);
    expect(callsheet.data.weather.low).toBe(60);
    expect(callsheet.data.weather.condition).toBe('Sunny');
    expect(callsheet.data.weather.sunrise).toBe('6:30 AM');
    expect(callsheet.data.weather.sunset).toBe('7:30 PM');
    
    // Verify hospitals from AI
    expect(callsheet.data.hospitals).toBeDefined();
    expect(callsheet.data.hospitals.length).toBeGreaterThan(0);
    expect(callsheet.data.hospitals[0].name).toBe('City General Hospital');
    expect(callsheet.data.hospitals[0].phone).toBe('555-1000');
    
    // Verify notes contain expected content
    expect(callsheet.data.notes).toContain('Call Sheet for 2024-01-15');
    expect(callsheet.data.notes).toContain('Location: Main Street Studio');
    expect(callsheet.data.notes).toContain('Scenes: 2 scenes scheduled');
    
    console.log('✅ Firestore document structure verified');

    // Step 11: Verify UI display
    console.log('1️⃣1️⃣ Verifying UI display');
    await verifyTextExists(page, 'Unit 1 - 2024-01-15', 'Callsheet in list');
    await verifyTextExists(page, '2024-01-15', 'Date in list');
    await verifyTextExists(page, 'Main Street Studio', 'Location in list');
    console.log('✅ UI display verified');

    console.log('🎉 Callsheet generation example completed successfully!');
  });

  test('Example: Direct service call (skip AI)', async ({ page }) => {
    console.log('🔧 Example: Direct service call approach');
    
    // Create project and setup data
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByLabel(page, 'Project Title', 'Direct Service Example');
    await clickButtonByText(page, 'Create Project');
    await page.waitForURL(url => url.pathname.includes('/project'));
    
    const projectId = 'test-project-123';
    await setupCallsheetTestData(firebaseMock, projectId);
    
    // Navigate to callsheet generator
    await page.click('text=Production, text=Shoot');
    await waitForElement(page, testConfig.selectors.callsheetGenerator);
    
    // Select data
    await page.selectOption(testConfig.selectors.daySelect, 'day-1');
    await page.selectOption(testConfig.selectors.locationSelect, 'location-1');
    
    // Use direct service call (autoPopulateCallSheet)
    const directButton = page.locator('button:has-text("Generate Direct"), [data-testid="direct-generate"]');
    if (await directButton.isVisible()) {
      await directButton.click();
    } else {
      // Fallback to regular generate
      await page.click(testConfig.selectors.prepareCallsheetButton);
    }
    
    await waitForFirebaseOperation(page, 'Direct callsheet generation');
    
    // Verify callsheet was created
    const callsheets = firebaseMock.firestore.getAllTestData(`projects/${projectId}/callsheets`);
    expect(callsheets.length).toBeGreaterThan(0);
    
    const callsheet = callsheets[0];
    expect(callsheet.data.unitName).toBe('Unit 1 - 2024-01-15');
    expect(callsheet.data.dayId).toBe('day-1');
    expect(callsheet.data.locationId).toBe('location-1');
    
    // Verify auto-populated recipients (based on roles)
    expect(callsheet.data.recipients.length).toBeGreaterThan(0);
    expect(callsheet.data.recipients).toContain('contact-1'); // Director
    expect(callsheet.data.recipients).toContain('contact-2'); // Producer
    expect(callsheet.data.recipients).toContain('contact-3'); // DP
    
    console.log('✅ Direct service call example completed');
  });

  test('Example: Error handling scenarios', async ({ page }) => {
    console.log('🚨 Example: Error handling scenarios');
    
    // Create project
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByText(page, 'Project Title', 'Error Handling Example');
    await clickButtonByText(page, 'Create Project');
    await page.waitForURL(url => url.pathname.includes('/project'));
    
    // Navigate to callsheet generator
    await page.click('text=Production, text=Shoot');
    await waitForElement(page, testConfig.selectors.callsheetGenerator);
    
    // Test 1: Missing strip day
    console.log('Testing missing strip day validation');
    await page.click(testConfig.selectors.prepareCallsheetButton);
    await verifyTextExists(page, 'required', 'Validation error for missing strip day');
    
    // Test 2: Missing location
    console.log('Testing missing location validation');
    await page.selectOption(testConfig.selectors.daySelect, 'day-1');
    await page.click(testConfig.selectors.prepareCallsheetButton);
    await verifyTextExists(page, 'required', 'Validation error for missing location');
    
    // Test 3: AI API failure
    console.log('Testing AI API failure');
    await mockApiResponse(page, '**/api/ai', { error: 'API Error' }, 500);
    await page.selectOption(testConfig.selectors.locationSelect, 'location-1');
    await page.click(testConfig.selectors.prepareCallsheetButton);
    await verifyTextExists(page, 'error', 'Error message for API failure');
    
    console.log('✅ Error handling examples completed');
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

  // Create contacts with different roles
  const contacts = [
    { id: 'contact-1', name: 'John Director', role: 'Director', email: 'john@example.com', phone: '555-0101' },
    { id: 'contact-2', name: 'Jane Producer', role: 'Producer', email: 'jane@example.com', phone: '555-0102' },
    { id: 'contact-3', name: 'Bob DP', role: 'DP', email: 'bob@example.com', phone: '555-0103' },
    { id: 'contact-4', name: 'Alice Sound', role: 'Sound', email: 'alice@example.com', phone: '555-0104' },
    { id: 'contact-5', name: 'Charlie Grip', role: 'Grip', email: 'charlie@example.com', phone: '555-0105' }
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
    description: 'Indoor studio space with full facilities',
    coordinates: {
      lat: 34.0522,
      lng: -118.2437
    },
    contactInfo: {
      name: 'Studio Manager',
      phone: '555-0200',
      email: 'studio@example.com'
    },
    createdAt: new Date(),
    updatedAt: new Date()
  });
}
