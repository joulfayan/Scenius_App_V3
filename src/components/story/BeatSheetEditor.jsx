
import React, { useState, useEffect, useCallback } from 'react';
import { BeatSheet } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, TrendingUp, TrendingDown, Minus, Sparkles, LayoutGrid, List, ArrowLeft, Edit, GripVertical } from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { cn } from "@/lib/utils";

const structureTemplates = {
  three_act: [
    { name: 'Opening Image', description: 'Sets the tone and mood', page_number: 1 },
    { name: 'Setup', description: 'Introduce character and world', page_number: 10 },
    { name: 'Inciting Incident', description: 'Event that starts the story', page_number: 25 },
    { name: 'Plot Point 1', description: 'End of Act 1', page_number: 30 },
    { name: 'Midpoint', description: 'Major revelation or twist', page_number: 60 },
    { name: 'Plot Point 2', description: 'End of Act 2', page_number: 90 },
    { name: 'Climax', description: 'Final confrontation', page_number: 105 },
    { name: 'Resolution', description: 'Wrap up and new normal', page_number: 120 }
  ],
  save_the_cat: [
    { name: 'Opening Image', description: 'A visual that represents the struggle & tone', page_number: 1 },
    { name: 'Theme Stated', description: 'What your story is about', page_number: 5 },
    { name: 'Setup', description: 'Introduce characters, stakes, and goals', page_number: 10 },
    { name: 'Catalyst', description: 'The moment that changes everything', page_number: 12 },
    { name: 'Debate', description: 'Should I go? Resistance to change', page_number: 25 },
    { name: 'Break into Two', description: 'Choosing Act 2', page_number: 25 },
    { name: 'B Story', description: 'Introduce new character or subplot', page_number: 30 },
    { name: 'Fun and Games', description: 'Promise of the premise', page_number: 45 },
    { name: 'Midpoint', description: 'Twist that changes everything', page_number: 60 },
    { name: 'Bad Guys Close In', description: 'Doubt, jealousy, fear', page_number: 75 },
    { name: 'All Is Lost', description: 'Opposite of opening image', page_number: 85 },
    { name: 'Dark Night of the Soul', description: 'Moment of despair', page_number: 90 },
    { name: 'Break into Three', description: 'Solution appears', page_number: 95 },
    { name: 'Finale', description: 'A and B stories merge', page_number: 110 },
    { name: 'Final Image', description: 'Opposite of opening image', page_number: 120 }
  ]
};

const getEmotionalIcon = (value) => {
  if (value > 5) return <TrendingUp className="w-4 h-4 text-green-500" />;
  if (value < -5) return <TrendingDown className="w-4 h-4 text-red-500" />;
  return <Minus className="w-4 h-4 text-gray-400" />;
};

