# Scenius App Testing Guide

This guide provides comprehensive information about the Playwright test suite for the Scenius film production app.

## 🎯 Test Overview

The test suite covers the complete user workflow:
1. **Project Creation** - Create new film projects
2. **Script Management** - Save and edit script content
3. **AI Assistant Integration** - Scene breakdown and shotlist generation
4. **Firestore Verification** - Database operations and data persistence
5. **UI Validation** - User interface elements and interactions

## 📁 Test Structure

```
tests/
├── scenius-flow.spec.js          # Main E2E flow test
├── assistant-integration.spec.js # AI Assistant specific tests
├── firestore-integration.spec.js # Database integration tests
├── examples/
│   └── example-usage.spec.js     # Usage examples and patterns
├── fixtures/
│   ├── test-data.json           # Test project and script data
│   └── ai-responses.json        # Mock AI API responses
├── utils/
│   ├── firebase-mock.js         # Firebase mocking utilities
│   └── test-helpers.js          # Common test helper functions
├── config/
│   └── test-config.js           # Centralized test configuration
├── setup/
│   └── test-setup.js            # Test environment setup
└── scripts/
    └── run-tests.js             # Custom test runner
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
npx playwright install
```

### 2. Run Tests

```bash
# Run all tests
npm test

# Run with UI (recommended for development)
npm run test:ui

# Run specific test suites
npm run test:flow        # Main flow tests
npm run test:assistant   # AI assistant tests
npm run test:firestore   # Database tests
npm run test:callsheet   # Callsheet generation tests

# Debug mode
npm run test:debug
```

### 3. Setup Test Environment

```bash
npm run test:setup
```

## 🧪 Test Categories

### Main Flow Test (`scenius-flow.spec.js`)

**Complete E2E workflow covering:**

- ✅ Project creation with form validation
- ✅ Script content saving and persistence
- ✅ AI assistant breakdown with mocked API
- ✅ Firestore data verification and scene linking
- ✅ Shotlist generation from AI JSON
- ✅ UI verification of shotlist rows
- ✅ Callsheet generation from stripDays + contacts + location
- ✅ Callsheet AI processing and Firestore persistence

**Key Features:**
- Mocked AI API responses
- Firebase data validation
- Error handling scenarios
- Data persistence across page refresh

### Assistant Integration Tests (`assistant-integration.spec.js`)

**AI Assistant specific functionality:**

- ✅ Scene breakdown response handling
- ✅ Shotlist generation with equipment creation
- ✅ Invalid JSON response handling
- ✅ Streaming response simulation
- ✅ Error state management

### Firestore Integration Tests (`firestore-integration.spec.js`)

**Database operations and data management:**

- ✅ Project creation and persistence
- ✅ Script saving and versioning
- ✅ Element creation and scene linking
- ✅ Data validation and error handling
- ✅ Real-time updates simulation
- ✅ Batch operations

### Callsheet Generation Tests (`callsheet-generation.spec.js`)

**Callsheet workflow and AI integration:**

- ✅ Strip day, contacts, and location selection
- ✅ AI callsheet generation with mocked responses
- ✅ Callsheet form population from AI data
- ✅ Firestore callsheet document creation
- ✅ Direct service call approach (skip AI)
- ✅ Error handling for missing data
- ✅ Callsheet export functionality

## 🔧 Configuration

### Test Configuration (`tests/config/test-config.js`)

Centralized configuration including:
- Environment variables
- Test data fixtures
- AI response mocks
- Timeout settings
- CSS selectors
- URL patterns
- Validation rules

### Firebase Mocking (`tests/utils/firebase-mock.js`)

Comprehensive Firebase simulation:
- Firestore database operations
- Authentication state management
- Real-time update simulation
- Batch operation support
- Data validation

## 📊 Mock Data

### AI Responses (`tests/fixtures/ai-responses.json`)

