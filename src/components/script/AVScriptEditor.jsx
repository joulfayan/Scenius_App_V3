import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { AVScript, AVSegment, AVRow } from '@/api/entities';
import { uploadFile, generateFilePath, validateFile } from '@/lib/storage';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Image as ImageIcon, Trash2, Loader2 } from 'lucide-react';

const WORDS_PER_MINUTE = 150;

// Custom debounce hook
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return [debouncedValue];
};

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.round(seconds % 60);
  return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
};

const AutoResizingTextarea = ({ value, onChange, placeholder, className }) => {
  const textareaRef = useRef(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [value]);

  return (
    <Textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`resize-none overflow-hidden ${className}`}
      rows={1}
    />
  );
};

const AVScriptRow = ({ row, segmentOrder, onUpdate, onDelete, onImageUpload, projectId }) => {
  const [isUploading, setIsUploading] = useState(false);
  const [debouncedRow] = useDebounce(row, 1000);

  useEffect(() => {
    onUpdate(debouncedRow, false);
  }, [debouncedRow, onUpdate]);

  const wordCount = useMemo(() => (row.audio || '').split(/\s+/).filter(Boolean).length, [row.audio]);
  const estimatedRT = useMemo(() => (wordCount / WORDS_PER_MINUTE) * 60, [wordCount]);

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    try {
      // Validate file before upload
      const validation = validateFile(file, { 
        maxSize: 10 * 1024 * 1024, // 10MB
        allowedTypes: ['image/*'] 
      });
      
      if (!validation.valid) {
        console.error("File validation failed:", validation.error);
        return;
      }

      const filePath = generateFilePath(projectId, file.name, 'av-script');
      const { url } = await uploadFile(projectId, filePath, file);
      onImageUpload(url);
    } catch (error) {
      console.error("Image upload failed:", error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex items-start gap-2 md:gap-4 py-3 border-b border-gray-200">
      <div className="w-12 md:w-16 text-center flex-shrink-0">
        <div className="font-semibold text-gray-800 text-sm">{segmentOrder}.{row.order}</div>
        <div className="text-xs text-gray-500 mt-1">{wordCount}w</div>
        <div className="text-xs text-gray-500">{formatTime(estimatedRT)}</div>
      </div>
      <div className="flex-1 min-w-0">
        <AutoResizingTextarea
          value={row.audio || ''}
          onChange={(e) => onUpdate({ ...row, audio: e.target.value }, true)}
          placeholder="Audio..."
          className="bg-transparent border-none p-0 focus-visible:ring-0 text-sm"
        />
      </div>
      <div className="flex-1 min-w-0">
        <AutoResizingTextarea
          value={row.visual || ''}
          onChange={(e) => onUpdate({ ...row, visual: e.target.value }, true)}
          placeholder="Visual..."
          className="bg-transparent border-none p-0 focus-visible:ring-0 text-sm"
        />
      </div>
      <div className="w-16 md:w-24 flex-shrink-0">
        <input type="file" id={`upload-${row.id}`} className="hidden" onChange={handleFileChange} accept="image/*" />
        <label htmlFor={`upload-${row.id}`} className="w-full h-12 md:h-16 rounded-lg cursor-pointer flex items-center justify-center" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: 'inset 1px 1px 3px rgba(0,0,0,0.1)'
        }}>
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> :
            row.image_url ? <img src={row.image_url} alt="visual" className="w-full h-full object-cover rounded-lg" /> :
            <ImageIcon className="w-4 h-4 text-gray-400" />
          }
        </label>
      </div>
      <div className="w-16 md:w-20 flex-shrink-0 text-center">
        <Input
          type="number"
          value={row.duration_seconds || ''}
          onChange={(e) => onUpdate({ ...row, duration_seconds: parseInt(e.target.value, 10) || 0 }, true)}
          className="w-full text-center bg-transparent border-none focus-visible:ring-0 text-sm p-1"
          placeholder="0"
        />
      </div>
      <div className="w-8 flex-shrink-0">
        <button onClick={onDelete} className="p-1 text-gray-400 hover:text-red-500">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

