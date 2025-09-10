// @ts-check
const { test, expect } = require('@playwright/test');
const { setupFirebaseMocks, cleanupFirebaseMocks } = require('../utils/firebase-mock');
const { 
  waitForElement, 
  waitForText, 
  fillFieldByLabel, 
  clickButtonByText, 
  mockApiResponse, 
  verifyElementVisible, 
  verifyTextExists,
  waitForToast,
  takeDebugScreenshot
} = require('../utils/test-helpers');
const testConfig = require('../config/test-config');

test.describe('Example Test Usage', () => {
  let firebaseMock;

  test.beforeEach(async ({ page }) => {
    // Setup Firebase mocks
    firebaseMock = setupFirebaseMocks();
    
    // Mock authenticated user
    await page.addInitScript(() => {
      window.mockFirebase = {
        auth: {
          currentUser: testConfig.testData.user
        }
      };
    });

    await page.goto('/');
    await waitForElement(page, 'body');
  });

  test.afterEach(async () => {
    cleanupFirebaseMocks();
  });

  test('Example: Complete project workflow', async ({ page }) => {
    console.log('📚 Example: Complete project workflow test');
    
    // Step 1: Create a project using test configuration
    console.log('1️⃣ Creating project with test data');
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByLabel(page, 'Project Title', testConfig.testData.project.title);
    await fillFieldByLabel(page, 'Logline', testConfig.testData.project.logline);
    await page.selectOption('select[name="genre"]', testConfig.testData.project.genre);
    await clickButtonByText(page, 'Create Project');
    
    // Verify navigation
    await page.waitForURL(url => url.pathname.includes('/project'));
    console.log('✅ Project created and navigated');

    // Step 2: Add script content
    console.log('2️⃣ Adding script content');
    await page.click('text=Script Management');
    await waitForElement(page, testConfig.selectors.scriptEditor);
    
    const scriptEditor = page.locator(testConfig.selectors.scriptEditor).first();
    await scriptEditor.fill(testConfig.testData.script.content);
    
    // Save script
    const saveButton = page.locator(testConfig.selectors.saveButton);
    if (await saveButton.isVisible()) {
      await saveButton.click();
      await waitForToast(page, 'saved', testConfig.timeouts.element);
    }
    console.log('✅ Script content added');

    // Step 3: Use AI assistant
    console.log('3️⃣ Using AI assistant for breakdown');
    
    // Mock AI response
    await mockApiResponse(page, testConfig.mocks.aiApi.url, {
      choices: [{
        delta: {
          content: JSON.stringify(testConfig.aiResponses.breakdownScene1)
        }
      }]
    });
    
    // Open assistant
    await page.click(testConfig.selectors.assistantButton);
    await waitForElement(page, testConfig.selectors.assistantPanel);
    
    // Trigger breakdown
    await page.click(testConfig.selectors.breakdownButton);
    
    // Wait for processing
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll(testConfig.selectors.loadingIndicator);
      return loadingElements.length === 0;
    }, { timeout: testConfig.timeouts.firebase });
    
    console.log('✅ AI breakdown completed');

    // Step 4: Verify Firestore data
    console.log('4️⃣ Verifying Firestore data');
    
    const elements = firebaseMock.firestore.getAllTestData('projects/test-project-123/elements');
    expect(elements.length).toBeGreaterThan(0);
    
    const johnElement = elements.find(el => el.data.name === 'JOHN');
    expect(johnElement).toBeTruthy();
    expect(johnElement.data.type).toBe('character');
    
    console.log(`✅ ${elements.length} elements created in Firestore`);

    // Step 5: Generate shotlist
    console.log('5️⃣ Generating shotlist');
    
    // Mock shotlist response
    await mockApiResponse(page, testConfig.mocks.aiApi.url, {
      choices: [{
        delta: {
          content: JSON.stringify(testConfig.aiResponses.shotlistScene1)
        }
      }]
    });
    
    await page.click(testConfig.selectors.shotlistButton);
    await page.waitForFunction(() => {
      const loadingElements = document.querySelectorAll(testConfig.selectors.loadingIndicator);
      return loadingElements.length === 0;
    }, { timeout: testConfig.timeouts.firebase });
    
    console.log('✅ Shotlist generated');

    // Step 6: Verify UI elements
    console.log('6️⃣ Verifying UI elements');
    
    await page.click('text=Shotlist');
    await waitForElement(page, 'table, [data-testid="shotlist"]');
    
    await verifyTextExists(page, '1A', 'Shot 1A');
    await verifyTextExists(page, 'WIDE', 'Wide shot type');
    
    console.log('✅ UI verification completed');

    console.log('🎉 Example test completed successfully!');
  });

  test('Example: Error handling and edge cases', async ({ page }) => {
    console.log('📚 Example: Error handling test');
    
    // Test API failure
    await mockApiResponse(page, testConfig.mocks.aiApi.url, {
      error: 'API rate limit exceeded'
    }, 429);
    
    await page.click(testConfig.selectors.assistantButton);
    await waitForElement(page, testConfig.selectors.assistantPanel);
    await page.click(testConfig.selectors.breakdownButton);
    
    // Should show error
    await verifyTextExists(page, 'error', 'Error message');
    console.log('✅ Error handling verified');

    // Test form validation
    await page.click('button:has-text("Create New Project")');
    await page.click('button:has-text("Create Project")'); // Submit empty form
    
    await verifyTextExists(page, 'required', 'Validation error');
    console.log('✅ Form validation verified');
  });

  test('Example: Debugging with screenshots', async ({ page }) => {
    console.log('📚 Example: Debugging test');
    
    // Take screenshot at different stages
    await takeDebugScreenshot(page, 'initial-load');
    
    await page.click('button:has-text("Create New Project")');
    await takeDebugScreenshot(page, 'create-project-dialog');
    
    await fillFieldByLabel(page, 'Project Title', 'Debug Test Project');
    await takeDebugScreenshot(page, 'form-filled');
    
    await clickButtonByText(page, 'Create Project');
    await takeDebugScreenshot(page, 'project-created');
    
    console.log('✅ Debug screenshots captured');
  });

  test('Example: Custom test data and assertions', async ({ page }) => {
    console.log('📚 Example: Custom test data test');
    
    // Create custom test data
    const customProject = {
      title: 'Custom Test Project',
      logline: 'A custom test story',
      genre: 'comedy',
      format: 'feature'
    };
    
    // Create project with custom data
    await clickButtonByText(page, 'Create New Project');
    await fillFieldByLabel(page, 'Project Title', customProject.title);
    await fillFieldByLabel(page, 'Logline', customProject.logline);
    await page.selectOption('select[name="genre"]', customProject.genre);
    await page.selectOption('select[name="format"]', customProject.format);
    await clickButtonByText(page, 'Create Project');
    
    // Verify custom data was used
    await page.waitForURL(url => url.pathname.includes('/project'));
    await verifyTextExists(page, customProject.title, 'Custom project title');
    
    // Verify Firestore data
    const projects = firebaseMock.firestore.getAllTestData('projects');
    const project = projects.find(p => p.data.name === customProject.title);
    expect(project).toBeTruthy();
    expect(project.data.genre).toBe(customProject.genre);
    expect(project.data.format).toBe(customProject.format);
    
    console.log('✅ Custom test data verified');
  });
});
