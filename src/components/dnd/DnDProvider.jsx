
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { DragDropContext } from '@hello-pangea/dnd';
import { A11yAnnouncer, announce } from './a11y';
import { featureFlags } from '@/components/featureFlags';

const DnDStateContext = createContext(null);

/**
 * This provider sets up the drag-and-drop context for the application.
 * It handles the core onDragStart and onDragEnd logic.
 * Components that contain draggable lists should use the `useDnD` hook
 * to register their state and update logic.
 */
export function DnDProvider({ children }) {
  const [registeredLists, setRegisteredLists] = useState({});

  const registerList = useCallback((listId, listData, onUpdate) => {
    setRegisteredLists(prev => ({
      ...prev,
      [listId]: { listData, onUpdate },
    }));
  }, []);

  const unregisterList = useCallback((listId) => {
    setRegisteredLists(prev => {
      const { [listId]: _, ...rest } = prev;
      return rest;
    });
  }, []);

  const onDragStart = useCallback((start) => {
    document.body.classList.add('dragging');
    const sourceList = registeredLists[start.source.droppableId];
    const item = sourceList?.listData[start.source.index];
    const itemName = item?.title || item?.name || `item`;
    announce(`Picked up ${itemName}, in position ${start.source.index + 1} of ${sourceList?.listData.length}. Use arrow keys to move.`);
  }, [registeredLists]);

  const onDragEnd = useCallback((result) => {
    document.body.classList.remove('dragging');
    const { source, destination, draggableId } = result;

    if (!destination) {
      announce('Drag cancelled. Item returned to starting position.');
      return;
    }

    if (source.droppableId === destination.droppableId && source.index === destination.index) {
      // Item was dropped in the same place
      return;
    }

    const sourceListInfo = registeredLists[source.droppableId];
    const destListInfo = registeredLists[destination.droppableId];
    const item = sourceListInfo?.listData[source.index];
    const itemName = item?.title || item?.name || `item`;

    if (!sourceListInfo) {
      console.error(`DND Error: No registered list found for source ID: ${source.droppableId}`);
      announce('Drag failed. Source list not found.');
      return;
    }
    
    // Announce the move
    announce(`Moved ${itemName} from position ${source.index + 1} to position ${destination.index + 1} in ${destListInfo ? 'list ' + destination.droppableId : 'its original list'}.`);
    
    // Delegate the state update to the registered component's handler
    sourceListInfo.onUpdate(result);
    
  }, [registeredLists]);

  if (!featureFlags.dnd) {
    return <>{children}</>;
  }

  const contextValue = { registerList, unregisterList };

  return (
    <DnDStateContext.Provider value={contextValue}>
      <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
        {children}
        <A11yAnnouncer />
      </DragDropContext>
    </DnDStateContext.Provider>
  );
}

/**
 * Hook for child components to register their draggable lists with the central provider.
 * @param {object} params
 * @param {string} params.listId - A unique ID for the droppable list.
 * @param {Array<any>} params.listData - The array of data for the list.
 * @param {(result: import('@hello-pangea/dnd').DropResult) => void} params.onUpdate - The callback function to handle the state update after a drag ends.
 */
export const useDnD = ({ listId, listData, onUpdate }) => {
  const { registerList, unregisterList } = useContext(DnDStateContext);

  useEffect(() => {
    if (registerList) {
      registerList(listId, listData, onUpdate);
    }
    return () => {
      if (unregisterList) {
        unregisterList(listId);
      }
    };
  }, [listId, listData, onUpdate, registerList, unregisterList]);
};
