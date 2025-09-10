// Professional screenplay formatting utilities
// Based on industry standards (WGA, Final Draft, Celtx)

export const ELEMENT_TYPES = {
  SCENE: 'scene',
  ACTION: 'action', 
  CHARACTER: 'character',
  DIALOGUE: 'dialogue',
  PARENTHETICAL: 'parenthetical',
  TRANSITION: 'transition',
  SHOT: 'shot',
  MONTAGE: 'montage',
  INTERCUT: 'intercut',
  GENERAL: 'general'
};

// Regex patterns for element detection
const PATTERNS = {
  SCENE: /^(INT|EXT|INT\.?\/EXT\.?)\s+.+\s+[-–]\s+(DAY|NIGHT|DAWN|DUSK|MORNING|AFTERNOON|EVENING|LATER|CONTINUOUS|SAME TIME)\s*\.?$/i,
  CHARACTER: /^[A-Z][A-Z0-9\s#@.'()-]{1,29}$/,
  TRANSITION: /^(CUT TO:|FADE IN:|FADE OUT\.|FADE TO BLACK\.|DISSOLVE TO:|SMASH CUT TO:|JUMP CUT TO:|MATCH CUT TO:|CROSS CUT TO:|QUICK CUT TO:|SLOW FADE TO:|IRIS IN:|IRIS OUT:)$/i,
  PARENTHETICAL: /^\s*\(.{1,30}\)\s*$/,
  SHOT: /^(CLOSE ON|CLOSE-UP|WIDE SHOT|MEDIUM SHOT|LONG SHOT|EXTREME CLOSE-UP|POV|ANGLE ON|INSERT|CUTAWAY|ESTABLISHING SHOT)/i,
  MONTAGE: /^MONTAGE\s*[-–]\s*.+$/i,
  INTERCUT: /^INTERCUT\s*[-–]\s*.+$/i
};

// Common scene locations and times for autocomplete
export const SCENE_SUGGESTIONS = {
  locations: [
    'LIVING ROOM', 'KITCHEN', 'BEDROOM', 'BATHROOM', 'HALLWAY', 'STAIRS',
    'CAR', 'RESTAURANT', 'OFFICE', 'COFFEE SHOP', 'PARK', 'STREET',
    'HOSPITAL', 'SCHOOL', 'CHURCH', 'STORE', 'APARTMENT', 'HOUSE'
  ],
  times: [
    'DAY', 'NIGHT', 'DAWN', 'DUSK', 'MORNING', 'AFTERNOON', 'EVENING',
    'LATER', 'CONTINUOUS', 'SAME TIME', 'MOMENTS LATER'
  ]
};

export const CHARACTER_SUGGESTIONS = [
  'NARRATOR (V.O.)', 'NARRATOR (O.S.)', '(V.O.)', '(O.S.)', '(CONT\'D)'
];

export const TRANSITION_SUGGESTIONS = [
  'CUT TO:', 'FADE IN:', 'FADE OUT.', 'FADE TO BLACK.', 'DISSOLVE TO:',
  'SMASH CUT TO:', 'JUMP CUT TO:', 'MATCH CUT TO:', 'CROSS CUT TO:'
];

/**
 * Parse a line of text and determine its element type
 */
export function parseLine(text, prevType = null, nextType = null) {
  const trimmed = text.trim();
  
  if (!trimmed) {
    return { type: ELEMENT_TYPES.GENERAL, confidence: 1.0 };
  }

  // Scene heading detection
  if (PATTERNS.SCENE.test(trimmed)) {
    return { type: ELEMENT_TYPES.SCENE, confidence: 0.95 };
  }

  // Transition detection  
  if (PATTERNS.TRANSITION.test(trimmed)) {
    return { type: ELEMENT_TYPES.TRANSITION, confidence: 0.9 };
  }

  // Parenthetical detection
  if (PATTERNS.PARENTHETICAL.test(trimmed)) {
    return { type: ELEMENT_TYPES.PARENTHETICAL, confidence: 0.85 };
  }

  // Character detection (contextual)
  if (PATTERNS.CHARACTER.test(trimmed) && 
      !trimmed.endsWith('TO:') && 
      prevType !== ELEMENT_TYPES.CHARACTER &&
      prevType !== ELEMENT_TYPES.DIALOGUE) {
    return { type: ELEMENT_TYPES.CHARACTER, confidence: 0.8 };
  }

  // Shot detection
  if (PATTERNS.SHOT.test(trimmed)) {
    return { type: ELEMENT_TYPES.SHOT, confidence: 0.75 };
  }

  // Montage detection
  if (PATTERNS.MONTAGE.test(trimmed)) {
    return { type: ELEMENT_TYPES.MONTAGE, confidence: 0.9 };
  }

  // Intercut detection
  if (PATTERNS.INTERCUT.test(trimmed)) {
    return { type: ELEMENT_TYPES.INTERCUT, confidence: 0.9 };
  }

  // Context-based dialogue detection
  if (prevType === ELEMENT_TYPES.CHARACTER || 
      prevType === ELEMENT_TYPES.PARENTHETICAL ||
      (prevType === ELEMENT_TYPES.DIALOGUE && trimmed.length > 0)) {
    return { type: ELEMENT_TYPES.DIALOGUE, confidence: 0.7 };
  }

  // Default to action for descriptive text
  return { type: ELEMENT_TYPES.ACTION, confidence: 0.6 };
}

/**
 * Format text based on element type
 */
export function formatLine(type, text) {
  const trimmed = text.trim();
  
  switch (type) {
    case ELEMENT_TYPES.SCENE:
      return trimmed.toUpperCase();
      
    case ELEMENT_TYPES.CHARACTER:
      // Remove common suffixes for processing, then re-add
      let charText = trimmed.toUpperCase();
      if (charText.includes('(')) {
        const [name, suffix] = charText.split('(');
        charText = name.trim() + ' (' + suffix;
      }
      return charText;
      
    case ELEMENT_TYPES.DIALOGUE:
      return trimmed; // Keep original case for dialogue
      
    case ELEMENT_TYPES.PARENTHETICAL:
      let parentText = trimmed;
      if (!parentText.startsWith('(')) {
        parentText = '(' + parentText;
      }
      if (!parentText.endsWith(')')) {
        parentText = parentText + ')';
      }
      return parentText.toLowerCase();
      
    case ELEMENT_TYPES.TRANSITION:
      return trimmed.toUpperCase();
      
    case ELEMENT_TYPES.ACTION:
    case ELEMENT_TYPES.SHOT:
    case ELEMENT_TYPES.MONTAGE:
    case ELEMENT_TYPES.INTERCUT:
    default:
      return trimmed;
  }
}

/**
 * Get the next logical element type based on current type and context
 */
export function getNextElementType(currentType, isDoubleEnter = false) {
  switch (currentType) {
    case ELEMENT_TYPES.SCENE:
      return ELEMENT_TYPES.ACTION;
      
    case ELEMENT_TYPES.ACTION:
      return ELEMENT_TYPES.ACTION;
      
    case ELEMENT_TYPES.CHARACTER:
      return ELEMENT_TYPES.DIALOGUE;
      
    case ELEMENT_TYPES.DIALOGUE:
      return isDoubleEnter ? ELEMENT_TYPES.ACTION : ELEMENT_TYPES.DIALOGUE;
      
    case ELEMENT_TYPES.PARENTHETICAL:
      return ELEMENT_TYPES.DIALOGUE;
      
    case ELEMENT_TYPES.TRANSITION:
      return ELEMENT_TYPES.SCENE;
      
    case ELEMENT_TYPES.SHOT:
    case ELEMENT_TYPES.MONTAGE:
    case ELEMENT_TYPES.INTERCUT:
      return ELEMENT_TYPES.ACTION;
      
    default:
      return ELEMENT_TYPES.ACTION;
  }
}

/**
 * Cycle through element types (for Tab key)
 */
export function cycleElementType(currentType, reverse = false) {
  const types = [
    ELEMENT_TYPES.SCENE,
    ELEMENT_TYPES.ACTION,
    ELEMENT_TYPES.CHARACTER,
    ELEMENT_TYPES.DIALOGUE,
    ELEMENT_TYPES.PARENTHETICAL,
    ELEMENT_TYPES.TRANSITION,
    ELEMENT_TYPES.SHOT
  ];
  
  const currentIndex = types.indexOf(currentType);
  const nextIndex = reverse 
    ? (currentIndex - 1 + types.length) % types.length
    : (currentIndex + 1) % types.length;
    
  return types[nextIndex];
}

/**
 * Get CSS classes for element type
 */
export function getElementClasses(type) {
  const baseClasses = 'script-line font-mono text-sm leading-relaxed';
  
  switch (type) {
    case ELEMENT_TYPES.SCENE:
      return `${baseClasses} script-scene uppercase font-bold mb-4`;
      
    case ELEMENT_TYPES.ACTION:
      return `${baseClasses} script-action mb-4 max-w-full`;
      
    case ELEMENT_TYPES.CHARACTER:
      return `${baseClasses} script-character uppercase font-semibold text-center mb-1`;
      
    case ELEMENT_TYPES.DIALOGUE:
      return `${baseClasses} script-dialogue mx-auto max-w-md`;
      
    case ELEMENT_TYPES.PARENTHETICAL:
      return `${baseClasses} script-parenthetical text-center italic mb-1`;
      
    case ELEMENT_TYPES.TRANSITION:
      return `${baseClasses} script-transition uppercase font-semibold text-right mb-4`;
      
    case ELEMENT_TYPES.SHOT:
      return `${baseClasses} script-shot uppercase mb-2`;
      
    case ELEMENT_TYPES.MONTAGE:
    case ELEMENT_TYPES.INTERCUT:
      return `${baseClasses} script-montage uppercase font-semibold mb-2`;
      
    default:
      return `${baseClasses} script-general mb-4`;
  }
}

/**
 * Calculate approximate page count based on line count
 * Industry standard: ~55 lines per page
 */
export function calculatePageCount(lines) {
  let totalLines = 0;
  
  lines.forEach(line => {
    const text = line.text || '';
    const lineCount = Math.max(1, Math.ceil(text.length / 60)); // ~60 chars per line
    
    switch (line.type) {
      case ELEMENT_TYPES.SCENE:
        totalLines += lineCount + 1; // Scene + blank line
        break;
      case ELEMENT_TYPES.ACTION:
        totalLines += lineCount + 1; // Action + blank line
        break;
      case ELEMENT_TYPES.CHARACTER:
        totalLines += 1; // Character name only
        break;
      case ELEMENT_TYPES.DIALOGUE:
        totalLines += lineCount;
        break;
      case ELEMENT_TYPES.PARENTHETICAL:
        totalLines += 1;
        break;
      case ELEMENT_TYPES.TRANSITION:
        totalLines += lineCount + 1;
        break;
      default:
        totalLines += lineCount;
    }
  });
  
  return Math.max(1, Math.ceil(totalLines / 55));
}

/**
 * Calculate runtime (1 page ≈ 1 minute)
 */
export function calculateRuntime(pageCount) {
  return pageCount;
}

/**
 * Count words in script
 */
export function countWords(lines) {
  return lines.reduce((total, line) => {
    const words = (line.text || '').trim().split(/\s+/).filter(word => word.length > 0);
    return total + words.length;
  }, 0);
}

/**
 * Export to Fountain format
 */
export function exportToFountain(scriptDoc) {
  let fountain = '';
  
  // Title page
  if (scriptDoc.settings?.titlePage) {
    const tp = scriptDoc.settings.titlePage;
    if (tp.title) fountain += `Title: ${tp.title}\n`;
    if (tp.author) fountain += `Author: ${tp.author}\n`;
    if (tp.contact) fountain += `Contact: ${tp.contact}\n`;
    if (tp.draftDate) fountain += `Draft date: ${tp.draftDate}\n`;
    fountain += '\n===\n\n';
  }
  
  // Script content
  scriptDoc.lines.forEach((line, index) => {
    const text = line.text || '';
    
    switch (line.type) {
      case ELEMENT_TYPES.SCENE:
        fountain += text.toUpperCase() + '\n\n';
        break;
        
      case ELEMENT_TYPES.ACTION:
        fountain += text + '\n\n';
        break;
        
      case ELEMENT_TYPES.CHARACTER:
        fountain += text.toUpperCase() + '\n';
        break;
        
      case ELEMENT_TYPES.DIALOGUE:
        fountain += text + '\n';
        break;
        
      case ELEMENT_TYPES.PARENTHETICAL:
        fountain += text + '\n';
        break;
        
      case ELEMENT_TYPES.TRANSITION:
        fountain += '> ' + text.toUpperCase() + '\n\n';
        break;
        
      default:
        fountain += text + '\n';
    }
  });
  
  return fountain;
}

/**
 * Import from Fountain format
 */
export function importFromFountain(fountainText) {
  const lines = fountainText.split('\n');
  const scriptLines = [];
  let inTitlePage = false;
  let titlePageData = {};
  
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    
    // Skip empty lines in processing, but we'll add them back as needed
    if (!trimmed) return;
    
    // Title page parsing
    if (trimmed === '===') {
      inTitlePage = false;
      return;
    }
    
    if (inTitlePage || (trimmed.includes(':') && index < 10)) {
      const [key, ...valueParts] = trimmed.split(':');
      const value = valueParts.join(':').trim();
      
      switch (key.toLowerCase()) {
        case 'title':
          titlePageData.title = value;
          break;
        case 'author':
          titlePageData.author = value;
          break;
        case 'contact':
          titlePageData.contact = value;
          break;
        case 'draft date':
          titlePageData.draftDate = value;
          break;
      }
      inTitlePage = true;
      return;
    }
    
    // Script content parsing
    let elementType = ELEMENT_TYPES.ACTION;
    let text = trimmed;
    
    // Transition (starts with >)
    if (trimmed.startsWith('> ')) {
      elementType = ELEMENT_TYPES.TRANSITION;
      text = trimmed.substring(2);
    }
    // Scene heading
    else if (PATTERNS.SCENE.test(trimmed)) {
      elementType = ELEMENT_TYPES.SCENE;
    }
    // Character (all caps, standalone)
    else if (PATTERNS.CHARACTER.test(trimmed) && trimmed === trimmed.toUpperCase()) {
      elementType = ELEMENT_TYPES.CHARACTER;
    }
    // Parenthetical
    else if (PATTERNS.PARENTHETICAL.test(trimmed)) {
      elementType = ELEMENT_TYPES.PARENTHETICAL;
    }
    // Dialogue (follows character)
    else if (scriptLines.length > 0) {
      const prevLine = scriptLines[scriptLines.length - 1];
      if (prevLine.type === ELEMENT_TYPES.CHARACTER || 
          prevLine.type === ELEMENT_TYPES.PARENTHETICAL ||
          prevLine.type === ELEMENT_TYPES.DIALOGUE) {
        elementType = ELEMENT_TYPES.DIALOGUE;
      }
    }
    
    scriptLines.push({
      id: `line_${Date.now()}_${index}`,
      type: elementType,
      text: text,
      meta: {}
    });
  });
  
  return {
    id: `script_${Date.now()}`,
    title: titlePageData.title || 'Imported Script',
    lines: scriptLines,
    settings: {
      showSceneNumbers: false,
      titlePage: titlePageData
    },
    updatedAt: Date.now()
  };
}