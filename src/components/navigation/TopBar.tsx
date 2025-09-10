import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  Upload,
  Download,
  Play,
  FileText,
  Settings,
  PanelLeft,
  PanelLeftClose,
  Search,
  Bell,
  User
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { OnlineMembers } from '@/components/presence/OnlineMembers';
import { usePresence } from '@/hooks/usePresence';

interface TopBarProps {
  isSidebarOpen: boolean;
  onToggleSidebar: () => void;
  currentPhase?: string;
  onQuickAction: (action: string) => void;
  projectId?: string | null;
}

const QUICK_ACTIONS = [
  {
    id: 'import',
    label: 'Import',
    icon: Upload,
    description: 'Import script or project files',
    shortcut: 'Ctrl+I'
  },
  {
    id: 'export',
    label: 'Export',
    icon: Download,
    description: 'Export current view',
    shortcut: 'Ctrl+E'
  },
  {
    id: 'run_breakdown',
    label: 'Run Breakdown',
    icon: Play,
    description: 'Generate scene breakdown',
    shortcut: 'Ctrl+B'
  },
  {
    id: 'generate_callsheet',
    label: 'Generate Call Sheet',
    icon: FileText,
    description: 'Create daily call sheet',
    shortcut: 'Ctrl+C'
  }
];

export default function TopBar({ 
  isSidebarOpen, 
  onToggleSidebar, 
  currentPhase,
  onQuickAction,
  projectId
}: TopBarProps) {
  const { onlineUsers, currentUser } = usePresence(projectId);
  const handleQuickAction = (actionId: string) => {
    onQuickAction(actionId);
    // Here you would implement the actual action logic
    console.log(`Quick action triggered: ${actionId}`);
  };

  return (
    <header className="sticky top-0 z-20 bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between h-16 px-4">
        {/* Left Section */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100"
          >
            {isSidebarOpen ? (
              <PanelLeftClose className="w-5 h-5 text-gray-600" />
            ) : (
              <PanelLeft className="w-5 h-5 text-gray-600" />
            )}
          </Button>

          {/* Current Phase Indicator */}
          {currentPhase && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span className="capitalize">{currentPhase.replace('_', ' ')}</span>
            </div>
          )}

          {/* Search */}
          <div className="hidden md:flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                className="pl-10 pr-4 py-2 w-64 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Center Section - Quick Actions */}
        <div className="hidden lg:flex items-center gap-2">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Button
                key={action.id}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.id)}
                className="flex items-center gap-2 hover:bg-gray-50"
                title={`${action.description} (${action.shortcut})`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden xl:inline">{action.label}</span>
              </Button>
            );
          })}
        </div>

        {/* Right Section */}
        <div className="flex items-center gap-2">
          {/* Online Members */}
          <OnlineMembers 
            onlineUsers={onlineUsers}
            currentUserId={currentUser?.uid}
          />

          {/* Quick Actions Dropdown for smaller screens */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="lg:hidden">
                <Play className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {QUICK_ACTIONS.map((action) => {
                const Icon = action.icon;
                return (
                  <DropdownMenuItem
                    key={action.id}
                    onClick={() => handleQuickAction(action.id)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="w-4 h-4" />
                    <div className="flex-1">
                      <div className="font-medium">{action.label}</div>
                      <div className="text-xs text-gray-500">{action.description}</div>
                    </div>
                    <span className="text-xs text-gray-400">{action.shortcut}</span>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
            <Bell className="w-4 h-4 text-gray-600" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="p-2 hover:bg-gray-100">
                <User className="w-4 h-4 text-gray-600" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem>
                <User className="w-4 h-4 mr-2" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="text-red-600">
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