**Scene Breakdown Response:**
```json
{
  "elements": [
    {
      "type": "character",
      "name": "JOHN",
      "description": "Main character, 30s, detective",
      "priority": "high",
      "estimatedCost": 0
    }
  ],
  "locations": [...],
  "technical": {...}
}
```

**Shotlist Response:**
```json
{
  "shots": [
    {
      "shotNumber": "1A",
      "shotType": "WIDE",
      "camera": {
        "lens": "24-70mm",
        "settings": "f/4, 1/60s, ISO 800"
      }
    }
  ]
}
```

### Test Data (`tests/fixtures/test-data.json`)

Sample project and script data for consistent testing.

## 🛠️ Helper Functions

### Common Test Helpers (`tests/utils/test-helpers.js`)

**Element Interaction:**
- `waitForElement()` - Wait for element visibility
- `fillFieldByLabel()` - Fill form fields by label
- `clickButtonByText()` - Click buttons by text content

**API Mocking:**
- `mockApiResponse()` - Mock API endpoints
- `waitForApiRequest()` - Wait for API calls

**Firebase Verification:**
- `verifyFirebaseData()` - Verify database data
- `countFirebaseDocuments()` - Count collection documents

**UI Validation:**
- `verifyElementVisible()` - Verify element visibility
- `verifyTextExists()` - Verify text content
- `waitForToast()` - Wait for notifications

## 🎨 Test Patterns

### Basic Test Structure

```javascript
test('Test description', async ({ page }) => {
  // Setup
  firebaseMock = setupFirebaseMocks();
  
  // Mock API responses
  await mockApiResponse(page, '**/api/ai', mockResponse);
  
  // Test steps
  await clickButtonByText(page, 'Create Project');
  await fillFieldByLabel(page, 'Title', 'Test Project');
  
  // Verification
  await verifyTextExists(page, 'Project created');
  verifyFirebaseData(firebaseMock, 'projects', 'test-id', expectedData);
  
  // Cleanup
  cleanupFirebaseMocks();
});
```

### Error Handling Pattern

```javascript
test('Error handling', async ({ page }) => {
  // Mock error response
  await mockApiResponse(page, '**/api/ai', { error: 'API Error' }, 500);
  
  // Trigger action that should fail
  await page.click('button:has-text("Breakdown Scene")');
  
  // Verify error handling
  await verifyTextExists(page, 'error', 'Error message displayed');
  await waitForToast(page, 'error');
});
```

## 🐛 Debugging

### Screenshots
Tests automatically capture screenshots on failure in `tests/screenshots/`

### Debug Mode
```bash
npm run test:debug
```

### Trace Viewer
```bash
npx playwright show-trace trace.zip
```

### Custom Debug Screenshots
```javascript
await takeDebugScreenshot(page, 'step-name');
```

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 🔍 Best Practices

### 1. Test Isolation
- Each test is independent
- Fresh mocks for each test
- Cleanup after each test

### 2. Realistic Data
- Use production-like test data
- Include edge cases and error scenarios
- Test with various data types

### 3. Maintainable Selectors
- Use data-testid attributes when possible
- Prefer semantic selectors over CSS classes
- Centralize selectors in configuration

### 4. Error Scenarios
- Test both success and failure paths
- Verify error messages and handling
- Test network failures and timeouts

### 5. Performance
- Run tests in parallel
- Use appropriate timeouts
- Mock external dependencies

## 📚 Additional Resources

- [Playwright Documentation](https://playwright.dev/)
- [Firebase Testing](https://firebase.google.com/docs/emulator-suite)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Test-Driven Development](https://en.wikipedia.org/wiki/Test-driven_development)

## 🤝 Contributing

When adding new tests:

1. Follow existing patterns and naming conventions
2. Add appropriate test data to fixtures
3. Update configuration as needed
4. Include both positive and negative test cases
5. Add documentation for complex test scenarios

## 📞 Support

For questions about the test suite:
- Check the test examples in `tests/examples/`
- Review the helper functions in `tests/utils/`
- Examine the configuration in `tests/config/`
- Look at existing test patterns in the spec files
