# Service Integration Guide

## Overview

The service integration system automatically parses AI-generated JSON responses and writes them to the appropriate database services. This creates a seamless workflow from AI generation to data persistence, allowing users to apply AI-generated content directly to their projects.

## Core Components

### 1. Service Integration Module (`serviceIntegration.ts`)

Handles the mapping between AI response types and database services.

**Key Functions:**
- `writeScriptFormat()` - Saves formatted scripts
- `writeSceneBreakdown()` - Creates scenes and elements
- `writeShotlist()` - Creates equipment and prop elements
- `writeCallsheet()` - Creates callsheets
- `writeAIResult()` - Automatic service selection
- `validateAIResult()` - Response validation

### 2. Enhanced AssistantPanel

Extended with automatic JSON parsing and service writing capabilities.

**New Features:**
- Real-time JSON parsing during streaming
- Validation of parsed responses
- Apply button for successful JSON
- Service write result display
- Error handling for parse failures

## Workflow

### 1. AI Response Generation

When a user clicks a quick action, the system:
1. Loads project context
2. Generates specialized prompt
3. Sends to AI with streaming response
4. Parses JSON in real-time

### 2. JSON Parsing and Validation

During streaming, the system:
1. Attempts to parse JSON from response
2. Validates structure against expected format
3. Updates UI with parsing status
4. Enables/disables Apply button

### 3. Service Writing

When user clicks Apply:
1. Validates all required parameters
2. Calls appropriate service function
3. Writes data to database
4. Displays success/error results

## Service Mappings

### Script Formatting (`format-script`)

**AI Response Type:** `ScriptFormatResult`
**Service:** `saveScript()`
**Creates:**
- Formatted script content
- Version information
- Duration estimates

**Database Fields:**
```typescript
{
  content: string;        // Formatted script
  version: number;        // AI-generated version
  durationMins: number;   // Estimated duration
  updatedAt: timestamp;   // Server timestamp
}
```

### Scene Breakdown (`breakdown-scene`)

**AI Response Type:** `BreakdownResult`
**Services:** `createScene()`, `createElement()`
**Creates:**
- Scene records for locations
- Element records for props/equipment
- Character information

**Database Fields:**
```typescript
// Scene
{
  number: number;
  slug: string;
  heading: string;
  locationType: 'INT' | 'EXT';
  timeOfDay: string;
  durationMins: number;
  elementIds: string[];
}

// Element
{
  type: string;
  name: string;
  category: string;
  customFields: {
    description: string;
    priority: string;
    estimatedCost: number;
  };
  estCostCents: number;
}
```

### Shotlist Generation (`generate-shotlist`)

**AI Response Type:** `ShotlistResult`
**Service:** `createElement()`
**Creates:**
- Camera equipment elements
- Lighting equipment elements
- Prop elements

**Database Fields:**
```typescript
{
  type: 'equipment' | 'prop';
  name: string;
  category: 'camera' | 'lighting' | 'props';
  customFields: {
    shotNumber: string;
    shotType: string;
    angle: string;
    movement: string;
    lens: string;
    settings: string;
    difficulty: string;
    estimatedTime: number;
  };
}
```

### Callsheet Generation (`generate-callsheet`)

**AI Response Type:** `CallsheetResult`
**Service:** `createCallSheet()`
**Creates:**
- Callsheet records
- Production information
- Schedule details

**Database Fields:**
```typescript
{
  date: string;
  unitName: string;
  dayId: string;
  locationId: string;
  recipients: string[];
  weather: {
    high: number;
    low: number;
    condition: string;
    sunrise: string;
    sunset: string;
  };
  notes: string;
}
```

## UI Components

### JSON Response Display

**Valid JSON:**
- Green indicator with checkmark
- "Valid JSON" badge
- Apply button enabled
- Collapsible JSON display

**Invalid JSON:**
- Yellow indicator with X
- "Invalid JSON" badge
- Apply button disabled
- Raw text display

### Apply Button

**Enabled When:**
- JSON is valid
- Quick action is selected
- Project ID is available
- Not currently writing

**States:**
- Default: "Apply to Project"
- Loading: "Applying..." with spinner
- Disabled: When conditions not met

### Service Write Results

**Success:**
- Green indicator with checkmark
- "Applied Successfully" badge
- Success message
- Created data summary

**Failure:**
- Red indicator with X
- "Application Failed" badge
- Error message
- Error details

## Error Handling

### JSON Parsing Errors

**Causes:**
- Malformed JSON syntax
- Missing required fields
- Invalid data types
- Unexpected structure