const SaveTheCatInfographic = ({ beats, onUpdate, setBeats, onAddBeat, onDeleteBeat }) => {
  const [editingBeat, setEditingBeat] = useState(null);

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    // Ensure beats are sorted by order before reordering
    // The `beats` prop should already be sorted by order when passed from BeatSheetEditor
    const items = Array.from(beats);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedBeats = items.map((beat, index) => ({
      ...beat,
      order: index + 1
    }));
    
    setBeats(updatedBeats);
  };

  const BeatBlock = ({ beat, index }) => (
    <Draggable draggableId={beat.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`relative group h-28 flex flex-col justify-center items-center text-center p-3 rounded-xl transition-all duration-300 cursor-pointer ${
            snapshot.isDragging ? 'scale-105 shadow-2xl' : ''
          }`}
          style={{
            background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
            boxShadow: snapshot.isDragging 
              ? '8px 8px 16px rgba(0,0,0,0.2)' 
              : '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)',
            ...provided.draggableProps.style
          }}
          onClick={() => setEditingBeat(beat)}
        >
          <div {...provided.dragHandleProps} className="absolute top-2 left-2 p-1 opacity-50 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation(); // Prevent the edit modal from opening
              onDeleteBeat(beat.id);
            }}
            className="absolute top-2 right-2 p-1 bg-red-600 hover:bg-red-700 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
            title="Delete beat"
          >
            <Trash2 className="w-3 h-3" />
          </button>
          <p className="text-sm font-semibold text-gray-800">{beat.name}</p>
          <p className="text-xs text-gray-500 mt-1 truncate w-full">{beat.description || '...'}</p>
        </div>
      )}
    </Draggable>
  );

  const renderActSection = (title, actBeats, color, sectionStartIndex, allBeats) => {
    // Ensure actBeats are sorted by order for correct display and slicing
    const sortedActBeats = actBeats.sort((a, b) => a.order - b.order);

    const handleAddClick = () => {
        let afterOrder = null;
        // If current act has beats, add after the last one
        if (sortedActBeats.length > 0) {
            afterOrder = sortedActBeats[sortedActBeats.length - 1].order;
        } 
        // If current act is empty but not the first act, find the last beat of the previous section
        else if (sectionStartIndex > 0) {
            const previousBeat = allBeats[sectionStartIndex - 1];
            if (previousBeat) {
                afterOrder = previousBeat.order;
            }
        }
        // For the first act when it's empty, afterOrder remains null, which means "add to the very beginning/end of current total beats".
        // The addBeat function in BeatSheetEditor will handle null afterOrder correctly by appending.
        onAddBeat(afterOrder);
    };

    return (
      <div className="flex gap-6 items-start">
        <div className="w-16 flex-shrink-0 text-center py-4 rounded-lg sticky top-6" style={{ backgroundColor: color, writingMode: 'vertical-rl', textOrientation: 'mixed' }}>
          <h3 className="font-bold tracking-widest text-slate-900 uppercase">{title}</h3>
        </div>
        <div className="flex-1 space-y-4">
          <Droppable droppableId={title} direction="horizontal">
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-4"
              >
                {sortedActBeats.map((beat, idx) => <BeatBlock key={beat.id} beat={beat} index={beats.findIndex(b => b.id === beat.id)} />)}
                {provided.placeholder}
                <button 
                  onClick={handleAddClick}
                  className="h-28 flex flex-col justify-center items-center p-3 rounded-xl border-2 border-dashed border-gray-300 hover:bg-gray-200/50 transition-colors"
                >
                  <Plus className="w-6 h-6 text-gray-400" />
                  <span className="text-xs text-gray-500 mt-1">Add Beat</span>
                </button>
              </div>
            )}
          </Droppable>
        </div>
      </div>
    );
  };

  const sortedAllBeats = beats.sort((a, b) => a.order - b.order);

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="bg-gray-100 p-6 rounded-xl space-y-8">
        {renderActSection('Act 1', sortedAllBeats.slice(0, 6), '#a78bfa', 0, sortedAllBeats)}
        {renderActSection('Act 2A', sortedAllBeats.slice(6, 9), '#f472b6', 6, sortedAllBeats)}
        {renderActSection('Act 2B', sortedAllBeats.slice(9, 12), '#4ade80', 9, sortedAllBeats)}
        {renderActSection('Act 3', sortedAllBeats.slice(12), '#facc15', 12, sortedAllBeats)}

        {editingBeat && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 w-full max-w-md shadow-xl">
              <h3 className="text-lg font-bold mb-4">Editing: {editingBeat.name}</h3>
              <div className="space-y-4">
                <div>
                  <Label>Description</Label>
                  <Textarea 
                    value={editingBeat.description} 
                    onChange={(e) => setEditingBeat({...editingBeat, description: e.target.value})} 
                    rows={4} 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Page Number</Label>
                    <Input 
                      type="number" 
                      value={editingBeat.page_number} 
                      onChange={(e) => setEditingBeat({...editingBeat, page_number: parseInt(e.target.value) || 1})} 
                      min="1" 
                    />
                  </div>
                  <div>
                    <Label>Emotional Value</Label>
                    <Input 
                      type="number" 
                      min="-10" 
                      max="10" 
                      value={editingBeat.emotional_value} 
                      onChange={(e) => setEditingBeat({...editingBeat, emotional_value: parseInt(e.target.value) || 0})} 
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <Button variant="ghost" onClick={() => setEditingBeat(null)}>Cancel</Button>
                <Button onClick={() => { onUpdate(editingBeat.id, editingBeat); setEditingBeat(null); }} className="bg-purple-600 hover:bg-purple-700">Save</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </DragDropContext>
  );
};

