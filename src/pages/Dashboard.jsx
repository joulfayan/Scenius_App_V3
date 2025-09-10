
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Project, User } from "@/api/entities";
import {
  Plus,
  Film,
  Clock,
  Users,
  Sparkles,
  TrendingUp,
  FileText,
  Clapperboard,
  LayoutGrid, // Added for AI details
  Calendar // Added for AI details
} from "lucide-react";

export default function Dashboard() {
  const [projects, setProjects] = useState([]);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    totalProjects: 0,
    activeProjects: 0,
    completedProjects: 0
  });
  const [showAIDetails, setShowAIDetails] = useState(false); // New state for AI details

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [fetchedProjects, currentUser] = await Promise.all([
        Project.list('-updated_date', 10),
        User.me()
      ]);

      setProjects(fetchedProjects);
      setUser(currentUser);

      const activeProjects = fetchedProjects.filter(p =>
        ['development', 'pre_production', 'production'].includes(p.status)
      ).length;

      const completedProjects = fetchedProjects.filter(p =>
        p.status === 'completed'
      ).length;

      setStats({
        totalProjects: fetchedProjects.length,
        activeProjects,
        completedProjects
      });
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  const StatCard = ({ title, value, icon: Icon, description }) => (
    <div className="p-6 rounded-2xl" style={{
      background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
      boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
    }}>
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{
          background: 'linear-gradient(145deg, #e0e0e0, #e8e8e8)',
          boxShadow: '2px 2px 4px rgba(0,0,0,0.1), -2px -2px 4px rgba(255,255,255,0.7)',
        }}>
          <Icon className="w-6 h-6 text-blue-600" />
        </div>
        <TrendingUp className="w-5 h-5 text-green-500" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-800 mb-1">{value}</h3>
        <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
    </div>
  );

  const ProjectCard = ({ project }) => (
    <Link
      to={createPageUrl(`Project?id=${project.id}`)}
      className="block p-6 rounded-2xl transition-all duration-300 hover:scale-[1.02]"
      style={{
        background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
        boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
      }}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-800 mb-1">{project.title}</h3>
          <p className="text-sm text-gray-600 mb-2">{project.logline || project.description}</p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="capitalize">{project.format}</span>
            <span className="capitalize">{project.genre}</span>
            <span className="capitalize">{project.status?.replace('_', ' ')}</span>
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
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <FileText className="w-4 h-4 text-blue-500" />
            <span className="text-xs text-gray-600">Script</span>
          </div>
          <div className="flex items-center gap-1">
            <Clapperboard className="w-4 h-4 text-purple-500" />
            <span className="text-xs text-gray-600">Storyboard</span>
          </div>
        </div>
        <span className="text-xs text-gray-500">
          Updated {new Date(project.updated_date).toLocaleDateString()}
        </span>
      </div>
    </Link>
  );

  return (
    <div className="p-4 sm:p-6 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-2">
              Welcome back{user?.full_name ? `, ${user.full_name.split(' ')[0]}` : ''}
            </h1>
            <p className="text-gray-600">
              Ready to bring your creative vision to life? Let's make some magic happen.
            </p>
          </div>
          <Link
            to={createPageUrl("Projects")}
            className="w-full md:w-auto text-center px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 active:scale-95"
            style={{
              background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
              boxShadow: '4px 4px 8px rgba(0,0,0,0.2), -2px -2px 4px rgba(255,255,255,0.1)',
            }}
          >
            <Plus className="w-5 h-5 inline mr-2" />
            New Project
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 mb-8">
          <StatCard
            title="Total Projects"
            value={stats.totalProjects}
            icon={Film}
            description="Your creative portfolio"
          />
          <StatCard
            title="Active Projects"
            value={stats.activeProjects}
            icon={Clock}
            description="Currently in development"
          />
          <StatCard
            title="Completed"
            value={stats.completedProjects}
            icon={Users}
            description="Finished productions"
          />
        </div>

        {/* AI Assistant Card */}
        <div className="p-4 md:p-6 rounded-2xl mb-8" style={{
          background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
          boxShadow: '6px 6px 12px rgba(0,0,0,0.1), -6px -6px 12px rgba(255,255,255,0.7)',
        }}>
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center flex-shrink-0" style={{
              background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
              boxShadow: '4px 4px 8px rgba(0,0,0,0.2)',
            }}>
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 text-center sm:text-left">
              <h3 className="text-lg md:text-xl font-semibold text-gray-800 mb-2">AI Creative Assistant</h3>
              <p className="text-gray-600 mb-3 text-sm md:text-base">
                Get intelligent suggestions, automated breakdowns, and optimized schedules.
              </p>
              <button
                onClick={() => setShowAIDetails(!showAIDetails)}
                className="text-blue-600 font-medium text-sm hover:text-blue-700 transition-colors"
              >
                {showAIDetails ? 'Show less ↑' : 'Learn more →'}
              </button>
            </div>
          </div>

          {showAIDetails && (
            <div className="mt-6 pt-6 border-t border-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-blue-600" />
                    Script Intelligence
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Our AI analyzes your script to provide character development suggestions, pacing insights, and dialogue enhancements. It can identify story beats, suggest scene transitions, and help maintain narrative consistency throughout your project.
                  </p>

                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <LayoutGrid className="w-4 h-4 text-green-600" />
                    Automated Breakdowns
                  </h4>
                  <p className="text-sm text-gray-600">
                    Automatically extract props, costumes, locations, and cast requirements from your script. The AI identifies visual elements, special effects needs, and production requirements, saving hours of manual breakdown work.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-purple-600" />
                    Smart Scheduling
                  </h4>
                  <p className="text-sm text-gray-600 mb-4">
                    Generate optimized shooting schedules based on location availability, cast schedules, and production efficiency. The AI considers factors like setup time, travel distance, and resource optimization to minimize costs and maximize productivity.
                  </p>

                  <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                    <Users className="w-4 h-4 text-orange-600" />
                    Creative Insights
                  </h4>
                  <p className="text-sm text-gray-600">
                    Receive personalized recommendations for improving your project's workflow, budget allocation, and creative decisions. The AI learns from industry best practices and your specific project needs to provide tailored guidance.
                  </p>
                </div>
              </div>

              <div className="mt-6 p-4 rounded-xl bg-blue-50/50 border border-blue-200">
                <p className="text-sm text-blue-800 text-center">
                  <span className="font-medium">Coming Soon:</span> Advanced features including mood board generation, casting suggestions, and real-time collaboration insights.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Recent Projects */}
        <div>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-2">
            <h2 className="text-xl md:text-2xl font-semibold text-gray-800">Recent Projects</h2>
            <Link
              to={createPageUrl("Projects")}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
            >
              View all projects →
            </Link>
          </div>

          {projects.length === 0 ? (
            <div className="text-center py-12 sm:py-16 px-4 rounded-2xl" style={{
              background: 'linear-gradient(145deg, #e8e8e8, #f0f0f0)',
              boxShadow: 'inset 2px 2px 6px rgba(0,0,0,0.1), inset -2px -2px 6px rgba(255,255,255,0.7)',
            }}>
              <Film className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No projects yet</h3>
              <p className="text-gray-500 mb-6">Start your filmmaking journey by creating your first project</p>
              <Link
                to={createPageUrl("Projects")}
                className="inline-flex items-center px-6 py-3 rounded-xl text-white font-medium transition-all duration-200 active:scale-95"
                style={{
                  background: 'linear-gradient(145deg, #3b82f6, #2563eb)',
                  boxShadow: '4px 4px 8px rgba(0,0,0,0.2), -2px -2px 4px rgba(255,255,255,0.1)',
                }}
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Your First Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-6">
              {projects.slice(0, 6).map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
