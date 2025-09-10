import React, { useState, useEffect, useCallback } from 'react';
import { ProductionElement, Actor } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { 
  Search, Filter, Plus, Edit2, Trash2, Save, X, Users, Package, 
  Shirt, Car, Sparkle, Eye, EyeOff, MoreVertical, Link, Unlink
} from 'lucide-react';
import { toast } from 'sonner';
import { useProductionElements } from '@/hooks/useProductionElements';

// Production element types
const ELEMENT_TYPES = {
  character: { label: 'Character', icon: Users, color: 'bg-blue-100 text-blue-800' },
  prop: { label: 'Prop', icon: Package, color: 'bg-green-100 text-green-800' },
  costume: { label: 'Costume', icon: Shirt, color: 'bg-purple-100 text-purple-800' },
  vehicle: { label: 'Vehicle', icon: Car, color: 'bg-orange-100 text-orange-800' },
  makeup: { label: 'Makeup', icon: Sparkle, color: 'bg-pink-100 text-pink-800' },
  location: { label: 'Location', icon: Package, color: 'bg-gray-100 text-gray-800' },
  equipment: { label: 'Equipment', icon: Package, color: 'bg-yellow-100 text-yellow-800' },
  sound: { label: 'Sound', icon: Package, color: 'bg-indigo-100 text-indigo-800' },
  special_effect: { label: 'Special Effect', icon: Sparkle, color: 'bg-red-100 text-red-800' }
};

const InlineEditCell = ({ 
  value, 
  onSave, 
  type = 'text', 
  options = [], 
  placeholder = '' 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');

  useEffect(() => {
    setEditValue(value || '');
  }, [value]);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value || '');
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        {type === 'select' ? (
          <Select value={editValue} onValueChange={setEditValue}>
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {options.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="h-8"
            placeholder={placeholder}
            autoFocus
          />
        )}
        <Button size="sm" variant="ghost" onClick={handleSave}>
          <Save className="w-3 h-3" />
        </Button>
        <Button size="sm" variant="ghost" onClick={handleCancel}>
          <X className="w-3 h-3" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center gap-1 hover:bg-gray-50 p-1 rounded cursor-pointer"
      onClick={() => setIsEditing(true)}
    >
      <span className="flex-1">{value || placeholder}</span>
      <Edit2 className="w-3 h-3 text-gray-400 opacity-0 group-hover:opacity-100" />
    </div>
  );
};