export default function BeatSheetEditor({ projectId }) {
  const [beatSheets, setBeatSheets] = useState([]);
  const [activeBeatSheet, setActiveBeatSheet] = useState(null);
  const [beats, setBeats] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState('three_act');
  const [viewMode, setViewMode] = useState('cards'); // 'cards' or 'infographic'

  const loadBeatSheets = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedBeatSheets = await BeatSheet.filter({ project_id: projectId }, '-created_date');
      setBeatSheets(fetchedBeatSheets);
      if (fetchedBeatSheets.length > 0) {
        const sheet = fetchedBeatSheets[0];
        setActiveBeatSheet(sheet);
        setBeats(sheet.beats || []);
        // Set view mode based on loaded sheet's type
        if (sheet.structure_type === 'save_the_cat') {
          setViewMode('infographic'); // Default to infographic for Save the Cat
        } else {
          setViewMode('cards');
        }
      }
    } catch (error) {
      console.error('Error loading beat sheets:', error);
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadBeatSheets();
  }, [loadBeatSheets]);

  const createBeatSheet = async () => {
    try {
      const template = structureTemplates[selectedTemplate] || [];
      const initialBeats = template.map((beat, index) => ({
        id: `beat-${Date.now()}-${index}`,
        name: beat.name,
        description: beat.description,
        page_number: beat.page_number,
        emotional_value: 0,
        order: index + 1
      }));

      const newBeatSheet = await BeatSheet.create({
        project_id: projectId,
        title: `${selectedTemplate.replace('_', ' ').split(' ').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')} Beat Sheet - ${new Date().toLocaleDateString()}`,
        structure_type: selectedTemplate,
        beats: initialBeats
      });

      setBeatSheets(prev => [newBeatSheet, ...prev]);
      setActiveBeatSheet(newBeatSheet);
      setBeats(initialBeats);

      if (newBeatSheet.structure_type === 'save_the_cat') {
        setViewMode('infographic');
      } else {
        setViewMode('cards');
      }
    } catch (error) {
      console.error('Error creating beat sheet:', error);
    }
  };

  const saveBeatSheet = async () => {
    if (!activeBeatSheet) return;
    
    setIsSaving(true);
    try {
      // Ensure beats are saved in their current sorted order
      const beatsToSave = beats.map((beat, index) => ({
        ...beat,
        order: index + 1 // Re-assign order based on current array position
      }));

      await BeatSheet.update(activeBeatSheet.id, {
        beats: beatsToSave,
        structure_type: activeBeatSheet.structure_type
      });
      setActiveBeatSheet(prev => ({ ...prev, beats: beatsToSave }));
      setBeats(beatsToSave); // Update state to reflect newly ordered beats
    } catch (error) {
      console.error('Error saving beat sheet:', error);
    }
    setIsSaving(false);
  };

  const addBeat = (afterOrder = null) => {
    const newBeat = {
      id: `beat-${Date.now()}`,
      name: 'New Beat',
      description: '',
      page_number: 1,
      emotional_value: 0,
      order: 0 // Temporary order, will be reassigned
    };
    
    const currentBeats = [...beats].sort((a, b) => a.order - b.order);
    let newBeats = [];

    if (afterOrder === null) { // Add to the very end of all beats (or beginning if currentBeats is empty)
      newBeats = [...currentBeats, newBeat];
    } else { // Insert after a specific order
      const insertIndex = currentBeats.findIndex(beat => beat.order === afterOrder) + 1;
       if (insertIndex > 0 && insertIndex <= currentBeats.length) { // Ensure insertIndex is valid
        newBeats = [...currentBeats.slice(0, insertIndex), newBeat, ...currentBeats.slice(insertIndex)];
      } else { // Fallback if afterOrder not found or at the end
        newBeats = [...currentBeats, newBeat];
      }
    }

    // Re-assign order based on new array position
    const updatedBeats = newBeats.map((beat, index) => ({
      ...beat,
      order: index + 1
    }));
    
    setBeats(updatedBeats);
  };

  const updateBeat = (beatId, updates) => {
    setBeats(prev => prev.map(beat => 
      beat.id === beatId ? { ...beat, ...updates } : beat
    ));
  };

  const deleteBeat = (beatId) => {
    setBeats(prev => prev.filter(beat => beat.id !== beatId));
  };

  const handleDragEnd = (result) => {
    if (!result.destination) return;

    const items = Array.from(beats);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedBeats = items.map((beat, index) => ({
      ...beat,
      order: index + 1
    }));

    setBeats(updatedBeats);
  };

  const resetToTemplateSelection = () => {
    setActiveBeatSheet(null);
    setBeats([]);
    setViewMode('cards'); // Reset view mode when changing template
  };

  const BeatCard = ({ beat, index }) => (
    <Draggable draggableId={beat.id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`p-4 rounded-xl transition-all duration-200 ${
            snapshot.isDragging ? 'shadow-lg scale-105' : ''
          }`}
          style={{
            background: 'linear-gradient(145deg, #f8f9fa, #ffffff)',
            boxShadow: snapshot.isDragging 
              ? '8px 8px 20px rgba(0,0,0,0.15)'
              : '4px 4px 12px rgba(0,0,0,0.1), -4px -4px 12px rgba(255,255,255,0.8)',
            ...provided.draggableProps.style,
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-500">#{beat.order}</span>
              {getEmotionalIcon(beat.emotional_value)}
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => deleteBeat(beat.id)}
              className="text-red-500 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>

          <div className="space-y-3">
            <Input
              value={beat.name}
              onChange={(e) => updateBeat(beat.id, { name: e.target.value })}
              className="font-semibold"
              placeholder="Beat name..."
            />
            
            <Textarea
              value={beat.description}
              onChange={(e) => updateBeat(beat.id, { description: e.target.value })}
              placeholder="Describe what happens..."
              rows={3}
            />

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs">Page</Label>
                <Input
                  type="number"
                  value={beat.page_number}
                  onChange={(e) => updateBeat(beat.id, { page_number: parseInt(e.target.value) || 1 })}
                  min="1"
                />
              </div>
              <div>
                <Label className="text-xs">Emotional Value</Label>
                <Input
                  type="range"
                  min="-10"
                  max="10"
                  value={beat.emotional_value}
                  onChange={(e) => updateBeat(beat.id, { emotional_value: parseInt(e.target.value) })}
                  className="mt-1"
                />
                <div className="text-xs text-center text-gray-500 mt-1">{beat.emotional_value}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Beat Sheet</h2>
          <p className="text-gray-600">Map the emotional journey of your story</p>
        </div>
        <div className="flex gap-2 items-center">
          {activeBeatSheet && (
             <Button variant="outline" size="sm" onClick={resetToTemplateSelection}>
               <ArrowLeft className="w-4 h-4 mr-2" />
               Change Template
             </Button>
          )}
          {activeBeatSheet && activeBeatSheet.structure_type === 'save_the_cat' && (
             <div className="flex items-center gap-1 p-1 rounded-lg bg-gray-200">
               <Button size="sm" onClick={() => setViewMode('cards')} className={viewMode === 'cards' ? 'bg-white shadow' : 'bg-transparent'}>
                 <LayoutGrid className="w-4 h-4"/>
               </Button>
               <Button size="sm" onClick={() => setViewMode('infographic')} className={viewMode === 'infographic' ? 'bg-white shadow' : 'bg-transparent'}>
                 <List className="w-4 h-4"/>
               </Button>
             </div>
          )}
          <Button onClick={saveBeatSheet} disabled={isSaving || !activeBeatSheet}>
            {isSaving ? (
              <div className="w-4 h-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2"></div>
            ) : (
              <Save className="w-4 h-4 mr-2" />
            )}
            Save
          </Button>
        </div>
      </div>

      {!activeBeatSheet ? (
        <Card>
          <CardContent className="pt-6 text-center">
            <Sparkles className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 mb-2">Create Your First Beat Sheet</h3>
            <p className="text-gray-500 mb-6">Choose a story structure template to get started</p>
            
            <div className="max-w-xs mx-auto mb-6">
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="three_act">Three Act Structure</SelectItem>
                  <SelectItem value="save_the_cat">Save the Cat</SelectItem>
                  <SelectItem value="custom">Start Blank</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button onClick={createBeatSheet}>
              <Plus className="w-4 h-4 mr-2" />
              Create Beat Sheet
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {viewMode === 'infographic' && activeBeatSheet.structure_type === 'save_the_cat' ? (
            <SaveTheCatInfographic 
              beats={beats.sort((a, b) => a.order - b.order)} 
              onUpdate={updateBeat} 
              setBeats={setBeats} 
              onAddBeat={addBeat}
              onDeleteBeat={deleteBeat}
            />
          ) : (
            <>
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">{activeBeatSheet.title}</h3>
                <Button size="sm" onClick={() => addBeat()}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Beat
                </Button>
              </div>

              <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="beats">
                  {(provided) => (
                    <div
                      {...provided.droppableProps}
                      ref={provided.innerRef}
                      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
                    >
                      {beats.sort((a, b) => a.order - b.order).map((beat, index) => (
                        <BeatCard key={beat.id} beat={beat} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </DragDropContext>
            </>
          )}
        </>
      )}
    </div>
  );
}
