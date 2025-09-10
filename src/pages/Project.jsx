
import React, { useState, useEffect, useCallback } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Project } from "@/api/entities";
import { createPageUrl } from "@/utils";
import {
  FileText, Clapperboard, Settings, ChevronLeft, Loader2, Save, Check,
  Sparkles, Camera, Calendar, PenSquare, Scissors, Eye, Briefcase, Film,
  Presentation, File, Columns, ClipboardList, RectangleVertical, Diamond,
  LayoutGrid, BookUser, Library, MapPin, HeartPulse, BarChart2, Goal, Wallet,
  AlertCircle, Users, PanelLeft, PanelLeftClose, Home, ChevronRight
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import ScriptEditor from "@/components/script/ScriptEditor";
import StoryboardEditor from "@/components/storyboard/StoryboardEditor";
import ShotlistEditor from "@/components/shotlist/ShotlistEditor";
import CallSheetEditor from "@/components/callsheet/CallSheetEditor";
import AVScriptEditor from "@/components/script/AVScriptEditor";
import ComingSoon from "@/components/placeholders/ComingSoon";
import BeatSheetEditor from "@/components/story/BeatSheetEditor";
import ScriptAnalytics from "@/components/story/ScriptAnalytics";
import BreakdownEditor from "@/components/breakdown/BreakdownEditor";
import MoodBoardEditor from "@/components/moodboard/MoodBoardEditor";
import TeamManager from "@/components/team/TeamManager";
import CatalogViewer from "@/components/catalog/CatalogViewer";
import { featureFlags } from "@/components/featureFlags";

// Define all navigation items with groups
const navigationGroups = [
  {
    title: 'Overview',
    items: [
      { id: 'dashboard', label: 'Project Dashboard', icon: Home },
    ]
  },
  {
    title: 'Story Development',
    items: [
      { id: 'beat_sheet', label: 'Beat Sheet', icon: HeartPulse },
      { id: 'script_analytics', label: 'Script Analytics', icon: BarChart2 },
      { id: 'storyboard', label: 'Storyboard', icon: Clapperboard },
      { id: 'moodboard', label: 'Mood Board', icon: LayoutGrid },
    ]
  },
  {
    title: 'Script Management',
    items: [
      { id: 'script', label: 'Script Editor', icon: FileText },
      { id: 'av_script', label: 'AV Script', icon: Presentation },
      { id: 'docs', label: 'Docs', icon: File },
      { id: 'script_goals', label: 'Script Goals', icon: Goal },
      { id: 'episodic_projects', label: 'Episodic Projects', icon: Library },
    ]
  },
  {
    title: 'Pre-Production',
    items: [
      { id: 'breakdowns', label: 'Breakdown', icon: Scissors },
      featureFlags.catalog_v1 && { id: 'catalog', label: 'Catalog', icon: Diamond },
      { id: 'shotlist', label: 'Shot List', icon: Camera },
      { id: 'stripboard', label: 'Stripboard', icon: Columns },
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'contacts', label: 'Cast & Crew', icon: BookUser },
      { id: 'sides', label: 'Script Sides', icon: RectangleVertical },
    ]
  },
  {
    title: 'Production',
    items: [
      { id: 'budget', label: 'Budget', icon: Wallet },
      { id: 'callsheet', label: 'Call Sheets', icon: Calendar },
      { id: 'reports', label: 'Production Reports', icon: ClipboardList },
      { id: 'locations', label: 'Locations', icon: MapPin },
      { id: 'media_library', label: 'Media Library', icon: Library },
    ]
  },
  {
    title: 'Collaboration',
    items: [
      { id: 'team', label: 'Team', icon: Users },
    ]
  },
].filter(Boolean); // Filter out any false values from feature flags

