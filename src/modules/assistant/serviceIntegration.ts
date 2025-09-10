// Service Integration for AI Assistant
// Handles writing AI-generated data to appropriate services

import { saveScript } from '../../services/scripts';
import { createScene } from '../../services/scenes';
import { createElement } from '../../services/elements';
import { createCallSheet } from '../../services/callsheets';
import type { 
  ScriptFormatResult, 
  BreakdownResult, 
  ShotlistResult, 
  CallsheetResult 
} from './prompts';

export interface ServiceWriteResult {
  success: boolean;
  message: string;
  data?: any;
  error?: string;
}

export interface ServiceWriteOptions {
  projectId: string;
  scriptId?: string;
  sceneId?: string;
  elementId?: string;
  callsheetId?: string;
}

/**
 * Writes script formatting results to the database
 * @param result - Parsed script format result
 * @param options - Service write options
 * @returns Promise with write result
 */
export async function writeScriptFormat(
  result: ScriptFormatResult,
  options: ServiceWriteOptions
): Promise<ServiceWriteResult> {
  try {
    if (!options.projectId || !options.scriptId) {
      return {
        success: false,
        message: 'Missing project ID or script ID',
        error: 'Required parameters not provided'
      };
    }

    // Save the formatted script
    await saveScript(options.projectId, options.scriptId, {
      content: result.formattedScript,
      version: 1, // AI-generated version
      durationMins: result.summary.estimatedDuration
    });

    return {
      success: true,
      message: `Script formatted and saved successfully. ${result.issues.length} issues identified, ${result.improvements.length} improvements suggested.`,
      data: {
        scriptId: options.scriptId,
        issues: result.issues,
        improvements: result.improvements,
        summary: result.summary
      }
    };
  } catch (error) {
    console.error('Error writing script format:', error);
    return {
      success: false,
      message: 'Failed to save formatted script',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Writes scene breakdown results to the database
 * @param result - Parsed breakdown result
 * @param options - Service write options
 * @returns Promise with write result
 */
export async function writeSceneBreakdown(
  result: BreakdownResult,
  options: ServiceWriteOptions
): Promise<ServiceWriteResult> {
  try {
    if (!options.projectId) {
      return {
        success: false,
        message: 'Missing project ID',
        error: 'Project ID is required'
      };
    }

    const createdItems = [];
    const errors = [];

    // Create scenes for each location
    for (const location of result.locations) {
      try {
        const sceneId = await createScene(options.projectId, {
          number: 1, // Default scene number, should be determined by context
          slug: location.name.toLowerCase().replace(/\s+/g, '-'),
          heading: `${location.type === 'interior' ? 'INT' : 'EXT'}. ${location.name.toUpperCase()} - DAY`,
          locationType: location.type.toUpperCase() as 'INT' | 'EXT',
          timeOfDay: 'DAY',
          durationMins: 5, // Default duration
          elementIds: []
        });
        createdItems.push({ type: 'scene', id: sceneId, name: location.name });
      } catch (error) {
        errors.push(`Failed to create scene for ${location.name}: ${error}`);
      }
    }

    // Create elements
    for (const element of result.elements) {
      try {
        const elementId = await createElement(options.projectId, {
          type: element.type,
          name: element.name,
          category: element.type, // Use type as category for now
          customFields: {
            description: element.description,
            priority: element.priority,
            estimatedCost: element.estimatedCost,
            notes: element.notes
          },
          estCostCents: element.estimatedCost ? element.estimatedCost * 100 : undefined
        });
        createdItems.push({ type: 'element', id: elementId, name: element.name });
      } catch (error) {
        errors.push(`Failed to create element ${element.name}: ${error}`);
      }
    }

    return {
      success: true,
      message: `Scene breakdown completed. Created ${createdItems.length} items. ${errors.length} errors occurred.`,
      data: {
        createdItems,
        errors,
        summary: result.summary
      }
    };
  } catch (error) {
    console.error('Error writing scene breakdown:', error);
    return {
      success: false,
      message: 'Failed to save scene breakdown',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Writes shotlist results to the database
 * @param result - Parsed shotlist result
 * @param options - Service write options
 * @returns Promise with write result
 */
export async function writeShotlist(
  result: ShotlistResult,
  options: ServiceWriteOptions
): Promise<ServiceWriteResult> {
  try {
    if (!options.projectId) {
      return {
        success: false,
        message: 'Missing project ID',
        error: 'Project ID is required'
      };
    }

    // Create elements for each shot's equipment and props
    const createdItems = [];
    const errors = [];

    for (const shot of result.shots) {
      // Create camera equipment element
      try {
        const cameraElementId = await createElement(options.projectId, {
          type: 'equipment',
          name: `Camera - ${shot.camera.lens}`,
          category: 'camera',
          customFields: {
            shotNumber: shot.shotNumber,
            shotType: shot.shotType,
            angle: shot.angle,
            movement: shot.movement,
            lens: shot.camera.lens,
            settings: shot.camera.settings,
            filters: shot.camera.filters,
            difficulty: shot.difficulty,
            estimatedTime: shot.estimatedTime
          }
        });
        createdItems.push({ type: 'camera_equipment', id: cameraElementId, name: `Camera - ${shot.camera.lens}` });
      } catch (error) {
        errors.push(`Failed to create camera equipment for shot ${shot.shotNumber}: ${error}`);
      }

      // Create lighting equipment element
      if (shot.lighting) {
        try {
          const lightingElementId = await createElement(options.projectId, {
            type: 'equipment',
            name: `Lighting - ${shot.lighting}`,
            category: 'lighting',
            customFields: {
              shotNumber: shot.shotNumber,
              description: shot.lighting,
              difficulty: shot.difficulty
            }
          });
          createdItems.push({ type: 'lighting_equipment', id: lightingElementId, name: `Lighting - ${shot.lighting}` });
        } catch (error) {
          errors.push(`Failed to create lighting equipment for shot ${shot.shotNumber}: ${error}`);
        }
      }

      // Create prop elements
      for (const prop of shot.props) {
        try {
          const propElementId = await createElement(options.projectId, {
            type: 'prop',
            name: prop,
            category: 'props',
            customFields: {
              shotNumber: shot.shotNumber,
              description: `Prop for ${shot.shotNumber}`,
              difficulty: shot.difficulty
            }
          });
          createdItems.push({ type: 'prop', id: propElementId, name: prop });
        } catch (error) {
          errors.push(`Failed to create prop ${prop} for shot ${shot.shotNumber}: ${error}`);
        }
      }
    }

    return {
      success: true,
      message: `Shotlist processed. Created ${createdItems.length} equipment and prop elements. ${errors.length} errors occurred.`,
      data: {
        createdItems,
        errors,
        coverage: result.coverage,
        schedule: result.schedule
      }
    };
  } catch (error) {
    console.error('Error writing shotlist:', error);
    return {
      success: false,
      message: 'Failed to save shotlist',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Writes callsheet results to the database
 * @param result - Parsed callsheet result
 * @param options - Service write options
 * @returns Promise with write result
 */
export async function writeCallsheet(
  result: CallsheetResult,
  options: ServiceWriteOptions
): Promise<ServiceWriteResult> {
  try {
    if (!options.projectId) {
      return {
        success: false,
        message: 'Missing project ID',
        error: 'Project ID is required'
      };
    }

    // Create callsheet
    const callsheetId = await createCallSheet(options.projectId, {
      date: result.production.date,
      unitName: result.production.title,
      dayId: 'ai-generated', // This should be linked to an actual strip day
      locationId: 'ai-generated', // This should be linked to an actual location
      recipients: [], // This should be populated with actual contact IDs
      weather: {
        high: 75, // Default values, should be parsed from result
        low: 60,
        condition: result.production.weather || 'Clear',
        sunrise: result.production.sunrise,
        sunset: result.production.sunset
      },
      notes: result.notes.join('\n')
    });

    return {
      success: true,
      message: `Callsheet created successfully. ${result.cast.length} cast members, ${result.crew.length} crew members.`,
      data: {
        callsheetId,
        production: result.production,
        schedule: result.schedule,
        cast: result.cast,
        crew: result.crew
      }
    };
  } catch (error) {
    console.error('Error writing callsheet:', error);
    return {
      success: false,
      message: 'Failed to save callsheet',
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Automatically determines which service to use based on the quick action
 * @param actionId - The quick action ID
 * @param result - Parsed AI result
 * @param options - Service write options
 * @returns Promise with write result
 */
export async function writeAIResult(
  actionId: string,
  result: any,
  options: ServiceWriteOptions
): Promise<ServiceWriteResult> {
  switch (actionId) {
    case 'format-script':
      return writeScriptFormat(result as ScriptFormatResult, options);
    
    case 'breakdown-scene':
      return writeSceneBreakdown(result as BreakdownResult, options);
    
    case 'generate-shotlist':
      return writeShotlist(result as ShotlistResult, options);
    
    case 'generate-callsheet':
      return writeCallsheet(result as CallsheetResult, options);
    
    default:
      return {
        success: false,
        message: 'Unknown action type',
        error: `No service integration for action: ${actionId}`
      };
  }
}

/**
 * Validates that a result has the expected structure for a given action
 * @param actionId - The quick action ID
 * @param result - Parsed AI result
 * @returns True if result has expected structure
 */
export function validateAIResult(actionId: string, result: any): boolean {
  if (!result || typeof result !== 'object') {
    return false;
  }

  switch (actionId) {
    case 'format-script':
      return 'formattedScript' in result && 'issues' in result && 'improvements' in result && 'summary' in result;
    
    case 'breakdown-scene':
      return 'elements' in result && 'locations' in result && 'characters' in result && 'technical' in result && 'summary' in result;
    
    case 'generate-shotlist':
      return 'shots' in result && 'coverage' in result && 'schedule' in result;
    
    case 'generate-callsheet':
      return 'production' in result && 'schedule' in result && 'cast' in result && 'crew' in result;
    
    default:
      return false;
  }
}
