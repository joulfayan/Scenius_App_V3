import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tag, Plus, X, Package, Shirt, Car, Sparkle, Users } from 'lucide-react';
import { ProductionElement, Actor } from '@/api/entities';
import { toast } from 'sonner';

// Production element types following SB-style taxonomy
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

const TaggingDialog = ({ 
  isOpen, 
  onClose, 
  selectedText, 
  projectId, 
  sceneId,
  onElementCreated 
}) => {
  const [elementType, setElementType] = useState('character');
  const [elementName, setElementName] = useState('');
  const [elementDescription, setElementDescription] = useState('');
  const [customFields, setCustomFields] = useState({});
  const [linkedActorId, setLinkedActorId] = useState('');
  const [availableActors, setAvailableActors] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [existingElements, setExistingElements] = useState([]);

  // Load existing elements and actors
  useEffect(() => {
    if (isOpen && projectId) {
      loadExistingElements();
      loadActors();
    }
  }, [isOpen, projectId]);

  // Set element name from selected text
  useEffect(() => {
    if (selectedText && isOpen) {
      setElementName(selectedText.trim());
    }
  }, [selectedText, isOpen]);

  const loadExistingElements = async () => {
    try {
      const elements = await ProductionElement.filter({ project_id: projectId }, '-created_date');
      setExistingElements(elements);
    } catch (error) {
      console.error('Error loading existing elements:', error);
    }
  };

  const loadActors = async () => {
    try {
      const actors = await Actor.filter({ project_id: projectId }, '-created_date');
      setAvailableActors(actors);
    } catch (error) {
      console.error('Error loading actors:', error);
    }
  };

  const handleCreateElement = async () => {
    if (!elementName.trim()) {
      toast.error('Element name is required');
      return;
    }

    setIsCreating(true);
    try {
      const elementData = {
        project_id: projectId,
        type: elementType,
        name: elementName.trim(),
        description: elementDescription.trim() || undefined,
        category: elementType,
        linked_scenes: sceneId ? [sceneId] : [],
        linked_actor_id: linkedActorId || undefined,
        custom_fields: Object.keys(customFields).length > 0 ? customFields : undefined,
        est_cost: undefined
      };

      const newElement = await ProductionElement.create(elementData);
      
      toast.success(`"${elementName}" tagged as ${ELEMENT_TYPES[elementType].label}`);
      onElementCreated(newElement);
      
      // Reset form
      setElementName('');
      setElementDescription('');
      setCustomFields({});
      setLinkedActorId('');
      onClose();
    } catch (error) {
      console.error('Error creating production element:', error);
      toast.error('Failed to create element');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLinkToExisting = (element) => {
    // Link existing element to current scene
    if (sceneId && !element.linked_scenes?.includes(sceneId)) {
      const updatedScenes = [...(element.linked_scenes || []), sceneId];
      ProductionElement.update(element.id, { linked_scenes: updatedScenes })
        .then(() => {
          toast.success(`"${element.name}" linked to current scene`);
          onElementCreated(element);
          onClose();
        })
        .catch(error => {
          console.error('Error linking element:', error);
          toast.error('Failed to link element');
        });
    } else {
      toast.info('Element already linked to this scene');
      onClose();
    }
  };

  const filteredElements = existingElements.filter(element => 
    element.name.toLowerCase().includes(elementName.toLowerCase()) &&
    element.type === elementType
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Tag Production Element
          </DialogTitle>
          <DialogDescription>
            Create or link a production element for: "{selectedText}"
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Element Type Selection */}
          <div className="space-y-2">
            <Label>Element Type</Label>
            <Select value={elementType} onValueChange={setElementType}>
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

          {/* Element Name */}
          <div className="space-y-2">
            <Label>Element Name</Label>
            <Input
              value={elementName}
              onChange={(e) => setElementName(e.target.value)}
              placeholder="Enter element name..."
            />
          </div>

          {/* Existing Elements */}
          {filteredElements.length > 0 && (
            <div className="space-y-2">
              <Label>Link to Existing Element</Label>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {filteredElements.map(element => (
                  <div
                    key={element.id}
                    className="flex items-center justify-between p-2 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-2">
                      <Badge className={ELEMENT_TYPES[element.type]?.color || 'bg-gray-100 text-gray-800'}>
                        {ELEMENT_TYPES[element.type]?.label || element.type}
                      </Badge>
                      <span className="font-medium">{element.name}</span>
                      {element.description && (
                        <span className="text-sm text-gray-500">{element.description}</span>
                      )}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleLinkToExisting(element)}
                    >
                      Link
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Element Description */}
          <div className="space-y-2">
            <Label>Description (Optional)</Label>
            <Textarea
              value={elementDescription}
              onChange={(e) => setElementDescription(e.target.value)}
              placeholder="Add details about this element..."
              rows={3}
            />
          </div>

          {/* Actor Linking (for characters) */}
          {elementType === 'character' && availableActors.length > 0 && (
            <div className="space-y-2">
              <Label>Link to Actor (Optional)</Label>
              <Select value={linkedActorId} onValueChange={setLinkedActorId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select an actor..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">No actor linked</SelectItem>
                  {availableActors.map(actor => (
                    <SelectItem key={actor.id} value={actor.id}>
                      {actor.name} {actor.role && `(${actor.role})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Custom Fields */}
          <div className="space-y-2">
            <Label>Custom Fields (Optional)</Label>
            <div className="space-y-2">
              {Object.entries(customFields).map(([key, value]) => (
                <div key={key} className="flex gap-2">
                  <Input
                    value={key}
                    onChange={(e) => {
                      const newFields = { ...customFields };
                      delete newFields[key];
                      newFields[e.target.value] = value;
                      setCustomFields(newFields);
                    }}
                    placeholder="Field name"
                    className="flex-1"
                  />
                  <Input
                    value={value}
                    onChange={(e) => setCustomFields({ ...customFields, [key]: e.target.value })}
                    placeholder="Field value"
                    className="flex-1"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const newFields = { ...customFields };
                      delete newFields[key];
                      setCustomFields(newFields);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                size="sm"
                variant="outline"
                onClick={() => setCustomFields({ ...customFields, '': '' })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Custom Field
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleCreateElement} disabled={isCreating}>
              {isCreating ? 'Creating...' : 'Create Element'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TaggingDialog;
