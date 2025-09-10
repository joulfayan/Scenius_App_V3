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