const CatalogManager = ({ projectId }) => {
  const {
    elements,
    actors,
    isLoading,
    createElement,
    updateElement,
    deleteElement,
    createActor,
    updateActor,
    deleteActor
  } = useProductionElements(projectId);

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [actorFilter, setActorFilter] = useState('all');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingElement, setEditingElement] = useState(null);

  const filteredElements = elements.filter(element => {
    const matchesSearch = element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         element.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || element.type === typeFilter;
    const matchesActor = actorFilter === 'all' || 
                        (actorFilter === 'linked' && element.linked_actor_id) ||
                        (actorFilter === 'unlinked' && !element.linked_actor_id) ||
                        element.linked_actor_id === actorFilter;
    
    return matchesSearch && matchesType && matchesActor;
  });

  const handleCreateElement = async (elementData) => {
    try {
      await createElement(elementData);
      toast.success('Element created successfully');
      setShowCreateDialog(false);
    } catch (error) {
      toast.error('Failed to create element');
    }
  };

  const handleUpdateElement = async (elementId, field, value) => {
    try {
      await updateElement(elementId, { [field]: value });
      toast.success('Element updated successfully');
    } catch (error) {
      toast.error('Failed to update element');
    }
  };

  const handleDeleteElement = async (elementId) => {
    if (window.confirm('Are you sure you want to delete this element?')) {
      try {
        await deleteElement(elementId);
        toast.success('Element deleted successfully');
      } catch (error) {
        toast.error('Failed to delete element');
      }
    }
  };

  const handleLinkActor = async (elementId, actorId) => {
    try {
      await updateElement(elementId, { linked_actor_id: actorId });
      toast.success('Actor linked successfully');
    } catch (error) {
      toast.error('Failed to link actor');
    }
  };

  const handleUnlinkActor = async (elementId) => {
    try {
      await updateElement(elementId, { linked_actor_id: null });
      toast.success('Actor unlinked successfully');
    } catch (error) {
      toast.error('Failed to unlink actor');
    }
  };

  const getActorName = (actorId) => {
    const actor = actors.find(a => a.id === actorId);
    return actor ? `${actor.name} ${actor.role ? `(${actor.role})` : ''}` : 'Unknown Actor';
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-500">Loading catalog...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-blue-500" />
            Production Catalog
          </h2>
          <p className="text-gray-600">Manage production elements and character→actor links</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Element
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search elements..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {Object.entries(ELEMENT_TYPES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={actorFilter} onValueChange={setActorFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by actor" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Elements</SelectItem>
            <SelectItem value="linked">Linked to Actors</SelectItem>
            <SelectItem value="unlinked">Not Linked</SelectItem>
            {actors.map(actor => (
              <SelectItem key={actor.id} value={actor.id}>
                {actor.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Catalog Table */}
      <div className="rounded-lg border overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Linked Scenes</TableHead>
              <TableHead>Actor Link</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredElements.map(element => {
              const typeInfo = ELEMENT_TYPES[element.type] || { label: element.type, icon: Package, color: 'bg-gray-100 text-gray-800' };
              const Icon = typeInfo.icon;
              
              return (
                <TableRow key={element.id} className="group">
                  <TableCell className="font-medium">
                    <InlineEditCell
                      value={element.name}
                      onSave={(value) => handleUpdateElement(element.id, 'name', value)}
                      placeholder="Element name"
                    />
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-gray-500" />
                      <Badge className={typeInfo.color}>
                        {typeInfo.label}
                      </Badge>
                    </div>
                  </TableCell>
                  
                  <TableCell>
                    <InlineEditCell
                      value={element.description}
                      onSave={(value) => handleUpdateElement(element.id, 'description', value)}
                      placeholder="Add description..."
                    />
                  </TableCell>
                  
                  <TableCell>
                    <Badge variant="outline">
                      {element.linked_scenes?.length || 0} scenes
                    </Badge>
                  </TableCell>
                  
                  <TableCell>
                    {element.linked_actor_id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-sm">{getActorName(element.linked_actor_id)}</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleUnlinkActor(element.id)}
                        >
                          <Unlink className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <Select
                        value=""
                        onValueChange={(actorId) => handleLinkActor(element.id, actorId)}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue placeholder="Link actor" />
                        </SelectTrigger>
                        <SelectContent>
                          {actors.map(actor => (
                            <SelectItem key={actor.id} value={actor.id}>
                              {actor.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingElement(element)}
                      >
                        <Edit2 className="w-3 h-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteElement(element.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        
        {filteredElements.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            {searchTerm || typeFilter !== 'all' || actorFilter !== 'all'
              ? 'No elements match your filters.'
              : 'No production elements yet. Add your first element or tag elements in the script.'
            }
          </div>
        )}
      </div>

      {/* Create Element Dialog */}
      {showCreateDialog && (
        <CreateElementDialog
          isOpen={showCreateDialog}
          onClose={() => setShowCreateDialog(false)}
          onCreate={handleCreateElement}
          actors={actors}
        />
      )}

      {/* Edit Element Dialog */}
      {editingElement && (
        <EditElementDialog
          element={editingElement}
          isOpen={!!editingElement}
          onClose={() => setEditingElement(null)}
          onUpdate={handleUpdateElement}
          actors={actors}
        />
      )}
    </div>
  );
};

// Create Element Dialog Component
const CreateElementDialog = ({ isOpen, onClose, onCreate, actors }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: 'character',
    description: '',
    linked_actor_id: '',
    custom_fields: {}
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Element name is required');
      return;
    }

    const elementData = {
      ...formData,
      linked_actor_id: formData.linked_actor_id || undefined,
      custom_fields: Object.keys(formData.custom_fields).length > 0 ? formData.custom_fields : undefined
    };

    onCreate(elementData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Production Element</DialogTitle>
          <DialogDescription>
            Add a new element to the production catalog
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Element name"
              required
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ELEMENT_TYPES).map(([key, { label, icon: Icon }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Element description"
            />
          </div>

          {formData.type === 'character' && actors.length > 0 && (
            <div>
              <Label>Link to Actor</Label>
              <Select value={formData.linked_actor_id} onValueChange={(value) => setFormData({ ...formData, linked_actor_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an actor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No actor</SelectItem>
                  {actors.map(actor => (
                    <SelectItem key={actor.id} value={actor.id}>
                      {actor.name} {actor.role && `(${actor.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Create Element
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// Edit Element Dialog Component
const EditElementDialog = ({ element, isOpen, onClose, onUpdate, actors }) => {
  const [formData, setFormData] = useState({
    name: element?.name || '',
    type: element?.type || 'character',
    description: element?.description || '',
    linked_actor_id: element?.linked_actor_id || ''
  });

  useEffect(() => {
    if (element) {
      setFormData({
        name: element.name || '',
        type: element.type || 'character',
        description: element.description || '',
        linked_actor_id: element.linked_actor_id || ''
      });
    }
  }, [element]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Element name is required');
      return;
    }

    onUpdate(element.id, formData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Production Element</DialogTitle>
          <DialogDescription>
            Update element details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Name *</Label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Element name"
              required
            />
          </div>

          <div>
            <Label>Type</Label>
            <Select value={formData.type} onValueChange={(value) => setFormData({ ...formData, type: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(ELEMENT_TYPES).map(([key, { label, icon: Icon }]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4" />
                      {label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Description</Label>
            <Textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Element description"
            />
          </div>

          {formData.type === 'character' && actors.length > 0 && (
            <div>
              <Label>Link to Actor</Label>
              <Select value={formData.linked_actor_id} onValueChange={(value) => setFormData({ ...formData, linked_actor_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an actor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No actor</SelectItem>
                  {actors.map(actor => (
                    <SelectItem key={actor.id} value={actor.id}>
                      {actor.name} {actor.role && `(${actor.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              Update Element
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CatalogManager;
