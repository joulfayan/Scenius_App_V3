# Context Loaders Guide

## Overview

The context loaders provide intelligent data fetching for the AI Assistant, allowing it to access relevant project information without overwhelming the system with raw data. These functions are designed to be efficient, selective, and user-intent driven.

## Core Functions

### 1. getScriptExcerpt(projectId, scriptId, options)

Fetches a script with intelligent truncation and formatting.

**Parameters:**
- `projectId`: The project ID
- `scriptId`: The script ID
- `options`: Configuration object
  - `maxChars`: Maximum characters to return (default: 2000)
  - `includeMetadata`: Include script metadata (default: true)

**Returns:**
```typescript
interface ScriptExcerpt {
  id: string;
  content: string;
  version: number;
  durationMins: number;
  excerpt: string;
  totalChars: number;
  excerptChars: number;
}
```

**Features:**
- Intelligent truncation at sentence boundaries
- Preserves script structure
- Includes metadata for context
- Handles large scripts efficiently

### 2. getScenesSummary(projectId, options)

Fetches a summary of scenes with element information.

**Parameters:**
- `projectId`: The project ID
- `options`: Configuration object
  - `limit`: Maximum number of scenes (default: 10)
  - `includeElements`: Include element information (default: true)

**Returns:**
```typescript
interface SceneSummary {
  id: string;
  number: number;
  heading: string;
  locationType: string;
  timeOfDay: string;
  durationMins: number;
  elementCount: number;
  elementTypes: string[];
}
```

**Features:**
- Sorted by scene number
- Includes element counts and types
- Efficient batch loading
- Error handling for missing elements

### 3. getCatalogSummary(projectId, options)

Fetches a summary of the project catalog (elements).

**Parameters:**
- `projectId`: The project ID
- `options`: Configuration object
  - `limit`: Maximum recent elements (default: 20)
  - `groupByType`: Group elements by type (default: true)
  - `groupByCategory`: Group elements by category (default: true)

**Returns:**
```typescript
interface CatalogSummary {
  totalElements: number;
  elementsByType: Record<string, number>;
  elementsByCategory: Record<string, number>;
  recentElements: Array<{
    id: string;
    name: string;
    type: string;
    category: string;
  }>;
}
```

**Features:**
- Statistical summaries
- Recent elements list
- Flexible grouping options
- Efficient data aggregation

### 4. getProjectContext(projectId, options)

Fetches comprehensive project context.

**Parameters:**
- `projectId`: The project ID
- `options`: Configuration object
  - `scriptId`: Optional script ID to include
  - `maxScriptChars`: Maximum script characters (default: 2000)
  - `scenesLimit`: Maximum scenes (default: 10)
  - `catalogLimit`: Maximum catalog items (default: 20)

**Returns:**
```typescript
interface ProjectContext {
  project: Project | null;
  script?: ScriptExcerpt;
  scenes: SceneSummary[];
  catalog: CatalogSummary;
}
```

**Features:**
- Combines all context types
- Configurable data limits
- Error handling and fallbacks
- Optimized for AI consumption

### 5. formatProjectContext(context)

Formats project context for AI system prompts.

**Parameters:**
- `context`: Project context object

**Returns:**
- Formatted string ready for AI consumption

**Features:**
- Human-readable formatting
- Structured information hierarchy
- Context-aware descriptions
- Optimized for AI understanding

## Integration with AssistantPanel

### Quick Action Context Loading

When a user clicks a quick action, the assistant automatically loads relevant context:

```typescript
const handleQuickAction = async (action: QuickAction) => {
  setSelectedQuickAction(action);
  setInput(`Please help me with: ${action.description}`);
  
  // Load project context
  if (projectId) {
    setIsLoadingContext(true);
    try {
      const context = await getProjectContext(projectId, {
        scenesLimit: 5,
        catalogLimit: 10
      });
      const formattedContext = formatProjectContext(context);
      setProjectContext(formattedContext);
    } catch (error) {
      console.error('Error loading project context:', error);
    } finally {
      setIsLoadingContext(false);
    }
  }
};
```

### System Prompt Enhancement

The loaded context is automatically added to the system prompt:

```typescript
if (selectedQuickAction) {
  let systemContent = selectedQuickAction.systemPrompt;
  
  // Add project context if available
  if (projectContext) {
    systemContent += '\n\n' + projectContext;
  }
  
  newMessages = [
    {
      role: 'system',
      content: systemContent
    },
    ...newMessages
  ];
}
```