const ProjectDashboard = ({ project }) => {
  const [stats, setStats] = useState({
    scriptPages: 0,
    sceneCount: 0,
    shotCount: 0,
    teamMembers: 0
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 rounded-2xl" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
            }}>
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.scriptPages}</h3>
          <p className="text-sm font-medium text-gray-600">Script Pages</p>
        </div>

        <div className="p-6 rounded-2xl" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
            }}>
              <LayoutGrid className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.sceneCount}</h3>
          <p className="text-sm font-medium text-gray-600">Scenes</p>
        </div>

        <div className="p-6 rounded-2xl" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
            }}>
              <Camera className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.shotCount}</h3>
          <p className="text-sm font-medium text-gray-600">Shots Planned</p>
        </div>

        <div className="p-6 rounded-2xl" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
        }}>
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
              background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
              boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
            }}>
              <Users className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-1">{stats.teamMembers}</h3>
          <p className="text-sm font-medium text-gray-600">Team Members</p>
        </div>
      </div>

      {/* Project Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-2xl" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
        }}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Project Status</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Current Phase</span>
              <span className="capitalize font-medium text-gray-800">{project.status?.replace('_', ' ')}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Genre</span>
              <span className="capitalize font-medium text-gray-800">{project.genre}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Format</span>
              <span className="capitalize font-medium text-gray-800">{project.format}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Last Updated</span>
              <span className="font-medium text-gray-800">{new Date(project.updated_date).toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="p-6 rounded-2xl" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
        }}>
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Link
              to={createPageUrl(`Project?id=${project.id}&view=script`)}
              className="p-3 rounded-xl text-center transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(145deg, #f0f0f0, #ffffff)',
                boxShadow: '3px 3px 6px rgba(0,0,0,0.1), -3px -3px 6px rgba(255,255,255,0.7)',
              }}
            >
              <FileText className="w-6 h-6 text-blue-600 mx-auto mb-1" />
              <span className="text-sm font-medium">Edit Script</span>
            </Link>
            <Link
              to={createPageUrl(`Project?id=${project.id}&view=storyboard`)}
              className="p-3 rounded-xl text-center transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(145deg, #f0f0f0, #ffffff)',
                boxShadow: '3px 3px 6px rgba(0,0,0,0.1), -3px -3px 6px rgba(255,255,255,0.7)',
              }}
            >
              <Clapperboard className="w-6 h-6 text-purple-600 mx-auto mb-1" />
              <span className="text-sm font-medium">Storyboard</span>
            </Link>
            <Link
              to={createPageUrl(`Project?id=${project.id}&view=shotlist`)}
              className="p-3 rounded-xl text-center transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(145deg, #f0f0f0, #ffffff)',
                boxShadow: '3px 3px 6px rgba(0,0,0,0.1), -3px -3px 6px rgba(255,255,255,0.7)',
              }}
            >
              <Camera className="w-6 h-6 text-green-600 mx-auto mb-1" />
              <span className="text-sm font-medium">Shot List</span>
            </Link>
            <Link
              to={createPageUrl(`Project?id=${project.id}&view=team`)}
              className="p-3 rounded-xl text-center transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(145deg, #f0f0f0, #ffffff)',
                boxShadow: '3px 3px 6px rgba(0,0,0,0.1), -3px -3px 6px rgba(255,255,255,0.7)',
              }}
            >
              <Users className="w-6 h-6 text-orange-600 mx-auto mb-1" />
              <span className="text-sm font-medium">Team</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ProjectPage() {
  const [project, setProject] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [isNavOpen, setIsNavOpen] = useState(true);
  const [openSections, setOpenSections] = useState(['Overview', 'Story Development', 'Script Management', 'Pre-Production', 'Production', 'Collaboration']);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const projectId = searchParams.get('id');
    const view = searchParams.get('view');
    setActiveView(view || "dashboard");
    if (!projectId || projectId === 'null') {
      navigate(createPageUrl("Projects"));
      return;
    }
    loadProject(projectId);
  }, [location.search, navigate]);

  const loadProject = async (id) => {
    setIsLoading(true);
    setError(null);
    try {
      const fetchedProject = await Project.get(id);
      setProject(fetchedProject);
    } catch (err) {
      console.error("Error loading project:", err);
      setError(`Error loading project: ${err.message}`);
    }
    setIsLoading(false);
  };

  const toggleSection = (title) => {
    setOpenSections(prev =>
      prev.includes(title)
        ? prev.filter(t => t !== title)
        : [...prev, title]
    );
  };

  const handleSaveScript = async (content) => {
    if (!project) return;
    try {
      await Project.update(project.id, { script_content: content });
      setProject(prev => ({ ...prev, script_content: content }));
      return true;
    } catch (err) {
      console.error("Failed to save script:", err);
      return false;
    }
  };

  const ProjectNav = () => (
    <aside className={`transition-all duration-300 ease-in-out ${isNavOpen ? 'w-64 p-4' : 'w-0 p-0'} bg-gray-100/50 border-r border-gray-200 overflow-hidden`}>
      <div className="h-full flex flex-col">
        <div className="flex-grow overflow-y-auto pr-2 -mr-2">
          <nav className="space-y-1">
            {navigationGroups.map(group => (
              <Collapsible
                key={group.title}
                open={openSections.includes(group.title)}
                onOpenChange={() => toggleSection(group.title)}
                className="w-full"
              >
                <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-semibold text-gray-700 hover:bg-gray-200/50 rounded-lg transition-colors duration-200">
                  <span className="text-xs uppercase tracking-wider">{group.title}</span>
                  <ChevronRight className={cn("w-4 h-4 transition-transform duration-200", openSections.includes(group.title) ? "rotate-90" : "")} />
                </CollapsibleTrigger>
                <CollapsibleContent className="pl-4 pt-1 pb-1 space-y-1">
                  {group.items.map(item => {
                    if (!item) return null;
                    const isActive = activeView === item.id;
                    return (
                      <Link
                        key={item.id}
                        to={createPageUrl(`Project?id=${project?.id}&view=${item.id}`)}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                          isActive
                            ? 'bg-blue-100 text-blue-800 font-semibold'
                            : 'text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        <item.icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    );
                  })}
                </CollapsibleContent>
              </Collapsible>
            ))}
          </nav>
        </div>
      </div>
    </aside>
  );

  const ProjectHeader = () => (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsNavOpen(!isNavOpen)}
          className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200/50"
        >
          {isNavOpen ? <PanelLeftClose className="w-5 h-5 text-gray-600" /> : <PanelLeft className="w-5 h-5 text-gray-600" />}
        </button>
        <Link
          to={createPageUrl("Projects")}
          className="p-2 rounded-lg flex items-center justify-center transition-colors duration-200 hover:bg-gray-200/50"
        >
          <ChevronLeft className="w-5 h-5 text-gray-600" />
        </Link>
        <div>
          {project && (
            <>
              <h1 className="text-xl md:text-2xl font-bold text-gray-800 truncate" title={project.title}>{project.title}</h1>
              <p className="text-sm text-gray-600 truncate" title={project.logline}>{project.logline}</p>
            </>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2">
        {project && (
          <Link
            to={createPageUrl(`ProjectSettings?id=${project.id}`)}
            className="p-2 rounded-lg transition-colors duration-200 hover:bg-gray-200/50"
          >
            <Settings className="w-5 h-5 text-gray-600" />
          </Link>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-gray-600">Loading project...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500" />
          <h2 className="text-xl font-semibold text-gray-800">Project Not Found</h2>
          <p className="text-gray-600">{error || "The project you're looking for doesn't exist or you don't have access to it."}</p>
          <Link to={createPageUrl("Projects")} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            Back to Projects
          </Link>
        </div>
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'dashboard':
        return <ProjectDashboard project={project} />;
      case 'script':
        return (
          <ScriptEditor
            initialContent={project.script_content || ''}
            onSave={handleSaveScript}
            projectId={project.id}
          />
        );
      case 'storyboard':
        return <StoryboardEditor projectId={project.id} />;
      case 'shotlist':
        return <ShotlistEditor projectId={project.id} />;
      case 'callsheet':
        return <CallSheetEditor projectId={project.id} />;
      case 'av_script':
        return <AVScriptEditor projectId={project.id} />;
      case 'beat_sheet':
        return <BeatSheetEditor projectId={project.id} />;
      case 'script_analytics':
        return <ScriptAnalytics projectId={project.id} />;
      case 'breakdowns':
        return <BreakdownEditor projectId={project.id} />;
      case 'moodboard':
        return <MoodBoardEditor projectId={project.id} />;
      case 'catalog':
        if (featureFlags.catalog_v1) {
          return <CatalogViewer projectId={project.id} />;
        }
        // Fallback or redirect if flag is off but URL is accessed
        return <ComingSoon title="Catalog" description="This feature is not enabled." icon={Diamond} />;
      case 'team':
        return <TeamManager projectId={project.id} />;
      default:
        return (
          <ComingSoon
            icon={navigationGroups.flatMap(g => g.items).find(i => i.id === activeView)?.icon || FileText}
            title={`${activeView.replace(/_/g, ' ')} Coming Soon`}
            description="This feature is currently under development and will be available soon."
          />
        );
    }
  };

  const isFullScreenView = ['script', 'av_script', 'breakdowns', 'moodboard'].includes(activeView);

  return (
    <div className="flex h-full bg-gray-50">
      <ProjectNav />
      <main className="flex-1 flex flex-col overflow-hidden">
        <div className={`border-b border-gray-200 ${isFullScreenView ? 'p-4 sm:p-6' : 'p-4 sm:p-6'}`}>
          <ProjectHeader />
        </div>
        <div className={`flex-1 overflow-y-auto ${isFullScreenView ? '' : 'p-4 sm:p-6'}`}>
          {renderActiveView()}
        </div>
      </main>
    </div>
  );
}