const AVScriptSegment = ({ segment, rows, onUpdate, onRowChange, onRowCreate, onRowDelete, onSegmentDelete, projectId }) => {
  const [debouncedSegment] = useDebounce(segment, 1000);

  useEffect(() => {
    onUpdate(debouncedSegment);
  }, [debouncedSegment, onUpdate]);

  const segmentStats = useMemo(() => {
    return rows.reduce((acc, row) => {
      const words = (row.audio || '').split(/\s+/).filter(Boolean).length;
      acc.words += words;
      acc.rt += row.duration_seconds > 0 ? row.duration_seconds : (words / WORDS_PER_MINUTE) * 60;
      return acc;
    }, { rt: 0, words: 0 });
  }, [rows]);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <Input
          value={segment.title}
          onChange={(e) => onUpdate({ ...segment, title: e.target.value })}
          className="text-lg font-semibold border-none bg-transparent focus-visible:ring-0 p-0 flex-1"
        />
         <button onClick={onSegmentDelete} className="p-2 text-gray-400 hover:text-red-500 ml-4">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
      
      <div className="overflow-x-auto">
        <div className="min-w-full">
          <div className="flex items-center gap-2 md:gap-4 text-xs font-medium text-gray-500 border-b pb-2 mb-2">
            <div className="w-12 md:w-16 text-center">Row</div>
            <div className="flex-1 min-w-0">Audio</div>
            <div className="flex-1 min-w-0">Visual</div>
            <div className="w-16 md:w-24 text-center">Image</div>
            <div className="w-16 md:w-20 text-center">Duration</div>
            <div className="w-8"></div>
          </div>
          <div>
            {rows.map(row => (
              <AVScriptRow
                key={row.id}
                row={row}
                segmentOrder={segment.order}
                onUpdate={(updatedRow, immediate) => onRowChange(updatedRow, immediate)}
                onDelete={() => onRowDelete(row.id)}
                onImageUpload={(imageUrl) => onRowChange({ ...row, image_url: imageUrl }, true)}
                projectId={projectId}
              />
            ))}
          </div>
        </div>
      </div>
      
      <Button variant="link" size="sm" onClick={onRowCreate} className="mt-2">
        <Plus className="w-4 h-4 mr-2" /> Add Row
      </Button>
      
      <div className="flex justify-end gap-4 md:gap-6 text-sm mt-4 text-right border-t pt-2">
        <div>
            <p className="text-gray-500 text-xs">SEGMENT RT</p>
            <p className="font-semibold">{formatTime(segmentStats.rt)}</p>
        </div>
        <div>
            <p className="text-gray-500 text-xs">SEGMENT WORDS</p>
            <p className="font-semibold">{segmentStats.words}</p>
        </div>
      </div>
    </div>
  );
};

