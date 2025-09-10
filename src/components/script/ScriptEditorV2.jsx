
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Textarea } from "@/components/ui/textarea"; // Keeping this import as it might be used elsewhere, though not in ScriptLine anymore.
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Toggle } from "@/components/ui/toggle";
import { Slider } from "@/components/ui/slider";
import {
  Save, Check, Sparkles, Loader2, Download, Upload, History, Lock, Settings,
  FileDown, Plus, X, MessageSquare, Hash, Copy, FileText, MoreVertical,
  ChevronRight, ChevronDown, Eye, EyeOff, Bold, Italic, Underline,
  Type, Palette, ZoomIn, ZoomOut, Search, Replace, Volume2, Image,
  BarChart3, Target, Clock, Users, Moon, Sun, Play, Pause,
  Columns3, Video, Mic, Camera, Tag, Share, CheckCircle, AlertCircle
} from "lucide-react";
import { InvokeLLM } from "@/api/integrations";
import { ScriptRevision } from "@/api/entities";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

// Import sub-components
import ScriptOutline from "./ScriptOutline";
import ScriptToolbar from "./ScriptToolbar";
import ExportDialog from "./ExportDialog";
import ScriptSidebar from "./ScriptSidebar";
import TitlePageEditor from "./TitlePageEditor";
import ScriptSettings from "./ScriptSettings";
import MultiColumnAVEditor from "./MultiColumnAVEditor";
import { ELEMENT_TYPES, parseLine, formatLine, getNextElementType, cycleElementType } from "./ScriptFormatter";

// Feature flags for progressive rollout
const SCRIPT_FEATURES = {
  filmTV: true,
  stageplay: true,
  multiColumnAV: true,
  dualDialogue: true,
  revisionMode: true,
  comments: true,
  breakdown: true,
  readThrough: true,
  insights: true,
  offlineMode: true,
  collaboration: true,
  spellcheck: true,
  findReplace: true,
  mediaEmbed: true,
  approvals: true,
  goals: true
};

// Script modes
const SCRIPT_MODES = {
  FILM_TV: 'film_tv',
  STAGEPLAY: 'stageplay',
  MULTI_COLUMN_AV: 'multi_column_av'
};

// Initial script document structure
const createEmptyScript = () => ({
  id: `script_${Date.now()}`,
  title: 'Untitled Script',
  mode: SCRIPT_MODES.FILM_TV,
  lines: [{
    id: `line_${Date.now()}`,
    type: ELEMENT_TYPES.SCENE,
    text: 'FADE IN:',
    meta: {}
  }],
  settings: {
    showSceneNumbers: false,
    revisionMode: false,
    pageSize: 'US_LETTER', // US_LETTER, A4
    lineSpacing: 'STANDARD', // STANDARD (55 lines), TIGHT (58 lines), LOOSE (52 lines)
    nightMode: false,
    zoom: 100,
    showTutorials: true,
    spellcheck: true,
    pageNumbering: true,
    watermark: '',
    headerText: '',
    footerText: ''
  },
  titlePage: {
    layout: 'default', // default, centered_image, image_only
    title: '',
    subtitle: '',
    author: '',
    basedOn: '',
    contact: '',
    draftDate: new Date().toLocaleDateString(),
    image: null
  },
  metadata: {
    wordCount: 0,
    pageCount: 0,
    sceneCount: 0,
    characterCount: 0,
    estimatedRuntime: 0,
    lastSave: Date.now(),
    totalEditTime: 0,
    sessionStartTime: Date.now()
  },
  collaboration: {
    comments: [],
    approvals: [],
    shareLinks: []
  },
  goals: [],
  drafts: [],
  updatedAt: Date.now()
});

