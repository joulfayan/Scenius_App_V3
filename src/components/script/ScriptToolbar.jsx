import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  AlignLeft, Hash, MessageSquare, Download, FileText, 
  Palette, Eye, EyeOff, MoreVertical, Clock, History,
  BarChart3, Scissors, Image, Tag
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const REVISION_COLORS = [
  'Blue', 'Pink', 'Yellow', 'Green', 'Goldenrod', 'Buff', 'Salmon', 'Cherry'
];

export default function ScriptToolbar({ 
  scriptDoc,
  onToggleOutline,
  onToggleSceneNumbers,
  onToggleRevisionMode,
  onExport,
  onTitlePage,
  pageMetrics,
  revisionMode,
  selectedRevisionColor,
  onRevisionColorChange,
  onToggleSidebar,
  activeSidebar,
  selectedText,
  onTagText
}) {
  return (
    <div className="border-b border-gray-200 px-6 py-3 bg-white flex items-center justify-between">
      {/* Left Side - Tools */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleOutline}
        >
          <AlignLeft className="w-4 h-4 mr-1" />
          Outline
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleSceneNumbers}
          className={scriptDoc.settings?.showSceneNumbers ? 'bg-blue-50' : ''}
        >
          <Hash className="w-4 h-4 mr-1" />
          Scene #
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={onToggleRevisionMode}
          className={revisionMode ? 'bg-purple-50' : ''}
        >
          <Palette className="w-4 h-4 mr-1" />
          Revisions
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleSidebar(activeSidebar === 'duration' ? null : 'duration')}
          className={activeSidebar === 'duration' ? 'bg-blue-50' : ''}
        >
          <Clock className="w-4 h-4 mr-1" />
          Duration
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onToggleSidebar(activeSidebar === 'versions' ? null : 'versions')}
          className={activeSidebar === 'versions' ? 'bg-blue-50' : ''}
        >
          <History className="w-4 h-4 mr-1" />
          Versions
        </Button>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => onTagText(selectedText)}
          disabled={!selectedText}
          className={selectedText ? 'bg-green-50' : ''}
        >
          <Tag className="w-4 h-4 mr-1" />
          Tag
        </Button>
        
        {revisionMode && (
          <Select
            value={selectedRevisionColor}
            onValueChange={onRevisionColorChange}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {REVISION_COLORS.map(color => (
                <SelectItem key={color} value={color}>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full border"
                      style={{ backgroundColor: getRevisionColorHex(color) }}
                    />
                    {color}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>

      {/* Center - Title */}
      <div className="font-medium text-gray-800">
        {scriptDoc.title || 'Untitled Script'}
      </div>

      {/* Right Side - Actions */}
      <div className="flex items-center gap-2">
        <Badge variant="outline" className="text-xs">
          {pageMetrics.totalPages} pages
        </Badge>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={onTitlePage}>
              <FileText className="w-4 h-4 mr-2" />
              Title Page
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExport}>
              <Download className="w-4 h-4 mr-2" />
              Export
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}

// Helper function to get hex colors for revision colors
const getRevisionColorHex = (color) => {
  const colors = {
    Blue: '#2196F3',
    Pink: '#E91E63',
    Yellow: '#FFEB3B',
    Green: '#4CAF50',
    Goldenrod: '#DAA520',
    Buff: '#F0DC82',
    Salmon: '#FA8072',
    Cherry: '#DE3163'
  };
  return colors[color] || '#2196F3';
};