## UI Indicators

### Loading States

- **Context Loading**: Spinner in quick actions header
- **Context Loaded**: Green "Context Loaded" badge
- **Error States**: Graceful error handling

### Visual Feedback

```tsx
{isLoadingContext && (
  <Loader2 className="h-3 w-3 animate-spin text-blue-500" />
)}
{projectContext && !isLoadingContext && (
  <Badge variant="outline" className="text-xs text-green-600">
    Context Loaded
  </Badge>
)}
```

## Usage Examples

### Basic Script Excerpt

```typescript
const excerpt = await getScriptExcerpt('project-123', 'script-456', {
  maxChars: 1000
});

if (excerpt) {
  console.log(`Script excerpt: ${excerpt.excerpt}`);
  console.log(`Total length: ${excerpt.totalChars} chars`);
}
```

### Scenes Summary

```typescript
const scenes = await getScenesSummary('project-123', {
  limit: 5,
  includeElements: true
});

scenes.forEach(scene => {
  console.log(`Scene ${scene.number}: ${scene.heading}`);
  console.log(`Elements: ${scene.elementCount} (${scene.elementTypes.join(', ')})`);
});
```

### Full Project Context

```typescript
const context = await getProjectContext('project-123', {
  scriptId: 'script-456',
  maxScriptChars: 2000,
  scenesLimit: 10,
  catalogLimit: 20
});

const formatted = formatProjectContext(context);
console.log('AI-ready context:', formatted);
```

## Error Handling

All functions include comprehensive error handling:

- **Network Errors**: Graceful fallbacks
- **Missing Data**: Null returns with logging
- **Invalid Parameters**: Validation and warnings
- **Timeout Handling**: Reasonable timeouts

## Performance Considerations

### Optimization Strategies

1. **Selective Loading**: Only load data when needed
2. **Character Limits**: Prevent overwhelming the AI
3. **Batch Operations**: Efficient database queries
4. **Caching**: Context is cached during session
5. **Error Boundaries**: Graceful degradation

### Data Limits

- **Script Excerpts**: 2000 characters max
- **Scenes**: 10 scenes max by default
- **Catalog**: 20 recent elements max
- **Total Context**: ~5000 characters typical

## Testing

### Context Test Page

Visit `/context-test` to test all context loading functions:

- Individual function testing
- Full context testing
- Error simulation
- Formatted output preview

### Test Scenarios

1. **Valid Project**: Test with real project data
2. **Empty Project**: Test with no data
3. **Large Project**: Test with extensive data
4. **Network Issues**: Test error handling
5. **Invalid IDs**: Test validation

## Best Practices

### When to Load Context

- **Quick Actions**: Always load context
- **Project-Specific Queries**: Load relevant context
- **General Queries**: Skip context loading
- **User Intent**: Load based on user needs

### Context Selection

- **Script Actions**: Include script excerpt
- **Production Actions**: Include scenes and catalog
- **General Actions**: Include project overview
- **Specific Queries**: Load targeted context

### Performance Tips

- Use appropriate limits
- Cache context during session
- Load context asynchronously
- Provide loading indicators
- Handle errors gracefully

## Troubleshooting

### Common Issues

1. **Context Not Loading**
   - Check project ID validity
   - Verify Firebase permissions
   - Check network connectivity

2. **Slow Context Loading**
   - Reduce data limits
   - Check database performance
   - Optimize queries

3. **Context Too Large**
   - Reduce character limits
   - Filter data more aggressively
   - Use more specific context

4. **Missing Data**
   - Check data existence
   - Verify relationships
   - Handle null cases

### Debug Information

Enable debug logging to troubleshoot:

```typescript
console.log('Loading context for project:', projectId);
console.log('Context options:', options);
console.log('Loaded context:', context);
```

## Future Enhancements

### Planned Features

- **Smart Context Selection**: AI-driven context selection
- **Context Caching**: Persistent context caching
- **Real-time Updates**: Live context updates
- **Custom Context Types**: User-defined context loaders
- **Context Analytics**: Usage tracking and optimization

### Extension Points

- **Custom Loaders**: Add new context types
- **Context Filters**: Advanced filtering options
- **Context Transformers**: Data transformation hooks
- **Context Validators**: Data validation
- **Context Metrics**: Performance monitoring
