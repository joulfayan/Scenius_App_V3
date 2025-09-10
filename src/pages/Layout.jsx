

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
// Icons and UI components now handled by NavigationSidebar and TopBar components
import ProjectSelectorModal from "@/components/modals/ProjectSelectorModal";
import { Project } from "@/api/entities";
import NavigationSidebar from "@/components/navigation/NavigationSidebar";
import TopBar from "@/components/navigation/TopBar";
import { usePhaseNavigation } from "@/hooks/usePhaseNavigation";

// Old navigation config removed - now using NavigationSidebar component

export default function Layout({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [modalProjects, setModalProjects] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Use the new phase navigation hook
  const { currentPhase, setPhase, setPhaseAndView } = usePhaseNavigation();

  useEffect(() => {
    const isMobile = window.innerWidth < 768;
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  }, []);

  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    setProjectId(searchParams.get('id'));
  }, [location.search]);
  
  // Sidebar toggle is now handled by NavigationSidebar component
  
  const handleNavAttempt = async (view) => {
    const fetchedProjects = await Project.list('-updated_date');
    if (fetchedProjects.length === 0) {
        navigate(createPageUrl("Projects"));
    } else {
        setModalProjects(fetchedProjects);
        setIsProjectSelectorOpen(true);
    }
  };

  const handleProjectSelection = (selectedProjectId) => {
    const currentView = new URLSearchParams(location.search).get('view');
    navigate(createPageUrl(`Project?id=${selectedProjectId}&view=${currentView || 'dashboard'}`));
    setIsProjectSelectorOpen(false);
  };

  const handleCreateNewProject = () => {
    setIsProjectSelectorOpen(false);
    navigate(createPageUrl("Projects"));
  };

  // Navigation components moved to NavigationSidebar.tsx

  const handleQuickAction = (action) => {
    console.log(`Quick action: ${action}`);
    // Implement quick action logic here
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <ProjectSelectorModal
        isOpen={isProjectSelectorOpen}
        onClose={() => setIsProjectSelectorOpen(false)}
        projects={modalProjects}
        onSelectProject={handleProjectSelection}
        onCreateNew={handleCreateNewProject}
      />
      
      {/* Navigation Sidebar */}
      <NavigationSidebar
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        currentPhase={currentPhase}
        onPhaseChange={setPhase}
      />

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-80' : 'ml-0'}`}>
        {/* Top Bar */}
        <TopBar
          isSidebarOpen={isSidebarOpen}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
          currentPhase={currentPhase}
          onQuickAction={handleQuickAction}
        />

        {/* Page Content */}
        <main className="h-[calc(100vh-4rem)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