export default function ScriptEditorV2({ initialContent, onSave, projectId }) {
  // Core state
  const [scriptDoc, setScriptDoc] = useState(() => {
    if (initialContent && typeof initialContent === 'string') {
      // Convert legacy string content to new format
      return {
        ...createEmptyScript(),
        lines: initialContent.split('\n').map((text, index) => ({
          id: `line_${Date.now()}_${index}`,
          type: index === 0 && text.includes('FADE IN') ? ELEMENT_TYPES.SCENE : ELEMENT_TYPES.ACTION,
          text: text.trim(),
          meta: {}
        })).filter(line => line.text) // Remove empty lines
      };
    }
    return initialContent || createEmptyScript();
  });

  // UI state
  const [saveStatus, setSaveStatus] = useState("idle");
  const [activeLineId, setActiveLineId] = useState(null);
  const [selectedText, setSelectedText] = useState('');
  const [currentMode, setCurrentMode] = useState(scriptDoc.mode);

  // Dialog states
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showTitlePageEditor, setShowTitlePageEditor] = useState(false);
  const [showScriptSettings, setShowScriptSettings] = useState(false);
  const [showFindReplace, setShowFindReplace] = useState(false);

  // Sidebar states
  const [activeSidebar, setActiveSidebar] = useState(null); // 'comments', 'media', 'breakdown', 'insights', 'outline'
  const [sidebarWidth, setSidebarWidth] = useState(320);

  // Formatting states
  const [revisionMode, setRevisionMode] = useState(scriptDoc.settings?.revisionMode || false);
  const [selectedRevisionColor, setSelectedRevisionColor] = useState('Blue');
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');

  // Collaboration
  const [isReadThroughMode, setIsReadThroughMode] = useState(false);
  const [currentSpeaker, setCurrentSpeaker] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);

  // Refs
  const editorRef = useRef(null);
  const lineRefs = useRef({});
  const autoSaveTimeoutRef = useRef(null);
  const sessionTimerRef = useRef(null);

  // Start session timer
  useEffect(() => {
    sessionTimerRef.current = setInterval(() => {
      setScriptDoc(prev => ({
        ...prev,
        metadata: {
          ...prev.metadata,
          totalEditTime: prev.metadata.totalEditTime + 1000
        }
      }));
    }, 1000);

    return () => {
      if (sessionTimerRef.current) {
        clearInterval(sessionTimerRef.current);
      }
    };
  }, []);

  // Calculate metrics
  const metrics = useMemo(() => {
    const lines = scriptDoc.lines;
    const text = lines.map(l => l.text).join(' ');
    const words = text.split(/\s+/).filter(w => w.length > 0);
    const characters = text.replace(/\s/g, '');
    const scenes = lines.filter(l => l.type === ELEMENT_TYPES.SCENE);

    // Estimate pages (55 lines per page for film/TV)
    const pageCount = Math.max(1, Math.ceil(lines.length / 55));

    // Estimate runtime (1 page ≈ 1 minute for film/TV)
    const estimatedRuntime = currentMode === SCRIPT_MODES.FILM_TV ? pageCount :
                            currentMode === SCRIPT_MODES.STAGEPLAY ? Math.ceil(pageCount * 1.5) :
                            Math.ceil(words.length / 250); // AV scripts

    return {
      wordCount: words.length,
      characterCount: characters.length,
      pageCount,
      sceneCount: scenes.length,
      estimatedRuntime
    };
  }, [scriptDoc.lines, currentMode]);

  // Update metadata
  useEffect(() => {
    setScriptDoc(prev => ({
      ...prev,
      metadata: {
        ...prev.metadata,
        ...metrics,
        lastSave: Date.now()
      }
    }));
  }, [metrics]);

  // Auto-save functionality
  const convertToLegacyFormat = useCallback(() => {
    return scriptDoc.lines.map(line => line.text).join('\n');
  }, [scriptDoc]);

  const handleSave = useCallback(async () => {
    setSaveStatus("saving");
    const legacyContent = convertToLegacyFormat();
    const success = await onSave(legacyContent);

    if (success) {
      setSaveStatus("saved");
      // Save revision if enabled
      if (projectId && SCRIPT_FEATURES.filmTV) {
        try {
          const existingRevisions = await ScriptRevision.filter({ project_id: projectId }, '-created_date');
          const newRevisionNumber = `v${existingRevisions.length + 1}`;
          await ScriptRevision.create({
            project_id: projectId,
            revision_number: newRevisionNumber,
            content: JSON.stringify(scriptDoc), // Save full document structure
            notes: `Auto-saved on ${new Date().toLocaleString()}`,
            is_current: true
          });
        } catch (error) {
          console.error('Error saving revision:', error);
        }
      }
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  }, [convertToLegacyFormat, onSave, projectId, scriptDoc]);

  // Debounced auto-save
  useEffect(() => {
    if (autoSaveTimeoutRef.current) {
      clearTimeout(autoSaveTimeoutRef.current);
    }

    autoSaveTimeoutRef.current = setTimeout(() => {
      if (saveStatus === "idle") {
        handleSave();
      }
    }, 2000);

    return () => {
      if (autoSaveTimeoutRef.current) {
        clearTimeout(autoSaveTimeoutRef.current);
      }
    };
  }, [scriptDoc, handleSave, saveStatus]);

  // Line management functions
  const updateLine = useCallback((lineId, updates) => {
    setScriptDoc(prev => ({
      ...prev,
      lines: prev.lines.map(line =>
        line.id === lineId ? {
          ...line,
          ...updates,
          meta: {
            ...line.meta,
            ...updates.meta,
            ...(revisionMode && updates.text !== line.text && {
              revisionColor: selectedRevisionColor,
              revisionTimestamp: Date.now()
            })
          }
        } : line
      ),
      updatedAt: Date.now()
    }));
  }, [revisionMode, selectedRevisionColor]);

  const addLine = useCallback((afterId, initialType = ELEMENT_TYPES.ACTION) => {
    const afterIndex = scriptDoc.lines.findIndex(line => line.id === afterId);
    const newLine = {
      id: `line_${Date.now()}`,
      type: initialType,
      text: '',
      meta: {}
    };

    setScriptDoc(prev => ({
      ...prev,
      lines: [
        ...prev.lines.slice(0, afterIndex + 1),
        newLine,
        ...prev.lines.slice(afterIndex + 1)
      ],
      updatedAt: Date.now()
    }));

    return newLine.id;
  }, [scriptDoc.lines]);

  const deleteLine = useCallback((lineId) => {
    if (scriptDoc.lines.length <= 1) return; // Don't delete the last line

    setScriptDoc(prev => ({
      ...prev,
      lines: prev.lines.filter(line => line.id !== lineId),
      updatedAt: Date.now()
    }));
  }, [scriptDoc.lines]);

  // Text formatting functions
  const applyFormatting = useCallback((format) => {
    if (!selectedText || !activeLineId) return;

    const line = scriptDoc.lines.find(l => l.id === activeLineId);
    if (!line) return;

    let newText = line.text;

    switch (format) {
      case 'bold':
        newText = line.text.replace(selectedText, `*${selectedText}*`);
        break;
      case 'italic':
        newText = line.text.replace(selectedText, `_${selectedText}_`);
        break;
      case 'underline':
        newText = line.text.replace(selectedText, `<u>${selectedText}</u>`);
        break;
      case 'uppercase':
        newText = line.text.replace(selectedText, selectedText.toUpperCase());
        break;
      case 'lowercase':
        newText = line.text.replace(selectedText, selectedText.toLowerCase());
        break;
    }

    updateLine(activeLineId, { text: newText });
  }, [selectedText, activeLineId, scriptDoc.lines, updateLine]);

  // Dual dialogue functionality
  const toggleDualDialogue = useCallback((lineId) => {
    if (!SCRIPT_FEATURES.dualDialogue) return;

    const lineIndex = scriptDoc.lines.findIndex(l => l.id === lineId);
    const line = scriptDoc.lines[lineIndex];

    if (line.type !== ELEMENT_TYPES.DIALOGUE) return;

    const dualId = line.meta?.dualId || `dual_${Date.now()}`;
    const isDual = !!line.meta?.dualId;

    // Find related dual dialogue lines
    const relatedLines = scriptDoc.lines.filter(l => l.meta?.dualId === dualId);

    if (isDual) {
      // Remove dual dialogue
      relatedLines.forEach(relatedLine => {
        updateLine(relatedLine.id, {
          meta: { ...relatedLine.meta, dualId: null }
        });
      });
    } else {
      // Add dual dialogue - look for next dialogue block
      let nextDialogueStart = -1;
      for (let i = lineIndex + 1; i < scriptDoc.lines.length; i++) {
        if (scriptDoc.lines[i].type === ELEMENT_TYPES.CHARACTER) {
          nextDialogueStart = i;
          break;
        }
        if (scriptDoc.lines[i].type === ELEMENT_TYPES.SCENE ||
            scriptDoc.lines[i].type === ELEMENT_TYPES.ACTION) {
          break;
        }
      }

      if (nextDialogueStart !== -1) {
        // Mark current dialogue block
        for (let i = lineIndex; i >= 0; i--) {
          const currentLine = scriptDoc.lines[i];
          if (currentLine.type === ELEMENT_TYPES.CHARACTER) {
            // Mark this character block and its dialogue as dual
            for (let j = i; j < scriptDoc.lines.length; j++) {
              const blockLine = scriptDoc.lines[j];
              if (blockLine.type === ELEMENT_TYPES.SCENE ||
                  blockLine.type === ELEMENT_TYPES.ACTION) break;
              if (blockLine.type === ELEMENT_TYPES.CHARACTER && j > i) break;

              updateLine(blockLine.id, {
                meta: { ...blockLine.meta, dualId, dualPosition: 'left' }
              });
            }
            break;
          }
        }

        // Mark next dialogue block
        for (let j = nextDialogueStart; j < scriptDoc.lines.length; j++) {
          const blockLine = scriptDoc.lines[j];
          if (blockLine.type === ELEMENT_TYPES.SCENE ||
              blockLine.type === ELEMENT_TYPES.ACTION) break;
          if (blockLine.type === ELEMENT_TYPES.CHARACTER && j > nextDialogueStart) break;

          updateLine(blockLine.id, {
            meta: { ...blockLine.meta, dualId, dualPosition: 'right' }
          });
        }
      }
    }
  }, [scriptDoc.lines, updateLine]);

  // Handle text changes with auto-formatting
  const handleLineChange = useCallback((lineId, newText) => {
    const line = scriptDoc.lines.find(l => l.id === lineId);
    if (!line) return;

    // Auto-detect element type based on content
    const lineIndex = scriptDoc.lines.findIndex(l => l.id === lineId);
    const prevLine = lineIndex > 0 ? scriptDoc.lines[lineIndex - 1] : null;
    const parseResult = parseLine(newText, prevLine?.type);

    // Only auto-change type if confidence is high and user hasn't manually set it
    const shouldAutoType = parseResult.confidence > 0.8 && !line.meta?.manualType;

    updateLine(lineId, {
      text: newText,
      type: shouldAutoType ? parseResult.type : line.type
    });
  }, [scriptDoc.lines, updateLine]);

  // Handle keyboard shortcuts and behaviors
  const handleKeyDown = useCallback((e, lineId) => {
    const line = scriptDoc.lines.find(l => l.id === lineId);
    if (!line) return;

    const lineIndex = scriptDoc.lines.findIndex(l => l.id === lineId);

    // Enter key behavior
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();

      // Check for double enter on dialogue
      const isDoubleEnter = line.type === ELEMENT_TYPES.DIALOGUE && !line.text.trim();
      const nextType = getNextElementType(line.type, isDoubleEnter);

      const newLineId = addLine(lineId, nextType);

      // Focus new line after a brief delay
      setTimeout(() => {
        const newLineElement = lineRefs.current[newLineId];
        if (newLineElement) {
          newLineElement.focus();
        }
      }, 50);

      return;
    }

    // Shift+Enter for soft line break
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow default behavior for soft line break
      return;
    }

    // Tab for element cycling
    if (e.key === 'Tab') {
      e.preventDefault();
      const newType = cycleElementType(line.type, e.shiftKey);
      updateLine(lineId, {
        type: newType,
        meta: { ...line.meta, manualType: true }
      });
      return;
    }

    // Keyboard shortcuts
    if (e.metaKey || e.ctrlKey) {
      switch (e.key) {
        case '1':
          e.preventDefault();
          updateLine(lineId, {
            type: ELEMENT_TYPES.SCENE,
            meta: { ...line.meta, manualType: true }
          });
          break;
        case '2':
          e.preventDefault();
          updateLine(lineId, {
            type: ELEMENT_TYPES.ACTION,
            meta: { ...line.meta, manualType: true }
          });
          break;
        case '3':
          e.preventDefault();
          updateLine(lineId, {
            type: ELEMENT_TYPES.CHARACTER,
            meta: { ...line.meta, manualType: true }
          });
          break;
        case '4':
          e.preventDefault();
          updateLine(lineId, {
            type: ELEMENT_TYPES.PARENTHETICAL,
            meta: { ...line.meta, manualType: true }
          });
          break;
        case '5':
          e.preventDefault();
          updateLine(lineId, {
            type: ELEMENT_TYPES.DIALOGUE,
            meta: { ...line.meta, manualType: true }
          });
          break;
        case '6':
          e.preventDefault();
          updateLine(lineId, {
            type: ELEMENT_TYPES.TRANSITION,
            meta: { ...line.meta, manualType: true }
          });
          break;
        case '7':
          e.preventDefault();
          updateLine(lineId, {
            type: ELEMENT_TYPES.SHOT,
            meta: { ...line.meta, manualType: true }
          });
          break;
        case ';':
          e.preventDefault();
          setScriptDoc(prev => ({
            ...prev,
            settings: {
              ...prev.settings,
              showSceneNumbers: !prev.settings?.showSceneNumbers
            }
          }));
          break;
        case 'd':
          if (e.shiftKey) {
            e.preventDefault();
            toggleDualDialogue(lineId);
          }
          break;
        case 'f':
          e.preventDefault();
          setShowFindReplace(true);
          break;
        case 'p':
          e.preventDefault();
          setShowExportDialog(true);
          break;
        case 's':
          e.preventDefault();
          handleSave();
          break;
        case 'b':
          e.preventDefault();
          applyFormatting('bold');
          break;
        case 'i':
          e.preventDefault();
          applyFormatting('italic');
          break;
        case 'u':
          e.preventDefault();
          applyFormatting('underline');
          break;
      }
    }

    // Backspace at beginning of line - merge with previous
    if (e.key === 'Backspace' && e.target.selectionStart === 0 && lineIndex > 0) {
      e.preventDefault();
      const prevLine = scriptDoc.lines[lineIndex - 1];
      const combinedText = prevLine.text + (line.text ? ' ' + line.text : '');

      updateLine(prevLine.id, { text: combinedText });
      deleteLine(lineId);

      // Focus previous line
      setTimeout(() => {
        const prevElement = lineRefs.current[prevLine.id];
        if (prevElement) {
          prevElement.focus();
          prevElement.setSelectionRange(prevLine.text.length, prevLine.text.length);
        }
      }, 50);
    }
  }, [scriptDoc.lines, addLine, updateLine, deleteLine, handleSave, toggleDualDialogue, applyFormatting]);

  // Handle text selection for formatting
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString().trim().length > 0) {
      setSelectedText(selection.toString().trim());
    } else {
      setSelectedText('');
    }
  }, []);

  // Mode-specific rendering
  const renderEditor = () => {
    switch (currentMode) {
      case SCRIPT_MODES.MULTI_COLUMN_AV:
        return (
          <MultiColumnAVEditor
            scriptDoc={scriptDoc}
            onUpdate={setScriptDoc}
            onSave={handleSave}
          />
        );

      case SCRIPT_MODES.STAGEPLAY:
      case SCRIPT_MODES.FILM_TV:
      default:
        return (
          <div className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-8" style={{ fontFamily: '"Courier Prime", "Courier New", Courier, monospace', fontSize: '12pt' }}>
            <div
              className="max-w-4xl mx-auto bg-white rounded-lg border border-gray-200 p-8 md:p-12 shadow-sm"
              style={{
                minHeight: 'calc(100vh - 200px)', // Ensure it has some height
                color: scriptDoc.settings?.nightMode ? '#e5e5e5' : '#1f2937',
                backgroundColor: scriptDoc.settings?.nightMode ? '#1a1b23' : '#ffffff'
              }}
            >
              {scriptDoc.lines.map((line, index) => (
                <ScriptLine
                  key={line.id}
                  line={line}
                  index={index}
                  isActive={activeLineId === line.id}
                  showSceneNumbers={scriptDoc.settings?.showSceneNumbers}
                  scriptDoc={scriptDoc}
                  revisionMode={revisionMode}
                  onFocus={() => setActiveLineId(line.id)}
                  onBlur={() => setActiveLineId(null)}
                  onChange={(text) => handleLineChange(line.id, text)}
                  onKeyDown={(e) => handleKeyDown(e, line.id)}
                  onDelete={() => deleteLine(line.id)}
                  onToggleDual={() => toggleDualDialogue(line.id)}
                  onMouseUp={handleTextSelection}
                  ref={el => lineRefs.current[line.id] = el}
                />
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-full bg-gray-50">
      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Enhanced Toolbar */}
        <ScriptToolbar
          scriptDoc={scriptDoc}
          currentMode={currentMode}
          saveStatus={saveStatus}
          selectedText={selectedText}
          revisionMode={revisionMode}
          onModeChange={setCurrentMode}
          onSave={handleSave}
          onExport={() => setShowExportDialog(true)}
          onTitlePage={() => setShowTitlePageEditor(true)}
          onSettings={() => setShowScriptSettings(true)}
          onFindReplace={() => setShowFindReplace(true)}
          onRevisionToggle={() => setRevisionMode(!revisionMode)}
          onApplyFormat={applyFormatting}
          onToggleSidebar={setActiveSidebar}
          activeSidebar={activeSidebar}
        />

        {/* Editor Content */}
        <div
          ref={editorRef}
          className="flex-1 overflow-y-auto p-6"
          style={{
            backgroundColor: scriptDoc.settings?.nightMode ? '#0f1419' : '#f8fafc'
          }}
        >
          {renderEditor()}
        </div>

        {/* Enhanced Status Bar */}
        <div className="border-t border-gray-200 px-6 py-3 bg-white flex items-center justify-between text-sm text-gray-600">
          <div className="flex items-center space-x-6">
            <span>Page {metrics.pageCount}</span>
            <span>{metrics.wordCount} words</span>
            <span>{metrics.sceneCount} scenes</span>
            <span>~{metrics.estimatedRuntime} min</span>
            {SCRIPT_FEATURES.collaboration && onlineUsers.length > 0 && (
              <div className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>{onlineUsers.length}</span>
              </div>
            )}
          </div>
          <div className="flex items-center space-x-4">
            {saveStatus === "saving" && <Loader2 className="w-4 h-4 animate-spin" />}
            {saveStatus === "saved" && <Check className="w-4 h-4 text-green-500" />}
            {saveStatus === "error" && <AlertCircle className="w-4 h-4 text-red-500" />}
            <span className="text-xs">
              Last saved: {new Date(scriptDoc.metadata?.lastSave || Date.now()).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>

      {/* Enhanced Sidebar */}
      {activeSidebar && (
        <ScriptSidebar
          type={activeSidebar}
          scriptDoc={scriptDoc}
          onUpdate={setScriptDoc}
          onClose={() => setActiveSidebar(null)}
          width={sidebarWidth}
          onWidthChange={setSidebarWidth}
          projectId={projectId}
        />
      )}

      {/* Dialogs */}
      {showExportDialog && (
        <ExportDialog
          scriptDoc={scriptDoc}
          onClose={() => setShowExportDialog(false)}
          onExport={(format, options) => {
            // Handle export logic
            console.log('Exporting as:', format, options);
            setShowExportDialog(false);
          }}
        />
      )}

      {showTitlePageEditor && (
        <TitlePageEditor
          titlePage={scriptDoc.titlePage}
          onSave={(titlePageData) => {
            setScriptDoc(prev => ({
              ...prev,
              titlePage: { ...prev.titlePage, ...titlePageData }
            }));
            setShowTitlePageEditor(false);
          }}
          onClose={() => setShowTitlePageEditor(false)}
        />
      )}

      {showScriptSettings && (
        <ScriptSettings
          settings={scriptDoc.settings}
          onSave={(newSettings) => {
            setScriptDoc(prev => ({
              ...prev,
              settings: { ...prev.settings, ...newSettings }
            }));
            setShowScriptSettings(false);
          }}
          onClose={() => setShowScriptSettings(false)}
        />
      )}

      {/* Find/Replace Dialog */}
      {showFindReplace && SCRIPT_FEATURES.findReplace && (
        <Dialog open={showFindReplace} onOpenChange={setShowFindReplace}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Find and Replace</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Find</Label>
                <Input
                  value={findText}
                  onChange={(e) => setFindText(e.target.value)}
                  placeholder="Text to find..."
                />
              </div>
              <div>
                <Label>Replace with</Label>
                <Input
                  value={replaceText}
                  onChange={(e) => setReplaceText(e.target.value)}
                  placeholder="Replacement text..."
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowFindReplace(false)}>
                  Cancel
                </Button>
                <Button onClick={() => {
                  // Implement find/replace logic
                  setShowFindReplace(false);
                }}>
                  Replace All
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Enhanced Script Line Component with Celtx-style formatting
const ScriptLine = React.forwardRef(({
  line,
  index,
  isActive,
  showSceneNumbers,
  scriptDoc,
  revisionMode,
  // nightMode, // Removed as parent controls theme
  onFocus,
  onBlur,
  onChange,
  onKeyDown,
  onDelete,
  onToggleDual,
  onMouseUp
}, ref) => {
  const getLineClasses = (type) => {
    switch (type) {
      case ELEMENT_TYPES.SCENE:
        return 'uppercase font-bold';
      case ELEMENT_TYPES.CHARACTER:
        return 'uppercase text-center';
      case ELEMENT_TYPES.DIALOGUE:
        return 'w-full block mx-auto md:w-10/12 lg:w-8/12';
      case ELEMENT_TYPES.PARENTHETICAL:
        return 'w-full block mx-auto md:w-8/12 lg:w-6/12 text-center text-gray-500';
      case ELEMENT_TYPES.TRANSITION:
        return 'uppercase text-right';
      case ELEMENT_TYPES.SHOT:
        return 'uppercase';
      default:
        return '';
    }
  };

  const getWrapperClasses = (type) => {
    switch(type) {
        case ELEMENT_TYPES.CHARACTER: return 'mt-4';
        case ELEMENT_TYPES.ACTION: return 'my-4';
        case ELEMENT_TYPES.SCENE: return 'my-6';
        case ELEMENT_TYPES.TRANSITION: return 'my-6';
        default: return 'mb-1';
    }
  }

  const sceneNumber = line.type === ELEMENT_TYPES.SCENE && showSceneNumbers && scriptDoc
    ? scriptDoc.lines.filter((l, i) => i <= index && l.type === ELEMENT_TYPES.SCENE).length
    : null;

  // Dual dialogue properties are still on the line object, but visual handling removed per outline.
  // const isDual = !!line.meta?.dualId;
  // const dualPosition = line.meta?.dualPosition;
  const revisionColor = line.meta?.revisionColor;

  // Format parenthetical text to ensure parentheses for display
  const formatParentheticalText = (text) => {
    if (line.type !== ELEMENT_TYPES.PARENTHETICAL) return text;
    let formatted = text.trim();
    if (formatted && !formatted.startsWith('(')) {
      formatted = '(' + formatted;
    }
    if (formatted && !formatted.endsWith(')') && formatted.length > 0 && formatted !== '(') {
      formatted = formatted + ')';
    }
    return formatted;
  };


  return (
    <div className={`relative group ${getWrapperClasses(line.type)}`}>
      {/* Scene Number */}
      {sceneNumber && (
        <span
          className="absolute -left-12 top-0 text-xs text-gray-400 font-mono"
        >
          {sceneNumber}.
        </span>
      )}

      {/* Text Input */}
      <textarea // Changed from Shadcn Textarea to native textarea
        ref={ref}
        value={line.type === ELEMENT_TYPES.PARENTHETICAL ? formatParentheticalText(line.text) : line.text}
        onChange={(e) => {
          let newText = e.target.value;
          // For parentheticals, strip the parentheses for internal storage
          if (line.type === ELEMENT_TYPES.PARENTHETICAL) {
            newText = newText.replace(/^\(/, '').replace(/\)$/, '');
          }
          onChange(newText);
        }}
        onFocus={onFocus}
        onBlur={onBlur}
        onKeyDown={onKeyDown}
        onMouseUp={onMouseUp}
        className={`block w-full resize-none border-none bg-transparent p-0 focus:outline-none focus:ring-0 leading-relaxed ${getLineClasses(line.type)}`}
        rows={1}
        onInput={(e) => {
          // Auto-resize textarea to fit content
          e.target.style.height = 'auto';
          e.target.style.height = e.target.scrollHeight + 'px';
        }}
      />

      {/* Revision Mark */}
      {revisionColor && revisionMode && (
        <div
          className="absolute top-0 right-0 h-full w-1"
          style={{
            backgroundColor: revisionColor.toLowerCase(),
            opacity: 0.7
          }}
          title={`Revised in ${revisionColor}`}
        />
      )}
    </div>
  );
});

ScriptLine.displayName = 'ScriptLine';
