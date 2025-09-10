
import React, { useState, useEffect, useCallback, useRef } from "react";
import { StoryboardFrame, MediaAsset } from "@/api/entities";
import { UploadFile } from "@/api/integrations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, Upload, Trash2, GripVertical, Image as ImageIcon, Camera, 
  Clock, Edit3, Search, MoreHorizontal, Copy, Scissors, Play,
  ChevronDown, ChevronRight, Layers, Move3D, Loader2
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { reorder, move } from "@/components/dnd/util";
import { save } from "@/components/dnd/persistence";
import { announce } from "@/components/dnd/a11y";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { featureFlags } from "@/components/featureFlags";

export default function StoryboardEditor({ projectId }) {
  const [sequences, setSequences] = useState({});
  const [shots, setShots] = useState({});
  const [sequenceOrder, setSequenceOrder] = useState([]);
  const [assets, setAssets] = useState([]);
  const [filteredAssets, setFilteredAssets] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedShotId, setSelectedShotId] = useState(null);
  const [expandedSequences, setExpandedSequences] = useState(new Set());
  const containerRef = useRef(null);

  const loadStoryboard = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load storyboard frames and convert to new structure
      const fetchedFrames = await StoryboardFrame.filter({ project_id: projectId }, 'order');
      const fetchedAssets = await MediaAsset.filter({ project_id: projectId }, '-created_date');
      
      // Initialize with existing frames or create default sequence
      if (fetchedFrames.length > 0) {
        const defaultSeqId = 'seq-01';
        const newSequences = {
          [defaultSeqId]: {
            name: 'Sequence 01',
            shotIds: fetchedFrames.map(f => f.id)
          }
        };
        
        const newShots = {};
        fetchedFrames.forEach(frame => {
          newShots[frame.id] = {
            id: frame.id,
            assetId: frame.image_url,
            description: frame.description || '',
            duration: frame.duration || 3,
            camera: frame.camera_notes || '',
            lens: '',
            notes: '',
            thumbnailUrl: frame.image_url
          };
        });
        
        setSequences(newSequences);
        setShots(newShots);
        setSequenceOrder([defaultSeqId]);
        setExpandedSequences(new Set([defaultSeqId]));
      } else {
        // Create initial empty sequence
        const defaultSeqId = 'seq-01';
        setSequences({
          [defaultSeqId]: { name: 'Sequence 01', shotIds: [] }
        });
        setSequenceOrder([defaultSeqId]);
        setExpandedSequences(new Set([defaultSeqId]));
      }
      
      setAssets(fetchedAssets);
      setFilteredAssets(fetchedAssets);
    } catch (error) {
      console.error('Error loading storyboard:', error);
      toast.error('Failed to load storyboard.');
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadStoryboard();
  }, [loadStoryboard]);

  // Filter assets based on search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredAssets(assets);
    } else {
      const filtered = assets.filter(asset => 
        asset.file_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (asset.description && asset.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      setFilteredAssets(filtered);
    }
  }, [assets, searchQuery]);

  const createSequence = useCallback(() => {
    const newSeqId = `seq-${String(Object.keys(sequences).length + 1).padStart(2, '0')}`;
    const newSequence = {
      name: `Sequence ${String(Object.keys(sequences).length + 1).padStart(2, '0')}`,
      shotIds: []
    };
    
    setSequences(prev => ({ ...prev, [newSeqId]: newSequence }));
    setSequenceOrder(prev => [...prev, newSeqId]);
    setExpandedSequences(prev => new Set([...prev, newSeqId]));
    
    announce(`New sequence created: ${newSequence.name}`);
  }, [sequences]);

  const createShotFromAsset = useCallback(async (assetId, sequenceId, insertIndex) => {
    try {
      const asset = assets.find(a => a.id === assetId);
      if (!asset) return;

      const newShot = await StoryboardFrame.create({
        project_id: projectId,
        shot_number: 1, // Will be auto-calculated
        image_url: asset.file_url,
        description: `Shot with ${asset.file_name}`,
        camera_notes: '',
        duration: 3,
        order: insertIndex
      });

      const shotData = {
        id: newShot.id,
        assetId: asset.id,
        description: `Shot with ${asset.file_name}`,
        duration: 3,
        camera: '',
        lens: '',
        notes: '',
        thumbnailUrl: asset.file_url
      };

      setShots(prev => ({ ...prev, [newShot.id]: shotData }));
      setSequences(prev => {
        const sequence = prev[sequenceId];
        const newShotIds = [...sequence.shotIds];
        newShotIds.splice(insertIndex, 0, newShot.id);
        return {
          ...prev,
          [sequenceId]: { ...sequence, shotIds: newShotIds }
        };
      });

      announce(`Shot created from ${asset.file_name}`);
      return newShot.id;
    } catch (error) {
      console.error('Error creating shot:', error);
      toast.error('Failed to create shot.');
      return null;
    }
  }, [assets, projectId]);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const { source, destination, draggableId, type } = result;

    if (type === 'SEQUENCES') {
      // Reorder sequences
      const newOrder = reorder(sequenceOrder, source.index, destination.index);
      setSequenceOrder(newOrder);
      announce(`Sequence moved to position ${destination.index + 1}`);
      
      if (featureFlags.dnd) {
        save({
          Entity: StoryboardFrame, // We'll need a Storyboard entity for this
          docId: projectId,
          payload: { sequenceOrder: newOrder },
          onSuccess: () => console.log('Sequence order saved'),
          onFailure: (error) => {
            setSequenceOrder(sequenceOrder);
            announce('Failed to save sequence order');
          }
        });
      }
    }
    
    else if (type === 'SHOTS') {
      const sourceSeqId = source.droppableId.replace('STORY:LANE:', '');
      const destSeqId = destination.droppableId.replace('STORY:LANE:', '');

      if (sourceSeqId === destSeqId) {
        // Reorder within same sequence
        const sequence = sequences[sourceSeqId];
        const newShotIds = reorder(sequence.shotIds, source.index, destination.index);
        
        setSequences(prev => ({
          ...prev,
          [sourceSeqId]: { ...sequence, shotIds: newShotIds }
        }));
        
        announce(`Shot reordered within ${sequence.name}`);
      } else {
        // Move between sequences
        const sourceSeq = sequences[sourceSeqId];
        const destSeq = sequences[destSeqId];
        
        const result = move(sourceSeq.shotIds, destSeq.shotIds, source.index, destination.index);
        
        setSequences(prev => ({
          ...prev,
          [sourceSeqId]: { ...sourceSeq, shotIds: result.source },
          [destSeqId]: { ...destSeq, shotIds: result.destination }
        }));
        
        announce(`Shot moved from ${sourceSeq.name} to ${destSeq.name}`);
      }

      if (featureFlags.dnd) {
        save({
          Entity: StoryboardFrame,
          docId: draggableId,
          payload: { updated_date: new Date().toISOString() },
          onSuccess: () => console.log('Shot order saved'),
          onFailure: (error) => {
            loadStoryboard(); // Reload on failure
            announce('Failed to save shot order');
          }
        });
      }
    }
    
    else if (type === 'ASSETS') {
      // Create shot from asset
      const destSeqId = destination.droppableId.replace('STORY:LANE:', '');
      if (destSeqId) {
        createShotFromAsset(draggableId, destSeqId, destination.index);
      }
    }
  }, [sequences, sequenceOrder, createShotFromAsset, loadStoryboard]);

  const duplicateShot = useCallback(async (shotId) => {
    try {
      const originalShot = shots[shotId];
      if (!originalShot) return;

      const newShot = await StoryboardFrame.create({
        project_id: projectId,
        shot_number: 1,
        image_url: originalShot.thumbnailUrl,
        description: `${originalShot.description} (Copy)`,
        camera_notes: originalShot.camera,
        duration: originalShot.duration,
        order: 0
      });

      const newShotData = {
        ...originalShot,
        id: newShot.id,
        description: `${originalShot.description} (Copy)`
      };

      setShots(prev => ({ ...prev, [newShot.id]: newShotData }));
      
      // Add to same sequence as original
      const sequenceId = Object.keys(sequences).find(seqId => 
        sequences[seqId].shotIds.includes(shotId)
      );
      
      if (sequenceId) {
        setSequences(prev => {
          const sequence = prev[sequenceId];
          const shotIndex = sequence.shotIds.indexOf(shotId);
          const newShotIds = [...sequence.shotIds];
          newShotIds.splice(shotIndex + 1, 0, newShot.id);
          return {
            ...prev,
            [sequenceId]: { ...sequence, shotIds: newShotIds }
          };
        });
      }

      toast.success('Shot duplicated successfully');
      announce('Shot duplicated');
    } catch (error) {
      console.error('Error duplicating shot:', error);
      toast.error('Failed to duplicate shot');
    }
  }, [shots, sequences, projectId]);

  const deleteShot = useCallback(async (shotId) => {
    try {
      await StoryboardFrame.delete(shotId);
      
      setShots(prev => {
        const newShots = { ...prev };
        delete newShots[shotId];
        return newShots;
      });
      
      setSequences(prev => {
        const newSequences = { ...prev };
        Object.keys(newSequences).forEach(seqId => {
          newSequences[seqId] = {
            ...newSequences[seqId],
            shotIds: newSequences[seqId].shotIds.filter(id => id !== shotId)
          };
        });
        return newSequences;
      });

      if (selectedShotId === shotId) {
        setSelectedShotId(null);
      }

      toast.success('Shot deleted successfully');
      announce('Shot deleted');
    } catch (error) {
      console.error('Error deleting shot:', error);
      toast.error('Failed to delete shot');
    }
  }, [selectedShotId]);

  const toggleSequenceExpanded = useCallback((seqId) => {
    setExpandedSequences(prev => {
      const newSet = new Set(prev);
      if (newSet.has(seqId)) {
        newSet.delete(seqId);
      } else {
        newSet.add(seqId);
      }
      return newSet;
    });
  }, []);

  const calculateSequenceDuration = useCallback((shotIds) => {
    return shotIds.reduce((total, shotId) => {
      const shot = shots[shotId];
      return total + (shot?.duration || 0);
    }, 0);
  }, [shots]);

  const calculateTotalDuration = useCallback(() => {
    return Object.values(sequences).reduce((total, sequence) => {
      return total + calculateSequenceDuration(sequence.shotIds);
    }, 0);
  }, [sequences, calculateSequenceDuration]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${String(secs).padStart(2, '0')}`;
  };

  // Asset Tray Component
  const AssetTray = () => (
    <div className="w-80 h-full border-r border-gray-200 flex flex-col" style={{
      background: 'linear-gradient(145deg, #f8f9fa, #e9ecef)',
    }}>
      <div className="p-4 border-b border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-3">Media Library</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <Input
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <Droppable droppableId="STORY:ASSETS" type="ASSETS" isDropDisabled>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className="flex-1 overflow-y-auto p-4"
          >
            <div className="grid grid-cols-2 gap-3">
              {filteredAssets.map((asset, index) => (
                <Draggable key={asset.id} draggableId={asset.id} index={index} type="ASSETS">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      className={`group relative aspect-video rounded-lg overflow-hidden cursor-grab transition-all duration-200 ${
                        snapshot.isDragging ? 'scale-105 shadow-2xl z-50' : 'hover:scale-105'
                      }`}
                      style={{
                        background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
                        boxShadow: snapshot.isDragging 
                          ? '8px 8px 16px rgba(0,0,0,0.3)' 
                          : '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)',
                        ...provided.draggableProps.style
                      }}
                    >
                      {asset.file_url ? (
                        <img 
                          src={asset.file_url} 
                          alt={asset.file_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="w-8 h-8 text-gray-400" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-end">
                        <div className="p-2 text-white text-xs font-medium truncate w-full bg-gradient-to-t from-black/50">
                          {asset.file_name}
                        </div>
                      </div>
                    </div>
                  )}
                </Draggable>
              ))}
            </div>
            {provided.placeholder}
            {filteredAssets.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                <ImageIcon className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>{searchQuery ? 'No assets match your search' : 'No assets uploaded yet'}</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  );

  // Shot Card Component
  const ShotCard = ({ shot, shotNumber, index, sequenceId }) => (
    <Draggable draggableId={shot.id} index={index} type="SHOTS">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group relative flex-shrink-0 w-64 rounded-2xl overflow-hidden transition-all duration-200 ${
            snapshot.isDragging ? 'scale-105 shadow-2xl z-50' : 'hover:scale-105'
          } ${selectedShotId === shot.id ? 'ring-2 ring-blue-500' : ''}`}
          style={{
            background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
            boxShadow: snapshot.isDragging 
              ? '8px 8px 16px rgba(0,0,0,0.3)' 
              : '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
            ...provided.draggableProps.style
          }}
          onClick={() => setSelectedShotId(shot.id)}
        >
          <div className="p-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div {...provided.dragHandleProps} className="opacity-0 group-hover:opacity-100 transition-opacity cursor-grab">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </div>
                <span className="text-sm font-semibold text-gray-800">Shot {shotNumber}</span>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreHorizontal className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                  <DropdownMenuItem onClick={() => duplicateShot(shot.id)}>
                    <Copy className="w-4 h-4 mr-2" />
                    Duplicate
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <Scissors className="w-4 h-4 mr-2" />
                    Split Shot
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => deleteShot(shot.id)} className="text-red-600">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Thumbnail */}
            <div className="aspect-video rounded-xl overflow-hidden mb-3" style={{
              background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)',
            }}>
              {shot.thumbnailUrl ? (
                <img 
                  src={shot.thumbnailUrl} 
                  alt={`Shot ${shotNumber}`}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Camera className="w-8 h-8 text-gray-400" />
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-2">
              <p className="text-sm text-gray-700 line-clamp-2">{shot.description}</p>
              <div className="flex items-center justify-between text-xs text-gray-500">
                <div className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  <span>{shot.duration}s</span>
                </div>
                {shot.camera && (
                  <span className="truncate max-w-20" title={shot.camera}>{shot.camera}</span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

  // Sequence Lane Component
  const SequenceLane = ({ sequenceId, sequence, index }) => {
    const isExpanded = expandedSequences.has(sequenceId);
    const duration = calculateSequenceDuration(sequence.shotIds);

    return (
      <Draggable 
        draggableId={sequenceId} 
        index={index} 
        type="SEQUENCES"
        isDragDisabled={!featureFlags.dnd}
      >
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`mb-6 rounded-2xl overflow-hidden transition-all duration-200 ${
              snapshot.isDragging ? 'shadow-2xl z-50' : ''
            }`}
            style={{
              background: 'linear-gradient(145deg, #f8f9fa, #e9ecef)',
              boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
              ...provided.draggableProps.style
            }}
          >
            {/* Sequence Header */}
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {featureFlags.dnd && (
                  <div {...provided.dragHandleProps} className="cursor-grab">
                    <GripVertical className="w-5 h-5 text-gray-400" />
                  </div>
                )}
                <button
                  onClick={() => toggleSequenceExpanded(sequenceId)}
                  className="flex items-center gap-2 text-left"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                  <h3 className="text-lg font-semibold text-gray-800">{sequence.name}</h3>
                </button>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>{sequence.shotIds.length} shots</span>
                  <span>{formatDuration(duration)}</span>
                </div>
              </div>
            </div>

            {/* Sequence Content */}
            {isExpanded && (
              <div className="p-4">
                <Droppable 
                  droppableId={`STORY:LANE:${sequenceId}`} 
                  type="SHOTS" 
                  direction="horizontal"
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`flex gap-4 min-h-64 p-4 rounded-xl transition-all duration-200 ${
                        snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      {sequence.shotIds.map((shotId, shotIndex) => {
                        const shot = shots[shotId];
                        if (!shot) return null;
                        return (
                          <ShotCard
                            key={shotId}
                            shot={shot}
                            shotNumber={shotIndex + 1}
                            index={shotIndex}
                            sequenceId={sequenceId}
                          />
                        );
                      })}
                      {provided.placeholder}
                      {sequence.shotIds.length === 0 && (
                        <div className="flex-1 flex items-center justify-center text-gray-500 min-h-48">
                          <div className="text-center">
                            <Layers className="w-12 h-12 mx-auto mb-2 opacity-50" />
                            <p>Drop assets or shots here to build your sequence</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>
            )}
          </div>
        )}
      </Draggable>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading storyboard...</p>
        </div>
      </div>
    );
  }

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex h-full">
        <AssetTray />
        
        <div className="flex-1 flex flex-col">
          {/* Main Header */}
          <div className="p-6 border-b border-gray-200" style={{
            background: 'linear-gradient(145deg, #f8f9fa, #e9ecef)',
          }}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-2xl font-semibold text-gray-800">Storyboard</h2>
                <p className="text-gray-600">Drag assets to create shots and organize your sequences</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-sm text-gray-600">
                  Total Duration: <span className="font-semibold">{formatDuration(calculateTotalDuration())}</span>
                </div>
                <Button onClick={createSequence}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Sequence
                </Button>
              </div>
            </div>
          </div>

          {/* Sequences Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">
              {sequenceOrder.length === 0 ? (
                <div className="text-center py-16 rounded-2xl" style={{
                  background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
                  boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.1), inset -2px -2px 6px rgba(255,255,255,0.7)',
                }}>
                  <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">No sequences yet</h3>
                  <p className="text-gray-500 mb-6">Create your first sequence to start building your storyboard</p>
                  <Button onClick={createSequence}>
                    <Plus className="w-5 h-5 mr-2" />
                    Create Your First Sequence
                  </Button>
                </div>
              ) : (
                <Droppable droppableId="STORY:SEQUENCES" type="SEQUENCES">
                  {(provided) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className="space-y-4"
                    >
                      {sequenceOrder.map((seqId, index) => (
                        <SequenceLane
                          key={seqId}
                          sequenceId={seqId}
                          sequence={sequences[seqId]}
                          index={index}
                        />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              )}
            </div>
          </div>
        </div>
      </div>
    </DragDropContext>
  );
}
