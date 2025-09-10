// src/modules/catalog/CatalogManager.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/card';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '../../components/ui/table';
import { 
  Input 
} from '../../components/ui/input';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { 
  Button 
} from '../../components/ui/button';
import { 
  Badge 
} from '../../components/ui/badge';
import { 
  Search, 
  Filter, 
  Edit2, 
  Check, 
  X, 
  Plus 
} from 'lucide-react';
import { 
  subscribeElementsWithFilters,
  updateElement,
  assignActorToElement,
  unassignActorFromElement,
  type Element,
  type ElementFilters 
} from '../../services/elements';
import { 
  subscribeScenes,
  type Scene 
} from '../../services/scenes';

interface CatalogManagerProps {
  projectId: string;
}

interface EditingCell {
  elementId: string;
  field: string;
  value: any;
}

const CatalogManager: React.FC<CatalogManagerProps> = ({ projectId }) => {
  const [elements, setElements] = useState<Element[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [filters, setFilters] = useState<ElementFilters>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [loading, setLoading] = useState(true);

  // Get unique values for filter options
  const uniqueTypes = Array.from(new Set(elements.map(el => el.type))).sort();
  const uniqueCategories = Array.from(new Set(elements.map(el => el.category))).sort();
  const uniqueActors = Array.from(new Set(elements.map(el => el.linkedActorId).filter(Boolean))).sort();

  // Subscribe to elements with filters
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeElementsWithFilters(
      projectId,
      filters,
      (elementsData) => {
        setElements(elementsData);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [projectId, filters]);

  // Subscribe to scenes for scene filter
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeScenes(projectId, (scenesData) => {
      setScenes(scenesData);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Filter elements by search term
  const filteredElements = elements.filter(element =>
    element.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    element.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle filter changes
  const handleFilterChange = (key: keyof ElementFilters, value: string | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value || undefined
    }));
  };

  // Handle cell editing
  const handleCellEdit = (elementId: string, field: string, currentValue: any) => {
    setEditingCell({
      elementId,
      field,
      value: currentValue
    });
  };

  // Handle cell save
  const handleCellSave = async () => {
    if (!editingCell) return;

    try {
      await updateElement(projectId, editingCell.elementId, {
        [editingCell.field]: editingCell.value
      });
      setEditingCell(null);
    } catch (error) {
      console.error('Error updating element:', error);
    }
  };

  // Handle cell cancel
  const handleCellCancel = () => {
    setEditingCell(null);
  };

  // Handle actor assignment
  const handleActorAssign = async (elementId: string, actorId: string) => {
    try {
      await assignActorToElement(projectId, elementId, actorId);
    } catch (error) {
      console.error('Error assigning actor:', error);
    }
  };

  // Handle actor unassignment
  const handleActorUnassign = async (elementId: string) => {
    try {
      await unassignActorFromElement(projectId, elementId);
    } catch (error) {
      console.error('Error unassigning actor:', error);
    }
  };

  // Render editable cell
  const renderEditableCell = (element: Element, field: string, value: any) => {
    const isEditing = editingCell?.elementId === element.id && editingCell?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            value={editingCell.value}
            onChange={(e) => setEditingCell(prev => prev ? { ...prev, value: e.target.value } : null)}
            className="h-8"
            autoFocus
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCellSave}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCellCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => handleCellEdit(element.id, field, value)}
      >
        <span className="flex-1">{value || '-'}</span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  // Render actor cell with assignment dropdown
  const renderActorCell = (element: Element) => {
    const isEditing = editingCell?.elementId === element.id && editingCell?.field === 'linkedActorId';

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Select
            value={editingCell.value || ''}
            onValueChange={(value) => setEditingCell(prev => prev ? { ...prev, value } : null)}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Select actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No actor</SelectItem>
              {uniqueActors.map(actorId => (
                <SelectItem key={actorId} value={actorId}>
                  Actor {actorId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCellSave}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCellCancel}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => handleCellEdit(element.id, 'linkedActorId', element.linkedActorId)}
      >
        <span className="flex-1">
          {element.linkedActorId ? (
            <Badge variant="secondary">Actor {element.linkedActorId}</Badge>
          ) : (
            '-'
          )}
        </span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading elements...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Catalog Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Filters and Search */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search elements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select
            value={filters.type || ''}
            onValueChange={(value) => handleFilterChange('type', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Types</SelectItem>
              {uniqueTypes.map(type => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.category || ''}
            onValueChange={(value) => handleFilterChange('category', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Categories</SelectItem>
              {uniqueCategories.map(category => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.linkedActorId || ''}
            onValueChange={(value) => handleFilterChange('linkedActorId', value)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Actor" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">All Actors</SelectItem>
              {uniqueActors.map(actorId => (
                <SelectItem key={actorId} value={actorId}>
                  Actor {actorId}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            onClick={() => {
              setFilters({});
              setSearchTerm('');
            }}
          >
            Clear Filters
          </Button>
        </div>

        {/* Elements Table */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Scenes</TableHead>
                <TableHead>Custom Fields</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredElements.map((element) => (
                <TableRow key={element.id} className="group">
                  <TableCell>
                    {renderEditableCell(element, 'name', element.name)}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(element, 'type', element.type)}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(element, 'category', element.category)}
                  </TableCell>
                  <TableCell>
                    {renderEditableCell(element, 'estCostCents', 
                      element.estCostCents ? `$${(element.estCostCents / 100).toFixed(2)}` : null
                    )}
                  </TableCell>
                  <TableCell>
                    {renderActorCell(element)}
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {element.linkedSceneIds.map(sceneId => {
                        const scene = scenes.find(s => s.id === sceneId);
                        return (
                          <Badge key={sceneId} variant="outline" className="text-xs">
                            {scene ? `Scene ${scene.number}` : sceneId}
                          </Badge>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-500">
                      {Object.keys(element.customFields).length} fields
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {filteredElements.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            {elements.length === 0 ? 'No elements found' : 'No elements match your filters'}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CatalogManager;
