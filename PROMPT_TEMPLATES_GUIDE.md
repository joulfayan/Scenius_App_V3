# Prompt Templates Guide

## Overview

The prompt templates provide specialized, structured prompts for the AI Assistant that are designed to work with context loaders and return JSON responses for easy UI integration. These templates ensure consistent, professional AI responses for film production tasks.

## Core Templates

### 1. formatScriptPrompt(excerpt, options)

Creates a prompt for script formatting assistance with industry standards.

**Parameters:**
- `excerpt`: Script text to format
- `options`: Configuration object
  - `format`: Response format ('json' | 'text' | 'markdown')
  - `maxLength`: Maximum input length (default: 2000)

**Returns:**
- Formatted prompt string for script formatting

**JSON Response Structure:**
```typescript
interface ScriptFormatResult {
  formattedScript: string;
  issues: Array<{
    type: 'formatting' | 'structure' | 'style' | 'industry_standard';
    description: string;
    suggestion: string;
    line?: number;
  }>;
  improvements: Array<{
    category: 'dialogue' | 'action' | 'character' | 'scene_heading' | 'transitions';
    description: string;
    suggestion: string;
  }>;
  summary: {
    totalPages: number;
    estimatedDuration: number;
    characterCount: number;
    sceneCount: number;
  };
}
```

**Features:**
- Industry-standard script formatting
- Issue identification and suggestions
- Improvement recommendations
- Statistical analysis
- Line-by-line feedback

### 2. breakdownPrompt(sceneText, options)

Creates a prompt for production scene breakdown.

**Parameters:**
- `sceneText`: Scene text to break down
- `options`: Configuration object
  - `format`: Response format ('json' | 'text' | 'markdown')
  - `maxLength`: Maximum input length (default: 1500)

**Returns:**
- Formatted prompt string for scene breakdown

**JSON Response Structure:**
```typescript
interface BreakdownResult {
  elements: Array<{
    type: 'character' | 'prop' | 'location' | 'costume' | 'vehicle' | 'special_equipment' | 'animal' | 'extra';
    name: string;
    description: string;
    notes?: string;
    priority: 'high' | 'medium' | 'low';
    estimatedCost?: number;
  }>;
  locations: Array<{
    name: string;
    type: 'interior' | 'exterior';
    description: string;
    requirements: string[];
    estimatedCost?: number;
  }>;
  characters: Array<{
    name: string;
    description: string;
    costume: string[];
    props: string[];
    specialRequirements?: string;
  }>;
  technical: {
    lighting: string[];
    sound: string[];
    camera: string[];
    specialEffects?: string[];
  };
  summary: {
    totalElements: number;
    estimatedBudget: number;
    complexity: 'low' | 'medium' | 'high';
    specialRequirements: string[];
  };
}
```

**Features:**
- Complete element identification
- Location and character breakdown
- Technical requirements
- Budget estimation
- Complexity assessment

### 3. shotlistPrompt(sceneText, options)

Creates a prompt for cinematography shotlist generation.

**Parameters:**
- `sceneText`: Scene text to create shots for
- `options`: Configuration object
  - `format`: Response format ('json' | 'text' | 'markdown')
  - `maxLength`: Maximum input length (default: 1500)

**Returns:**
- Formatted prompt string for shotlist generation

**JSON Response Structure:**
```typescript
interface ShotlistResult {
  shots: Array<{
    shotNumber: string;
    shotType: 'WIDE' | 'MEDIUM' | 'CLOSE' | 'EXTREME_CLOSE' | 'OVER_SHOULDER' | 'POV' | 'ESTABLISHING' | 'INSERT' | 'CUTAWAY';
    angle: 'EYE_LEVEL' | 'LOW' | 'HIGH' | 'DUTCH' | 'BIRD_EYE' | 'WORM_EYE';
    movement: 'STATIC' | 'PAN' | 'TILT' | 'DOLLY' | 'TRACK' | 'CRANE' | 'HANDHELD' | 'STEADICAM' | 'DRONE';
    description: string;
    duration: number;
    characters: string[];
    props: string[];
    location: string;
    lighting: string;
    camera: {
      lens: string;
      settings: string;
      filters?: string[];
    };
    notes?: string;
    difficulty: 'easy' | 'medium' | 'hard';
    estimatedTime: number;
  }>;
  coverage: {
    totalShots: number;
    estimatedDuration: number;
    complexity: 'low' | 'medium' | 'high';
    specialEquipment: string[];
  };
  schedule: {
    estimatedDays: number;
    dailyShots: number[];
    priority: Array<'must_have' | 'should_have' | 'nice_to_have'>;
  };
}
```