**Handling:**
- Graceful fallback to text display
- Clear error indicators
- Disabled Apply button
- User-friendly messages

### Service Write Errors

**Causes:**
- Missing project ID
- Invalid data format
- Database connection issues
- Permission errors

**Handling:**
- Detailed error messages
- Retry suggestions
- Fallback options
- Logging for debugging

### Validation Errors

**Causes:**
- Missing required fields
- Invalid data types
- Structure mismatches
- Business rule violations

**Handling:**
- Pre-write validation
- Clear error messages
- Field-specific feedback
- Correction suggestions

## Testing

### Service Integration Test Page

Visit `/service-integration-test` to test the complete workflow:

**Features:**
- Mock AI responses for all action types
- Real database writing
- Result validation
- Error simulation
- Performance testing

**Test Scenarios:**
1. **Valid Responses** - Test successful workflows
2. **Invalid Responses** - Test error handling
3. **Missing Data** - Test validation
4. **Database Errors** - Test failure recovery

### Manual Testing

**Steps:**
1. Use AssistantPanel with quick actions
2. Generate AI responses
3. Verify JSON parsing
4. Apply to services
5. Check database results

## Best Practices

### Data Validation

1. **Pre-write Validation** - Validate before database writes
2. **Type Safety** - Use TypeScript interfaces
3. **Business Rules** - Enforce project-specific rules
4. **Error Recovery** - Provide fallback options

### User Experience

1. **Clear Feedback** - Show parsing and writing status
2. **Error Messages** - Provide actionable error information
3. **Progress Indicators** - Show loading states
4. **Confirmation** - Confirm successful operations

### Performance

1. **Streaming Parsing** - Parse JSON during streaming
2. **Batch Operations** - Group related database writes
3. **Error Boundaries** - Prevent UI crashes
4. **Memory Management** - Clean up large responses

### Security

1. **Input Validation** - Sanitize AI responses
2. **Permission Checks** - Verify user access
3. **Data Integrity** - Validate business rules
4. **Audit Logging** - Track all operations

## Troubleshooting

### Common Issues

1. **JSON Parse Failures**
   - Check response format
   - Validate structure
   - Handle mixed content

2. **Service Write Failures**
   - Verify project ID
   - Check permissions
   - Validate data format

3. **Validation Errors**
   - Check required fields
   - Validate data types
   - Review business rules

4. **UI Issues**
   - Check state management
   - Verify event handlers
   - Review error boundaries

### Debug Information

Enable debug logging:

```typescript
console.log('AI Response:', response);
console.log('Parsed JSON:', parsed);
console.log('Validation Result:', isValid);
console.log('Service Write Result:', result);
```

### Performance Monitoring

Track key metrics:
- JSON parsing time
- Service write duration
- Success/failure rates
- User interaction patterns

## Future Enhancements

### Planned Features

- **Batch Processing** - Handle multiple responses
- **Conflict Resolution** - Handle data conflicts
- **Undo/Redo** - Revert operations
- **Templates** - Pre-configured responses
- **Analytics** - Usage tracking

### Extension Points

- **Custom Services** - Add new service types
- **Validation Rules** - Custom validation logic
- **Error Handlers** - Custom error handling
- **UI Components** - Custom result displays
- **Integration Hooks** - External service integration

## API Reference

### Service Integration Functions

```typescript
// Write AI result to appropriate service
writeAIResult(actionId: string, result: any, options: ServiceWriteOptions): Promise<ServiceWriteResult>

// Validate AI result structure
validateAIResult(actionId: string, result: any): boolean

// Write script format result
writeScriptFormat(result: ScriptFormatResult, options: ServiceWriteOptions): Promise<ServiceWriteResult>

// Write scene breakdown result
writeSceneBreakdown(result: BreakdownResult, options: ServiceWriteOptions): Promise<ServiceWriteResult>

// Write shotlist result
writeShotlist(result: ShotlistResult, options: ServiceWriteOptions): Promise<ServiceWriteResult>

// Write callsheet result
writeCallsheet(result: CallsheetResult, options: ServiceWriteOptions): Promise<ServiceWriteResult>
```

### Types

```typescript
interface ServiceWriteOptions {
  projectId: string;
  scriptId?: string;
  sceneId?: string;
  elementId?: string;
  callsheetId?: string;
}

interface ServiceWriteResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}
```

This service integration system provides a complete workflow from AI generation to database persistence, making the AI assistant a powerful tool for creating and managing film production data.
