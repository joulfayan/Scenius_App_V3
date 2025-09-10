import React from "react";
import Layout from "./Layout.jsx";

import Dashboard from "./Dashboard";

import Projects from "./Projects";

import Project from "./Project";

import Settings from "./Settings";

import ProjectSettings from "./ProjectSettings";

// Five Phase Pages
import StoryDevelopment from "./StoryDevelopment";
import ScriptManagement from "./ScriptManagement";
import PreProduction from "./PreProduction";
import Production from "./Production";
import Collaboration from "./Collaboration";
import PhaseRouter from "@/components/navigation/PhaseRouter";
// Conditional diagnostic component - only available in development
const DiagnosticWrapper = () => {
  // In production, always return 404
  if (import.meta.env.NODE_ENV === 'production') {
    return <div className="flex items-center justify-center h-screen"><h1 className="text-2xl font-bold text-gray-600">404 - Page Not Found</h1></div>;
  }
  
  // In development, dynamically import the diagnostic page
  const [DiagnosticPage, setDiagnosticPage] = React.useState(null);
  
  React.useEffect(() => {
    // Only import in development
    if (import.meta.env.NODE_ENV !== 'production') {
      import("./diag").then(module => {
        setDiagnosticPage(() => module.default);
      }).catch(() => {
        // If import fails, show error
        setDiagnosticPage(() => () => <div className="flex items-center justify-center h-screen"><h1 className="text-2xl font-bold text-red-600">Diagnostic page not available</h1></div>);
      });
    }
  }, []);
  
  if (!DiagnosticPage) {
    return <div className="flex items-center justify-center h-screen"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>;
  }
  
  return <DiagnosticPage />;
};
import AssistantDemo from "./AssistantDemo";
import ContextTest from "./ContextTest";
import PromptTest from "./PromptTest";
import ServiceIntegrationTest from "./ServiceIntegrationTest";

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Projects: Projects,
    
    Project: Project,
    
    Settings: Settings,
    
    ProjectSettings: ProjectSettings,
    
    // Five Phase Pages
    StoryDevelopment: StoryDevelopment,
    ScriptManagement: ScriptManagement,
    PreProduction: PreProduction,
    Production: Production,
    Collaboration: Collaboration,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Projects" element={<Projects />} />
                
                <Route path="/Project" element={<Project />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/ProjectSettings" element={<ProjectSettings />} />
                
                {/* Phase-based Routes */}
                <Route path="/phase" element={<PhaseRouter />} />
                
                {/* Legacy Phase Routes (for backward compatibility) */}
                <Route path="/StoryDevelopment" element={<StoryDevelopment />} />
                <Route path="/ScriptManagement" element={<ScriptManagement />} />
                <Route path="/PreProduction" element={<PreProduction />} />
                <Route path="/Production" element={<Production />} />
                <Route path="/Collaboration" element={<Collaboration />} />
                
                {/* Diagnostic Route - Only available in non-production */}
                <Route path="/diag" element={<DiagnosticWrapper />} />
                
                {/* Assistant Demo Route */}
                <Route path="/assistant-demo" element={<AssistantDemo />} />
                
                {/* Context Test Route */}
                <Route path="/context-test" element={<ContextTest />} />
                
                {/* Prompt Test Route */}
                <Route path="/prompt-test" element={<PromptTest />} />
                
                {/* Service Integration Test Route */}
                <Route path="/service-integration-test" element={<ServiceIntegrationTest />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}