**Features:**
- Detailed shot specifications
- Camera and lighting requirements
- Time and difficulty estimates
- Equipment needs
- Scheduling information

### 4. callsheetPrompt(daySummary, options)

Creates a prompt for production callsheet generation.

**Parameters:**
- `daySummary`: Summary of the shooting day
- `options`: Configuration object
  - `format`: Response format ('json' | 'text' | 'markdown')
  - `maxLength`: Maximum input length (default: 1000)

**Returns:**
- Formatted prompt string for callsheet generation

**JSON Response Structure:**
```typescript
interface CallsheetResult {
  production: {
    title: string;
    date: string;
    day: number;
    weather: string;
    sunrise: string;
    sunset: string;
  };
  schedule: {
    callTime: string;
    wrapTime: string;
    lunchTime: string;
    totalHours: number;
  };
  locations: Array<{
    name: string;
    address: string;
    contact: string;
    callTime: string;
    wrapTime: string;
    notes?: string;
  }>;
  cast: Array<{
    name: string;
    character: string;
    callTime: string;
    costume: string;
    makeup: string;
    notes?: string;
  }>;
  crew: Array<{
    name: string;
    position: string;
    callTime: string;
    contact: string;
    notes?: string;
  }>;
  equipment: {
    camera: string[];
    lighting: string[];
    sound: string[];
    grip: string[];
    special: string[];
  };
  transportation: Array<{
    type: string;
    capacity: number;
    driver: string;
    contact: string;
    notes?: string;
  }>;
  meals: {
    breakfast: string;
    lunch: string;
    dinner?: string;
    craftServices: string;
  };
  safety: {
    hazards: string[];
    precautions: string[];
    emergencyContacts: Array<{
      name: string;
      position: string;
      phone: string;
    }>;
  };
  notes: string[];
}
```

**Features:**
- Complete production information
- Detailed scheduling
- Contact information
- Equipment and transportation
- Safety considerations
- Meal planning

### 5. customPrompt(context, request, options)

Creates a generic prompt for custom AI assistance.

**Parameters:**
- `context`: Context information
- `request`: User request
- `options`: Configuration object
  - `format`: Response format ('json' | 'text' | 'markdown')
  - `maxLength`: Maximum input length (default: 2000)

**Returns:**
- Formatted prompt string for custom assistance

**Features:**
- Flexible context integration
- Custom request handling
- Professional film industry focus
- Structured or free-form responses

## Utility Functions

### parseAIResponse<T>(response)

Parses JSON responses from AI, handling various response formats.

**Parameters:**
- `response`: AI response text

**Returns:**
- Parsed JSON object or null if parsing fails

**Features:**
- Extracts JSON from mixed responses
- Handles malformed JSON gracefully
- Type-safe parsing

### validateResponseStructure(response, expectedKeys)

Validates that a parsed response has the expected structure.

**Parameters:**
- `response`: Parsed response object
- `expectedKeys`: Array of expected top-level keys

**Returns:**
- True if response has expected structure

**Features:**
- Structure validation
- Key presence checking
- Type safety

## Integration with AssistantPanel

### Quick Action Integration

The prompt templates are automatically integrated with the AssistantPanel's quick actions:

```typescript
// Quick action handling with specialized prompts
const handleQuickAction = async (action: QuickAction) => {
  // Load project context
  const context = await getProjectContext(projectId);
  
  // Generate specialized prompt based on action
  let specializedPrompt = '';
  switch (action.id) {
    case 'format-script':
      specializedPrompt = formatScriptPrompt(context.script.excerpt, { format: 'json' });
      break;
    case 'breakdown-scene':
      specializedPrompt = breakdownPrompt(sceneText, { format: 'json' });
      break;
    // ... other cases
  }
  
  setInput(specializedPrompt);
};
```

### Structured Response Display

The AssistantPanel automatically displays structured responses:

```typescript
// Parse and display structured responses
if (selectedQuickAction && fullContent.includes('{')) {
  const structured = parseAIResponse(fullContent);
  if (structured) {
    setStructuredResponse(structured);
  }
}
```

### UI Components