export default function AVScriptEditor({ projectId }) {
  const [scripts, setScripts] = useState([]);
  const [activeScript, setActiveScript] = useState(null);
  const [segments, setSegments] = useState([]);
  const [rows, setRows] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadScripts = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedScripts = await AVScript.filter({ project_id: projectId }, '-created_date');
      setScripts(fetchedScripts);
      if (fetchedScripts.length > 0) {
        handleSelectScript(fetchedScripts[0]);
      } else {
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Error loading scripts:', error);
      setIsLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    loadScripts();
  }, [loadScripts]);

  const handleSelectScript = async (script) => {
    setIsLoading(true);
    try {
      setActiveScript(script);
      const fetchedSegments = await AVSegment.filter({ av_script_id: script.id }, 'order');
      setSegments(fetchedSegments);
      if (fetchedSegments.length > 0) {
        const segmentIds = fetchedSegments.map(s => s.id);
        const fetchedRows = await AVRow.filter({ av_segment_id: { '$in': segmentIds } }, 'order');
        setRows(fetchedRows);
      } else {
        setRows([]);
      }
    } catch (error) {
      console.error('Error loading script data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCreateScript = async () => {
    try {
      const newScript = await AVScript.create({
        project_id: projectId,
        title: 'New AV Script',
        version: `v${scripts.length + 1}`
      });
      setScripts(prev => [newScript, ...prev]);
      handleSelectScript(newScript);
    } catch (error) {
      console.error('Error creating script:', error);
    }
  };
  
  const handleUpdateRow = useCallback(async (updatedRow, immediate) => {
    setRows(prevRows => prevRows.map(r => r.id === updatedRow.id ? updatedRow : r));
    if (immediate) {
      try {
        await AVRow.update(updatedRow.id, { ...updatedRow, id: undefined });
      } catch (error) {
        console.error('Error updating row:', error);
      }
    }
  }, []);

  const handleUpdateSegment = useCallback(async (updatedSegment) => {
    setSegments(prev => prev.map(s => s.id === updatedSegment.id ? updatedSegment : s));
    try {
      await AVSegment.update(updatedSegment.id, { ...updatedSegment, id: undefined });
    } catch (error) {
      console.error('Error updating segment:', error);
    }
  }, []);

  const handleAddRow = async (segmentId) => {
    try {
      const segmentRows = rows.filter(r => r.av_segment_id === segmentId);
      const maxOrder = segmentRows.length > 0 ? Math.max(...segmentRows.map(r => r.order)) : 0;
      const newRow = await AVRow.create({
        av_segment_id: segmentId,
        order: maxOrder + 1,
        audio: '',
        visual: '',
        duration_seconds: 0
      });
      setRows(prev => [...prev, newRow]);
    } catch (error) {
      console.error('Error adding row:', error);
    }
  };

  const handleDeleteRow = async (rowId) => {
    try {
      await AVRow.delete(rowId);
      setRows(prev => prev.filter(r => r.id !== rowId));
    } catch (error) {
      console.error('Error deleting row:', error);
    }
  };
  
  const handleAddSegment = async () => {
    if (!activeScript) return;
    try {
      const maxOrder = segments.length > 0 ? Math.max(...segments.map(s => s.order)) : 0;
      const newSegment = await AVSegment.create({
        av_script_id: activeScript.id,
        order: maxOrder + 1,
        title: 'New Segment'
      });
      setSegments(prev => [...prev, newSegment]);
    } catch (error) {
      console.error('Error adding segment:', error);
    }
  };
  
  const handleDeleteSegment = async (segmentId) => {
    try {
      await AVSegment.delete(segmentId);
      // Also delete associated rows
      const rowsToDelete = rows.filter(r => r.av_segment_id === segmentId);
      for (const row of rowsToDelete) {
        await AVRow.delete(row.id);
      }
      setSegments(prev => prev.filter(s => s.id !== segmentId));
      setRows(prev => prev.filter(r => r.av_segment_id !== segmentId));
    } catch (error) {
      console.error('Error deleting segment:', error);
    }
  };

  const totalStats = useMemo(() => {
    return rows.reduce((acc, row) => {
      const words = (row.audio || '').split(/\s+/).filter(Boolean).length;
      acc.words += words;
      acc.rt += row.duration_seconds > 0 ? row.duration_seconds : (words / WORDS_PER_MINUTE) * 60;
      return acc;
    }, { rt: 0, words: 0 });
  }, [rows]);

  return (
    <div className="flex flex-col lg:flex-row h-full" style={{
      background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
    }}>
      {/* Sidebar */}
      <div className="w-full lg:w-64 lg:h-full p-4 border-b lg:border-b-0 lg:border-r border-gray-200">
        <h3 className="font-semibold text-gray-800 mb-4">AV Script Versions</h3>
        <div className="space-y-2 max-h-40 lg:max-h-none overflow-y-auto">
          {scripts.map(script => (
            <button
              key={script.id}
              onClick={() => handleSelectScript(script)}
              className={`w-full p-3 rounded-lg text-left transition-all ${activeScript?.id === script.id ? 'bg-blue-100' : 'hover:bg-gray-100'}`}
            >
              <div className="font-medium text-sm">{script.version} {script.title}</div>
            </button>
          ))}
        </div>
        <Button variant="outline" size="sm" className="w-full mt-4" onClick={handleCreateScript}>
          <Plus className="w-4 h-4 mr-2" /> New Version
        </Button>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-4 lg:p-8 overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : !activeScript ? (
          <div className="text-center text-gray-500 h-64 flex flex-col items-center justify-center">
            <p>No AV script selected.</p>
            <p>Create a new version to get started.</p>
          </div>
        ) : (
          <>
            <div className="mb-6 lg:mb-8">
              <h1 className="text-xl lg:text-2xl font-bold">{activeScript.version} {activeScript.title}</h1>
              <p className="text-sm text-gray-500">
                Total RT: {formatTime(totalStats.rt)} • Total Words: {totalStats.words}
              </p>
            </div>
            
            {segments.map(segment => (
              <AVScriptSegment
                key={segment.id}
                segment={segment}
                rows={rows.filter(r => r.av_segment_id === segment.id).sort((a, b) => a.order - b.order)}
                onUpdate={handleUpdateSegment}
                onRowChange={handleUpdateRow}
                onRowCreate={() => handleAddRow(segment.id)}
                onRowDelete={handleDeleteRow}
                onSegmentDelete={() => handleDeleteSegment(segment.id)}
                projectId={projectId}
              />
            ))}

            <Button onClick={handleAddSegment} className="mt-4">
              <Plus className="w-4 h-4 mr-2" /> Add Segment
            </Button>
          </>
        )}
      </div>
    </div>
  );
}