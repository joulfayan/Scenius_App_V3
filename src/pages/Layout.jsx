

import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import {
  Menu, Sparkles, LayoutGrid, Film, Users, PenSquare, Scissors, Eye, Briefcase, ChevronRight, Settings, Home, PanelLeftClose, PanelLeft
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import ProjectSelectorModal from "@/components/modals/ProjectSelectorModal";
import { Project } from "@/api/entities";

const navigationGroupsConfig = [
  {
    title: "Home",
    icon: Home,
    items: [
      { name: "Dashboard", view: "dashboard", icon: Home },
      { name: "Projects", view: "projects", icon: Briefcase },
    ],
  },
  {
    title: "Write",
    icon: PenSquare,
    items: [
      { name: "Script", view: "script", icon: Sparkles },
      { name: "Characters", view: "characters", icon: Users },
      { name: "Scenes", view: "scenes", icon: LayoutGrid },
      { name: "Locations", view: "locations", icon: Film },
      { name: "Props", view: "props", icon: Scissors },
    ],
  },
  {
    title: "Review",
    icon: Eye,
    items: [
      { name: "Review", view: "review", icon: Eye },
    ],
  },
];

export default function Layout({ children, currentPageName }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [openGroups, setOpenGroups] = useState(['Home', 'Write']);
  const [isProjectSelectorOpen, setIsProjectSelectorOpen] = useState(false);
  const [projectId, setProjectId] = useState(null);
  const [modalProjects, setModalProjects] = useState([]);
  const location = useLocation();
  const navigate = useNavigate();

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
  
  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const toggleGroup = (groupTitle) => {
    setOpenGroups(prev =>
      prev.includes(groupTitle)
        ? prev.filter(g => g !== groupTitle)
        : [...prev, groupTitle]
    );
  };
  
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

  const NavItem = ({ item }) => {
    const isActive = currentPageName === item.name || (location.pathname.includes("Project") && new URLSearchParams(location.search).get('view') === item.view && item.view !== "projects" && item.view !== "dashboard");
    const isDashboardActive = currentPageName === "Dashboard" && item.name === "Dashboard";
    const isProjectsActive = currentPageName === "Projects" && item.name === "Projects";
    
    const linkClass = cn(
        "flex items-center gap-2 p-2 rounded-lg text-sm transition-all duration-200",
        isActive || isDashboardActive || isProjectsActive
            ? "bg-blue-100 text-blue-800 font-semibold"
            : "text-gray-700 hover:bg-gray-100"
    );
    const iconClass = cn(
        "w-4 h-4",
        isActive || isDashboardActive || isProjectsActive ? "text-blue-600" : "text-gray-500"
    );

    const handleClick = (e) => {
        if (item.view !== 'projects' && item.view !== 'dashboard' && !projectId) {
            e.preventDefault();
            handleNavAttempt(item.view);
        }
    };

    let toPath = "";
    if (item.view === "projects") {
        toPath = createPageUrl("Projects");
    } else if (item.view === "dashboard") {
        if (projectId) {
            toPath = createPageUrl(`Project?id=${projectId}&view=dashboard`);
        } else {
            toPath = createPageUrl("Dashboard");
        }
    } else if (projectId) {
        toPath = createPageUrl(`Project?id=${projectId}&view=${item.view}`);
    } else {
        toPath = createPageUrl(`Project?view=${item.view}`);
    }

    return (
        <Link to={toPath} onClick={handleClick} className={linkClass}>
            {item.icon && <item.icon className={iconClass} />}
            {item.name}
        </Link>
    );
  };
  
  const NavGroup = ({ group }) => {
    const isOpen = openGroups.includes(group.title);
    return (
        <Collapsible open={isOpen} onOpenChange={() => toggleGroup(group.title)} className="w-full">
            <CollapsibleTrigger className="flex items-center justify-between w-full p-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                <div className="flex items-center gap-2">
                    {group.icon && <group.icon className="w-5 h-5 text-gray-600" />}
                    {group.title}
                </div>
                <ChevronRight className={cn("w-4 h-4 transition-transform duration-200", isOpen ? "rotate-90" : "")} />
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-6 pt-2 pb-1 space-y-1">
                {group.items.map((item) => (
                    <NavItem key={item.name} item={item} />
                ))}
            </CollapsibleContent>
        </Collapsible>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50" style={{
      background: 'linear-gradient(135deg, #e8e8e8, #f0f0f0)',
    }}>
      <ProjectSelectorModal
        isOpen={isProjectSelectorOpen}
        onClose={() => setIsProjectSelectorOpen(false)}
        projects={modalProjects}
        onSelectProject={handleProjectSelection}
        onCreateNew={handleCreateNewProject}
      />
      
      {/* Overlay for mobile */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-30 z-30 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed left-0 top-0 h-full z-40 transform transition-transform duration-300 ease-in-out bg-white overflow-y-auto shadow-lg ${isSidebarOpen ? 'w-64 p-4' : 'w-0 -translate-x-full'}`}>
        <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold text-gray-800">Scenius</h1>
        </div>
        <nav className="space-y-2">
            {navigationGroupsConfig.map((group) => (
                <NavGroup key={group.title} group={group} />
            ))}
        </nav>
      </aside>

      {/* Main Content Area */}
      <div className={`transition-all duration-300 ease-in-out ${isSidebarOpen ? 'md:ml-64' : 'ml-0'}`}>
        {/* Header */}
        <header className="sticky top-0 z-20 p-4 flex items-center justify-between" style={{
            background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
            <div className="flex items-center gap-2">
              <button
                onClick={toggleSidebar}
                className="p-2 rounded-lg"
                style={{
                  background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
                }}
              >
                {isSidebarOpen ? <PanelLeftClose className="w-5 h-5 text-gray-700" /> : <PanelLeft className="w-5 h-5 text-gray-700" />}
              </button>
            </div>
            <div className="flex items-center gap-2">
              <Link
                to={createPageUrl("Settings")}
                className="p-2 rounded-lg"
                style={{
                  background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
                }}
              >
                <Settings className="w-5 h-5 text-gray-700" />
              </Link>
            </div>
        </header>

        {/* Page Content */}
        <main className="h-[calc(100vh-68px)] overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}

