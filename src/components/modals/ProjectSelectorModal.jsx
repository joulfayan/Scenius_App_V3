import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Film, Plus } from 'lucide-react';

export default function ProjectSelectorModal({ isOpen, onClose, projects, onSelectProject, onCreateNew }) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Select a Project</DialogTitle>
          <DialogDescription>
            This tool is project-specific. Please choose a project to continue or create a new one.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <Button onClick={onCreateNew} className="w-full">
            <Plus className="w-4 h-4 mr-2" />
            Create New Project
          </Button>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or select an existing project
              </span>
            </div>
          </div>
          
          <ScrollArea className="h-64 border rounded-lg">
            <div className="p-2 space-y-1">
              {projects.length > 0 ? (
                projects.map(project => (
                  <button
                    key={project.id}
                    onClick={() => onSelectProject(project.id)}
                    className="w-full flex items-center gap-3 p-3 rounded-md text-left transition-all hover:bg-gray-100"
                  >
                    <div className="p-2 bg-gray-100 rounded-md">
                      <Film className="w-5 h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800">{project.title}</p>
                      <p className="text-sm text-gray-500 capitalize">{project.format}</p>
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-center text-sm text-gray-500 p-8">
                  You don't have any projects yet.
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}