
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { MoodBoard, MoodBoardAsset, MoodBoardItem } from '@/api/entities';
import { UploadFile } from '@/api/integrations';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Loader2, Upload, Image as ImageIcon, Type, Trash2, Lock, Unlock, 
  Layers, Move, RotateCw, Plus, X, Grid3x3, AlignLeft, AlignCenter, 
  AlignRight, Palette, StickyNote, ArrowUp, ArrowDown, Eye, EyeOff
} from 'lucide-react';
import { toast } from "sonner";
import { debounce } from 'lodash';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { snap } from '@/components/dnd/util';
import { announce } from '@/components/dnd/a11y';

const GRID_SIZE = 8;
const CANVAS_SIZE = { width: 4000, height: 3000 };

export default function MoodBoardEditor({ projectId }) {
  const [board, setBoard] = useState(null);
  const [items, setItems] = useState([]);
  const [assets, setAssets] = useState([]);
  const [selectedItemIds, setSelectedItemIds] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [draggedAsset, setDraggedAsset] = useState(null);
  const [isGridVisible, setIsGridVisible] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const [canvasViewport, setCanvasViewport] = useState({ x: 0, y: 0, scale: 1 });
  const [isMultiSelecting, setIsMultiSelecting] = useState(false);
  const [selectionBox, setSelectionBox] = useState(null);
  const canvasRef = useRef(null);
  const dragState = useRef({ isDragging: false, startPos: null, items: [] });
  const animationFrame = useRef(null);

  const loadBoard = useCallback(async () => {
    setIsLoading(true);
    try {
      let fetchedBoard = await MoodBoard.filter({ project_id: projectId }).then(b => b[0]);
      if (!fetchedBoard) {
        fetchedBoard = await MoodBoard.create({ 
          project_id: projectId, 
          title: "Main Mood Board",
          settings: {
            width: CANVAS_SIZE.width,
            height: CANVAS_SIZE.height,
            background_color: "#f8f9fa",
            grid_visible: true,
            grid_size: GRID_SIZE
          }
        });
      }
      setBoard(fetchedBoard);

      const [fetchedItems, fetchedAssets] = await Promise.all([
        MoodBoardItem.filter({ mood_board_id: fetchedBoard.id }, 'z_index'),
        MoodBoardAsset.filter({ project_id: projectId }, '-created_date'),
      ]);
      setItems(fetchedItems);
      setAssets(fetchedAssets);
    } catch (error) {
      console.error("Error loading mood board:", error);
      toast.error("Failed to load mood board.");
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  // Debounced persistence
  const debouncedSaveItem = useMemo(
    () => debounce((itemId, updates) => {
      try {
        MoodBoardItem.update(itemId, updates);
      } catch (error) {
        console.error("Failed to save item:", error);
      }
    }, 500),
    []
  );

  const updateItem = useCallback((itemId, updates, immediate = false) => {
    setItems(prev => prev.map(item => item.id === itemId ? { ...item, ...updates } : item));
    
    if (immediate) {
      debouncedSaveItem.cancel();
      try {
        MoodBoardItem.update(itemId, updates);
      } catch (error) {
        console.error("Failed to save item immediately:", error);
      }
    } else {
      debouncedSaveItem(itemId, updates);
    }
  }, [debouncedSaveItem]);

  const createItem = useCallback(async (itemData) => {
    try {
      const maxZ = items.length > 0 ? Math.max(...items.map(item => item.z_index || 0)) : 0;
      const newItem = await MoodBoardItem.create({
        mood_board_id: board.id,
        ...itemData,
        z_index: maxZ + 1
      });
      setItems(prev => [...prev, newItem]);
      return newItem;
    } catch (error) {
      console.error("Failed to create item:", error);
      toast.error("Failed to create item.");
      return null;
    }
  }, [board, items]);

  const deleteItems = useCallback(async (itemIds) => {
    try {
      await Promise.all(itemIds.map(id => MoodBoardItem.delete(id)));
      setItems(prev => prev.filter(item => !itemIds.includes(item.id)));
      setSelectedItemIds([]);
      announce(`${itemIds.length} item(s) deleted`);
    } catch (error) {
      console.error("Failed to delete items:", error);
      toast.error("Failed to delete items.");
    }
  }, []);

  // Handle file drops on canvas
  const handleCanvasDrop = useCallback(async (e) => {
    e.preventDefault();
    if (!board || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const canvasX = (e.clientX - canvasRect.left) / canvasViewport.scale - canvasViewport.x;
    const canvasY = (e.clientY - canvasRect.top) / canvasViewport.scale - canvasViewport.y;

    const x = snapToGrid ? snap(canvasX, GRID_SIZE) : canvasX;
    const y = snapToGrid ? snap(canvasY, GRID_SIZE) : canvasY;

    // Handle file drops
    if (e.dataTransfer.files?.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        try {
          const { file_url } = await UploadFile({ file });
          await createItem({
            type: 'image',
            x, y,
            width: 200,
            height: 150,
            content: file_url,
            styles: { caption: file.name }
          });
          toast.success("Image added to mood board.");
        } catch (error) {
          console.error("Failed to upload image:", error);
          toast.error("Failed to upload image.");
        }
      }
    }
    // Handle dragged assets
    else if (draggedAsset) {
      await createItem({
        type: 'image',
        x, y,
        width: 200,
        height: 150,
        content: draggedAsset.url,
        styles: { caption: draggedAsset.name }
      });
      toast.success("Asset added to mood board.");
    }

    setDraggedAsset(null);
  }, [board, canvasViewport, snapToGrid, createItem, draggedAsset]);

  // Keyboard handling
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (selectedItemIds.length === 0) return;

      let deltaX = 0, deltaY = 0;
      const step = e.shiftKey ? GRID_SIZE : 1;

      switch (e.key) {
        case 'ArrowUp': deltaY = -step; break;
        case 'ArrowDown': deltaY = step; break;
        case 'ArrowLeft': deltaX = -step; break;
        case 'ArrowRight': deltaX = step; break;
        case 'Delete':
        case 'Backspace':
          deleteItems(selectedItemIds);
          return;
        default: return;
      }

      if (deltaX !== 0 || deltaY !== 0) {
        e.preventDefault();
        selectedItemIds.forEach(itemId => {
          const item = items.find(i => i.id === itemId);
          if (item) {
            const newX = snapToGrid && !e.altKey ? snap(item.x + deltaX, GRID_SIZE) : item.x + deltaX;
            const newY = snapToGrid && !e.altKey ? snap(item.y + deltaY, GRID_SIZE) : item.y + deltaY;
            updateItem(itemId, { x: newX, y: newY });
          }
        });
        announce(`Moved ${selectedItemIds.length} item(s) by ${deltaX}, ${deltaY}`);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItemIds, items, snapToGrid, updateItem, deleteItems]);

  // Multi-selection with marquee
  const handleCanvasMouseDown = useCallback((e) => {
    if (e.target === canvasRef.current || e.target.classList.contains('mood-board-canvas')) {
      const rect = canvasRef.current.getBoundingClientRect();
      const startX = (e.clientX - rect.left) / canvasViewport.scale - canvasViewport.x;
      const startY = (e.clientY - rect.top) / canvasViewport.scale - canvasViewport.y;
      
      setIsMultiSelecting(true);
      setSelectionBox({ startX, startY, endX: startX, endY: startY });
      
      if (!e.shiftKey) {
        setSelectedItemIds([]);
      }
    }
  }, [canvasViewport]);

  const handleCanvasMouseMove = useCallback((e) => {
    if (isMultiSelecting && selectionBox) {
      const rect = canvasRef.current.getBoundingClientRect();
      const endX = (e.clientX - rect.left) / canvasViewport.scale - canvasViewport.x;
      const endY = (e.clientY - rect.top) / canvasViewport.scale - canvasViewport.y;
      
      setSelectionBox(prev => ({ ...prev, endX, endY }));
    }
  }, [isMultiSelecting, selectionBox, canvasViewport]);

  const handleCanvasMouseUp = useCallback(() => {
    if (isMultiSelecting && selectionBox) {
      const { startX, startY, endX, endY } = selectionBox;
      const minX = Math.min(startX, endX);
      const maxX = Math.max(startX, endX);
      const minY = Math.min(startY, endY);
      const maxY = Math.max(startY, endY);

      const selectedItems = items.filter(item => 
        item.x < maxX && item.x + item.width > minX &&
        item.y < maxY && item.y + item.height > minY
      );

      setSelectedItemIds(prev => [...new Set([...prev, ...selectedItems.map(item => item.id)])]);
      setSelectionBox(null);
    }
    setIsMultiSelecting(false);
  }, [isMultiSelecting, selectionBox, items]);

  // Toolbar functions
  const addTextNote = useCallback(async () => {
    await createItem({
      type: 'text',
      x: 100,
      y: 100,
      width: 200,
      height: 100,
      content: 'New note',
      styles: { fontSize: '16px', color: '#000000', backgroundColor: '#ffeb3b' }
    });
  }, [createItem]);

  const addColorSwatch = useCallback(async () => {
    await createItem({
      type: 'color',
      x: 100,
      y: 100,
      width: 100,
      height: 100,
      content: '#e3f2fd',
      styles: {}
    });
  }, [createItem]);

  const alignItems = useCallback((alignment) => {
    if (selectedItemIds.length < 2) return;

    const selectedItems = items.filter(item => selectedItemIds.includes(item.id));
    let referenceValue;

    switch (alignment) {
      case 'left':
        referenceValue = Math.min(...selectedItems.map(item => item.x));
        selectedItems.forEach(item => updateItem(item.id, { x: referenceValue }));
        break;
      case 'center':
        const centerX = (Math.min(...selectedItems.map(item => item.x)) + 
                       Math.max(...selectedItems.map(item => item.x + item.width))) / 2;
        selectedItems.forEach(item => updateItem(item.id, { x: centerX - item.width / 2 }));
        break;
      case 'right':
        referenceValue = Math.max(...selectedItems.map(item => item.x + item.width));
        selectedItems.forEach(item => updateItem(item.id, { x: referenceValue - item.width }));
        break;
    }
    announce(`Aligned ${selectedItems.length} items ${alignment}`);
  }, [selectedItemIds, items, updateItem]);

  const changeZOrder = useCallback((direction) => {
    selectedItemIds.forEach(itemId => {
      const item = items.find(i => i.id === itemId);
      if (item) {
        const newZ = direction === 'forward' ? item.z_index + 1 : Math.max(0, item.z_index - 1);
        updateItem(itemId, { z_index: newZ }, true);
      }
    });
  }, [selectedItemIds, items, updateItem]);

  // Canvas Item Component
  const CanvasItem = ({ item }) => {
    const isSelected = selectedItemIds.includes(item.id);
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const itemRef = useRef(null);

    const handleItemMouseDown = useCallback((e) => {
      e.stopPropagation();
      if (!e.shiftKey) {
        setSelectedItemIds([item.id]);
      } else {
        setSelectedItemIds(prev => 
          prev.includes(item.id) 
            ? prev.filter(id => id !== item.id)
            : [...prev, item.id]
        );
      }
    }, [item.id]);

    const style = {
      position: 'absolute',
      left: item.x,
      top: item.y,
      width: item.width,
      height: item.height,
      transform: item.rotation ? `rotate(${item.rotation}deg)` : undefined,
      opacity: item.opacity || 1,
      zIndex: item.z_index || 1,
      cursor: isDragging ? 'grabbing' : 'grab',
      border: isSelected ? '2px solid #3b82f6' : 'none',
      borderRadius: '4px'
    };

    return (
      <div
        ref={itemRef}
        style={style}
        onMouseDown={handleItemMouseDown}
        role={item.type === 'text' ? 'note' : 'img'}
        aria-label={item.styles?.caption || item.content}
        className="mood-board-item"
      >
        {item.type === 'image' && (
          <img 
            src={item.content} 
            alt={item.styles?.caption || 'Mood board image'}
            className="w-full h-full object-cover rounded"
            draggable={false}
          />
        )}
        {item.type === 'text' && (
          <div 
            className="w-full h-full p-2 rounded"
            style={{
              backgroundColor: item.styles?.backgroundColor || '#ffeb3b',
              color: item.styles?.color || '#000000',
              fontSize: item.styles?.fontSize || '16px'
            }}
          >
            {item.content}
          </div>
        )}
        {item.type === 'color' && (
          <div 
            className="w-full h-full rounded border border-gray-300"
            style={{ backgroundColor: item.content }}
          />
        )}

        {/* Resize handles for selected items */}
        {isSelected && (
          <>
            <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
            <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
          </>
        )}
      </div>
    );
  };

  // Properties panel for selected items
  const PropertiesPanel = () => {
    if (selectedItemIds.length === 0) return null;

    const selectedItem = items.find(item => selectedItemIds.includes(item.id));
    if (!selectedItem) return null;

    return (
      <div className="w-72 p-4 border-l space-y-4" style={{
        background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
      }}>
        <h3 className="font-semibold text-gray-800">Properties</h3>
        
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-xs">X Position</Label>
            <Input
              type="number"
              value={Math.round(selectedItem.x)}
              onChange={(e) => updateItem(selectedItem.id, { x: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label className="text-xs">Y Position</Label>
            <Input
              type="number"
              value={Math.round(selectedItem.y)}
              onChange={(e) => updateItem(selectedItem.id, { y: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div>
            <Label className="text-xs">Width</Label>
            <Input
              type="number"
              value={Math.round(selectedItem.width)}
              onChange={(e) => updateItem(selectedItem.id, { width: parseInt(e.target.value) || 20 })}
            />
          </div>
          <div>
            <Label className="text-xs">Height</Label>
            <Input
              type="number"
              value={Math.round(selectedItem.height)}
              onChange={(e) => updateItem(selectedItem.id, { height: parseInt(e.target.value) || 20 })}
            />
          </div>
        </div>

        <div>
          <Label className="text-xs">Rotation</Label>
          <Input
            type="range"
            min="-180"
            max="180"
            value={selectedItem.rotation || 0}
            onChange={(e) => updateItem(selectedItem.id, { rotation: parseInt(e.target.value) })}
          />
        </div>

        <div>
          <Label className="text-xs">Opacity</Label>
          <Input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={selectedItem.opacity || 1}
            onChange={(e) => updateItem(selectedItem.id, { opacity: parseFloat(e.target.value) })}
          />
        </div>

        {selectedItem.type === 'text' && (
          <div>
            <Label className="text-xs">Text Content</Label>
            <Textarea
              value={selectedItem.content}
              onChange={(e) => updateItem(selectedItem.id, { content: e.target.value })}
              rows={3}
            />
          </div>
        )}

        <Button 
          onClick={() => deleteItems([selectedItem.id])}
          variant="outline"
          className="w-full text-red-600 hover:text-red-700"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          Delete Item
        </Button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full">
      {/* Main Canvas Area */}
      <div className="flex-1 flex flex-col">
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b bg-white">
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={addTextNote}>
              <StickyNote className="w-4 h-4 mr-1" />
              Note
            </Button>
            <Button size="sm" onClick={addColorSwatch}>
              <Palette className="w-4 h-4 mr-1" />
              Color
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Button size="sm" onClick={() => alignItems('left')} disabled={selectedItemIds.length < 2}>
              <AlignLeft className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => alignItems('center')} disabled={selectedItemIds.length < 2}>
              <AlignCenter className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => alignItems('right')} disabled={selectedItemIds.length < 2}>
              <AlignRight className="w-4 h-4" />
            </Button>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <Button size="sm" onClick={() => changeZOrder('forward')} disabled={selectedItemIds.length === 0}>
              <ArrowUp className="w-4 h-4" />
            </Button>
            <Button size="sm" onClick={() => changeZOrder('backward')} disabled={selectedItemIds.length === 0}>
              <ArrowDown className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button 
              size="sm" 
              variant={isGridVisible ? "default" : "outline"}
              onClick={() => setIsGridVisible(!isGridVisible)}
            >
              {isGridVisible ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </Button>
            <Button 
              size="sm" 
              variant={snapToGrid ? "default" : "outline"}
              onClick={() => setSnapToGrid(!snapToGrid)}
            >
              <Grid3x3 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Canvas */}
        <div 
          ref={canvasRef}
          className="flex-1 relative overflow-hidden mood-board-canvas"
          style={{ 
            backgroundColor: board?.settings?.background_color || '#f8f9fa',
            backgroundImage: isGridVisible ? 
              `radial-gradient(circle, #ddd 1px, transparent 1px)` : 'none',
            backgroundSize: isGridVisible ? `${GRID_SIZE}px ${GRID_SIZE}px` : 'auto'
          }}
          onDrop={handleCanvasDrop}
          onDragOver={(e) => e.preventDefault()}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
        >
          {/* Canvas Items */}
          {items.map(item => (
            <CanvasItem key={item.id} item={item} />
          ))}

          {/* Selection box */}
          {selectionBox && (
            <div
              className="absolute border-2 border-blue-500 bg-blue-200 bg-opacity-25 pointer-events-none"
              style={{
                left: Math.min(selectionBox.startX, selectionBox.endX),
                top: Math.min(selectionBox.startY, selectionBox.endY),
                width: Math.abs(selectionBox.endX - selectionBox.startX),
                height: Math.abs(selectionBox.endY - selectionBox.startY)
              }}
            />
          )}
        </div>
      </div>

      {/* Asset Library Sidebar */}
      <div className="w-64 border-l bg-gray-50 p-4">
        <h3 className="font-semibold text-gray-800 mb-4">Assets</h3>
        <div className="space-y-2">
          {assets.map(asset => (
            <div
              key={asset.id}
              draggable
              onDragStart={() => setDraggedAsset(asset)}
              className="p-2 rounded-lg cursor-grab hover:bg-gray-100 transition-colors"
            >
              <img 
                src={asset.thumbnail_url || asset.url} 
                alt={asset.name}
                className="w-full h-20 object-cover rounded mb-2"
              />
              <p className="text-sm text-gray-700 truncate">{asset.name}</p>
            </div>
          ))}
        </div>

        <div className="mt-4">
          <input
            type="file"
            accept="image/*"
            onChange={async (e) => {
              const file = e.target.files[0];
              if (file) {
                try {
                  const { file_url } = await UploadFile({ file });
                  const newAsset = await MoodBoardAsset.create({
                    project_id: projectId,
                    name: file.name,
                    url: file_url,
                    thumbnail_url: file_url
                  });
                  setAssets(prev => [newAsset, ...prev]);
                  toast.success("Asset uploaded successfully.");
                } catch (error) {
                  console.error("Failed to upload asset:", error);
                  toast.error("Failed to upload asset.");
                }
              }
            }}
            className="hidden"
            id="asset-upload"
          />
          <Label
            htmlFor="asset-upload"
            className="flex items-center justify-center w-full px-4 py-2 border border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100"
          >
            <Upload className="w-4 h-4 mr-2" />
            Upload Asset
          </Label>
        </div>
      </div>

      {/* Properties Panel */}
      <PropertiesPanel />
    </div>
  );
}
