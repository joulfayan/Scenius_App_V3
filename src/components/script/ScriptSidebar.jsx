import React from 'react';
import { X, Clock, History, BarChart3, MessageSquare, Image, Scissors, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import DurationTracker from './DurationTracker';
import VersionHistory from './VersionHistory';
import ScriptOutline from './ScriptOutline';
import CatalogManager from '../catalog/CatalogManager';

const ScriptSidebar = ({ 
  type, 
  scriptDoc, 
  onUpdate, 
  onClose, 
  width, 
  onWidthChange,
  projectId,
  versions = [],
  currentVersion,
  onRestoreVersion,
  onDeleteVersion,
  onDownloadVersion
}) => {
  const renderSidebarContent = () => {
    switch (type) {
      case 'duration':
        return (
          <DurationTracker 
            scriptDoc={scriptDoc} 
            currentMode={scriptDoc.mode}
            isLive={true}
          />
        );
      
      case 'versions':
        return (
          <VersionHistory
            versions={versions}
            currentVersion={currentVersion}
            onRestoreVersion={onRestoreVersion}
            onDeleteVersion={onDeleteVersion}
            onDownloadVersion={onDownloadVersion}
          />
        );
      
      case 'outline':
        return (
          <ScriptOutline 
            scriptDoc={scriptDoc}
            onUpdate={onUpdate}
          />
        );
      
      case 'breakdown':
        return (
          <div className="space-y-4">
            <CatalogManager projectId={projectId} />
          </div>
        );
      
      case 'insights':
        return (
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Script Insights</h3>
              <p className="text-sm">Analytics and insights coming soon</p>
            </div>
          </div>
        );
      
      case 'comments':
        return (
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Comments</h3>
              <p className="text-sm">Collaboration features coming soon</p>
            </div>
          </div>
        );
      
      case 'media':
        return (
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              <Image className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Media Library</h3>
              <p className="text-sm">Media management coming soon</p>
            </div>
          </div>
        );
      
      default:
        return (
          <div className="space-y-4">
            <div className="text-center text-gray-500 py-8">
              <Eye className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">Sidebar</h3>
              <p className="text-sm">Select a sidebar option from the toolbar</p>
            </div>
          </div>
        );
    }
  };

  const getSidebarTitle = () => {
    switch (type) {
      case 'duration': return 'Duration Tracker';
      case 'versions': return 'Version History';
      case 'outline': return 'Script Outline';
      case 'breakdown': return 'Scene Breakdown';
      case 'insights': return 'Script Insights';
      case 'comments': return 'Comments';
      case 'media': return 'Media Library';
      default: return 'Sidebar';
    }
  };

  const getSidebarIcon = () => {
    switch (type) {
      case 'duration': return Clock;
      case 'versions': return History;
      case 'outline': return Eye;
      case 'breakdown': return Scissors;
      case 'insights': return BarChart3;
      case 'comments': return MessageSquare;
      case 'media': return Image;
      default: return Eye;
    }
  };

  const Icon = getSidebarIcon();

  return (
    <div 
      className="bg-white border-l border-gray-200 flex flex-col h-full"
      style={{ width: `${width}px` }}
    >
      {/* Sidebar Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Icon className="w-5 h-5 text-gray-600" />
          <h3 className="font-semibold text-gray-800">{getSidebarTitle()}</h3>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="p-1 h-8 w-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Sidebar Content */}
      <ScrollArea className="flex-1 p-4">
        {renderSidebarContent()}
      </ScrollArea>

      {/* Resize Handle */}
      <div 
        className="absolute right-0 top-0 bottom-0 w-1 bg-gray-200 hover:bg-gray-300 cursor-col-resize"
        onMouseDown={(e) => {
          e.preventDefault();
          const startX = e.clientX;
          const startWidth = width;
          
          const handleMouseMove = (e) => {
            const newWidth = Math.max(200, Math.min(600, startWidth + (e.clientX - startX)));
            onWidthChange(newWidth);
          };
          
          const handleMouseUp = () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
          };
          
          document.addEventListener('mousemove', handleMouseMove);
          document.addEventListener('mouseup', handleMouseUp);
        }}
      />
    </div>
  );
};

export default ScriptSidebar;
