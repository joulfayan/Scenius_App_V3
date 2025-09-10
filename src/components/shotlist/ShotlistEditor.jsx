import React, { useState, useEffect, useCallback } from "react";
import { Shot } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Plus, 
  Edit3, 
  Trash2, 
  Camera,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  GripVertical
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function ShotlistEditor({ projectId }) {
  const [shots, setShots] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingShot, setEditingShot] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const loadShots = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedShots = await Shot.filter({ project_id: projectId }, 'order');
      setShots(fetchedShots);
    } catch (error) {
      console.error('Error loading shots:', error);
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadShots();
  }, [loadShots]);

  const createShot = async (shotData) => {
    try {
      const maxOrder = shots.length > 0 ? Math.max(...shots.map(s => s.order)) : 0;
      const newShot = await Shot.create({
        ...shotData,
        project_id: projectId,
        order: maxOrder + 1
      });
      setShots(prev => [...prev, newShot]);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating shot:', error);
    }
  };

  const updateShot = async (shotId, updates) => {
    try {
      await Shot.update(shotId, updates);
      setShots(prev => prev.map(s => s.id === shotId ? { ...s, ...updates } : s));
    } catch (error) {
      console.error('Error updating shot:', error);
    }
  };

  const deleteShot = async (shotId) => {
    try {
      await Shot.delete(shotId);
      setShots(prev => prev.filter(s => s.id !== shotId));
    } catch (error) {
      console.error('Error deleting shot:', error);
    }
  };

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(shots);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, index) => ({ ...item, order: index + 1 }));
    setShots(updatedItems);

    try {
      for (let i = 0; i < updatedItems.length; i++) {
        await Shot.update(updatedItems[i].id, { order: i + 1 });
      }
    } catch (error) {
      console.error('Error updating shot order:', error);
    }
  };

  const ShotForm = ({ shot, onSave, onCancel }) => {
    const [formData, setFormData] = useState({
      scene_number: shot?.scene_number || '',
      shot_number: shot?.shot_number || '',
      shot_type: shot?.shot_type || 'medium',
      camera_movement: shot?.camera_movement || 'static',
      description: shot?.description || '',
      dialogue: shot?.dialogue || '',
      location: shot?.location || '',
      time_of_day: shot?.time_of_day || 'day',
      equipment_notes: shot?.equipment_notes || '',
      duration: shot?.duration || 3,
      priority: shot?.priority || 'medium',
      status: shot?.status || 'planned'
    });

    const handleSave = () => {
      if (shot) {
        onSave(shot.id, formData);
      } else {
        onSave(formData);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)',
        }}>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-800">
              {shot ? 'Edit Shot' : 'Create New Shot'}
            </h3>
            <button onClick={onCancel} className="p-2 rounded-lg text-gray-500 hover:text-gray-700">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <Label>Scene Number</Label>
              <Input
                value={formData.scene_number}
                onChange={(e) => setFormData({...formData, scene_number: e.target.value})}
                placeholder="Scene 1"
              />
            </div>
            <div>
              <Label>Shot Number</Label>
              <Input
                value={formData.shot_number}
                onChange={(e) => setFormData({...formData, shot_number: e.target.value})}
                placeholder="1A"
              />
            </div>
            <div>
              <Label>Shot Type</Label>
              <Select value={formData.shot_type} onValueChange={(value) => setFormData({...formData, shot_type: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wide">Wide Shot</SelectItem>
                  <SelectItem value="medium">Medium Shot</SelectItem>
                  <SelectItem value="close-up">Close-up</SelectItem>
                  <SelectItem value="extreme_close_up">Extreme Close-up</SelectItem>
                  <SelectItem value="over_shoulder">Over Shoulder</SelectItem>
                  <SelectItem value="two_shot">Two Shot</SelectItem>
                  <SelectItem value="insert">Insert</SelectItem>
                  <SelectItem value="cutaway">Cutaway</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Camera Movement</Label>
              <Select value={formData.camera_movement} onValueChange={(value) => setFormData({...formData, camera_movement: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="static">Static</SelectItem>
                  <SelectItem value="pan">Pan</SelectItem>
                  <SelectItem value="tilt">Tilt</SelectItem>
                  <SelectItem value="dolly">Dolly</SelectItem>
                  <SelectItem value="zoom">Zoom</SelectItem>
                  <SelectItem value="handheld">Handheld</SelectItem>
                  <SelectItem value="steadicam">Steadicam</SelectItem>
                  <SelectItem value="crane">Crane</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Location</Label>
              <Input
                value={formData.location}
                onChange={(e) => setFormData({...formData, location: e.target.value})}
                placeholder="Coffee shop interior"
              />
            </div>
            <div>
              <Label>Time of Day</Label>
              <Select value={formData.time_of_day} onValueChange={(value) => setFormData({...formData, time_of_day: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morning</SelectItem>
                  <SelectItem value="day">Day</SelectItem>
                  <SelectItem value="evening">Evening</SelectItem>
                  <SelectItem value="night">Night</SelectItem>
                  <SelectItem value="magic_hour">Magic Hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (seconds)</Label>
              <Input
                type="number"
                value={formData.duration}
                onChange={(e) => setFormData({...formData, duration: parseFloat(e.target.value)})}
                min="0.5"
                step="0.5"
              />
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={formData.priority} onValueChange={(value) => setFormData({...formData, priority: value})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-4 mb-6">
            <div>
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Describe what happens in this shot..."
                rows={3}
              />
            </div>
            <div>
              <Label>Dialogue</Label>
              <Textarea
                value={formData.dialogue}
                onChange={(e) => setFormData({...formData, dialogue: e.target.value})}
                placeholder="Any dialogue in this shot..."
                rows={2}
              />
            </div>
            <div>
              <Label>Equipment Notes</Label>
              <Textarea
                value={formData.equipment_notes}
                onChange={(e) => setFormData({...formData, equipment_notes: e.target.value})}
                placeholder="Special equipment needed..."
                rows={2}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <Button variant="outline" onClick={onCancel} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSave} className="flex-1">
              {shot ? 'Update Shot' : 'Create Shot'}
            </Button>
          </div>
        </div>
      </div>
    );
  };

  const ShotCard = ({ shot, index }) => {
    const statusIcons = {
      planned: <Clock className="w-4 h-4 text-gray-500" />,
      ready: <CheckCircle2 className="w-4 h-4 text-blue-500" />,
      in_progress: <Camera className="w-4 h-4 text-yellow-500" />,
      completed: <CheckCircle2 className="w-4 h-4 text-green-500" />,
      needs_pickup: <AlertCircle className="w-4 h-4 text-red-500" />
    };

    const priorityColors = {
      low: 'text-gray-500',
      medium: 'text-blue-500',
      high: 'text-orange-500',
      critical: 'text-red-500'
    };

    return (
      <Draggable draggableId={shot.id} index={index}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`p-4 rounded-2xl transition-all duration-200 ${
              snapshot.isDragging ? 'scale-105' : ''
            }`}
            style={{
              background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
              boxShadow: snapshot.isDragging 
                ? '8px 8px 16px rgba(0,0,0,0.2), -8px -8px 16px rgba(255,255,255,0.7)'
                : '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
              ...provided.draggableProps.style,
            }}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div {...provided.dragHandleProps} className="cursor-grab">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="font-semibold text-gray-800">
                    {shot.scene_number} - Shot {shot.shot_number}
                  </p>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                    <span className="capitalize">{shot.shot_type?.replace('_', ' ')}</span>
                    <span>•</span>
                    <span className="capitalize">{shot.camera_movement}</span>
                    <span>•</span>
                    <span>{shot.duration}s</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {statusIcons[shot.status]}
                  <span className={`text-xs font-medium ${priorityColors[shot.priority]}`}>
                    {shot.priority?.toUpperCase()}
                  </span>
                </div>
                <button
                  onClick={() => setEditingShot(shot)}
                  className="p-1 rounded-lg transition-colors hover:bg-gray-200"
                >
                  <Edit3 className="w-4 h-4 text-gray-500" />
                </button>
                <button
                  onClick={() => deleteShot(shot.id)}
                  className="p-1 rounded-lg transition-colors hover:bg-red-100 text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-gray-700 mb-2">{shot.description}</p>
            
            {shot.location && (
              <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                <span>📍 {shot.location}</span>
                <span>• {shot.time_of_day}</span>
              </div>
            )}
            
            {shot.dialogue && (
              <p className="text-xs text-gray-600 italic bg-gray-100 p-2 rounded mt-2">
                "{shot.dialogue}"
              </p>
            )}
          </div>
        )}
      </Draggable>
    );
  };

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
          <h2 className="text-2xl font-semibold text-gray-800">Shot List</h2>
          <p className="text-gray-600">Plan and organize your shooting schedule</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Shot
        </Button>
      </div>

      {shots.length === 0 ? (
        <div className="text-center py-16 rounded-2xl" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.1), inset -2px -2px 6px rgba(255,255,255,0.7)',
        }}>
          <Camera className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-600 mb-2">No shots planned yet</h3>
          <p className="text-gray-500 mb-6">Start planning your shoot by adding your first shot</p>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-5 h-5 mr-2" />
            Add Your First Shot
          </Button>
        </div>
      ) : (
        <DragDropContext onDragEnd={handleDragEnd}>
          <Droppable droppableId="shotlist">
            {(provided) => (
              <div
                {...provided.droppableProps}
                ref={provided.innerRef}
                className="grid grid-cols-1 lg:grid-cols-2 gap-4"
              >
                {shots.map((shot, index) => (
                  <ShotCard key={shot.id} shot={shot} index={index} />
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </DragDropContext>
      )}

      {(showCreateForm || editingShot) && (
        <ShotForm
          shot={editingShot}
          onSave={editingShot ? updateShot : createShot}
          onCancel={() => {
            setShowCreateForm(false);
            setEditingShot(null);
          }}
        />
      )}
    </div>
  );
}