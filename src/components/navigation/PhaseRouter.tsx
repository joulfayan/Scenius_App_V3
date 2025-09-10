import React from 'react';
import { useLocation } from 'react-router-dom';
import { usePhaseNavigation } from '@/hooks/usePhaseNavigation';
import StoryDevelopment from '@/pages/StoryDevelopment';
import ScriptManagement from '@/pages/ScriptManagement';
import PreProduction from '@/pages/PreProduction';
import Production from '@/pages/Production';
import Collaboration from '@/pages/Collaboration';

const PHASE_COMPONENTS = {
  write: ScriptManagement,
  breakdown: PreProduction,
  visualize: StoryDevelopment,
  plan: PreProduction,
  shoot: Production,
  collaboration: Collaboration,
};

const VIEW_COMPONENTS = {
  // Write phase views
  script: ScriptManagement,
  beat_sheet: StoryDevelopment,
  characters: ScriptManagement,
  scenes: ScriptManagement,
  
  // Breakdown phase views
  breakdowns: PreProduction,
  catalog: PreProduction,
  shotlist: PreProduction,
  stripboard: PreProduction,
  
  // Visualize phase views
  storyboard: StoryDevelopment,
  moodboard: StoryDevelopment,
  locations: PreProduction,
  
  // Plan phase views
  schedule: PreProduction,
  contacts: PreProduction,
  budget: Production,
  
  // Shoot phase views
  callsheet: Production,
  reports: Production,
  media_library: Production,
};

export default function PhaseRouter() {
  const location = useLocation();
  const { currentPhase, getCurrentView } = usePhaseNavigation();
  
  // Get the current view from URL parameters
  const searchParams = new URLSearchParams(location.search);
  const currentView = searchParams.get('view');
  
  // Determine which component to render
  let ComponentToRender;
  
  if (currentView && VIEW_COMPONENTS[currentView]) {
    ComponentToRender = VIEW_COMPONENTS[currentView];
  } else if (currentPhase && PHASE_COMPONENTS[currentPhase]) {
    ComponentToRender = PHASE_COMPONENTS[currentPhase];
  } else {
    // Default to Script Management (Write phase)
    ComponentToRender = ScriptManagement;
  }
  
  return <ComponentToRender />;
}
