// Context loaders for AI Assistant
// These functions fetch relevant project data to provide context to the AI

import { getScript, subscribeScript } from '../../services/scripts';
import { listScenes } from '../../services/scenes';
import { listElements, getElement } from '../../services/elements';
import { getProject } from '../../services/projects';

export interface ScriptExcerptOptions {
  maxChars?: number;
  includeMetadata?: boolean;
}

export interface ScenesSummaryOptions {
  limit?: number;
  includeElements?: boolean;
}

export interface CatalogSummaryOptions {
  limit?: number;
  groupByType?: boolean;
  groupByCategory?: boolean;
}

export interface ScriptExcerpt {
  id: string;
  content: string;
  version: number;
  durationMins: number;
  excerpt: string;
  totalChars: number;
  excerptChars: number;
}

export interface SceneSummary {
  id: string;
  number: number;
  heading: string;
  locationType: string;
  timeOfDay: string;
  durationMins: number;
  elementCount: number;
  elementTypes: string[];
}

export interface CatalogSummary {
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

/**
 * Gets a script excerpt with character limit
 * @param projectId - The project ID
 * @param scriptId - The script ID
 * @param options - Configuration options
 * @returns Promise with script excerpt data
 */
export async function getScriptExcerpt(
  projectId: string,
  scriptId: string,
  options: ScriptExcerptOptions = {}
): Promise<ScriptExcerpt | null> {
  const { maxChars = 2000, includeMetadata = true } = options;

  try {
    const script = await getScript(projectId, scriptId);
    if (!script) {
      return null;
    }

    const totalChars = script.content.length;
    let excerpt = script.content;
    let excerptChars = totalChars;

    // Truncate if content exceeds maxChars
    if (totalChars > maxChars) {
      excerpt = script.content.substring(0, maxChars);
      excerptChars = maxChars;
      
      // Try to end at a sentence boundary
      const lastSentenceEnd = excerpt.lastIndexOf('.');
      const lastNewline = excerpt.lastIndexOf('\n');
      const lastBreak = Math.max(lastSentenceEnd, lastNewline);
      
      if (lastBreak > maxChars * 0.8) {
        excerpt = excerpt.substring(0, lastBreak + 1);
        excerptChars = lastBreak + 1;
      }
    }

    return {
      id: script.id,
      content: script.content,
      version: script.version,
      durationMins: script.durationMins,
      excerpt,
      totalChars,
      excerptChars
    };
  } catch (error) {
    console.error('Error fetching script excerpt:', error);
    return null;
  }
}

/**
 * Gets a summary of scenes for the project
 * @param projectId - The project ID
 * @param options - Configuration options
 * @returns Promise with scenes summary data
 */
export async function getScenesSummary(
  projectId: string,
  options: ScenesSummaryOptions = {}
): Promise<SceneSummary[]> {
  const { limit = 10, includeElements = true } = options;

  try {
    const scenes = await listScenes(projectId);
    
    // Sort by scene number and limit results
    const sortedScenes = scenes
      .sort((a, b) => a.number - b.number)
      .slice(0, limit);

    const summaries: SceneSummary[] = [];

    for (const scene of sortedScenes) {
      let elementCount = 0;
      let elementTypes: string[] = [];

      if (includeElements && scene.elementIds.length > 0) {
        try {
          // Get elements for this scene
          const elements = await Promise.all(
            scene.elementIds.map(elementId => 
              getElement(projectId, elementId).catch(() => null)
            )
          );
          
          const validElements = elements.filter(Boolean);
          elementCount = validElements.length;
          
          // Get unique element types
          const types = new Set<string>();
          validElements.forEach(element => {
            if (element && element.type) {
              types.add(element.type);
            }
          });
          elementTypes = Array.from(types);
        } catch (error) {
          console.warn('Error fetching elements for scene:', scene.id, error);
          elementCount = scene.elementIds.length;
        }
      }

      summaries.push({
        id: scene.id,
        number: scene.number,
        heading: scene.heading,
        locationType: scene.locationType,
        timeOfDay: scene.timeOfDay,
        durationMins: scene.durationMins,
        elementCount,
        elementTypes
      });
    }

    return summaries;
  } catch (error) {
    console.error('Error fetching scenes summary:', error);
    return [];
  }
}

/**
 * Gets a summary of the project catalog (elements)
 * @param projectId - The project ID
 * @param options - Configuration options
 * @returns Promise with catalog summary data
 */
export async function getCatalogSummary(
  projectId: string,
  options: CatalogSummaryOptions = {}
): Promise<CatalogSummary> {
  const { limit = 20, groupByType = true, groupByCategory = true } = options;

  try {
    const elements = await listElements(projectId);
    
    // Group by type
    const elementsByType: Record<string, number> = {};
    const elementsByCategory: Record<string, number> = {};
    
    elements.forEach(element => {
      // Count by type
      if (groupByType) {
        elementsByType[element.type] = (elementsByType[element.type] || 0) + 1;
      }
      
      // Count by category
      if (groupByCategory) {
        elementsByCategory[element.category] = (elementsByCategory[element.category] || 0) + 1;
      }
    });

    // Get recent elements (limit to specified number)
    const recentElements = elements
      .sort((a, b) => {
        // Sort by updatedAt if available, otherwise by createdAt
        const aTime = a.updatedAt || a.createdAt;
        const bTime = b.updatedAt || b.createdAt;
        return bTime - aTime;
      })
      .slice(0, limit)
      .map(element => ({
        id: element.id,
        name: element.name,
        type: element.type,
        category: element.category
      }));

    return {
      totalElements: elements.length,
      elementsByType,
      elementsByCategory,
      recentElements
    };
  } catch (error) {
    console.error('Error fetching catalog summary:', error);
    return {
      totalElements: 0,
      elementsByType: {},
      elementsByCategory: {},
      recentElements: []
    };
  }
}

/**
 * Gets comprehensive project context for AI assistant
 * @param projectId - The project ID
 * @param options - Configuration options
 * @returns Promise with comprehensive project context
 */
export async function getProjectContext(
  projectId: string,
  options: {
    scriptId?: string;
    maxScriptChars?: number;
    scenesLimit?: number;
    catalogLimit?: number;
  } = {}
): Promise<{
  project: any;
  script?: ScriptExcerpt;
  scenes: SceneSummary[];
  catalog: CatalogSummary;
}> {
  try {
    // Fetch project info
    const project = await getProject(projectId);
    
    // Fetch script if scriptId provided
    let script: ScriptExcerpt | undefined;
    if (options.scriptId) {
      script = await getScriptExcerpt(projectId, options.scriptId, {
        maxChars: options.maxScriptChars || 2000
      }) || undefined;
    }
    
    // Fetch scenes summary
    const scenes = await getScenesSummary(projectId, {
      limit: options.scenesLimit || 10
    });
    
    // Fetch catalog summary
    const catalog = await getCatalogSummary(projectId, {
      limit: options.catalogLimit || 20
    });

    return {
      project,
      script,
      scenes,
      catalog
    };
  } catch (error) {
    console.error('Error fetching project context:', error);
    throw error;
  }
}

/**
 * Formats project context for AI consumption
 * @param context - Project context data
 * @returns Formatted string for AI system prompt
 */
export function formatProjectContext(context: {
  project: any;
  script?: ScriptExcerpt;
  scenes: SceneSummary[];
  catalog: CatalogSummary;
}): string {
  let contextText = `Project Context for "${context.project?.name || 'Unknown Project'}":\n\n`;

  // Add script context
  if (context.script) {
    contextText += `SCRIPT EXCERPT (Version ${context.script.version}, ${context.script.durationMins} mins):\n`;
    contextText += `"${context.script.excerpt}"\n`;
    if (context.script.totalChars > context.script.excerptChars) {
      contextText += `[Note: This is an excerpt of ${context.script.excerptChars}/${context.script.totalChars} characters]\n\n`;
    } else {
      contextText += '\n';
    }
  }

  // Add scenes context
  if (context.scenes.length > 0) {
    contextText += `SCENES SUMMARY (${context.scenes.length} scenes):\n`;
    context.scenes.forEach(scene => {
      contextText += `- Scene ${scene.number}: ${scene.heading} (${scene.locationType}, ${scene.timeOfDay}, ${scene.durationMins}min)`;
      if (scene.elementCount > 0) {
        contextText += ` [${scene.elementCount} elements: ${scene.elementTypes.join(', ')}]`;
      }
      contextText += '\n';
    });
    contextText += '\n';
  }

  // Add catalog context
  if (context.catalog.totalElements > 0) {
    contextText += `CATALOG SUMMARY (${context.catalog.totalElements} total elements):\n`;
    
    if (Object.keys(context.catalog.elementsByType).length > 0) {
      contextText += 'By Type:\n';
      Object.entries(context.catalog.elementsByType).forEach(([type, count]) => {
        contextText += `- ${type}: ${count}\n`;
      });
    }
    
    if (Object.keys(context.catalog.elementsByCategory).length > 0) {
      contextText += 'By Category:\n';
      Object.entries(context.catalog.elementsByCategory).forEach(([category, count]) => {
        contextText += `- ${category}: ${count}\n`;
      });
    }
    
    if (context.catalog.recentElements.length > 0) {
      contextText += 'Recent Elements:\n';
      context.catalog.recentElements.forEach(element => {
        contextText += `- ${element.name} (${element.type}/${element.category})\n`;
      });
    }
    contextText += '\n';
  }

  contextText += 'Use this context to provide relevant, project-specific assistance.';
  
  return contextText;
}
