// src/modules/breakdown/StripboardView.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from '../../components/ui/card';
import { 
  Button 
} from '../../components/ui/button';
import { 
  Input 
} from '../../components/ui/input';
import { 
  Badge 
} from '../../components/ui/badge';
import { 
  Alert, 
  AlertDescription 
} from '../../components/ui/alert';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  Plus, 
  GripVertical,
  Trash2,
  DollarSign
} from 'lucide-react';
import { 
  subscribeStripDays,
  createStripDay,
  updateStripDay,
  deleteStripDay,
  reorderScenes,
  calculateTotalDuration,
  isOverTarget,
  getOverageMinutes,
  type StripDay 
} from '../../services/stripboard';
import { 
  subscribeScenes,
  type Scene 
} from '../../services/scenes';
import { 
  calculateDayBudgetTotals,
  formatMoney,
  type DayBudgetTotals 
} from '../../services/budget';

interface StripboardViewProps {
  projectId: string;
}

interface DragItem {
  dayId: string;
  sceneId: string;
  index: number;
}

const StripboardView: React.FC<StripboardViewProps> = ({ projectId }) => {
  const [stripDays, setStripDays] = useState<StripDay[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [sceneDurations, setSceneDurations] = useState<Map<string, number>>(new Map());
  const [dayBudgets, setDayBudgets] = useState<Map<string, DayBudgetTotals>>(new Map());
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [newDayDate, setNewDayDate] = useState('');
  const [newDayTargetMins, setNewDayTargetMins] = useState(480); // 8 hours default

  // Subscribe to strip days
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeStripDays(projectId, async (stripDaysData) => {
      setStripDays(stripDaysData);
      
      // Calculate budget totals for each day
      const budgetMap = new Map<string, DayBudgetTotals>();
      for (const day of stripDaysData) {
        try {
          const budget = await calculateDayBudgetTotals(projectId, day.id);
          budgetMap.set(day.id, budget);
        } catch (error) {
          console.error(`Error calculating budget for day ${day.id}:`, error);
        }
      }
      setDayBudgets(budgetMap);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Subscribe to scenes
  useEffect(() => {
    if (!projectId) return;

    const unsubscribe = subscribeScenes(projectId, (scenesData) => {
      setScenes(scenesData);
      
      // Build scene durations map
      const durations = new Map<string, number>();
      scenesData.forEach(scene => {
        durations.set(scene.id, scene.durationMins);
      });
      setSceneDurations(durations);
    });

    return () => unsubscribe();
  }, [projectId]);

  // Get scene by ID
  const getSceneById = useCallback((sceneId: string): Scene | undefined => {
    return scenes.find(scene => scene.id === sceneId);
  }, [scenes]);

  // Handle creating new strip day
  const handleCreateStripDay = async () => {
    if (!newDayDate) return;

    try {
      await createStripDay(projectId, {
        date: newDayDate,
        targetMins: newDayTargetMins
      });
      setNewDayDate('');
      setNewDayTargetMins(480);
    } catch (error) {
      console.error('Error creating strip day:', error);
    }
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, dayId: string, sceneId: string, index: number) => {
    setDraggedItem({ dayId, sceneId, index });
    e.dataTransfer.effectAllowed = 'move';
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, targetDayId: string, targetIndex: number) => {
    e.preventDefault();
    
    if (!draggedItem) return;

    try {
      if (draggedItem.dayId === targetDayId) {
        // Reordering within the same day
        await reorderScenes(
          projectId,
          targetDayId,
          draggedItem.index,
          targetIndex,
          sceneDurations
        );
      } else {
        // Moving between days
        const sourceDay = stripDays.find(day => day.id === draggedItem.dayId);
        const targetDay = stripDays.find(day => day.id === targetDayId);
        
        if (!sourceDay || !targetDay) return;

        // Remove from source day
        const newSourceOrder = sourceDay.sceneOrder.filter((_, index) => index !== draggedItem.index);
        const newSourceTotal = calculateTotalDuration(newSourceOrder, sceneDurations);
        
        // Add to target day
        const newTargetOrder = [...targetDay.sceneOrder];
        newTargetOrder.splice(targetIndex, 0, draggedItem.sceneId);
        const newTargetTotal = calculateTotalDuration(newTargetOrder, sceneDurations);

        // Update both days
        await Promise.all([
          updateStripDay(projectId, draggedItem.dayId, {
            sceneOrder: newSourceOrder,
            totalMins: newSourceTotal
          }),
          updateStripDay(projectId, targetDayId, {
            sceneOrder: newTargetOrder,
            totalMins: newTargetTotal
          })
        ]);
      }
    } catch (error) {
      console.error('Error reordering scenes:', error);
    } finally {
      setDraggedItem(null);
    }
  };

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedItem(null);
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  // Format date
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading stripboard...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Stripboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-end">
            <div>
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={newDayDate}
                onChange={(e) => setNewDayDate(e.target.value)}
                className="w-40"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Target Duration (mins)</label>
              <Input
                type="number"
                value={newDayTargetMins}
                onChange={(e) => setNewDayTargetMins(Number(e.target.value))}
                className="w-32"
                min="0"
              />
            </div>
            <Button onClick={handleCreateStripDay} disabled={!newDayDate}>
              <Plus className="h-4 w-4 mr-2" />
              Add Day
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Strip Days */}
      <div className="grid gap-4">
        {stripDays.map((stripDay) => {
          const isOver = isOverTarget(stripDay);
          const overage = getOverageMinutes(stripDay);
          const dayBudget = dayBudgets.get(stripDay.id);
          
          return (
            <Card key={stripDay.id} className={isOver ? 'border-red-200 bg-red-50' : ''}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold">{formatDate(stripDay.date)}</h3>
                    <Badge variant="outline">
                      {stripDay.sceneOrder.length} scenes
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {formatDuration(stripDay.totalMins)} / {formatDuration(stripDay.targetMins)}
                    </div>
                    {dayBudget && (
                      <div className="flex items-center gap-1 text-sm text-gray-600">
                        <DollarSign className="h-4 w-4" />
                        {formatMoney(dayBudget.totalCents, dayBudget.currency)}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {isOver && (
                      <Alert className="py-2 px-3 border-red-200 bg-red-100">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700 text-sm">
                          {formatDuration(overage)} over target
                        </AlertDescription>
                      </Alert>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteStripDay(projectId, stripDay.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {stripDay.sceneOrder.length === 0 ? (
                    <div className="text-center py-8 text-gray-500 text-sm">
                      No scenes scheduled for this day
                    </div>
                  ) : (
                    stripDay.sceneOrder.map((sceneId, index) => {
                      const scene = getSceneById(sceneId);
                      const duration = sceneDurations.get(sceneId) || 0;
                      
                      return (
                        <div
                          key={`${stripDay.id}-${sceneId}-${index}`}
                          draggable
                          onDragStart={(e) => handleDragStart(e, stripDay.id, sceneId, index)}
                          onDragEnd={handleDragEnd}
                          className={`
                            flex items-center gap-3 p-3 rounded-lg border cursor-move
                            hover:bg-gray-50 transition-colors
                            ${draggedItem?.dayId === stripDay.id && draggedItem?.index === index 
                              ? 'opacity-50' : ''
                            }
                          `}
                        >
                          <GripVertical className="h-4 w-4 text-gray-400" />
                          <div className="flex-1">
                            <div className="font-medium">
                              {scene ? `Scene ${scene.number}` : `Scene ${sceneId}`}
                            </div>
                            {scene && (
                              <div className="text-sm text-gray-600">
                                {scene.heading}
                              </div>
                            )}
                          </div>
                          <Badge variant="secondary">
                            {formatDuration(duration)}
                          </Badge>
                        </div>
                      );
                    })
                  )}
                  
                  {/* Drop zone for adding scenes */}
                  <div
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stripDay.id, stripDay.sceneOrder.length)}
                    className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center text-gray-500 text-sm hover:border-gray-400 transition-colors"
                  >
                    Drop scenes here to add to this day
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {stripDays.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No shooting days scheduled</h3>
            <p className="text-gray-500 mb-4">Create your first shooting day to start building your stripboard.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StripboardView;
