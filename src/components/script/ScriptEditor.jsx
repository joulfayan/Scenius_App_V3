
import React, { useState, useEffect, useCallback } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Save,
  Check,
  Sparkles,
  Loader2,
  Wand2,
  Download,
  Upload,
  History,
  Lock,
  Settings,
  FileDown,
  Plus,
  X
} from "lucide-react";
import { InvokeLLM } from "@/api/integrations";
import { ScriptRevision } from "@/api/entities";

export default function ScriptEditor({ initialContent, onSave, projectId }) {
  const [content, setContent] = useState(initialContent);
  const [saveStatus, setSaveStatus] = useState("idle");
  const [aiStatus, setAiStatus] = useState("idle");
  const [formatStatus, setFormatStatus] = useState("idle");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [showRevisions, setShowRevisions] = useState(false);
  const [revisions, setRevisions] = useState([]);
  const [currentElement, setCurrentElement] = useState("action");
  const [showSettings, setShowSettings] = useState(false);
  const [autoSave, setAutoSave] = useState(true);
  const [isLocked, setIsLocked] = useState(false);

  const loadRevisions = useCallback(async () => {
    try {
      const fetchedRevisions = await ScriptRevision.filter({ project_id: projectId }, '-created_date');
      setRevisions(fetchedRevisions);
    } catch (error) {
      console.error('Error loading revisions:', error);
    }
  }, [projectId]);

  const createRevision = useCallback(async () => {
    try {
      // Mark all previous revisions as not current
      for (const revision of revisions) {
        if (revision.is_current) {
          await ScriptRevision.update(revision.id, { is_current: false });
        }
      }

      const newRevisionNumber = `v${revisions.length + 1}`;
      const newRevision = await ScriptRevision.create({
        project_id: projectId,
        revision_number: newRevisionNumber,
        content: content,
        notes: `Auto-saved on ${new Date().toLocaleString()}`,
        is_current: true
      });

      setRevisions(prev => [newRevision, ...prev]);
    } catch (error) {
      console.error('Error creating revision:', error);
    }
  }, [projectId, content, revisions]);

  const handleSave = useCallback(async () => {
    if (isLocked) return;

    setSaveStatus("saving");
    const success = await onSave(content);
    if (success) {
      setSaveStatus("saved");
      if (projectId) {
        await createRevision();
      }
      setTimeout(() => setSaveStatus("idle"), 2000);
    } else {
      setSaveStatus("error");
      setTimeout(() => setSaveStatus("idle"), 2000);
    }
  }, [content, onSave, projectId, createRevision, isLocked]);

  useEffect(() => {
    setContent(initialContent);
    if (projectId) {
      loadRevisions();
    }
  }, [initialContent, projectId, loadRevisions]);

  useEffect(() => {
    if (autoSave && content !== initialContent) {
      const timer = setTimeout(() => {
        handleSave();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [content, autoSave, initialContent, handleSave]);

  const handleContentChange = (e) => {
    if (isLocked) return;
    setContent(e.target.value);
    setSaveStatus("idle");
  };

  const insertScriptElement = () => {
    const cursor = document.getElementById('script-textarea').selectionStart;
    let elementText = "";

    switch (currentElement) {
      case "scene_heading":
        elementText = "\n\nINT. LOCATION - DAY\n\n";
        break;
      case "character":
        elementText = "\n\nCHARACTER\n";
        break;
      case "dialogue":
        elementText = "Dialogue goes here.\n\n";
        break;
      case "parenthetical":
        elementText = "\n(parenthetical)\n";
        break;
      case "action":
        elementText = "\n\nAction description goes here.\n\n";
        break;
      case "transition":
        elementText = "\n\nFADE IN:\n\n";
        break;
      default:
        elementText = "\n\n";
    }

    const newContent = content.slice(0, cursor) + elementText + content.slice(cursor);
    setContent(newContent);
  };

  const getAIAssistance = async () => {
    setAiStatus("thinking");
    setAiSuggestion("");
    try {
      const lastPortion = content.slice(-1000);
      const prompt = `You are a professional screenwriter. Based on the following script snippet, provide a concise, compelling continuation of the dialogue or action. Keep it brief and in proper script format.\n\nSCRIPT:\n---\n${lastPortion}\n\nCONTINUATION:`;
      const result = await InvokeLLM({ prompt });

      if (typeof result === 'string') {
        setAiSuggestion(result);
      }
    } catch (error) {
      console.error("AI Assistant Error:", error);
      setAiSuggestion("Sorry, I couldn't generate a suggestion right now.");
    } finally {
      setAiStatus("idle");
    }
  };

  const handleFormatScript = async () => {
    if (isLocked) return;

    setFormatStatus("formatting");
    try {
      const prompt = `You are an expert script formatter. Take the following text and return it in perfect industry-standard screenplay format using Fountain markdown syntax.
- Scene headings (like INT. or EXT.) must be in all caps.
- Character names before dialogue must be in all caps and centered.
- Parentheticals should be on their own line, enclosed in parentheses.
- Dialogue should follow character names or parentheticals.
- Action lines should have no special formatting.
- Do not add any new content, scenes, or dialogue. Only reformat the existing text.

Here is the script to format:
---
${content}`;

      const formattedContent = await InvokeLLM({ prompt });

      if (typeof formattedContent === 'string') {
        setContent(formattedContent);
        setFormatStatus("idle");
      }
    } catch (error) {
      console.error("AI Formatting Error:", error);
      setFormatStatus("error");
      setTimeout(() => setFormatStatus("idle"), 2000);
    }
  };

  const exportToPDF = async () => {
    // Create a simple PDF export
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <html>
        <head>
          <title>Script Export</title>
          <style>
            body { font-family: 'Courier New', monospace; margin: 1in; line-height: 1.5; }
            .scene-heading { font-weight: bold; margin: 1em 0; }
            .character { font-weight: bold; text-align: center; margin-top: 1em; }
            .dialogue { margin: 0 1.5in; }
            .parenthetical { margin: 0 2in; font-style: italic; }
          </style>
        </head>
        <body>
          <pre>${content}</pre>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  const loadRevision = async (revision) => {
    setContent(revision.content);
    setShowRevisions(false);
  };

  const insertSuggestion = () => {
    if (aiSuggestion && !isLocked) {
      setContent(prev => prev + '\n\n' + aiSuggestion);
      setAiSuggestion('');
    }
  };

  const RevisionPanel = () => (
    <div className="w-64 h-full p-4 border-r border-gray-200" style={{
      background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
    }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-gray-800">Script Revisions</h3>
        <button onClick={() => setShowRevisions(false)}>
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      <div className="space-y-2">
        {revisions.map((revision) => (
          <button
            key={revision.id}
            onClick={() => loadRevision(revision)}
            className="w-full p-3 rounded-lg text-left transition-all"
            style={{
              background: revision.is_current
                ? 'linear-gradient(145deg, #d0d0d0, #e8e8e8)'
                : 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
              boxShadow: revision.is_current
                ? 'inset 2px 2px 6px rgba(0,0,0,0.1)'
                : '2px 2px 4px rgba(0,0,0,0.1)',
            }}
          >
            <div className="flex items-center justify-between">
              <span className="font-medium">{revision.revision_number}</span>
              {revision.is_current && (
                <span className="text-xs text-blue-600">Current</span>
              )}
            </div>
            <p className="text-xs text-gray-600 mt-1">
              {new Date(revision.created_date).toLocaleDateString()}
            </p>
            {revision.notes && (
              <p className="text-xs text-gray-500 mt-1">{revision.notes}</p>
            )}
          </button>
        ))}
      </div>
    </div>
  );

  const SettingsPanel = () => (
    <div className="absolute top-full right-0 mt-2 w-64 p-4 rounded-xl z-50" style={{
      background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
      boxShadow: '8px 8px 16px rgba(0,0,0,0.1), -8px -8px 16px rgba(255,255,255,0.7)',
    }}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Auto-save</Label>
          <input
            type="checkbox"
            checked={autoSave}
            onChange={(e) => setAutoSave(e.target.checked)}
            className="rounded"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label>Lock Script</Label>
          <input
            type="checkbox"
            checked={isLocked}
            onChange={(e) => setIsLocked(e.target.checked)}
            className="rounded"
          />
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-full">
      {showRevisions && <RevisionPanel />}

      <div className="flex-1 flex flex-col">
        {/* Script Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 gap-4 border-b border-gray-200">
          <div className="flex items-center gap-2 flex-wrap">
            <Select value={currentElement} onValueChange={setCurrentElement}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="action">Action</SelectItem>
                <SelectItem value="scene_heading">Scene Heading</SelectItem>
                <SelectItem value="character">Character</SelectItem>
                <SelectItem value="dialogue">Dialogue</SelectItem>
                <SelectItem value="parenthetical">Parenthetical</SelectItem>
                <SelectItem value="transition">Transition</SelectItem>
              </SelectContent>
            </Select>

            <Button size="sm" onClick={insertScriptElement} disabled={isLocked}>
              <Plus className="w-4 h-4 mr-1" />
              Insert
            </Button>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button size="sm" variant="outline" onClick={() => setShowRevisions(!showRevisions)}>
              <History className="w-4 h-4 mr-1" />
              Revisions
            </Button>

            <Button size="sm" variant="outline" onClick={exportToPDF}>
              <Download className="w-4 h-4 mr-1" />
              Export PDF
            </Button>

            <div className="relative">
              <Button size="sm" variant="outline" onClick={() => setShowSettings(!showSettings)}>
                <Settings className="w-4 h-4" />
              </Button>
              {showSettings && <SettingsPanel />}
            </div>
          </div>
        </div>

        {/* Script Editor */}
        <div className="flex-1 p-6 relative" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: 'inset 4px 4px 8px rgba(0,0,0,0.1), inset -4px -4px 8px rgba(255,255,255,0.7)',
        }}>
          <Textarea
            id="script-textarea"
            value={content}
            onChange={handleContentChange}
            placeholder="FADE IN:&#10;&#10;INT. COFFEE SHOP - DAY&#10;&#10;Sunlight streams through the window..."
            className="w-full h-full bg-transparent border-none focus-visible:ring-0 resize-none text-gray-800 leading-loose font-mono"
            disabled={isLocked}
          />

          {isLocked && (
            <div className="absolute inset-0 bg-gray-200 bg-opacity-50 flex items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow">
                <Lock className="w-4 h-4 text-gray-600" />
                <span className="text-sm text-gray-600">Script is locked</span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Toolbar */}
        <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t border-gray-200 gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={getAIAssistance}
              disabled={aiStatus === 'thinking' || isLocked}
              className="flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
                boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)',
                color: aiStatus === 'thinking' || isLocked ? '#9ca3af' : '#3b82f6'
              }}
            >
              {aiStatus === 'thinking' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4 mr-2" />
              )}
              AI Assist
            </button>

            <button
              onClick={handleFormatScript}
              disabled={formatStatus === 'formatting' || isLocked}
              className="flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200"
              style={{
                background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
                boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)',
                color: formatStatus === 'formatting' || isLocked ? '#9ca3af' : '#8b5cf6'
              }}
            >
              {formatStatus === 'formatting' ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Format Script
            </button>

            {aiSuggestion && (
              <button
                onClick={insertSuggestion}
                disabled={isLocked}
                className="px-4 py-2 rounded-xl text-sm font-medium text-green-600"
                style={{
                  background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
                  boxShadow: '4px 4px 8px rgba(0,0,0,0.1), -4px -4px 8px rgba(255,255,255,0.7)',
                }}
              >
                Insert Suggestion
              </button>
            )}
          </div>

          <button
            onClick={handleSave}
            disabled={saveStatus === 'saving' || saveStatus === 'saved' || isLocked}
            className="px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 active:scale-95 disabled:opacity-70"
            style={{
              background: saveStatus === 'saved'
                ? 'linear-gradient(145deg, #10b981, #059669)'
                : 'linear-gradient(145deg, #3b82f6, #2563eb)',
              boxShadow: '4px 4px 8px rgba(0,0,0,0.2), -2px -2px 4px rgba(255,255,255,0.1)',
            }}
          >
            {saveStatus === "saving" && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {saveStatus === "saved" && <Check className="w-4 h-4 mr-2" />}
            {saveStatus === "idle" && <Save className="w-4 h-4 mr-2" />}
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save Script"}
          </button>
        </div>

        {aiSuggestion && (
          <div className="m-4 p-4 rounded-xl border border-dashed border-blue-300 bg-blue-50/50">
            <p className="text-sm font-semibold text-blue-700 mb-2">AI Suggestion:</p>
            <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">{aiSuggestion}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
