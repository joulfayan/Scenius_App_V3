// src/modules/budget/BudgetTable.tsx
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
  Button 
} from '../../components/ui/button';
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
  Badge 
} from '../../components/ui/badge';
import { 
  Alert, 
  AlertDescription 
} from '../../components/ui/alert';
import { 
  DollarSign, 
  Plus, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Calculator,
  TrendingUp,
  PieChart
} from 'lucide-react';
import { 
  createBudgetLineItem,
  updateBudgetLineItem,
  deleteBudgetLineItem,
  subscribeBudgetLineItems,
  calculateBudgetTotals,
  formatMoney,
  formatMoneyCompact,
  validateMoneyInput,
  getUniqueCategories,
  getBudgetSummaryByCategory,
  type BudgetLineItem,
  type CreateBudgetLineItemData,
  type BudgetScope 
} from '../../services/budget';

interface BudgetTableProps {
  projectId: string;
  scope?: BudgetScope;
  refId?: string;
  showSummary?: boolean;
}

interface EditingItem {
  id: string;
  field: string;
  value: any;
}

const BudgetTable: React.FC<BudgetTableProps> = ({ 
  projectId, 
  scope = 'project', 
  refId = '', 
  showSummary = true 
}) => {
  const [lineItems, setLineItems] = useState<BudgetLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<EditingItem | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newItem, setNewItem] = useState<CreateBudgetLineItemData>({
    scope,
    refId,
    description: '',
    category: '',
    qty: 1,
    unitCents: 0,
    currency: 'USD'
  });
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');

  // Subscribe to budget line items
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeBudgetLineItems(projectId, (items) => {
      // Filter by scope and refId if specified
      const filteredItems = scope && refId 
        ? items.filter(item => item.scope === scope && item.refId === refId)
        : items;
      
      setLineItems(filteredItems);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId, scope, refId]);

  // Get unique categories for filter
  const uniqueCategories = getUniqueCategories(lineItems);

  // Filter line items
  const filteredItems = lineItems.filter(item => {
    const matchesCategory = !filterCategory || item.category === filterCategory;
    const matchesSearch = !searchTerm || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesCategory && matchesSearch;
  });

  // Calculate totals
  const totals = calculateBudgetTotals(filteredItems);
  const categorySummary = getBudgetSummaryByCategory(filteredItems);

  // Handle creating new item
  const handleCreateItem = async () => {
    if (!newItem.description || !newItem.category) return;

    try {
      await createBudgetLineItem(projectId, {
        ...newItem,
        refId: refId || newItem.refId
      });
      
      setNewItem({
        scope,
        refId,
        description: '',
        category: '',
        qty: 1,
        unitCents: 0,
        currency: 'USD'
      });
      setIsCreating(false);
    } catch (error) {
      console.error('Error creating budget line item:', error);
    }
  };

  // Handle editing item
  const handleEditItem = (itemId: string, field: string, currentValue: any) => {
    setEditingItem({ id: itemId, field, value: currentValue });
  };

  // Handle saving edit
  const handleSaveEdit = async () => {
    if (!editingItem) return;

    try {
      const updateData: any = { [editingItem.field]: editingItem.value };
      
      // Recalculate total if qty or unitCents changed
      if (editingItem.field === 'qty' || editingItem.field === 'unitCents') {
        const item = lineItems.find(i => i.id === editingItem!.id);
        if (item) {
          const newQty = editingItem.field === 'qty' ? editingItem.value : item.qty;
          const newUnitCents = editingItem.field === 'unitCents' ? editingItem.value : item.unitCents;
          updateData.totalCents = newQty * newUnitCents;
        }
      }

      await updateBudgetLineItem(projectId, editingItem.id, updateData);
      setEditingItem(null);
    } catch (error) {
      console.error('Error updating budget line item:', error);
    }
  };

  // Handle canceling edit
  const handleCancelEdit = () => {
    setEditingItem(null);
  };

  // Handle deleting item
  const handleDeleteItem = async (itemId: string) => {
    if (window.confirm('Are you sure you want to delete this line item?')) {
      try {
        await deleteBudgetLineItem(projectId, itemId);
      } catch (error) {
        console.error('Error deleting budget line item:', error);
      }
    }
  };

  // Handle money input validation
  const handleMoneyInput = (value: string, field: 'unitCents') => {
    try {
      const cents = validateMoneyInput(value);
      if (field === 'unitCents') {
        setNewItem(prev => ({ ...prev, unitCents: cents }));
      }
    } catch (error) {
      // Invalid input, don't update
    }
  };

  // Render editable cell
  const renderEditableCell = (item: BudgetLineItem, field: string, value: any, type: 'text' | 'number' | 'money' = 'text') => {
    const isEditing = editingItem?.id === item.id && editingItem?.field === field;

    if (isEditing) {
      return (
        <div className="flex items-center gap-2">
          <Input
            type={type === 'money' ? 'number' : type}
            value={type === 'money' ? (value / 100).toFixed(2) : value}
            onChange={(e) => {
              if (type === 'money') {
                handleMoneyInput(e.target.value, field as 'unitCents');
              } else {
                setEditingItem(prev => prev ? { ...prev, value: e.target.value } : null);
              }
            }}
            className="h-8"
            autoFocus
            step={type === 'money' ? '0.01' : undefined}
          />
          <Button
            size="sm"
            variant="ghost"
            onClick={handleSaveEdit}
            className="h-8 w-8 p-0"
          >
            <Check className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleCancelEdit}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      );
    }

    const displayValue = type === 'money' ? formatMoney(value) : value;

    return (
      <div 
        className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded"
        onClick={() => handleEditItem(item.id, field, value)}
      >
        <span className="flex-1">{displayValue}</span>
        <Edit2 className="h-3 w-3 opacity-0 group-hover:opacity-100" />
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading budget...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      {showSummary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-green-600" />
                <div>
                  <div className="text-2xl font-bold">{formatMoney(totals.totalCents)}</div>
                  <div className="text-sm text-gray-600">Total Budget</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                <div>
                  <div className="text-2xl font-bold">{totals.lineItemCount}</div>
                  <div className="text-sm text-gray-600">Line Items</div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <PieChart className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="text-2xl font-bold">{Object.keys(categorySummary).length}</div>
                  <div className="text-sm text-gray-600">Categories</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Filters and Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Budget Line Items
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search line items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="All Categories" />
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

            <Button onClick={() => setIsCreating(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Line Item
            </Button>
          </div>

          {/* Create New Item Form */}
          {isCreating && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <h3 className="font-medium mb-3">Add New Line Item</h3>
              <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                <Input
                  placeholder="Description"
                  value={newItem.description}
                  onChange={(e) => setNewItem(prev => ({ ...prev, description: e.target.value }))}
                />
                <Input
                  placeholder="Category"
                  value={newItem.category}
                  onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                />
                <Input
                  type="number"
                  placeholder="Quantity"
                  value={newItem.qty}
                  onChange={(e) => setNewItem(prev => ({ ...prev, qty: Number(e.target.value) }))}
                />
                <Input
                  type="number"
                  placeholder="Unit Price ($)"
                  value={(newItem.unitCents / 100).toFixed(2)}
                  onChange={(e) => handleMoneyInput(e.target.value, 'unitCents')}
                  step="0.01"
                />
                <Select value={newItem.currency} onValueChange={(value) => setNewItem(prev => ({ ...prev, currency: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
                <div className="flex gap-2">
                  <Button onClick={handleCreateItem} disabled={!newItem.description || !newItem.category}>
                    <Check className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Line Items Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Qty</TableHead>
                  <TableHead>Unit Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredItems.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      {renderEditableCell(item, 'description', item.description)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(item, 'category', item.category)}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(item, 'qty', item.qty, 'number')}
                    </TableCell>
                    <TableCell>
                      {renderEditableCell(item, 'unitCents', item.unitCents, 'money')}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">
                        {formatMoney(item.totalCents, item.currency)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredItems.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              {lineItems.length === 0 ? 'No line items found' : 'No line items match your filters'}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Breakdown */}
      {showSummary && Object.keys(categorySummary).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(categorySummary).map(([category, summary]) => (
                <div key={category} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline">{category}</Badge>
                    <span className="text-sm text-gray-600">{summary.itemCount} items</span>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatMoney(summary.totalCents)}</div>
                    <div className="text-sm text-gray-600">{summary.percentage.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BudgetTable;
