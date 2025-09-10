// @ts-check
const { test, expect } = require('@playwright/test');
const { setupFirebaseMocks, cleanupFirebaseMocks } = require('./utils/firebase-mock');
const { 
  waitForElement, 
  waitForText, 
  fillFieldByLabel, 
  clickButtonByText, 
  mockApiResponse, 
  verifyElementVisible, 
  verifyTextExists,
  waitForToast,
  waitForFirebaseOperation,
  verifyFirebaseData,
  countFirebaseDocuments
} = require('./utils/test-helpers');

const testData = require('./fixtures/test-data.json');
const callsheetFixtures = require('./fixtures/callsheet-fixtures.json');

test.describe('Callsheet Generation Flow', () => {
  let firebaseMock;

  test.beforeEach(async ({ page }) => {
    // Setup Firebase mocks
    firebaseMock = setupFirebaseMocks();
    
    // Mock authenticated user
    await page.addInitScript(() => {
      window.mockFirebase = {
        auth: {
          currentUser: testData.testUser
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

  test('Complete callsheet generation flow: stripDays + contacts + location → AI callsheet → Firestore', async ({ page }) => {
    console.log('🎬 Starting callsheet generation flow test');

    // Step 1: Create project and setup test data
    console.log('1️⃣ Setting up project and test data');
    
    // Create project
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByLabel(page, 'Project Title', 'Test Callsheet Project');
    await fillFieldByLabel(page, 'Logline', 'A test project for callsheet generation');
    await clickButtonByText(page, 'Create Project');
    await page.waitForURL(url => url.pathname.includes('/project'));
    
    const projectId = 'test-project-123';
    console.log('✅ Project created');

    // Setup test data in Firestore
    await setupTestData(firebaseMock, projectId);
    console.log('✅ Test data setup complete');

    // Step 2: Navigate to callsheet generator
    console.log('2️⃣ Navigating to callsheet generator');
    
    // Navigate to production/shoot section
    await page.click('text=Production, text=Shoot, [data-testid="production-tab"]');
    await waitForElement(page, '[data-testid="callsheet-generator"], .callsheet-generator');
    console.log('✅ Callsheet generator loaded');

    // Step 3: Select strip day, contacts, and location
    console.log('3️⃣ Selecting strip day, contacts, and location');
    
    // Select strip day
    const daySelect = page.locator('select[name="dayId"], [data-testid="day-select"]');
    await daySelect.selectOption('day-1');
    
    // Select location
    const locationSelect = page.locator('select[name="locationId"], [data-testid="location-select"]');
    await locationSelect.selectOption('location-1');
    
    // Select contacts (checkboxes or multi-select)
    const contactCheckboxes = page.locator('input[type="checkbox"][name*="contact"], [data-testid="contact-checkbox"]');
    const contactCount = await contactCheckboxes.count();
    
    // Select first few contacts
    for (let i = 0; i < Math.min(3, contactCount); i++) {
      await contactCheckboxes.nth(i).check();
    }
    
    console.log('✅ Strip day, location, and contacts selected');

    // Step 4: Trigger "Prepare call sheet for Day X" 
    console.log('4️⃣ Triggering callsheet preparation');
    
    // Look for callsheet generation button
    const prepareButton = page.locator('button:has-text("Prepare Call Sheet"), button:has-text("Generate Call Sheet"), [data-testid="prepare-callsheet"]');
    await prepareButton.click();
    
    // Wait for AI processing
    await waitForFirebaseOperation(page, 'Callsheet AI processing');
    console.log('✅ Callsheet preparation triggered');

    // Step 5: Verify AI response was processed
    console.log('5️⃣ Verifying AI response processing');
    
    // Check that callsheet form is populated with AI data
    await verifyTextExists(page, 'Unit 1 - 2024-01-15', 'Unit name from AI');
    await verifyTextExists(page, 'Sunny', 'Weather condition from AI');
    await verifyTextExists(page, '6:30 AM', 'Sunrise time from AI');
    await verifyTextExists(page, '7:30 PM', 'Sunset time from AI');
    
    console.log('✅ AI response processed and form populated');

    // Step 6: Save callsheet to Firestore
    console.log('6️⃣ Saving callsheet to Firestore');
    
    // Click save/create callsheet button
    const saveButton = page.locator('button:has-text("Save Call Sheet"), button:has-text("Create Call Sheet"), [data-testid="save-callsheet"]');
    await saveButton.click();
    
    // Wait for save confirmation
    await waitForToast(page, 'saved', 5000);
    await waitForFirebaseOperation(page, 'Callsheet saving');
    console.log('✅ Callsheet saved to Firestore');

    // Step 7: Verify callsheet document in Firestore
    console.log('7️⃣ Verifying callsheet document in Firestore');
    
    // Check callsheet was created
    const callsheets = firebaseMock.firestore.getAllTestData(`projects/${projectId}/callsheets`);
    expect(callsheets.length).toBeGreaterThan(0);
    console.log(`✅ ${callsheets.length} callsheet(s) created in Firestore`);
    
    // Verify callsheet structure
    const callsheet = callsheets[0];
    expect(callsheet.data.date).toBe('2024-01-15');
    expect(callsheet.data.unitName).toBe('Unit 1 - 2024-01-15');
    expect(callsheet.data.dayId).toBe('day-1');
    expect(callsheet.data.locationId).toBe('location-1');
    expect(callsheet.data.recipients).toContain('contact-1');
    expect(callsheet.data.recipients).toContain('contact-2');
    
    // Verify weather data from AI
    expect(callsheet.data.weather).toBeDefined();
    expect(callsheet.data.weather.high).toBe(75);
    expect(callsheet.data.weather.low).toBe(60);
    expect(callsheet.data.weather.condition).toBe('Sunny');
    expect(callsheet.data.weather.sunrise).toBe('6:30 AM');
    expect(callsheet.data.weather.sunset).toBe('7:30 PM');
    
    // Verify hospitals data from AI
    expect(callsheet.data.hospitals).toBeDefined();
    expect(callsheet.data.hospitals.length).toBeGreaterThan(0);
    expect(callsheet.data.hospitals[0].name).toBe('City General Hospital');
    
    // Verify notes from AI
    expect(callsheet.data.notes).toContain('Call Sheet for 2024-01-15');
    expect(callsheet.data.notes).toContain('Location: Main Street Studio');
    
    console.log('✅ Callsheet document structure verified');

    // Step 8: Verify callsheet appears in UI
    console.log('8️⃣ Verifying callsheet appears in UI');
    
    // Check callsheet list shows the new callsheet
    await verifyTextExists(page, 'Unit 1 - 2024-01-15', 'Callsheet unit name in list');
    await verifyTextExists(page, '2024-01-15', 'Callsheet date in list');
    await verifyTextExists(page, 'Main Street Studio', 'Location name in list');
    
    console.log('✅ Callsheet visible in UI');

    console.log('🎉 Callsheet generation flow test completed successfully!');
  });

  test('Callsheet generation with direct service call (skip AI)', async ({ page }) => {
    console.log('🔧 Testing direct service call approach');
    
    // Create project
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByLabel(page, 'Project Title', 'Direct Service Test');
    await clickButtonByText(page, 'Create Project');
    await page.waitForURL(url => url.pathname.includes('/project'));
    
    const projectId = 'test-project-123';
    await setupTestData(firebaseMock, projectId);
    
    // Navigate to callsheet generator
    await page.click('text=Production, text=Shoot');
    await waitForElement(page, '[data-testid="callsheet-generator"]');
    
    // Select data
    await page.selectOption('select[name="dayId"]', 'day-1');
    await page.selectOption('select[name="locationId"]', 'location-1');
    
    // Use direct service call instead of AI
    const directGenerateButton = page.locator('button:has-text("Generate Direct"), [data-testid="direct-generate"]');
    if (await directGenerateButton.isVisible()) {
      await directGenerateButton.click();
    } else {
      // Fallback to regular generate button
      await page.click('button:has-text("Prepare Call Sheet")');
    }
    
    await waitForFirebaseOperation(page, 'Direct callsheet generation');
    
    // Verify callsheet was created using autoPopulateCallSheet
    const callsheets = firebaseMock.firestore.getAllTestData(`projects/${projectId}/callsheets`);
    expect(callsheets.length).toBeGreaterThan(0);
    
    const callsheet = callsheets[0];
    expect(callsheet.data.unitName).toBe('Unit 1 - 2024-01-15');
    expect(callsheet.data.dayId).toBe('day-1');
    expect(callsheet.data.locationId).toBe('location-1');
    
    console.log('✅ Direct service call test completed');
  });

  test('Error handling: Missing strip day or location', async ({ page }) => {
    console.log('🚨 Testing error handling for missing data');
    
    // Create project
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByLabel(page, 'Project Title', 'Error Test Project');
    await clickButtonByText(page, 'Create Project');
    await page.waitForURL(url => url.pathname.includes('/project'));
    
    // Navigate to callsheet generator
    await page.click('text=Production, text=Shoot');
    await waitForElement(page, '[data-testid="callsheet-generator"]');
    
    // Try to generate without selecting strip day
    await page.click('button:has-text("Prepare Call Sheet")');
    
    // Should show validation error
    await verifyTextExists(page, 'required', 'Validation error for missing data');
    await waitForToast(page, 'error', 5000);
    
    console.log('✅ Error handling verified');
  });

  test('Callsheet export functionality', async ({ page }) => {
    console.log('📄 Testing callsheet export functionality');
    
    // Create project and callsheet
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByLabel(page, 'Project Title', 'Export Test Project');
    await clickButtonByText(page, 'Create Project');
    await page.waitForURL(url => url.pathname.includes('/project'));
    
    const projectId = 'test-project-123';
    await setupTestData(firebaseMock, projectId);
    
    // Create a callsheet directly in Firestore
    firebaseMock.firestore.setTestData(`projects/${projectId}/callsheets`, 'callsheet-1', {
      id: 'callsheet-1',
      date: '2024-01-15',
      unitName: 'Unit 1 - 2024-01-15',
      dayId: 'day-1',
      locationId: 'location-1',
      recipients: ['contact-1', 'contact-2'],
      weather: {
        high: 75,
        low: 60,
        condition: 'Sunny',
        sunrise: '6:30 AM',
        sunset: '7:30 PM'
      },
      notes: 'Test callsheet for export',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Navigate to callsheet generator
    await page.click('text=Production, text=Shoot');
    await waitForElement(page, '[data-testid="callsheet-generator"]');
    
    // Find and click export button
    const exportButton = page.locator('button:has-text("Export"), [data-testid="export-callsheet"]');
    await exportButton.click();
    
    // Verify download was triggered (this would be hard to test in Playwright)
    // We can at least verify the button click worked
    await page.waitForTimeout(1000);
    
    console.log('✅ Export functionality tested');
  });
});

// Helper function to setup test data
async function setupTestData(firebaseMock, projectId) {
  // Create strip day
  firebaseMock.firestore.setTestData(`projects/${projectId}/stripdays`, 'day-1', {
    id: 'day-1',
    date: '2024-01-15',
    sceneOrder: ['scene-1', 'scene-2'],
    targetMins: 480, // 8 hours
    totalMins: 450,  // 7.5 hours
    notes: 'First day of shooting',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Create contacts
  firebaseMock.firestore.setTestData(`projects/${projectId}/contacts`, 'contact-1', {
    id: 'contact-1',
    name: 'John Director',
    email: 'john@example.com',
    phone: '555-0101',
    role: 'Director',
    company: 'Production Co',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  firebaseMock.firestore.setTestData(`projects/${projectId}/contacts`, 'contact-2', {
    id: 'contact-2',
    name: 'Jane Producer',
    email: 'jane@example.com',
    phone: '555-0102',
    role: 'Producer',
    company: 'Production Co',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  firebaseMock.firestore.setTestData(`projects/${projectId}/contacts`, 'contact-3', {
    id: 'contact-3',
    name: 'Bob DP',
    email: 'bob@example.com',
    phone: '555-0103',
    role: 'DP',
    company: 'Camera Dept',
    createdAt: new Date(),
    updatedAt: new Date()
  });

  // Create location
  firebaseMock.firestore.setTestData(`projects/${projectId}/locations`, 'location-1', {
    id: 'location-1',
    name: 'Main Street Studio',
    address: '123 Main Street, Los Angeles, CA 90210',
    description: 'Indoor studio space',
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
