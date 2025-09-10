// src/modules/shoot/CallSheetGenerator.tsx
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
  Textarea 
} from '../../components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { 
  Checkbox 
} from '../../components/ui/checkbox';
import { 
  Badge 
} from '../../components/ui/badge';
import { 
  Alert, 
  AlertDescription 
} from '../../components/ui/alert';
import { 
  FileText, 
  Download, 
  Plus, 
  Trash2, 
  RefreshCw,
  Calendar,
  MapPin,
  Users,
  Cloud,
  Hospital
} from 'lucide-react';
import { 
  createCallSheet,
  updateCallSheet,
  deleteCallSheet,
  listCallSheetsWithDetails,
  autoPopulateCallSheet,
  exportCallSheetAsText,
  type CallSheet,
  type CallSheetWithDetails,
  type CreateCallSheetData 
} from '../../services/callsheets';
import { 
  subscribeStripDays,
  type StripDay 
} from '../../services/stripboard';
import { 
  subscribeContacts,
  type Contact 
} from '../../services/contacts';
import { 
  subscribeLocations,
  type Location 
} from '../../services/locations';

interface CallSheetGeneratorProps {
  projectId: string;
}

interface WeatherData {
  high: number;
  low: number;
  condition: string;
  sunrise: string;
  sunset: string;
}

interface HospitalData {
  name: string;
  address: string;
  phone: string;
  distance: string;
}

