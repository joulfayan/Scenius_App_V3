// Test Configuration
// Centralized configuration for all test files

module.exports = {
  // Test environment settings
  environment: {
    NODE_ENV: 'test',
    VITE_AI_API_URL: 'http://localhost:3001/api/ai',
    VITE_FIREBASE_PROJECT_ID: 'test-project',
    VITE_FIREBASE_API_KEY: 'test-api-key',
    VITE_FIREBASE_AUTH_DOMAIN: 'test-project.firebaseapp.com',
    VITE_FIREBASE_STORAGE_BUCKET: 'test-project.appspot.com',
    VITE_FIREBASE_MESSAGING_SENDER_ID: '123456789',
    VITE_FIREBASE_APP_ID: '1:123456789:web:abcdef'
  },

  // Test data configuration
  testData: {
    project: {
      title: 'Test Detective Story',
      description: 'A test project for automated testing',
      genre: 'drama',
      format: 'short',
      logline: 'A detective investigates a mysterious case',
      budget_range: 'micro'
    },
    callsheet: {
      stripDay: {
        id: 'day-1',
        date: '2024-01-15',
        sceneOrder: ['scene-1', 'scene-2'],
        targetMins: 480,
        totalMins: 450,
        notes: 'First day of shooting'
      },
      contacts: [
        { id: 'contact-1', name: 'John Director', role: 'Director', email: 'john@example.com', phone: '555-0101' },
        { id: 'contact-2', name: 'Jane Producer', role: 'Producer', email: 'jane@example.com', phone: '555-0102' },
        { id: 'contact-3', name: 'Bob DP', role: 'DP', email: 'bob@example.com', phone: '555-0103' }
      ],
      location: {
        id: 'location-1',
        name: 'Main Street Studio',
        address: '123 Main Street, Los Angeles, CA 90210',
        coordinates: { lat: 34.0522, lng: -118.2437 }
      }
    },
    script: {
      content: `FADE IN:

INT. POLICE STATION - DAY

Detective JOHN (30s) sits at his cluttered desk, examining his badge. The office buzzes with activity.

JOHN
(quietly)
Another day, another case.

He takes a sip of coffee and opens a file folder.

FADE OUT.`,
      version: 1,
      durationMins: 2
    },
    user: {
      uid: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    }
  },

  // AI response fixtures
  aiResponses: {
    breakdownScene1: {
      elements: [
        {
          type: 'character',
          name: 'JOHN',
          description: 'Main character, 30s, detective',
          notes: 'Lead role',
          priority: 'high',
          estimatedCost: 0
        },
        {
          type: 'prop',
          name: 'Detective Badge',
          description: 'Police detective badge',
          notes: 'Essential prop for character',
          priority: 'high',
          estimatedCost: 25
        },
        {
          type: 'location',
          name: 'Police Station',
          description: 'Interior police station office',
          notes: 'Main location',
          priority: 'high',
          estimatedCost: 500
        }
      ],
      locations: [
        {
          name: 'Police Station',
          type: 'interior',
          description: 'Modern police station office with desk and filing cabinets',
          requirements: ['Desk', 'Chairs', 'Filing cabinets', 'Police equipment'],
          estimatedCost: 500
        }
      ],
      characters: [
        {
          name: 'JOHN',
          description: 'Detective, 30s, professional attire',
          costume: ['Suit', 'Tie', 'Detective badge'],
          props: ['Detective badge', 'Notebook', 'Pen'],
          specialRequirements: 'None'
        }
      ],
      technical: {
        lighting: ['Overhead fluorescent lights', 'Desk lamp'],
        sound: ['Background office noise', 'Phone ringing'],
        camera: ['Standard lens', 'Tripod'],
        specialEffects: []
      },
      summary: {
        totalElements: 3,
        estimatedBudget: 525,
        complexity: 'low',
        specialRequirements: []
      }
    },
    shotlistScene1: {
      shots: [
        {
          shotNumber: '1A',
          shotType: 'WIDE',
          angle: 'EYE_LEVEL',
          movement: 'STATIC',
          description: 'Wide shot of police station office, establishing location',
          duration: 5,
          characters: ['JOHN'],
          props: ['Desk', 'Filing cabinets'],
          location: 'Police Station',
          lighting: 'Overhead fluorescent lighting',
          camera: {
            lens: '24-70mm',
            settings: 'f/4, 1/60s, ISO 800',
            filters: []
          },
          notes: 'Establishing shot',
          difficulty: 'easy',
          estimatedTime: 15
        },
        {
          shotNumber: '1B',
          shotType: 'MEDIUM',
          angle: 'EYE_LEVEL',
          movement: 'STATIC',
          description: 'Medium shot of John at his desk, looking at files',
          duration: 8,
          characters: ['JOHN'],
          props: ['Detective badge', 'Files', 'Coffee cup'],
          location: 'Police Station',
          lighting: 'Desk lamp + overhead',
          camera: {
            lens: '50mm',
            settings: 'f/2.8, 1/60s, ISO 400',
            filters: []
          },
          notes: 'Character introduction',
          difficulty: 'easy',
          estimatedTime: 20
        }
      ],
      coverage: {
        totalShots: 2,
        estimatedDuration: 13,
        complexity: 'low',
        specialEquipment: []
      },
      schedule: {
        estimatedDays: 1,
        dailyShots: [2],
        priority: ['must_have', 'must_have']
      }
    }
  },

  // Test timeouts
  timeouts: {
    element: 5000,
    navigation: 10000,
    api: 15000,
    firebase: 10000,
    test: 30000
  },

  // Test selectors
  selectors: {
    createProjectButton: 'button:has-text("Create New Project")',
    assistantButton: '[data-testid="assistant-button"], button:has-text("Assistant")',
    assistantPanel: '[data-testid="assistant-panel"], .assistant-panel',
    breakdownButton: 'button:has-text("Breakdown Scene")',
    shotlistButton: 'button:has-text("Generate Shotlist")',
    scriptEditor: 'textarea, [contenteditable="true"]',
    saveButton: 'button:has-text("Save"), button[title*="Save"]',
    loadingIndicator: '[data-testid="loading"], .loading, [aria-busy="true"]',
    callsheetGenerator: '[data-testid="callsheet-generator"], .callsheet-generator',
    daySelect: 'select[name="dayId"], [data-testid="day-select"]',
    locationSelect: 'select[name="locationId"], [data-testid="location-select"]',
    contactCheckbox: 'input[type="checkbox"][name*="contact"], [data-testid="contact-checkbox"]',
    prepareCallsheetButton: 'button:has-text("Prepare Call Sheet"), button:has-text("Generate Call Sheet"), [data-testid="prepare-callsheet"]',
    saveCallsheetButton: 'button:has-text("Save Call Sheet"), button:has-text("Create Call Sheet"), [data-testid="save-callsheet"]',
    exportCallsheetButton: 'button:has-text("Export"), [data-testid="export-callsheet"]'
  },

  // Test URLs
  urls: {
    base: 'http://localhost:5173',
    project: '/project',
    script: '/script',
    shotlist: '/shotlist',
    assistant: '/assistant-demo'
  },

  // Mock configurations
  mocks: {
    aiApi: {
      url: '**/api/ai',
      method: 'POST',
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    },
    firebase: {
      projectId: 'test-project-123',
      collections: {
        projects: 'projects',
        elements: 'projects/{projectId}/elements',
        scenes: 'projects/{projectId}/scenes',
        scripts: 'projects/{projectId}/scripts'
      }
    }
  },

  // Test data validation
  validation: {
    requiredFields: {
      project: ['title', 'logline'],
      script: ['content'],
      element: ['type', 'name', 'category'],
      scene: ['number', 'heading', 'locationType']
    },
    dataTypes: {
      project: {
        title: 'string',
        description: 'string',
        genre: 'string',
        format: 'string',
        logline: 'string',
        budget_range: 'string'
      },
      element: {
        type: 'string',
        name: 'string',
        category: 'string',
        linkedSceneIds: 'array',
        customFields: 'object'
      }
    }
  }
};
