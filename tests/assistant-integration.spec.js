// @ts-check
const { test, expect } = require('@playwright/test');
const { setupFirebaseMocks, cleanupFirebaseMocks } = require('./utils/firebase-mock');
const { 
  waitForElement, 
  mockApiResponse, 
  waitForFirebaseOperation, 
  verifyTextExists,
  waitForToast
} = require('./utils/test-helpers');

const aiResponses = require('./fixtures/ai-responses.json');

test.describe('AI Assistant Integration Tests', () => {
  let firebaseMock;

  test.beforeEach(async ({ page }) => {
    firebaseMock = setupFirebaseMocks();
    
    // Mock authenticated user
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

  test('Assistant breakdown creates correct Firestore structure', async ({ page }) => {
    // Mock AI response for breakdown
    await mockApiResponse(page, '**/api/ai', {
      choices: [{
        delta: {
          content: JSON.stringify(aiResponses.breakdownScene1)
        }
      }]
    });

    // Navigate to assistant
    await page.click('[data-testid="assistant-button"], button:has-text("Assistant")');
    await waitForElement(page, '[data-testid="assistant-panel"]');
    
    // Trigger breakdown
    await page.click('button:has-text("Breakdown Scene")');
    await waitForFirebaseOperation(page, 'Breakdown processing');

    // Verify elements were created with correct structure
    const elements = firebaseMock.firestore.getAllTestData('projects/test-project-123/elements');
    
    // Check for character element
    const johnElement = elements.find(el => el.data.name === 'JOHN');
    expect(johnElement).toBeTruthy();
    expect(johnElement.data.type).toBe('character');
    expect(johnElement.data.priority).toBe('high');
    
    // Check for prop element
    const badgeElement = elements.find(el => el.data.name === 'Detective Badge');
    expect(badgeElement).toBeTruthy();
    expect(badgeElement.data.type).toBe('prop');
    expect(badgeElement.data.estimatedCost).toBe(25);
    
    // Check for location element
    const locationElement = elements.find(el => el.data.name === 'Police Station');
    expect(locationElement).toBeTruthy();
    expect(locationElement.data.type).toBe('location');
  });

  test('Assistant shotlist generation creates equipment elements', async ({ page }) => {
    // Mock AI response for shotlist
    await mockApiResponse(page, '**/api/ai', {
      choices: [{
        delta: {
          content: JSON.stringify(aiResponses.shotlistScene1)
        }
      }]
    });

    await page.click('[data-testid="assistant-button"], button:has-text("Assistant")');
    await waitForElement(page, '[data-testid="assistant-panel"]');
    
    // Trigger shotlist generation
    await page.click('button:has-text("Generate Shotlist")');
    await waitForFirebaseOperation(page, 'Shotlist generation');

    // Verify equipment elements were created
    const elements = firebaseMock.firestore.getAllTestData('projects/test-project-123/elements');
    const cameraElements = elements.filter(el => el.data.category === 'camera');
    const lightingElements = elements.filter(el => el.data.category === 'lighting');
    
    expect(cameraElements.length).toBeGreaterThan(0);
    expect(lightingElements.length).toBeGreaterThan(0);
    
    // Check specific camera equipment
    const cameraElement = cameraElements.find(el => el.data.name.includes('24-70mm'));
    expect(cameraElement).toBeTruthy();
    expect(cameraElement.data.customFields.lens).toBe('24-70mm');
    expect(cameraElement.data.customFields.shotNumber).toBe('1A');
  });

  test('Assistant handles invalid JSON response gracefully', async ({ page }) => {
    // Mock invalid AI response
    await mockApiResponse(page, '**/api/ai', {
      choices: [{
        delta: {
          content: 'This is not valid JSON'
        }
      }]
    });

    await page.click('[data-testid="assistant-button"], button:has-text("Assistant")');
    await waitForElement(page, '[data-testid="assistant-panel"]');
    
    await page.click('button:has-text("Breakdown Scene")');
    
    // Should show error message
    await verifyTextExists(page, 'error', 'Error handling for invalid JSON');
    await waitForToast(page, 'error', 5000);
  });

  test('Assistant streaming response is handled correctly', async ({ page }) => {
    // Mock streaming AI response
    let responseSent = false;
    await page.route('**/api/ai', async route => {
      if (!responseSent) {
        responseSent = true;
        // Simulate streaming response
        const response = {
          status: 200,
          headers: { 'Content-Type': 'text/event-stream' },
          body: `data: ${JSON.stringify({
            choices: [{
              delta: { content: JSON.stringify(aiResponses.breakdownScene1) }
            }]
          })}\n\ndata: [DONE]\n\n`
        };
        await route.fulfill(response);
      }
    });

    await page.click('[data-testid="assistant-button"], button:has-text("Assistant")');
    await waitForElement(page, '[data-testid="assistant-panel"]');
    
    await page.click('button:has-text("Breakdown Scene")');
    await waitForFirebaseOperation(page, 'Streaming response processing');

    // Verify response was processed
    const elements = firebaseMock.firestore.getAllTestData('projects/test-project-123/elements');
    expect(elements.length).toBeGreaterThan(0);
  });
});