const CallSheetGenerator: React.FC<CallSheetGeneratorProps> = ({ projectId }) => {
  const [callSheets, setCallSheets] = useState<CallSheetWithDetails[]>([]);
  const [stripDays, setStripDays] = useState<StripDay[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCallSheet, setEditingCallSheet] = useState<CallSheetWithDetails | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedDayId, setSelectedDayId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [weather, setWeather] = useState<WeatherData>({
    high: 75,
    low: 60,
    condition: 'Sunny',
    sunrise: '6:30 AM',
    sunset: '7:30 PM'
  });
  const [hospitals, setHospitals] = useState<HospitalData[]>([]);
  const [newHospital, setNewHospital] = useState<HospitalData>({
    name: '',
    address: '',
    phone: '',
    distance: ''
  });

  // Form state
  const [formData, setFormData] = useState<CreateCallSheetData>({
    date: '',
    unitName: '',
    dayId: '',
    locationId: '',
    recipients: [],
    notes: ''
  });

  // Subscribe to data
  useEffect(() => {
    if (!projectId) return;

    const unsubscribeCallSheets = listCallSheetsWithDetails(projectId).then(setCallSheets);
    const unsubscribeStripDays = subscribeStripDays(projectId, setStripDays);
    const unsubscribeContacts = subscribeContacts(projectId, setContacts);
    const unsubscribeLocations = subscribeLocations(projectId, setLocations);

    setLoading(false);

    return () => {
      unsubscribeStripDays();
      unsubscribeContacts();
      unsubscribeLocations();
    };
  }, [projectId]);

  // Auto-populate when day and location are selected
  useEffect(() => {
    if (selectedDayId && selectedLocationId && isCreating) {
      handleAutoPopulate();
    }
  }, [selectedDayId, selectedLocationId, isCreating]);

  // Handle auto-population
  const handleAutoPopulate = async () => {
    if (!selectedDayId || !selectedLocationId) return;

    try {
      const autoData = await autoPopulateCallSheet(
        projectId,
        selectedDayId,
        selectedLocationId,
        selectedRecipients
      );

      setFormData(prev => ({
        ...prev,
        ...autoData,
        recipients: autoData.recipients || []
      }));

      // Update selected recipients
      setSelectedRecipients(autoData.recipients || []);
    } catch (error) {
      console.error('Error auto-populating call sheet:', error);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const callSheetData: CreateCallSheetData = {
        ...formData,
        recipients: selectedRecipients,
        weather: weather.high > 0 ? weather : undefined,
        hospitals: hospitals.length > 0 ? hospitals : undefined
      };

      if (editingCallSheet) {
        await updateCallSheet(projectId, editingCallSheet.id, callSheetData);
      } else {
        await createCallSheet(projectId, callSheetData);
      }

      // Refresh call sheets
      const updatedCallSheets = await listCallSheetsWithDetails(projectId);
      setCallSheets(updatedCallSheets);

      // Reset form
      resetForm();
    } catch (error) {
      console.error('Error saving call sheet:', error);
    }
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      date: '',
      unitName: '',
      dayId: '',
      locationId: '',
      recipients: [],
      notes: ''
    });
    setSelectedDayId('');
    setSelectedLocationId('');
    setSelectedRecipients([]);
    setWeather({
      high: 75,
      low: 60,
      condition: 'Sunny',
      sunrise: '6:30 AM',
      sunset: '7:30 PM'
    });
    setHospitals([]);
    setNewHospital({ name: '', address: '', phone: '', distance: '' });
    setEditingCallSheet(null);
    setIsCreating(false);
  };

  // Handle edit
  const handleEdit = (callSheet: CallSheetWithDetails) => {
    setEditingCallSheet(callSheet);
    setFormData({
      date: callSheet.date,
      unitName: callSheet.unitName,
      dayId: callSheet.dayId,
      locationId: callSheet.locationId,
      recipients: callSheet.recipients,
      notes: callSheet.notes
    });
    setSelectedDayId(callSheet.dayId);
    setSelectedLocationId(callSheet.locationId);
    setSelectedRecipients(callSheet.recipients);
    setWeather(callSheet.weather || {
      high: 75,
      low: 60,
      condition: 'Sunny',
      sunrise: '6:30 AM',
      sunset: '7:30 PM'
    });
    setHospitals(callSheet.hospitals || []);
    setIsCreating(true);
  };

  // Handle delete
  const handleDelete = async (callSheetId: string) => {
    if (window.confirm('Are you sure you want to delete this call sheet?')) {
      try {
        await deleteCallSheet(projectId, callSheetId);
        const updatedCallSheets = await listCallSheetsWithDetails(projectId);
        setCallSheets(updatedCallSheets);
      } catch (error) {
        console.error('Error deleting call sheet:', error);
      }
    }
  };

  // Handle export
  const handleExport = (callSheet: CallSheetWithDetails) => {
    exportCallSheetAsText(callSheet, callSheet);
  };

  // Add hospital
  const handleAddHospital = () => {
    if (newHospital.name && newHospital.address) {
      setHospitals(prev => [...prev, newHospital]);
      setNewHospital({ name: '', address: '', phone: '', distance: '' });
    }
  };

  // Remove hospital
  const handleRemoveHospital = (index: number) => {
    setHospitals(prev => prev.filter((_, i) => i !== index));
  };

  // Toggle recipient selection
  const toggleRecipient = (contactId: string) => {
    setSelectedRecipients(prev => 
      prev.includes(contactId) 
        ? prev.filter(id => id !== contactId)
        : [...prev, contactId]
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center">
            <div className="text-sm text-gray-500">Loading call sheets...</div>
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
            <FileText className="h-5 w-5" />
            Call Sheet Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Call Sheet
          </Button>
        </CardContent>
      </Card>

      {/* Create/Edit Form */}
      {isCreating && (
        <Card>
          <CardHeader>
            <CardTitle>
              {editingCallSheet ? 'Edit Call Sheet' : 'Create New Call Sheet'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Date</label>
                  <Input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Unit Name</label>
                  <Input
                    value={formData.unitName}
                    onChange={(e) => setFormData(prev => ({ ...prev, unitName: e.target.value }))}
                    placeholder="Unit 1"
                    required
                  />
                </div>
              </div>

              {/* Strip Day and Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Strip Day</label>
                  <Select value={selectedDayId} onValueChange={setSelectedDayId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select strip day" />
                    </SelectTrigger>
                    <SelectContent>
                      {stripDays.map(day => (
                        <SelectItem key={day.id} value={day.id}>
                          {day.date} - {day.sceneOrder.length} scenes
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Location</label>
                  <Select value={selectedLocationId} onValueChange={setSelectedLocationId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      {locations.map(location => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Auto-populate button */}
              {selectedDayId && selectedLocationId && (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleAutoPopulate}
                    className="flex items-center gap-2"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Auto-populate from selected day and location
                  </Button>
                </div>
              )}

              {/* Recipients */}
              <div>
                <label className="text-sm font-medium">Recipients</label>
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                  {contacts.map(contact => (
                    <div key={contact.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={contact.id}
                        checked={selectedRecipients.includes(contact.id)}
                        onCheckedChange={() => toggleRecipient(contact.id)}
                      />
                      <label htmlFor={contact.id} className="text-sm">
                        {contact.name} {contact.role && `(${contact.role})`}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weather */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Cloud className="h-4 w-4" />
                  Weather (Optional)
                </label>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="High"
                    value={weather.high}
                    onChange={(e) => setWeather(prev => ({ ...prev, high: Number(e.target.value) }))}
                  />
                  <Input
                    type="number"
                    placeholder="Low"
                    value={weather.low}
                    onChange={(e) => setWeather(prev => ({ ...prev, low: Number(e.target.value) }))}
                  />
                  <Input
                    placeholder="Condition"
                    value={weather.condition}
                    onChange={(e) => setWeather(prev => ({ ...prev, condition: e.target.value }))}
                  />
                  <Input
                    placeholder="Sunrise"
                    value={weather.sunrise}
                    onChange={(e) => setWeather(prev => ({ ...prev, sunrise: e.target.value }))}
                  />
                  <Input
                    placeholder="Sunset"
                    value={weather.sunset}
                    onChange={(e) => setWeather(prev => ({ ...prev, sunset: e.target.value }))}
                  />
                </div>
              </div>

              {/* Hospitals */}
              <div>
                <label className="text-sm font-medium flex items-center gap-2">
                  <Hospital className="h-4 w-4" />
                  Nearby Hospitals (Optional)
                </label>
                <div className="space-y-2 mt-2">
                  {hospitals.map((hospital, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 border rounded">
                      <div className="flex-1">
                        <div className="font-medium">{hospital.name}</div>
                        <div className="text-sm text-gray-600">{hospital.address}</div>
                        <div className="text-sm text-gray-600">{hospital.phone} - {hospital.distance}</div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveHospital(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <Input
                      placeholder="Hospital name"
                      value={newHospital.name}
                      onChange={(e) => setNewHospital(prev => ({ ...prev, name: e.target.value }))}
                    />
                    <Input
                      placeholder="Address"
                      value={newHospital.address}
                      onChange={(e) => setNewHospital(prev => ({ ...prev, address: e.target.value }))}
                    />
                    <Input
                      placeholder="Phone"
                      value={newHospital.phone}
                      onChange={(e) => setNewHospital(prev => ({ ...prev, phone: e.target.value }))}
                    />
                    <Input
                      placeholder="Distance"
                      value={newHospital.distance}
                      onChange={(e) => setNewHospital(prev => ({ ...prev, distance: e.target.value }))}
                    />
                  </div>
                  <Button type="button" variant="outline" onClick={handleAddHospital}>
                    Add Hospital
                  </Button>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm font-medium">Notes</label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Additional notes for the call sheet..."
                  rows={4}
                />
              </div>

              {/* Form Actions */}
              <div className="flex gap-2">
                <Button type="submit">
                  {editingCallSheet ? 'Update Call Sheet' : 'Create Call Sheet'}
                </Button>
                <Button type="button" variant="outline" onClick={resetForm}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Call Sheets List */}
      <div className="space-y-4">
        {callSheets.map((callSheet) => (
          <Card key={callSheet.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">{callSheet.unitName}</CardTitle>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {callSheet.date}
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      {callSheet.location?.name || 'TBD'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {callSheet.recipients.length} recipients
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleExport(callSheet)}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(callSheet)}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDelete(callSheet.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {callSheet.stripDay && (
                  <div>
                    <Badge variant="outline">
                      {callSheet.stripDay.sceneOrder.length} scenes - {Math.floor(callSheet.stripDay.targetMins / 60)}h {callSheet.stripDay.targetMins % 60}m
                    </Badge>
                  </div>
                )}
                {callSheet.weather && (
                  <div className="text-sm text-gray-600">
                    Weather: {callSheet.weather.condition}, {callSheet.weather.high}°F/{callSheet.weather.low}°F
                  </div>
                )}
                {callSheet.notes && (
                  <div className="text-sm text-gray-600">
                    {callSheet.notes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {callSheets.length === 0 && !isCreating && (
        <Card>
          <CardContent className="p-8 text-center">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No call sheets created</h3>
            <p className="text-gray-500 mb-4">Create your first call sheet to start managing your shoot days.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CallSheetGenerator;
