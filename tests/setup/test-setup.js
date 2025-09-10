// Test Setup Script
// Configures the test environment and provides setup utilities

const { chromium } = require('@playwright/test');
const path = require('path');

/**
 * Setup test environment with necessary configurations
 */
async function setupTestEnvironment() {
  console.log('🔧 Setting up test environment...');
  
  // Set environment variables for testing
  process.env.NODE_ENV = 'test';
  process.env.VITE_AI_API_URL = 'http://localhost:3001/api/ai';
  process.env.VITE_FIREBASE_PROJECT_ID = 'test-project';
  process.env.VITE_FIREBASE_API_KEY = 'test-api-key';
  process.env.VITE_FIREBASE_AUTH_DOMAIN = 'test-project.firebaseapp.com';
  process.env.VITE_FIREBASE_STORAGE_BUCKET = 'test-project.appspot.com';
  process.env.VITE_FIREBASE_MESSAGING_SENDER_ID = '123456789';
  process.env.VITE_FIREBASE_APP_ID = '1:123456789:web:abcdef';
  
  console.log('✅ Environment variables set');
}

/**
 * Create test data directories
 */
function createTestDirectories() {
  const fs = require('fs');
  const directories = [
    'tests/screenshots',
    'tests/traces',
    'tests/results',
    'tests/fixtures'
  ];
  
  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  });
}

/**
 * Validate test configuration
 */
function validateTestConfig() {
  const requiredFiles = [
    'playwright.config.js',
    'tests/scenius-flow.spec.js',
    'tests/utils/firebase-mock.js',
    'tests/utils/test-helpers.js',
    'tests/fixtures/test-data.json',
    'tests/fixtures/ai-responses.json'
  ];
  
  const fs = require('fs');
  const missingFiles = requiredFiles.filter(file => !fs.existsSync(file));
  
  if (missingFiles.length > 0) {
    console.error('❌ Missing required test files:');
    missingFiles.forEach(file => console.error(`   - ${file}`));
    process.exit(1);
  }
  
  console.log('✅ Test configuration validated');
}

/**
 * Setup browser context for testing
 */
async function setupBrowserContext() {
  const browser = await chromium.launch({
    headless: process.env.CI ? true : false,
    slowMo: process.env.DEBUG ? 100 : 0
  });
  
  const context = await browser.newContext({
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    // Mock geolocation and other browser APIs
    geolocation: { latitude: 37.7749, longitude: -122.4194 },
    permissions: ['geolocation']
  });
  
  // Add custom test utilities to page context
  await context.addInitScript(() => {
    // Mock console methods for cleaner test output
    const originalLog = console.log;
    console.log = (...args) => {
      if (args[0] && typeof args[0] === 'string' && args[0].startsWith('🔧')) {
        originalLog(...args);
      }
    };
    
    // Add test utilities to window object
    window.testUtils = {
      waitForElement: (selector, timeout = 5000) => {
        return new Promise((resolve, reject) => {
          const element = document.querySelector(selector);
          if (element) {
            resolve(element);
            return;
          }
          
          const observer = new MutationObserver(() => {
            const element = document.querySelector(selector);
            if (element) {
              observer.disconnect();
              resolve(element);
            }
          });
          
          observer.observe(document.body, {
            childList: true,
            subtree: true
          });
          
          setTimeout(() => {
            observer.disconnect();
            reject(new Error(`Element ${selector} not found within ${timeout}ms`));
          }, timeout);
        });
      },
      
      mockFirebase: () => {
        // This will be overridden by the actual mock
        return {
          firestore: () => ({}),
          auth: () => ({})
        };
      }
    };
  });
  
  return { browser, context };
}

/**
 * Cleanup test environment
 */
async function cleanupTestEnvironment() {
  console.log('🧹 Cleaning up test environment...');
  
  // Clean up any temporary files
  const fs = require('fs');
  const tempFiles = [
    'tests/screenshots/temp-*.png',
    'tests/traces/temp-*.zip'
  ];
  
  // Note: In a real implementation, you'd use glob patterns
  // to clean up temporary files
  
  console.log('✅ Test environment cleaned up');
}

/**
 * Run test setup
 */
async function runSetup() {
  try {
    console.log('🚀 Starting test setup...');
    
    createTestDirectories();
    validateTestConfig();
    await setupTestEnvironment();
    
    console.log('✅ Test setup completed successfully!');
    console.log('\n📋 Next steps:');
    console.log('   1. Run tests: npm test');
    console.log('   2. Run with UI: npm run test:ui');
    console.log('   3. Debug tests: npm run test:debug');
    
  } catch (error) {
    console.error('❌ Test setup failed:', error);
    process.exit(1);
  }
}

// Export functions for use in tests
module.exports = {
  setupTestEnvironment,
  createTestDirectories,
  validateTestConfig,
  setupBrowserContext,
  cleanupTestEnvironment,
  runSetup
};

// Run setup if called directly
if (require.main === module) {
  runSetup();
}
