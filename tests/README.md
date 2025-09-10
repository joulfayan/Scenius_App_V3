# Scenius App Test Suite

This directory contains comprehensive end-to-end tests for the Scenius film production app using Playwright.

## Test Structure

### Main Test Files

- **`scenius-flow.spec.js`** - Complete end-to-end flow test covering:
  - Project creation
  - Script content saving
  - AI assistant breakdown
  - Firestore data verification
  - Shotlist generation
  - UI verification

- **`assistant-integration.spec.js`** - AI Assistant specific tests:
  - Breakdown response handling
  - Shotlist generation
  - Error handling
  - Streaming responses

- **`firestore-integration.spec.js`** - Firestore database tests:
  - Data persistence
  - Real-time updates
  - Batch operations
  - Data validation

### Test Utilities

- **`utils/firebase-mock.js`** - Mock Firebase services for testing
- **`utils/test-helpers.js`** - Common test helper functions
- **`fixtures/`** - Test data and mock responses

## Running Tests

### Prerequisites

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

### Test Commands

```bash
# Run all tests
npm test

# Run tests with UI
npm run test:ui

# Run tests in headed mode (see browser)
npm run test:headed

# Debug tests
npm run test:debug

# Run specific test file
npx playwright test tests/scenius-flow.spec.js
```

## Test Configuration

The tests are configured in `playwright.config.js` with:
- Base URL: `http://localhost:5173`
- Parallel execution
- Multiple browser support (Chrome, Firefox, Safari)
- Automatic dev server startup

## Mock Data

### AI Responses (`fixtures/ai-responses.json`)

Contains mock AI responses for:
- Scene breakdown with elements, locations, characters
- Shotlist generation with camera specs, lighting, props

### Test Data (`fixtures/test-data.json`)

Contains:
- Test project information
- Sample script content
- Test user credentials

## Firebase Mocking

The tests use a comprehensive Firebase mock system that:
- Simulates Firestore database operations
- Mocks Firebase Auth
- Provides real-time update simulation
- Supports batch operations
- Handles data validation

## Test Flow

### Complete E2E Flow

1. **Project Creation**
   - Fill project form
   - Submit and verify navigation
   - Check Firestore data creation

2. **Script Management**
   - Navigate to script editor
   - Add script content
   - Save and verify persistence

3. **AI Assistant Integration**
   - Open assistant panel
   - Trigger scene breakdown
   - Mock AI API response
   - Verify data processing

4. **Firestore Verification**
   - Check element creation
   - Verify scene linking
   - Validate data structure

5. **Shotlist Generation**
   - Generate shotlist from AI
   - Verify equipment elements
   - Check UI display

6. **UI Verification**
   - Navigate to shotlist view
   - Verify table rows
   - Check shot details

## Error Handling Tests

- AI API failures
- Invalid JSON responses
- Network timeouts
- Data validation errors
- Authentication failures

## Debugging

### Screenshots
Tests automatically take screenshots on failure in `tests/screenshots/`

### Debug Mode
```bash
npm run test:debug
```

### Trace Viewer
```bash
npx playwright show-trace trace.zip
```

## Best Practices

1. **Isolation**: Each test is independent with fresh mocks
2. **Realistic Data**: Use realistic test data that matches production
3. **Error Scenarios**: Test both success and failure paths
4. **Performance**: Tests run in parallel for speed
5. **Maintainability**: Use helper functions for common operations

## Continuous Integration

Tests are designed to run in CI environments with:
- Headless browser execution
- Retry logic for flaky tests
- Comprehensive error reporting
- Artifact collection for debugging
