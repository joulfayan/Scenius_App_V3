/**
 * @typedef {string} DraggableID
 * A unique identifier for a draggable item.
 * Recommended format: `${DragKind}:${string}` (e.g., 'shot:shot-abc-123')
 */

/**
 * @typedef {string} DroppableID
 * A unique identifier for a droppable area.
 * Recommended format: `${DragKind}List:${string}` (e.g., 'shotList:scene-1')
 */

/**
 * @typedef {'callSheetRow' | 'asset' | 'storyCard' | 'shot' | 'lane' | 'beat'} DragKind
 * Represents the type of item being dragged to distinguish logic in handlers.
 */

export {};