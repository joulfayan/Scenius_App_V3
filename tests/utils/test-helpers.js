// Test Helper Utilities
// Common utilities for Playwright tests

import { expect } from '@playwright/test';

/**
 * Wait for an element to be visible and return it
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector or test ID
 * @param {number} timeout - Timeout in milliseconds
 * @returns {Promise<import('@playwright/test').Locator>}
 */
export async function waitForElement(page, selector, timeout = 5000) {
  const element = page.locator(selector);
  await element.waitFor({ state: 'visible', timeout });
  return element;
}

/**
 * Wait for text to appear on the page
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} text - Text to wait for
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForText(page, text, timeout = 5000) {
  await page.waitForSelector(`text=${text}`, { timeout });
}

/**
 * Fill a form field by label
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} label - Field label text
 * @param {string} value - Value to fill
 */
export async function fillFieldByLabel(page, label, value) {
  const field = page.locator(`label:has-text("${label}") + input, label:has-text("${label}") + textarea`);
  await field.fill(value);
}

/**
 * Click a button by text
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} text - Button text
 */
export async function clickButtonByText(page, text) {
  await page.click(`button:has-text("${text}")`);
}

/**
 * Wait for API request to complete
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} url - API URL pattern
 * @param {string} method - HTTP method
 * @returns {Promise<import('@playwright/test').Request>}
 */
export async function waitForApiRequest(page, url, method = 'POST') {
  return page.waitForRequest(request => 
    request.url().includes(url) && request.method() === method
  );
}

/**
 * Mock API response
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} url - API URL pattern
 * @param {Object} response - Mock response data
 * @param {number} status - HTTP status code
 */
export async function mockApiResponse(page, url, response, status = 200) {
  await page.route(url, route => {
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response)
    });
  });
}

/**
 * Wait for Firebase operation to complete
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} operation - Operation description for logging
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForFirebaseOperation(page, operation, timeout = 10000) {
  console.log(`Waiting for Firebase operation: ${operation}`);
  
  // Wait for any loading indicators to disappear
  await page.waitForFunction(() => {
    const loadingElements = document.querySelectorAll('[data-testid="loading"], .loading, [aria-busy="true"]');
    return loadingElements.length === 0;
  }, { timeout });
  
  // Wait a bit more for any async operations to complete
  await page.waitForTimeout(1000);
}

/**
 * Verify element exists and is visible
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector or test ID
 * @param {string} description - Description for error message
 */
export async function verifyElementVisible(page, selector, description) {
  const element = page.locator(selector);
  await expect(element).toBeVisible({ timeout: 5000 });
  console.log(`✓ ${description} is visible`);
}

/**
 * Verify text content exists
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} text - Text to verify
 * @param {string} description - Description for error message
 */
export async function verifyTextExists(page, text, description) {
  await expect(page.locator(`text=${text}`)).toBeVisible({ timeout: 5000 });
  console.log(`✓ ${description} text is visible`);
}

/**
 * Take a screenshot for debugging
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} name - Screenshot name
 */
export async function takeDebugScreenshot(page, name) {
  await page.screenshot({ 
    path: `tests/screenshots/${name}-${Date.now()}.png`,
    fullPage: true 
  });
  console.log(`Debug screenshot saved: ${name}`);
}

/**
 * Wait for navigation to complete
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} expectedUrl - Expected URL pattern
 */
export async function waitForNavigation(page, expectedUrl) {
  await page.waitForURL(url => url.href.includes(expectedUrl));
  console.log(`✓ Navigated to ${expectedUrl}`);
}

/**
 * Verify Firebase data exists
 * @param {Object} firebaseMock - Mock Firebase instance
 * @param {string} collectionPath - Collection path
 * @param {string} docId - Document ID
 * @param {Object} expectedData - Expected data structure
 */
export function verifyFirebaseData(firebaseMock, collectionPath, docId, expectedData) {
  const doc = firebaseMock.firestore.getTestData(collectionPath, docId);
  expect(doc).toBeTruthy();
  expect(doc.data).toMatchObject(expectedData);
  console.log(`✓ Firebase data verified for ${collectionPath}/${docId}`);
}

/**
 * Count Firebase documents in collection
 * @param {Object} firebaseMock - Mock Firebase instance
 * @param {string} collectionPath - Collection path
 * @returns {number} Document count
 */
export function countFirebaseDocuments(firebaseMock, collectionPath) {
  const docs = firebaseMock.firestore.getAllTestData(collectionPath);
  return docs.filter(doc => doc.data !== null).length;
}

/**
 * Wait for toast notification
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} message - Expected toast message
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForToast(page, message, timeout = 5000) {
  const toast = page.locator(`[data-sonner-toast]:has-text("${message}")`);
  await toast.waitFor({ state: 'visible', timeout });
  console.log(`✓ Toast notification: ${message}`);
}

/**
 * Clear all form fields
 * @param {import('@playwright/test').Page} page - Playwright page object
 */
export async function clearAllFormFields(page) {
  const inputs = page.locator('input, textarea, select');
  const count = await inputs.count();
  
  for (let i = 0; i < count; i++) {
    const input = inputs.nth(i);
    const tagName = await input.evaluate(el => el.tagName.toLowerCase());
    
    if (tagName === 'select') {
      await input.selectOption('');
    } else {
      await input.clear();
    }
  }
}

/**
 * Wait for element to have specific text
 * @param {import('@playwright/test').Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {string} text - Expected text
 * @param {number} timeout - Timeout in milliseconds
 */
export async function waitForElementText(page, selector, text, timeout = 5000) {
  const element = page.locator(selector);
  await expect(element).toHaveText(text, { timeout });
  console.log(`✓ Element has expected text: ${text}`);
}
