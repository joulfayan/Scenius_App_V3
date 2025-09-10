import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ChevronRight, X, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export default function ScriptOutline({ scenes, onSceneClick, onSceneReorder, onClose }) {
  const handleDragEnd = (result) => {
    if (!result.destination) return;
    
    const items = Array.from(scenes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    onSceneReorder(items);
  };

  const parseSceneHeading = (text) => {
    // Parse INT./EXT. LOCATION - TIME format
    const match = text.match(/^(INT|EXT|INT\.\/EXT)\.?\s+(.+?)\s*[-–—]\s*(.+)$/i);
    if (match) {
      return {
        intExt: match[1],
        location: match[2].trim(),
        time: match[3].trim()
      };
    }
    return { intExt: '', location: text, time: '' };
  };

  const getWordCount = (scene, allLines) => {
    const sceneIndex = scene.index;
    const nextSceneIndex = allLines.findIndex((line, i) => 
      i > sceneIndex && line.type === 'scene'
    );
    
    const sceneLines = nextSceneIndex === -1 
      ? allLines.slice(sceneIndex)
      : allLines.slice(sceneIndex, nextSceneIndex);
      
    return sceneLines.reduce((count, line) => 
      count + (line.text ? line.text.split(/\s+/).length : 0), 0
    );
  };

  return (
    <div className="w-80 h-full bg-white border-r border-gray-200 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Script Outline</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClose}
          className="p-1"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      {/* Scene List */}
      <ScrollArea className="flex-1">
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="scenes">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="p-2 space-y-1"
              >
                {scenes.map((scene, index) => {
                  const parsed = parseSceneHeading(scene.text);
                  const wordCount = getWordCount(scene, []);
                  
                  return (
                    <Draggable 
                      key={scene.id} 
                      draggableId={scene.id} 
                      index={index}
                    >
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group p-3 rounded-lg border cursor-pointer transition-all ${
                            snapshot.isDragging 
                              ? 'bg-blue-50 border-blue-300 shadow-lg' 
                              : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
                          }`}
                          onClick={() => onSceneClick(scene.id)}
                        >
                          <div className="flex items-start gap-2">
                            {/* Drag Handle */}
                            <div
                              {...provided.dragHandleProps}
                              className="mt-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <GripVertical className="w-3 h-3 text-gray-400" />
                            </div>
                            
                            <div className="flex-1 min-w-0">
                              {/* Scene Number */}
                              <div className="flex items-center gap-2 mb-1">
                                <Badge variant="outline" className="text-xs">
                                  {index + 1}
                                </Badge>
                                {parsed.intExt && (
                                  <Badge 
                                    variant="secondary" 
                                    className={`text-xs ${
                                      parsed.intExt.includes('INT') 
                                        ? 'bg-blue-100 text-blue-800' 
                                        : 'bg-yellow-100 text-yellow-800'
                                    }`}
                                  >
                                    {parsed.intExt}
                                  </Badge>
                                )}
                              </div>
                              
                              {/* Location */}
                              <div className="font-medium text-sm text-gray-800 truncate mb-1">
                                {parsed.location || scene.text}
                              </div>
                              
                              {/* Time and Stats */}
                              <div className="flex items-center justify-between text-xs text-gray-500">
                                <span>{parsed.time}</span>
                                <span>{wordCount} words</span>
                              </div>
                            </div>
                            
                            <ChevronRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                      )}
                    </Draggable>
                  );
                })}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      </ScrollArea>
    </div>
  );
}