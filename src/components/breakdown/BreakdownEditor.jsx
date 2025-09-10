
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Project, BreakdownElement, CatalogItem } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Tag, X, Users, Tv, Clapperboard, Shirt, Sparkle, Car, Zap, Sparkles as SparklesIcon, Wand2, Mic, Music, Leaf, Component, Shield, UserPlus, Package, FileText, Settings2, Plus, MapPin } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from "sonner";
import { InvokeLLM } from '@/api/integrations';
import { featureFlags } from '@/components/featureFlags';

// Reordered by most commonly used categories first
const breakdownCategories = {
  cast_members: { label: 'Cast Members', icon: Users, color: 'text-purple-500' },
  locations: { label: 'Locations', icon: MapPin, color: 'text-blue-600' },
  props: { label: 'Props', icon: Clapperboard, color: 'text-red-500' },
  extras: { label: 'Extras', icon: UserPlus, color: 'text-green-500' },
  set_dressing: { label: 'Set Dressing', icon: Tv, color: 'text-blue-500' },
  costumes: { label: 'Costumes', icon: Shirt, color: 'text-orange-500' },
  vehicles: { label: 'Vehicles', icon: Car, color: 'text-indigo-500' },
  makeup: { label: 'Makeup', icon: Sparkle, color: 'text-pink-500' },
  stunts: { label: 'Stunts', icon: Zap, color: 'text-yellow-500' },
  special_effects: { label: 'Special Effects', icon: SparklesIcon, color: 'text-cyan-500' },
  sound: { label: 'Sound', icon: Mic, color: 'text-fuchsia-500' },
  music: { label: 'Music', icon: Music, color: 'text-rose-500' },
  special_equipment: { label: 'Special Equipment', icon: Component, color: 'text-red-600' },
  visual_fx: { label: 'Visual FX', icon: Wand2, color: 'text-teal-600' },
  optical_fx: { label: 'Optical FX', icon: Wand2, color: 'text-teal-500' },
  mechanical_fx: { label: 'Mechanical FX', icon: Settings2, color: 'text-gray-500' },
  greenery: { label: 'Greenery', icon: Leaf, color: 'text-green-600' },
  livestock: { label: 'Livestock', icon: Leaf, color: 'text-lime-500' },
  animal_handler: { label: 'Animal Handler', icon: UserPlus, color: 'text-amber-600' },
  security: { label: 'Security', icon: Shield, color: 'text-blue-700' },
  additional_labor: { label: 'Additional Labor', icon: Users, color: 'text-orange-600' },
  miscellaneous: { label: 'Miscellaneous', icon: Package, color: 'text-gray-600' },
  notes: { label: 'Notes', icon: FileText, color: 'text-yellow-600' },
  scene_settings: { label: 'Scene Settings', icon: Clapperboard, color: 'text-indigo-600' },
};

