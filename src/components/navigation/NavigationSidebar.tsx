import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  PenSquare,
  Scissors,
  Eye,
  Calendar,
  Camera,
  ChevronRight,
  Home,
  Briefcase,
  Settings,
  PanelLeftClose,
  PanelLeft,
  Bug
} from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Phase configuration based on UI guidelines
const PHASES = [
  {
    id: 'write',
    title: 'Write',
    icon: PenSquare,
    description: 'Script writing and story development',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    items: [
      { id: 'script', label: 'Script Editor', icon: PenSquare },
      { id: 'beat_sheet', label: 'Beat Sheet', icon: PenSquare },
      { id: 'characters', label: 'Characters', icon: PenSquare },
      { id: 'scenes', label: 'Scenes', icon: PenSquare },
    ]
  },
  {
    id: 'breakdown',
    title: 'Breakdown',
    icon: Scissors,
    description: 'Scene breakdown and element tracking',
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    items: [
      { id: 'breakdowns', label: 'Breakdown', icon: Scissors },
      { id: 'catalog', label: 'Catalog', icon: Scissors },
      { id: 'shotlist', label: 'Shot List', icon: Camera },
      { id: 'stripboard', label: 'Stripboard', icon: Scissors },
    ]
  },
  {
    id: 'visualize',
    title: 'Visualize',
    icon: Eye,
    description: 'Storyboards and visual planning',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    items: [
      { id: 'storyboard', label: 'Storyboard', icon: Eye },
      { id: 'moodboard', label: 'Mood Board', icon: Eye },
      { id: 'locations', label: 'Locations', icon: Eye },
    ]
  },
  {
    id: 'plan',
    title: 'Plan',
    icon: Calendar,
    description: 'Scheduling and pre-production',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    items: [
      { id: 'schedule', label: 'Schedule', icon: Calendar },
      { id: 'contacts', label: 'Cast & Crew', icon: Calendar },
      { id: 'budget', label: 'Budget', icon: Calendar },
    ]
  },
  {
    id: 'shoot',
    title: 'Shoot',
    icon: Camera,
    description: 'Production and execution',
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    items: [
      { id: 'callsheet', label: 'Call Sheets', icon: Camera },
      { id: 'reports', label: 'Production Reports', icon: Camera },
      { id: 'media_library', label: 'Media Library', icon: Camera },
    ]
  }
];

interface NavigationSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  currentPhase?: string;
  onPhaseChange: (phase: string) => void;
}

export default function NavigationSidebar({ 
  isOpen, 
  onToggle, 
  currentPhase, 
  onPhaseChange 
}: NavigationSidebarProps) {
  const [openPhases, setOpenPhases] = useState<string[]>(['write']);
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize open phases based on current phase
  useEffect(() => {
    if (currentPhase) {
      setOpenPhases(prev => 
        prev.includes(currentPhase) ? prev : [...prev, currentPhase]
      );
    }
  }, [currentPhase]);

  const togglePhase = (phaseId: string) => {
    setOpenPhases(prev =>
      prev.includes(phaseId)
        ? prev.filter(p => p !== phaseId)
        : [...prev, phaseId]
    );
  };

  const handlePhaseClick = (phaseId: string) => {
    onPhaseChange(phaseId);
    // Navigate to phase route with phase parameter
    navigate(`/phase?phase=${phaseId}`, { replace: true });
  };

  const handleItemClick = (phaseId: string, itemId: string) => {
    onPhaseChange(phaseId);
    // Navigate to phase route with both phase and view parameters
    navigate(`/phase?phase=${phaseId}&view=${itemId}`, { replace: true });
  };

  const NavItem = ({ phase, item }: { phase: typeof PHASES[0], item: any }) => {
    const isActive = currentPhase === phase.id && 
      new URLSearchParams(location.search).get('view') === item.id;
    
    const linkClass = cn(
      "flex items-center gap-2 p-2 rounded-lg text-sm transition-all duration-200",
      isActive
        ? `${phase.bgColor} ${phase.color} font-semibold`
        : "text-gray-700 hover:bg-gray-100"
    );
    
    const iconClass = cn(
      "w-4 h-4",
      isActive ? phase.color : "text-gray-500"
    );

    return (
      <button
        onClick={() => handleItemClick(phase.id, item.id)}
        className={linkClass}
      >
        {item.icon && <item.icon className={iconClass} />}
        {item.label}
      </button>
    );
  };

  const PhaseGroup = ({ phase }: { phase: typeof PHASES[0] }) => {
    const isOpen = openPhases.includes(phase.id);
    const isActive = currentPhase === phase.id;
    
    return (
      <Collapsible 
        open={isOpen} 
        onOpenChange={() => togglePhase(phase.id)} 
        className="w-full"
      >
        <CollapsibleTrigger 
          className={cn(
            "flex items-center justify-between w-full p-3 rounded-lg text-sm font-semibold transition-all duration-200",
            isActive 
              ? `${phase.bgColor} ${phase.color}` 
              : "text-gray-700 hover:bg-gray-100"
          )}
        >
          <div className="flex items-center gap-3">
            {phase.icon && <phase.icon className="w-5 h-5" />}
            <div className="text-left">
              <div>{phase.title}</div>
              <div className="text-xs text-gray-500 font-normal">
                {phase.description}
              </div>
            </div>
          </div>
          <ChevronRight 
            className={cn(
              "w-4 h-4 transition-transform duration-200", 
              isOpen ? "rotate-90" : ""
            )} 
          />
        </CollapsibleTrigger>
        <CollapsibleContent className="pl-6 pt-2 pb-1 space-y-1">
          {phase.items.map((item) => (
            <NavItem key={item.id} phase={phase} item={item} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed left-0 top-0 h-full z-40 transform transition-transform duration-300 ease-in-out bg-white overflow-y-auto shadow-lg",
        isOpen ? 'w-80 p-4' : 'w-0 -translate-x-full'
      )}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">Scenius</h1>
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <PanelLeftClose className="w-5 h-5 text-gray-600" />
          </button>
        </div>

        {/* Quick Navigation */}
        <div className="mb-6 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
          <Link
            to="/Projects"
            className="flex items-center gap-2 p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Briefcase className="w-4 h-4" />
            Projects
          </Link>
          <button
            onClick={() => handlePhaseClick('write')}
            className="flex items-center gap-2 p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors w-full text-left"
          >
            <PenSquare className="w-4 h-4" />
            Start Writing
          </button>
        </div>

        {/* Phase Navigation */}
        <nav className="space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
            Production Phases
          </h3>
          {PHASES.map((phase) => (
            <PhaseGroup key={phase.id} phase={phase} />
          ))}
        </nav>

        {/* Settings */}
        <div className="mt-8 pt-4 border-t border-gray-200">
          <Link
            to="/Settings"
            className="flex items-center gap-2 p-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Settings className="w-4 h-4" />
            Settings
          </Link>
          {/* Temporary Diagnostic Link - Only available in non-production */}
          {import.meta.env.NODE_ENV !== 'production' && (
            <Link
              to="/diag"
              className="flex items-center gap-2 p-2 rounded-lg text-sm text-orange-600 hover:bg-orange-50 transition-colors"
            >
              <Bug className="w-4 h-4" />
              Diagnostics
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
