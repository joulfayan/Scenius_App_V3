import React, { useState, useEffect, useCallback } from "react";
import { CallSheet } from "@/api/entities";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  Plus, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone,
  Users,
  FileText,
  Download,
  Edit3,
  Trash2,
  X,
  GripVertical,
  UserPlus
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { reorder, move } from "@/components/dnd/util";
import { save } from "@/components/dnd/persistence";
import { announce } from "@/components/dnd/a11y";
import { featureFlags } from "@/components/featureFlags";

export default function CallSheetEditor({ projectId }) {
  const [callSheets, setCallSheets] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingCallSheet, setEditingCallSheet] = useState(null);
  const [activeSheet, setActiveSheet] = useState(null);
  
  // DnD-specific state
  const [sections, setSections] = useState([
    'header', 'team', 'location', 'parking', 'hospital', 'notes'
  ]);
  const [teamByDept, setTeamByDept] = useState({
    production: [],
    camera: [],
    sound: [],
    other: []
  });
  const [infoLayout, setInfoLayout] = useState(['location', 'parking', 'weather']);
  const [availablePeople] = useState([
    { id: '1', name: 'John Director', role: 'Director', phone: '555-0101' },
    { id: '2', name: 'Jane Producer', role: 'Producer', phone: '555-0102' },
    { id: '3', name: 'Mike Camera', role: 'DP', phone: '555-0103' },
    { id: '4', name: 'Sarah Sound', role: 'Sound Mixer', phone: '555-0104' },
  ]);

  const loadCallSheets = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedCallSheets = await CallSheet.filter({ project_id: projectId }, '-shoot_date');
      setCallSheets(fetchedCallSheets);
      
      if (fetchedCallSheets.length > 0) {
        const sheet = fetchedCallSheets[0];
        setActiveSheet(sheet);
        
        // Load DnD state from sheet data
        if (sheet.sections) setSections(sheet.sections);
        if (sheet.team) setTeamByDept(sheet.team);
        if (sheet.infoLayout) setInfoLayout(sheet.infoLayout);
      }
    } catch (error) {
      console.error('Error loading call sheets:', error);
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadCallSheets();
  }, [loadCallSheets]);

  const handleDragEnd = useCallback((result) => {
    if (!result.destination) return;

    const { source, destination, draggableId, type } = result;

    // Handle different drag types
    if (type === 'SECTIONS') {
      const newSections = reorder(sections, source.index, destination.index);
      setSections(newSections);
      
      announce(`Section moved to position ${destination.index + 1}`);
      
      if (activeSheet && featureFlags.dnd) {
        save({
          Entity: CallSheet,
          docId: activeSheet.id,
          payload: { sections: newSections },
          onSuccess: () => console.log('Sections order saved'),
          onFailure: (error) => {
            setSections(sections); // Rollback
            announce('Failed to save section order changes');
          }
        });
      }
    }

    else if (type === 'TEAM') {
      const sourceDeptId = source.droppableId.replace('CALLSHEET:TEAM:', '');
      const destDeptId = destination.droppableId.replace('CALLSHEET:TEAM:', '');

      if (sourceDeptId === destDeptId) {
        // Reorder within same department
        const newTeam = { ...teamByDept };
        newTeam[sourceDeptId] = reorder(teamByDept[sourceDeptId], source.index, destination.index);
        setTeamByDept(newTeam);
        
        announce(`Team member reordered within ${sourceDeptId}`);
      } else {
        // Move between departments
        const result = move(
          teamByDept[sourceDeptId],
          teamByDept[destDeptId],
          source.index,
          destination.index
        );
        
        const newTeam = {
          ...teamByDept,
          [sourceDeptId]: result.source,
          [destDeptId]: result.destination
        };
        setTeamByDept(newTeam);
        
        announce(`Team member moved from ${sourceDeptId} to ${destDeptId}`);
      }

      if (activeSheet && featureFlags.dnd) {
        save({
          Entity: CallSheet,
          docId: activeSheet.id,
          payload: { team: teamByDept },
          onSuccess: () => console.log('Team assignments saved'),
          onFailure: (error) => {
            setTeamByDept(teamByDept); // Rollback
            announce('Failed to save team changes');
          }
        });
      }
    }

    else if (type === 'PEOPLE') {
      // Copy person from sidebar to team department
      if (destination.droppableId.startsWith('CALLSHEET:TEAM:')) {
        const deptId = destination.droppableId.replace('CALLSHEET:TEAM:', '');
        const person = availablePeople.find(p => p.id === draggableId);
        
        if (person) {
          const newAssignment = {
            id: `${person.id}-${Date.now()}`,
            contactId: person.id,
            name: person.name,
            role: person.role,
            phone: person.phone,
            callTime: '07:00',
            notes: ''
          };
          
          const newTeam = { ...teamByDept };
          newTeam[deptId] = [...teamByDept[deptId], newAssignment];
          setTeamByDept(newTeam);
          
          announce(`${person.name} added to ${deptId} department`);

          if (activeSheet && featureFlags.dnd) {
            save({
              Entity: CallSheet,
              docId: activeSheet.id,
              payload: { team: newTeam },
              onSuccess: () => console.log('Person added to team'),
              onFailure: (error) => {
                setTeamByDept(teamByDept); // Rollback
                announce('Failed to add person to team');
              }
            });
          }
        }
      }
    }

    else if (type === 'INFO') {
      const newInfoLayout = reorder(infoLayout, source.index, destination.index);
      setInfoLayout(newInfoLayout);
      
      announce(`Info block moved to position ${destination.index + 1}`);

      if (activeSheet && featureFlags.dnd) {
        save({
          Entity: CallSheet,
          docId: activeSheet.id,
          payload: { infoLayout: newInfoLayout },
          onSuccess: () => console.log('Info layout saved'),
          onFailure: (error) => {
            setInfoLayout(infoLayout); // Rollback
            announce('Failed to save info layout changes');
          }
        });
      }
    }
  }, [sections, teamByDept, infoLayout, availablePeople, activeSheet]);

  const createCallSheet = async (callSheetData) => {
    try {
      const newCallSheet = await CallSheet.create({
        ...callSheetData,
        project_id: projectId,
        sections,
        team: teamByDept,
        infoLayout
      });
      setCallSheets(prev => [newCallSheet, ...prev]);
      setActiveSheet(newCallSheet);
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating call sheet:', error);
    }
  };

  const deleteCallSheet = async (callSheetId) => {
    try {
      await CallSheet.delete(callSheetId);
      setCallSheets(prev => prev.filter(cs => cs.id !== callSheetId));
    } catch (error) {
      console.error('Error deleting call sheet:', error);
    }
  };

  // UI Components
  const SectionCard = ({ section, index }) => (
    <Draggable draggableId={section} index={index} type="SECTIONS">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`p-4 rounded-xl transition-all duration-200 ${
            snapshot.isDragging ? 'scale-105 shadow-2xl' : ''
          }`}
          style={{
            background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
            boxShadow: snapshot.isDragging 
              ? '8px 8px 16px rgba(0,0,0,0.2)' 
              : '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)',
            ...provided.draggableProps.style
          }}
        >
          <div className="flex items-center gap-3">
            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-5 h-5 text-gray-400" />
            </div>
            <h3 className="font-semibold text-gray-800 capitalize">
              {section.replace('_', ' ')}
            </h3>
          </div>
        </div>
      )}
    </Draggable>
  );

  const TeamRow = ({ assignment, index, deptId }) => (
    <Draggable draggableId={assignment.id} index={index} type="TEAM">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`group flex items-center gap-3 p-3 rounded-lg transition-all duration-200 ${
            snapshot.isDragging ? 'scale-105 shadow-lg bg-blue-50' : 'bg-white/50 hover:bg-white/80'
          }`}
          style={provided.draggableProps.style}
        >
          <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity">
            <GripVertical className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex-1">
            <p className="font-medium text-gray-800">{assignment.name}</p>
            <p className="text-sm text-gray-600">{assignment.role}</p>
          </div>
          <div className="text-sm text-gray-500">
            {assignment.callTime}
          </div>
          <button
            onClick={() => {
              const newTeam = { ...teamByDept };
              newTeam[deptId] = teamByDept[deptId].filter(a => a.id !== assignment.id);
              setTeamByDept(newTeam);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 rounded text-red-500 hover:bg-red-100 transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}
    </Draggable>
  );

  const PersonChip = ({ person, index }) => (
    <Draggable draggableId={person.id} index={index} type="PEOPLE">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`flex items-center gap-2 p-2 rounded-lg cursor-grab active:cursor-grabbing transition-all duration-200 ${
            snapshot.isDragging ? 'scale-105 shadow-lg bg-blue-100' : 'bg-gray-100 hover:bg-gray-200'
          }`}
          style={provided.draggableProps.style}
        >
          <UserPlus className="w-4 h-4 text-blue-600" />
          <div>
            <p className="text-sm font-medium text-gray-800">{person.name}</p>
            <p className="text-xs text-gray-600">{person.role}</p>
          </div>
        </div>
      )}
    </Draggable>
  );

  const InfoBlock = ({ blockId, index }) => (
    <Draggable draggableId={blockId} index={index} type="INFO">
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          className={`p-4 rounded-xl transition-all duration-200 ${
            snapshot.isDragging ? 'scale-105 shadow-2xl' : ''
          }`}
          style={{
            background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
            boxShadow: snapshot.isDragging 
              ? '8px 8px 16px rgba(0,0,0,0.2)' 
              : '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)',
            ...provided.draggableProps.style
          }}
        >
          <div className="flex items-center gap-3">
            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="w-4 h-4 text-gray-400" />
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 capitalize mb-1">
                {blockId.replace('_', ' ')}
              </h4>
              <p className="text-sm text-gray-600">
                {blockId === 'location' && 'Coffee Shop - 123 Main St'}
                {blockId === 'parking' && 'Street parking available'}
                {blockId === 'weather' && 'Sunny, 75°F'}
              </p>
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
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-gray-800">Call Sheets</h2>
            <p className="text-gray-600">Organize your shooting days with drag-and-drop</p>
          </div>
          <Button onClick={() => setShowCreateForm(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Call Sheet
          </Button>
        </div>

        {activeSheet ? (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Main Content - 3 columns */}
            <div className="lg:col-span-3 space-y-6">
              {/* Sections */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Sections</h3>
                <Droppable droppableId="CALLSHEET:SECTIONS" type="SECTIONS">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-3 p-4 rounded-xl transition-all duration-200 ${
                        snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      {sections.map((section, index) => (
                        <SectionCard key={section} section={section} index={index} />
                      ))}
                      {provided.placeholder}
                      {sections.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p>Drop sections here to organize your call sheet</p>
                        </div>
                      )}
                    </div>
                  )}
                </Droppable>
              </div>

              {/* Team Departments */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Team</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {Object.entries(teamByDept).map(([deptId, assignments]) => (
                    <div key={deptId}>
                      <h4 className="font-medium text-gray-700 mb-3 capitalize">{deptId}</h4>
                      <Droppable droppableId={`CALLSHEET:TEAM:${deptId}`} type="TEAM">
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className={`space-y-2 p-4 rounded-xl min-h-24 transition-all duration-200 ${
                              snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50'
                            }`}
                          >
                            {assignments.map((assignment, index) => (
                              <TeamRow 
                                key={assignment.id} 
                                assignment={assignment} 
                                index={index}
                                deptId={deptId}
                              />
                            ))}
                            {provided.placeholder}
                            {assignments.length === 0 && (
                              <div className="text-center py-4 text-gray-500">
                                <Users className="w-6 h-6 mx-auto mb-1 opacity-50" />
                                <p className="text-sm">Drop people here</p>
                              </div>
                            )}
                          </div>
                        )}
                      </Droppable>
                    </div>
                  ))}
                </div>
              </div>

              {/* Info Layout */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Information Blocks</h3>
                <Droppable droppableId="CALLSHEET:INFO:COLUMNS" type="INFO">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-xl transition-all duration-200 ${
                        snapshot.isDraggingOver ? 'bg-blue-50 ring-2 ring-blue-200' : 'bg-gray-50'
                      }`}
                    >
                      {infoLayout.map((blockId, index) => (
                        <InfoBlock key={blockId} blockId={blockId} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>

            {/* Sidebar - 1 column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Available People</h3>
                <Droppable droppableId="CALLSHEET:SIDEBAR:PEOPLE" type="PEOPLE">
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      className={`space-y-2 p-4 rounded-xl transition-all duration-200 ${
                        snapshot.isDraggingOver ? 'bg-green-50 ring-2 ring-green-200' : 'bg-gray-50'
                      }`}
                    >
                      {availablePeople.map((person, index) => (
                        <PersonChip key={person.id} person={person} index={index} />
                      ))}
                      {provided.placeholder}
                    </div>
                  )}
                </Droppable>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 rounded-2xl" style={{
            background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
            boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.1), inset -2px -2px 6px rgba(255,255,255,0.7)',
          }}>
            <Calendar className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">No call sheets yet</h3>
            <p className="text-gray-500 mb-6">Create your first call sheet to get started</p>
            <Button onClick={() => setShowCreateForm(true)}>
              <Plus className="w-5 h-5 mr-2" />
              Create Your First Call Sheet
            </Button>
          </div>
        )}

        {/* Create Form Modal (existing form code) */}
        {showCreateForm && (
          <CallSheetForm
            onSave={createCallSheet}
            onCancel={() => setShowCreateForm(false)}
          />
        )}
      </div>
    </DragDropContext>
  );
}

// Simple form component for creating call sheets
const CallSheetForm = ({ onSave, onCancel }) => {
  const [formData, setFormData] = useState({
    shoot_date: '',
    call_time: '07:00',
    wrap_time: '18:00',
    location: '',
    location_address: '',
    weather: '',
    special_notes: ''
  });

  const handleSave = () => {
    if (!formData.shoot_date) return;
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="w-full max-w-md p-6 rounded-2xl" style={{
        background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
        boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)',
      }}>
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-800">Create Call Sheet</h3>
          <button onClick={onCancel} className="p-2 rounded-lg text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="space-y-4">
          <div>
            <Label>Shoot Date</Label>
            <Input
              type="date"
              value={formData.shoot_date}
              onChange={(e) => setFormData({...formData, shoot_date: e.target.value})}
            />
          </div>
          <div>
            <Label>Location</Label>
            <Input
              value={formData.location}
              onChange={(e) => setFormData({...formData, location: e.target.value})}
              placeholder="Coffee Shop Interior"
            />
          </div>
          <div>
            <Label>Call Time</Label>
            <Input
              type="time"
              value={formData.call_time}
              onChange={(e) => setFormData({...formData, call_time: e.target.value})}
            />
          </div>
        </div>
        
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onCancel} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSave} className="flex-1">
            Create Call Sheet
          </Button>
        </div>
      </div>
    </div>
  );
};