const TaggingPopover = ({ position, onTag, onClose }) => {
  const popoverRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 rounded-2xl shadow-2xl border p-2"
      style={{ 
        top: position.y, 
        left: position.x,
        background: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(10px)',
      }}
    >
      <div className="flex justify-between items-center mb-2 px-2">
        <h4 className="text-sm font-semibold text-gray-800">Tag as...</h4>
        <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200"><X className="w-4 h-4 text-gray-600" /></button>
      </div>
      <ScrollArea className="h-64">
        <div className="grid grid-cols-1 gap-1">
          {Object.entries(breakdownCategories).map(([key, { label, icon: Icon, color }]) => (
            <button
              key={key}
              onClick={() => onTag(key)}
              className={`flex items-center gap-3 w-full text-left px-3 py-2 rounded-md hover:bg-gray-200/50 transition-colors ${color}`}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm text-gray-800 font-medium">{label}</span>
            </button>
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default function BreakdownEditor({ projectId }) {
  const [project, setProject] = useState(null);
  const [breakdownElements, setBreakdownElements] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [popover, setPopover] = useState(null);
  const [selection, setSelection] = useState(null);

  const scriptContainerRef = useRef(null);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [proj, elements] = await Promise.all([
        Project.get(projectId),
        BreakdownElement.filter({ project_id: projectId }, '-created_date')
      ]);
      setProject(proj);
      setBreakdownElements(elements);
    } catch (error) {
      console.error('Error loading breakdown data:', error);
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      if (scriptContainerRef.current && scriptContainerRef.current.contains(range.startContainer)) {
        const containerRect = scriptContainerRef.current.getBoundingClientRect();
        setSelection(sel.toString().trim());
        setPopover({
          x: rect.left - containerRect.left,
          y: rect.bottom - containerRect.top + window.scrollY + 10
        });
      }
    } else {
      setTimeout(() => setPopover(null), 100);
    }
  };

  const handleTag = async (elementType) => {
    if (!selection) return;

    try {
      const newElement = await BreakdownElement.create({
        project_id: projectId,
        name: selection,
        element_type: elementType,
      });

      // --- FEATURE FLAG: catalog_v1 ---
      // If the catalog feature is enabled, also create a master catalog item.
      if (featureFlags.catalog_v1) {
        await CatalogItem.create({
          project_id: projectId,
          // Map breakdown category to catalog category. For now, they are 1:1.
          category: elementType,
          name: selection,
          source: 'rent', // default value
          status: 'needed',
        });
        toast.success(`"${selection}" tagged and added to Catalog.`);
      } else {
        toast.success(`"${selection}" tagged as ${breakdownCategories[elementType].label}.`);
      }
      
      setBreakdownElements(prev => [newElement, ...prev]);

    } catch (error) {
      console.error("Failed to create breakdown element:", error);
      toast.error("Failed to tag element.");
    } finally {
      setPopover(null);
      setSelection(null);
      window.getSelection().removeAllRanges();
    }
  };

  const handleAIBreakdown = async () => {
    if (!project?.script_content) {
      toast.error("Script content is empty. Cannot perform AI breakdown.");
      return;
    }
    
    setIsGenerating(true);
    toast.info("AI is analyzing your script... This might take a moment.");

    try {
      const response_json_schema = {
        type: "object",
        properties: {
          elements: {
            type: "array",
            items: {
              type: "object",
              properties: {
                name: { type: "string" },
                element_type: { type: "string", enum: Object.keys(breakdownCategories) }
              },
              required: ["name", "element_type"]
            }
          }
        },
        required: ["elements"]
      };

      const categoryList = Object.entries(breakdownCategories).map(([key, { label }]) => `- ${key}: ${label}`).join('\n');
      const prompt = `Analyze the following film script and extract all relevant production elements. Categorize each element into one of the following types:\n\n${categoryList}\n\nIdentify elements like character names, props, locations, costumes, sounds, etc. Be thorough. Return the result as a single JSON object with an "elements" key, which is an array of objects. Each object in the array should have a "name" and an "element_type". Do not hallucinate elements not present in the script.\n\nScript:\n---\n${project.script_content}`;

      const result = await InvokeLLM({ prompt, response_json_schema });

      if (result && result.elements) {
        const existingElements = new Set(breakdownElements.map(el => `${el.name.trim().toLowerCase()}_${el.element_type}`));
        const newElements = result.elements.filter(el => 
          el.name && el.element_type && !existingElements.has(`${el.name.trim().toLowerCase()}_${el.element_type}`)
        );

        if (newElements.length === 0) {
          toast.info("AI analysis complete. No new elements were found.");
          setIsGenerating(false);
          return;
        }

        const breakdownPromises = newElements.map(element => 
            BreakdownElement.create({
                project_id: projectId,
                name: element.name.trim(),
                element_type: element.element_type,
            })
        );
        
        await Promise.all(breakdownPromises);

        // --- FEATURE FLAG: catalog_v1 ---
        if (featureFlags.catalog_v1) {
          const catalogPromises = newElements.map(element => 
            CatalogItem.create({
              project_id: projectId,
              category: element.element_type,
              name: element.name.trim(),
              source: 'rent',
              status: 'needed',
            })
          );
          await Promise.all(catalogPromises);
          toast.success(`AI analysis complete! ${newElements.length} new elements tagged and added to Catalog.`);
        } else {
          toast.success(`AI analysis complete! ${newElements.length} new elements were tagged.`);
        }
        
        await loadData(); // Reload data to show new elements
      } else {
        throw new Error("Invalid response from AI or no elements found.");
      }

    } catch (error) {
      console.error("AI Breakdown failed:", error);
      toast.error("AI breakdown failed. Please try again. " + (error.message || ""));
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteElement = async (elementId) => {
    try {
      await BreakdownElement.delete(elementId);
      setBreakdownElements(prev => prev.filter(el => el.id !== elementId));
      toast.success("Element deleted successfully.");
    } catch (error) {
      console.error("Failed to delete element:", error);
      toast.error("Failed to delete element.");
    }
  };
  
  const addManualAsset = () => {
    // This is a stub for manual asset addition. A dialog would open here.
    toast.info("Manual asset addition coming soon!");
  };

  const generateReport = () => {
    // Pseudo-code for PDF generation
    // let pdf = new PDFDocument();
    // pdf.addTitle("Breakdown Report for " + project.title);
    // Object.entries(groupedElements).forEach(([category, items]) => {
    //   pdf.addSection(category);
    //   items.forEach(item => pdf.addItem(item.name));
    // });
    // pdf.download("breakdown-report.pdf");
    toast.info("PDF Report generation is on the roadmap!");
  }
  
  const groupedElements = breakdownElements.reduce((acc, el) => {
    (acc[el.element_type] = acc[el.element_type] || []).push(el);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="flex justify-center items-center h-96"><Loader2 className="w-8 h-8 animate-spin text-gray-400" /></div>;
  }

  return (
    <div className="flex h-[calc(100vh-150px)]">
      {/* Script Panel */}
      <div className="flex-grow w-2/3 relative" ref={scriptContainerRef}>
        <ScrollArea className="h-full">
          <div onMouseUp={handleMouseUp} className="prose p-8 whitespace-pre-wrap select-text selection:bg-blue-300/50">
            {project?.script_content || "No script content available. Please add a script."}
          </div>
        </ScrollArea>
        {popover && (
          <TaggingPopover
            position={popover}
            onTag={handleTag}
            onClose={() => setPopover(null)}
          />
        )}
      </div>

      {/* Breakdown Sidebar */}
      <div className="w-1/3 border-l" style={{background: 'rgba(240, 240, 240, 0.9)', backdropFilter: 'blur(5px)'}}>
        <Card className="h-full shadow-none border-none rounded-none bg-transparent">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5 text-blue-500" /> Breakdown
            </CardTitle>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={handleAIBreakdown} disabled={isGenerating}>
                {isGenerating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <SparklesIcon className="w-4 h-4 mr-1" />}
                AI Breakdown
              </Button>
              <Button size="sm" variant="outline" onClick={addManualAsset}>
                  <Plus className="w-4 h-4 mr-1" /> Add Asset
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[calc(100vh-300px)]">
              <div className="space-y-4">
                {Object.keys(breakdownCategories).map(key => {
                  const items = groupedElements[key];
                  // Only render category if there are items in it
                  if (!items || items.length === 0) return null;
                  
                  const { label, icon: Icon, color } = breakdownCategories[key];
                  return (
                    <div key={key}>
                      <h3 className={`flex items-center gap-2 font-semibold text-sm mb-2 ${color}`}>
                        <Icon className="w-4 h-4" />
                        {label} ({items.length})
                      </h3>
                      <ul className="space-y-1 pl-6">
                        {items.map(item => (
                          <li key={item.id} className="text-sm text-gray-700 flex justify-between items-center group">
                            <span>{item.name}</span>
                            <button onClick={() => handleDeleteElement(item.id)} className="opacity-0 group-hover:opacity-100 p-1 rounded-full hover:bg-red-100">
                              <X className="w-3 h-3 text-red-500" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
             <div className="absolute bottom-4 right-4 left-4 border-t pt-4">
                <Button onClick={generateReport} className="w-full">Generate Breakdown Report</Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
