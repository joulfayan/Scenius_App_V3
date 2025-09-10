
import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project } from "@/api/entities";
import { 
  Plus, 
  Film, 
  Search, 
  Filter, 
  Grid,
  List,
  Calendar,
  User,
  Clock,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function Projects() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("grid");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newProject, setNewProject] = useState({
    title: "",
    description: "",
    genre: "drama",
    format: "feature",
    logline: "",
    budget_range: "micro"
  });
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  useEffect(() => {
    let filtered = projects;

    if (searchQuery) {
      filtered = filtered.filter(project =>
        project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (project.description && project.description.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(project => project.status === statusFilter);
    }

    setFilteredProjects(filtered);
  }, [projects, searchQuery, statusFilter]);

  const loadProjects = async () => {
    const fetchedProjects = await Project.list('-updated_date');
    setProjects(fetchedProjects);
  };

  const handleCreateProject = async () => {
    if (!newProject.title.trim()) return;
    
    setIsCreating(true);
    try {
      const createdProject = await Project.create(newProject);
      setShowCreateDialog(false);
      setNewProject({
        title: "",
        description: "",
        genre: "drama",
        format: "feature",
        logline: "",
        budget_range: "micro"
      });
      loadProjects();
      navigate(createPageUrl(`Project?id=${createdProject.id}`));
    } catch (error) {
      console.error('Error creating project:', error);
    }
    setIsCreating(false);
  };

  const ProjectCard = ({ project }) => (
    <Link 
      to={createPageUrl(`Project?id=${project.id}`)}
      className="block p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02] group"
      style={{
        background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
        boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-blue-600 transition-colors">
            {project.title}
          </h3>
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {project.logline || project.description}
          </p>
          <div className="flex flex-wrap gap-2 mb-3">
            <span className="px-2 py-1 text-xs rounded-lg capitalize" style={{
              background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
              boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.7)',
              color: '#6b7280'
            }}>
              {project.format}
            </span>
            <span className="px-2 py-1 text-xs rounded-lg capitalize" style={{
              background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
              boxShadow: 'inset 1px 1px 2px rgba(0,0,0,0.1), inset -1px -1px 2px rgba(255,255,255,0.7)',
              color: '#6b7280'
            }}>
              {project.genre}
            </span>
          </div>
        </div>
        <div className="w-16 h-16 rounded-xl flex items-center justify-center ml-4" style={{
          background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
          boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
        }}>
          <Film className="w-8 h-8 text-gray-600" />
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{
            backgroundColor: project.status === 'completed' ? '#10b981' :
                           project.status === 'production' ? '#f59e0b' :
                           project.status === 'pre_production' ? '#8b5cf6' :
                           '#6b7280'
          }} />
          <span className="text-xs text-gray-600 capitalize">
            {project.status?.replace('_', ' ')}
          </span>
        </div>
        <span className="text-xs text-gray-500">
          {new Date(project.updated_date).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );

  const ProjectListItem = ({ project }) => (
    <Link 
      to={createPageUrl(`Project?id=${project.id}`)}
      className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 hover:scale-[1.01] group"
      style={{
        background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
        boxShadow: '3px 3px 6px rgba(0,0,0,0.1), -3px -3px 6px rgba(255,255,255,0.7)',
      }}
    >
      <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{
        background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
        boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
      }}>
        <Film className="w-6 h-6 text-gray-600" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
          {project.title}
        </h3>
        <p className="text-sm text-gray-600 truncate">{project.logline || project.description}</p>
      </div>
      <div className="hidden md:flex items-center gap-4 text-sm text-gray-500 flex-shrink-0">
        <span className="capitalize w-20 text-center">{project.format}</span>
        <span className="capitalize w-20 text-center">{project.genre}</span>
        <div className="flex items-center gap-2 w-32">
          <div className="w-2 h-2 rounded-full" style={{
            backgroundColor: project.status === 'completed' ? '#10b981' :
                           project.status === 'production' ? '#f59e0b' :
                           project.status === 'pre_production' ? '#8b5cf6' :
                           '#6b7280'
          }} />
          <span className="capitalize truncate">{project.status?.replace('_', ' ')}</span>
        </div>
        <span className="w-24 text-right">{new Date(project.updated_date).toLocaleDateString()}</span>
      </div>
    </Link>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">Projects</h1>
            <p className="text-gray-600">Manage your creative portfolio</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <button
                className="w-full sm:w-auto text-center px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 active:scale-95"
                style={{
                  background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                  boxShadow: '4px 4px 8px rgba(0,0,0,0.2), -2px -2px 4px rgba(255,255,255,0.1)',
                }}
              >
                <Plus className="w-5 h-5 inline mr-2" />
                New Project
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-blue-500" />
                  Create New Project
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Project Title</Label>
                  <Input
                    id="title"
                    value={newProject.title}
                    onChange={(e) => setNewProject({...newProject, title: e.target.value})}
                    placeholder="Enter your project title..."
                  />
                </div>
                <div>
                  <Label htmlFor="logline">Logline</Label>
                  <Input
                    id="logline"
                    value={newProject.logline}
                    onChange={(e) => setNewProject({...newProject, logline: e.target.value})}
                    placeholder="One-sentence summary of your story..."
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Format</Label>
                    <Select value={newProject.format} onValueChange={(value) => setNewProject({...newProject, format: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="feature">Feature Film</SelectItem>
                        <SelectItem value="short">Short Film</SelectItem>
                        <SelectItem value="series">TV Series</SelectItem>
                        <SelectItem value="commercial">Commercial</SelectItem>
                        <SelectItem value="music_video">Music Video</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Genre</Label>
                    <Select value={newProject.genre} onValueChange={(value) => setNewProject({...newProject, genre: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="drama">Drama</SelectItem>
                        <SelectItem value="comedy">Comedy</SelectItem>
                        <SelectItem value="thriller">Thriller</SelectItem>
                        <SelectItem value="action">Action</SelectItem>
                        <SelectItem value="horror">Horror</SelectItem>
                        <SelectItem value="sci-fi">Sci-Fi</SelectItem>
                        <SelectItem value="documentary">Documentary</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newProject.description}
                    onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                    placeholder="Describe your project in detail..."
                    rows={3}
                  />
                </div>
                <div className="flex gap-3 pt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => setShowCreateDialog(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleCreateProject}
                    disabled={isCreating || !newProject.title.trim()}
                    className="flex-1"
                  >
                    {isCreating ? "Creating..." : "Create Project"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row items-center gap-4 mb-8">
          <div className="flex-1 w-full relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex w-full md:w-auto items-center gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="flex-1">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="pre_production">Pre-Production</SelectItem>
                <SelectItem value="production">Production</SelectItem>
                <SelectItem value="post_production">Post-Production</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex rounded-lg p-1" style={{
              background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
              boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.1), inset -2px -2px 4px rgba(255,255,255,0.7)',
            }}>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded transition-all ${viewMode === "grid" ? "text-blue-600" : "text-gray-500"}`}
                style={viewMode === "grid" ? {
                  background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
                } : {}}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 rounded transition-all ${viewMode === "list" ? "text-blue-600" : "text-gray-500"}`}
                style={viewMode === "list" ? {
                  background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
                  boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
                } : {}}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Projects Display */}
        {filteredProjects.length === 0 ? (
          <div className="text-center py-12 sm:py-16 px-4 rounded-2xl" style={{
            background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
            boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.1), inset -2px -2px 6px rgba(255,255,255,0.7)',
          }}>
            <Film className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              {searchQuery || statusFilter !== "all" ? "No projects match your filters" : "No projects yet"}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery || statusFilter !== "all" ? 
                "Try adjusting your search or filters" : 
                "Start your filmmaking journey by creating your first project"
              }
            </p>
            {!searchQuery && statusFilter === "all" && (
              <button
                onClick={() => setShowCreateDialog(true)}
                className="inline-flex items-center px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 active:scale-95"
                style={{
                  background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                  boxShadow: '4px 4px 8px rgba(0,0,0,0.2), -2px -2px 4px rgba(255,255,255,0.1)',
                }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </button>
            )}
          </div>
        ) : (
          <div>
            {viewMode === "grid" ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProjects.map((project) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredProjects.map((project) => (
                  <ProjectListItem key={project.id} project={project} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
