// AI Assistant Prompt Templates
// These templates are designed to work with context loaders and return structured JSON responses

export interface PromptOptions {
  includeContext?: boolean;
  format?: 'json' | 'text' | 'markdown';
  maxLength?: number;
}

export interface ScriptFormatResult {
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

export interface BreakdownResult {
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

export interface ShotlistResult {
  shots: Array<{
    shotNumber: string;
    shotType: 'WIDE' | 'MEDIUM' | 'CLOSE' | 'EXTREME_CLOSE' | 'OVER_SHOULDER' | 'POV' | 'ESTABLISHING' | 'INSERT' | 'CUTAWAY';
    angle: 'EYE_LEVEL' | 'LOW' | 'HIGH' | 'DUTCH' | 'BIRD_EYE' | 'WORM_EYE';
    movement: 'STATIC' | 'PAN' | 'TILT' | 'DOLLY' | 'TRACK' | 'CRANE' | 'HANDHELD' | 'STEADICAM' | 'DRONE';
    description: string;
    duration: number; // in seconds
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
    estimatedTime: number; // in minutes
  }>;
  coverage: {
    totalShots: number;
    estimatedDuration: number; // in minutes
    complexity: 'low' | 'medium' | 'high';
    specialEquipment: string[];
  };
  schedule: {
    estimatedDays: number;
    dailyShots: number[];
    priority: Array<'must_have' | 'should_have' | 'nice_to_have'>;
  };
}

export interface CallsheetResult {
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

/**
 * Creates a prompt for script formatting assistance
 * @param excerpt - Script excerpt to format
 * @param options - Prompt configuration options
 * @returns Formatted prompt string
 */
export function formatScriptPrompt(excerpt: string, options: PromptOptions = {}): string {
  const { format = 'json', maxLength = 2000 } = options;
  
  const truncatedExcerpt = excerpt.length > maxLength 
    ? excerpt.substring(0, maxLength) + '...'
    : excerpt;

  return `You are a professional script formatter and script supervisor. Please analyze and format the following script excerpt according to industry standards.

SCRIPT EXCERPT:
"""
${truncatedExcerpt}
"""

Please provide a comprehensive analysis and formatting suggestions. ${format === 'json' ? 'Return your response as a JSON object with the following structure:' : 'Include the following information:'}

${format === 'json' ? `{
  "formattedScript": "The properly formatted script text",
  "issues": [
    {
      "type": "formatting|structure|style|industry_standard",
      "description": "Description of the issue",
      "suggestion": "How to fix it",
      "line": 123
    }
  ],
  "improvements": [
    {
      "category": "dialogue|action|character|scene_heading|transitions",
      "description": "What can be improved",
      "suggestion": "Specific improvement suggestion"
    }
  ],
  "summary": {
    "totalPages": 0,
    "estimatedDuration": 0,
    "characterCount": 0,
    "sceneCount": 0
  }
}` : `
1. Formatted script text
2. List of formatting issues with suggestions
3. Improvement recommendations by category
4. Summary statistics (pages, duration, characters, scenes)
`}

Focus on:
- Proper scene heading format (INT./EXT. LOCATION - TIME)
- Character name formatting (ALL CAPS, centered)
- Dialogue formatting (proper indentation)
- Action line formatting (present tense, active voice)
- Industry standard transitions
- Proper page numbering and margins
- Character consistency
- Scene structure and pacing

Provide specific, actionable suggestions that will improve the script's professional appearance and readability.`;
}

/**
 * Creates a prompt for scene breakdown assistance
 * @param sceneText - Scene text to break down
 * @param options - Prompt configuration options
 * @returns Formatted prompt string
 */
export function breakdownPrompt(sceneText: string, options: PromptOptions = {}): string {
  const { format = 'json', maxLength = 1500 } = options;
  
  const truncatedScene = sceneText.length > maxLength 
    ? sceneText.substring(0, maxLength) + '...'
    : sceneText;

  return `You are a professional production manager and script supervisor. Please break down the following scene into production elements for planning and budgeting.

SCENE TEXT:
"""
${truncatedScene}
"""

Analyze this scene and identify all production elements needed. ${format === 'json' ? 'Return your response as a JSON object with the following structure:' : 'Include the following information:'}

${format === 'json' ? `{
  "elements": [
    {
      "type": "character|prop|location|costume|vehicle|special_equipment|animal|extra",
      "name": "Element name",
      "description": "Detailed description",
      "notes": "Additional notes",
      "priority": "high|medium|low",
      "estimatedCost": 0
    }
  ],
  "locations": [
    {
      "name": "Location name",
      "type": "interior|exterior",
      "description": "Location description",
      "requirements": ["requirement1", "requirement2"],
      "estimatedCost": 0
    }
  ],
  "characters": [
    {
      "name": "Character name",
      "description": "Character description",
      "costume": ["costume item 1", "costume item 2"],
      "props": ["prop 1", "prop 2"],
      "specialRequirements": "Any special requirements"
    }
  ],
  "technical": {
    "lighting": ["lighting requirement 1", "lighting requirement 2"],
    "sound": ["sound requirement 1", "sound requirement 2"],
    "camera": ["camera requirement 1", "camera requirement 2"],
    "specialEffects": ["effect 1", "effect 2"]
  },
  "summary": {
    "totalElements": 0,
    "estimatedBudget": 0,
    "complexity": "low|medium|high",
    "specialRequirements": ["requirement 1", "requirement 2"]
  }
}` : `
1. All production elements (props, costumes, vehicles, etc.)
2. Location requirements and details
3. Character breakdown with costumes and props
4. Technical requirements (lighting, sound, camera)
5. Budget estimates and complexity assessment
`}

Focus on:
- Identifying every physical element mentioned or implied
- Breaking down character requirements (costumes, props, special needs)
- Location details and requirements
- Technical equipment needs
- Safety considerations
- Budget implications
- Production complexity assessment

Be thorough and specific. Consider both what's explicitly mentioned and what's implied by the scene.`;
}

/**
 * Creates a prompt for shotlist generation
 * @param sceneText - Scene text to create shots for
 * @param options - Prompt configuration options
 * @returns Formatted prompt string
 */
export function shotlistPrompt(sceneText: string, options: PromptOptions = {}): string {
  const { format = 'json', maxLength = 1500 } = options;
  
  const truncatedScene = sceneText.length > maxLength 
    ? sceneText.substring(0, maxLength) + '...'
    : sceneText;

  return `You are a professional cinematographer and director. Please create a detailed shotlist for the following scene.

SCENE TEXT:
"""
${truncatedScene}
"""

Create a comprehensive shotlist that covers all the action and dialogue in this scene. ${format === 'json' ? 'Return your response as a JSON object with the following structure:' : 'Include the following information:'}

${format === 'json' ? `{
  "shots": [
    {
      "shotNumber": "1A",
      "shotType": "WIDE|MEDIUM|CLOSE|EXTREME_CLOSE|OVER_SHOULDER|POV|ESTABLISHING|INSERT|CUTAWAY",
      "angle": "EYE_LEVEL|LOW|HIGH|DUTCH|BIRD_EYE|WORM_EYE",
      "movement": "STATIC|PAN|TILT|DOLLY|TRACK|CRANE|HANDHELD|STEADICAM|DRONE",
      "description": "Detailed shot description",
      "duration": 0,
      "characters": ["character1", "character2"],
      "props": ["prop1", "prop2"],
      "location": "Location name",
      "lighting": "Lighting description",
      "camera": {
        "lens": "Lens specification",
        "settings": "Camera settings",
        "filters": ["filter1", "filter2"]
      },
      "notes": "Additional notes",
      "difficulty": "easy|medium|hard",
      "estimatedTime": 0
    }
  ],
  "coverage": {
    "totalShots": 0,
    "estimatedDuration": 0,
    "complexity": "low|medium|high",
    "specialEquipment": ["equipment1", "equipment2"]
  },
  "schedule": {
    "estimatedDays": 0,
    "dailyShots": [0, 0, 0],
    "priority": ["must_have", "should_have", "nice_to_have"]
  }
}` : `
1. Individual shots with detailed specifications
2. Camera movements and angles
3. Lighting requirements
4. Equipment needs
5. Scheduling and priority information
`}

Focus on:
- Complete coverage of all action and dialogue
- Logical shot progression and continuity
- Appropriate shot types for the content
- Technical specifications for each shot
- Realistic time estimates
- Equipment and crew requirements
- Safety considerations for complex shots

Consider the emotional tone and pacing of the scene when choosing shot types and movements.`;
}

/**
 * Creates a prompt for callsheet generation
 * @param daySummary - Summary of the shooting day
 * @param options - Prompt configuration options
 * @returns Formatted prompt string
 */
export function callsheetPrompt(daySummary: string, options: PromptOptions = {}): string {
  const { format = 'json', maxLength = 1000 } = options;
  
  const truncatedSummary = daySummary.length > maxLength 
    ? daySummary.substring(0, maxLength) + '...'
    : daySummary;

  return `You are a professional assistant director and production coordinator. Please create a detailed callsheet for the following shooting day.

DAY SUMMARY:
"""
${truncatedSummary}
"""

Create a comprehensive callsheet that covers all aspects of the shooting day. ${format === 'json' ? 'Return your response as a JSON object with the following structure:' : 'Include the following information:'}

${format === 'json' ? `{
  "production": {
    "title": "Production title",
    "date": "YYYY-MM-DD",
    "day": 1,
    "weather": "Weather forecast",
    "sunrise": "HH:MM",
    "sunset": "HH:MM"
  },
  "schedule": {
    "callTime": "HH:MM",
    "wrapTime": "HH:MM",
    "lunchTime": "HH:MM",
    "totalHours": 0
  },
  "locations": [
    {
      "name": "Location name",
      "address": "Full address",
      "contact": "Contact person",
      "callTime": "HH:MM",
      "wrapTime": "HH:MM",
      "notes": "Additional notes"
    }
  ],
  "cast": [
    {
      "name": "Actor name",
      "character": "Character name",
      "callTime": "HH:MM",
      "costume": "Costume description",
      "makeup": "Makeup requirements",
      "notes": "Additional notes"
    }
  ],
  "crew": [
    {
      "name": "Crew member name",
      "position": "Job title",
      "callTime": "HH:MM",
      "contact": "Phone number",
      "notes": "Additional notes"
    }
  ],
  "equipment": {
    "camera": ["camera equipment"],
    "lighting": ["lighting equipment"],
    "sound": ["sound equipment"],
    "grip": ["grip equipment"],
    "special": ["special equipment"]
  },
  "transportation": [
    {
      "type": "Vehicle type",
      "capacity": 0,
      "driver": "Driver name",
      "contact": "Phone number",
      "notes": "Additional notes"
    }
  ],
  "meals": {
    "breakfast": "Breakfast details",
    "lunch": "Lunch details",
    "dinner": "Dinner details (if applicable)",
    "craftServices": "Craft services details"
  },
  "safety": {
    "hazards": ["hazard 1", "hazard 2"],
    "precautions": ["precaution 1", "precaution 2"],
    "emergencyContacts": [
      {
        "name": "Contact name",
        "position": "Position",
        "phone": "Phone number"
      }
    ]
  },
  "notes": ["Additional notes", "Special instructions"]
}` : `
1. Production information and schedule
2. Location details and contacts
3. Cast call times and requirements
4. Crew assignments and contacts
5. Equipment lists
6. Transportation arrangements
7. Meal information
8. Safety considerations
9. Emergency contacts
`}

Focus on:
- Clear, detailed scheduling information
- Complete contact information for all personnel
- Specific equipment and transportation needs
- Safety considerations and emergency procedures
- Meal and craft services arrangements
- Weather considerations and backup plans
- Clear communication of expectations and requirements

Ensure all information is accurate and complete for smooth production operations.`;
}

/**
 * Generic prompt for custom AI assistance
 * @param context - Context information
 * @param request - User request
 * @param options - Prompt configuration options
 * @returns Formatted prompt string
 */
export function customPrompt(context: string, request: string, options: PromptOptions = {}): string {
  const { format = 'text', maxLength = 2000 } = options;
  
  const truncatedContext = context.length > maxLength 
    ? context.substring(0, maxLength) + '...'
    : context;

  return `You are a professional film production assistant. Please help with the following request using the provided context.

CONTEXT:
"""
${truncatedContext}
"""

USER REQUEST:
"""
${request}
"""

Please provide a helpful, professional response. ${format === 'json' ? 'If the request asks for structured data, return it as JSON. Otherwise, provide a clear text response.' : 'Provide a clear, detailed response.'}

Focus on:
- Professional film industry standards
- Practical, actionable advice
- Clear communication
- Industry best practices
- Safety considerations
- Budget awareness
- Time management

Be specific and helpful in your response.`;
}

/**
 * Utility function to parse JSON responses from AI
 * @param response - AI response text
 * @returns Parsed JSON object or null if parsing fails
 */
export function parseAIResponse<T>(response: string): T | null {
  try {
    // Try to extract JSON from the response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    
    // Try to parse the entire response as JSON
    return JSON.parse(response) as T;
  } catch (error) {
    console.error('Failed to parse AI response as JSON:', error);
    return null;
  }
}

/**
 * Utility function to validate prompt response structure
 * @param response - Parsed response object
 * @param expectedKeys - Array of expected top-level keys
 * @returns True if response has expected structure
 */
export function validateResponseStructure(response: any, expectedKeys: string[]): boolean {
  if (!response || typeof response !== 'object') {
    return false;
  }
  
  return expectedKeys.every(key => key in response);
}