**Structured Response Display:**
- Green success indicator
- Collapsible JSON display
- Copy to clipboard functionality
- Action-specific labeling

**Loading States:**
- Context loading indicators
- Response parsing feedback
- Error handling

## Usage Examples

### Basic Script Formatting

```typescript
const excerpt = `FADE IN:\n\nINT. COFFEE SHOP - MORNING\n\nSARAH sits alone...`;
const prompt = formatScriptPrompt(excerpt, { format: 'json' });

// Send to AI and parse response
const response = await sendToAI(prompt);
const result = parseAIResponse<ScriptFormatResult>(response);
```

### Scene Breakdown

```typescript
const sceneText = `Scene 1: INT. COFFEE SHOP - MORNING\nSarah sits at a table...`;
const prompt = breakdownPrompt(sceneText, { format: 'json' });

const response = await sendToAI(prompt);
const breakdown = parseAIResponse<BreakdownResult>(response);
```

### Shotlist Generation

```typescript
const sceneText = `Scene 1: INT. COFFEE SHOP - MORNING\nSarah and John meet...`;
const prompt = shotlistPrompt(sceneText, { format: 'json' });

const response = await sendToAI(prompt);
const shotlist = parseAIResponse<ShotlistResult>(response);
```

### Callsheet Creation

```typescript
const daySummary = `Shooting Day 1 - Coffee Shop Scene\n2 scenes, 2 characters...`;
const prompt = callsheetPrompt(daySummary, { format: 'json' });

const response = await sendToAI(prompt);
const callsheet = parseAIResponse<CallsheetResult>(response);
```

## Testing

### Prompt Test Page

Visit `/prompt-test` to test all prompt templates:

- **Template Selection**: Choose from available prompt types
- **Input Modification**: Edit sample input or provide custom content
- **Prompt Generation**: See formatted prompts ready for AI
- **JSON Parsing**: Test response parsing functionality
- **Copy Functionality**: Copy prompts and responses to clipboard

### Test Scenarios

1. **Script Formatting**: Test with various script formats and styles
2. **Scene Breakdown**: Test with different scene types and complexities
3. **Shotlist Generation**: Test with various scene descriptions
4. **Callsheet Creation**: Test with different production scenarios
5. **JSON Parsing**: Test with various response formats

## Best Practices

### Prompt Design

1. **Clear Instructions**: Provide specific, actionable instructions
2. **Industry Standards**: Use professional film industry terminology
3. **Structured Output**: Request JSON format for easy parsing
4. **Context Integration**: Include relevant project context
5. **Error Handling**: Provide fallbacks for missing data

### Response Handling

1. **Validation**: Always validate parsed responses
2. **Error Recovery**: Handle parsing failures gracefully
3. **Type Safety**: Use TypeScript interfaces for response types
4. **User Feedback**: Provide clear feedback on response status
5. **Fallback Options**: Offer alternative formats when JSON fails

### Performance

1. **Input Limits**: Use appropriate character limits
2. **Caching**: Cache frequently used prompts
3. **Streaming**: Handle streaming responses efficiently
4. **Memory Management**: Clean up large response objects
5. **Error Boundaries**: Prevent crashes from malformed responses

## Troubleshooting

### Common Issues

1. **JSON Parsing Failures**
   - Check response format
   - Validate JSON structure
   - Handle mixed content responses

2. **Missing Context**
   - Ensure context loaders are working
   - Provide fallback prompts
   - Handle empty project data

3. **Response Validation**
   - Check expected keys
   - Validate data types
   - Handle partial responses

4. **Performance Issues**
   - Optimize input lengths
   - Cache parsed responses
   - Handle large responses

### Debug Information

Enable debug logging to troubleshoot:

```typescript
console.log('Generated prompt:', prompt);
console.log('AI response:', response);
console.log('Parsed result:', parsed);
console.log('Validation result:', isValid);
```

## Future Enhancements

### Planned Features

- **Dynamic Prompts**: Context-aware prompt generation
- **Response Templates**: Pre-built response templates
- **Validation Rules**: Advanced response validation
- **Custom Types**: User-defined response types
- **Prompt Analytics**: Usage tracking and optimization

### Extension Points

- **Custom Templates**: Add new prompt templates
- **Response Processors**: Custom response processing
- **Validation Hooks**: Advanced validation logic
- **Format Converters**: Convert between response formats
- **Integration APIs**: External service integration
