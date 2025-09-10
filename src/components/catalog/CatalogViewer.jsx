import React, { useState, useEffect, useCallback } from 'react';
import { CatalogItem } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Loader2, Diamond, Plus, Package, Shirt, Car, Sparkle, Search, X } from 'lucide-react';
import { toast } from "sonner";

// Using a subset of breakdown categories for the catalog for now
const catalogCategories = {
  props: { label: 'Props', icon: Package },
  costumes: { label: 'Costumes', icon: Shirt },
  vehicles: { label: 'Vehicles', icon: Car },
  makeup: { label: 'Makeup', icon: Sparkle },
  set_dressing: { label: 'Set Dressing', icon: Package },
  special_equipment: { label: 'Special Equipment', icon: Package },
  miscellaneous: { label: 'Miscellaneous', icon: Diamond },
};

const statusColors = {
  needed: 'bg-yellow-100 text-yellow-800',
  sourced: 'bg-blue-100 text-blue-800',
  confirmed: 'bg-purple-100 text-purple-800',
  delivered: 'bg-green-100 text-green-800',
  returned: 'bg-gray-100 text-gray-800',
};

export default function CatalogViewer({ projectId }) {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const loadItems = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedItems = await CatalogItem.filter({ project_id: projectId }, '-created_date');
      setItems(fetchedItems);
    } catch (error) {
      console.error('Error loading catalog items:', error);
      toast.error('Failed to load catalog.');
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const handleCreateItem = async (itemData) => {
    setIsCreating(true);
    try {
      const newItem = await CatalogItem.create({
        ...itemData,
        project_id: projectId
      });
      
      setItems(prev => [newItem, ...prev]);
      setShowAddDialog(false);
      toast.success(`"${itemData.name}" added to catalog successfully.`);
    } catch (error) {
      console.error('Error creating catalog item:', error);
      toast.error('Failed to add item to catalog.');
    }
    setIsCreating(false);
  };

  const AddItemDialog = () => {
    const [formData, setFormData] = useState({
      name: '',
      description: '',
      category: 'props',
      source: 'rent',
      status: 'needed',
      quantity_needed: 1,
      cost: '',
      vendor: '',
      notes: ''
    });

    const handleSubmit = (e) => {
      e.preventDefault();
      if (!formData.name.trim()) {
        toast.error('Item name is required.');
        return;
      }
      
      const itemData = {
        ...formData,
        cost: formData.cost ? parseFloat(formData.cost) : undefined
      };
      
      handleCreateItem(itemData);
    };

    const resetForm = () => {
      setFormData({
        name: '',
        description: '',
        category: 'props',
        source: 'rent',
        status: 'needed',
        quantity_needed: 1,
        cost: '',
        vendor: '',
        notes: ''
      });
    };

    return (
      <Dialog open={showAddDialog} onOpenChange={(open) => {
        setShowAddDialog(open);
        if (!open) resetForm();
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add New Catalog Item</DialogTitle>
            <DialogDescription>
              Manually add a new item to your project catalog.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Item Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                placeholder="Coffee cup, Leather jacket, etc."
                required
              />
            </div>
            
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                placeholder="Detailed description of the item..."
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select 
                  value={formData.category} 
                  onValueChange={(value) => setFormData({...formData, category: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(catalogCategories).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="source">Source</Label>
                <Select 
                  value={formData.source} 
                  onValueChange={(value) => setFormData({...formData, source: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="purchase">Purchase</SelectItem>
                    <SelectItem value="rent">Rent</SelectItem>
                    <SelectItem value="build">Build</SelectItem>
                    <SelectItem value="owned">Already Owned</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="status">Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(value) => setFormData({...formData, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="needed">Needed</SelectItem>
                    <SelectItem value="sourced">Sourced</SelectItem>
                    <SelectItem value="confirmed">Confirmed</SelectItem>
                    <SelectItem value="delivered">Delivered</SelectItem>
                    <SelectItem value="returned">Returned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  value={formData.quantity_needed}
                  onChange={(e) => setFormData({...formData, quantity_needed: parseInt(e.target.value) || 1})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cost">Estimated Cost</Label>
                <Input
                  id="cost"
                  type="number"
                  step="0.01"
                  value={formData.cost}
                  onChange={(e) => setFormData({...formData, cost: e.target.value})}
                  placeholder="0.00"
                />
              </div>

              <div>
                <Label htmlFor="vendor">Vendor/Supplier</Label>
                <Input
                  id="vendor"
                  value={formData.vendor}
                  onChange={(e) => setFormData({...formData, vendor: e.target.value})}
                  placeholder="Company name"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                placeholder="Additional notes, requirements, etc."
                rows={2}
              />
            </div>

            <div className="flex gap-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={isCreating || !formData.name.trim()}
                className="flex-1"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Item'
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  };

  const filteredItems = items.filter(item => {
    const searchMatch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const categoryMatch = categoryFilter === 'all' || item.category === categoryFilter;
    return searchMatch && categoryMatch;
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800 flex items-center gap-2">
            <Diamond className="w-6 h-6 text-blue-500" /> Catalog
          </h2>
          <p className="text-gray-600">A central repository for all production assets.</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item Manually
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search assets..."
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {Object.entries(catalogCategories).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Catalog Table */}
      <div className="rounded-2xl border overflow-hidden" style={{
        background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
        boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
      }}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-2/5">Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Source</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Qty</TableHead>
              <TableHead className="text-right">Cost</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">
                  <div>
                    <p>{item.name}</p>
                    {item.description && (
                      <p className="text-sm text-gray-500 mt-1">{item.description}</p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    {React.createElement(catalogCategories[item.category]?.icon || Diamond, {className: "w-4 h-4 text-gray-500"})}
                    {catalogCategories[item.category]?.label || 'Uncategorized'}
                  </div>
                </TableCell>
                <TableCell className="capitalize">{item.source}</TableCell>
                <TableCell>
                  <Badge className={`capitalize ${statusColors[item.status]}`}>{item.status}</Badge>
                </TableCell>
                <TableCell>{item.quantity_needed || 1}</TableCell>
                <TableCell className="text-right">
                  {item.cost ? `$${item.cost.toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" disabled>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredItems.length === 0 && (
          <div className="text-center p-8 text-gray-500">
            {searchTerm || categoryFilter !== 'all' 
              ? 'No items match your filters.' 
              : 'No catalog items yet. Add your first item manually or tag elements in the breakdown.'
            }
          </div>
        )}
      </div>

      <AddItemDialog />
    </div>
  );
}