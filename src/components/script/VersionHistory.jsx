import React, { useState, useMemo } from 'react';
import { History, Clock, User, Eye, RotateCcw, Download, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

// Simple diff algorithm for text comparison
const createDiff = (oldText, newText) => {
  const oldLines = oldText.split('\n');
  const newLines = newText.split('\n');
  const diff = [];
  
  let i = 0, j = 0;
  
  while (i < oldLines.length || j < newLines.length) {
    if (i >= oldLines.length) {
      // Only new lines remain
      diff.push({ type: 'added', line: newLines[j], lineNumber: j + 1 });
      j++;
    } else if (j >= newLines.length) {
      // Only old lines remain
      diff.push({ type: 'removed', line: oldLines[i], lineNumber: i + 1 });
      i++;
    } else if (oldLines[i] === newLines[j]) {
      // Lines are identical
      diff.push({ type: 'unchanged', line: oldLines[i], lineNumber: i + 1 });
      i++;
      j++;
    } else {
      // Lines are different - check if it's an addition or deletion
      const nextOldIndex = oldLines.slice(i + 1).indexOf(newLines[j]);
      const nextNewIndex = newLines.slice(j + 1).indexOf(oldLines[i]);
      
      if (nextOldIndex !== -1 && (nextNewIndex === -1 || nextOldIndex < nextNewIndex)) {
        // Line was removed
        diff.push({ type: 'removed', line: oldLines[i], lineNumber: i + 1 });
        i++;
      } else {
        // Line was added
        diff.push({ type: 'added', line: newLines[j], lineNumber: j + 1 });
        j++;
      }
    }
  }
  
  return diff;
};

const DiffViewer = ({ oldVersion, newVersion, onClose }) => {
  const diff = useMemo(() => {
    if (!oldVersion || !newVersion) return [];
    return createDiff(oldVersion.content, newVersion.content);
  }, [oldVersion, newVersion]);

  return (
    <Dialog open={!!oldVersion && !!newVersion} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Version Comparison
          </DialogTitle>
          <DialogDescription>
            Comparing {oldVersion?.revision_number} with {newVersion?.revision_number}
          </DialogDescription>
        </DialogHeader>
        
        <ScrollArea className="h-96">
          <div className="space-y-1 font-mono text-sm">
            {diff.map((item, index) => (
              <div
                key={index}
                className={`flex items-start gap-2 p-1 rounded ${
                  item.type === 'added' ? 'bg-green-50 border-l-2 border-green-500' :
                  item.type === 'removed' ? 'bg-red-50 border-l-2 border-red-500' :
                  'bg-gray-50'
                }`}
              >
                <div className="w-8 text-xs text-gray-500 flex-shrink-0">
                  {item.lineNumber}
                </div>
                <div className="flex-1">
                  <span className={
                    item.type === 'added' ? 'text-green-700' :
                    item.type === 'removed' ? 'text-red-700' :
                    'text-gray-700'
                  }>
                    {item.line}
                  </span>
                </div>
                <div className="w-4 flex-shrink-0">
                  {item.type === 'added' && <span className="text-green-500">+</span>}
                  {item.type === 'removed' && <span className="text-red-500">-</span>}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

const VersionHistory = ({ 
  versions = [], 
  currentVersion, 
  onRestoreVersion, 
  onDeleteVersion,
  onDownloadVersion 
}) => {
  const [selectedVersions, setSelectedVersions] = useState({ old: null, new: null });
  const [showDiff, setShowDiff] = useState(false);

  const sortedVersions = useMemo(() => {
    return [...versions].sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
  }, [versions]);

  const handleCompareVersions = (version1, version2) => {
    setSelectedVersions({ 
      old: version1, 
      new: version2 
    });
    setShowDiff(true);
  };

  const handleRestoreVersion = (version) => {
    if (window.confirm(`Are you sure you want to restore version ${version.revision_number}? This will replace your current script.`)) {
      onRestoreVersion(version);
    }
  };

  const handleDeleteVersion = (version) => {
    if (window.confirm(`Are you sure you want to delete version ${version.revision_number}? This action cannot be undone.`)) {
      onDeleteVersion(version);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getVersionType = (version) => {
    if (version.is_current) return 'current';
    if (version.notes?.toLowerCase().includes('auto-saved')) return 'auto';
    if (version.notes?.toLowerCase().includes('manual')) return 'manual';
    return 'draft';
  };

  const getVersionColor = (type) => {
    switch (type) {
      case 'current': return 'bg-blue-100 text-blue-800';
      case 'manual': return 'bg-green-100 text-green-800';
      case 'auto': return 'bg-gray-100 text-gray-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <History className="w-4 h-4" />
            Version History
            <Badge variant="secondary" className="text-xs">
              {versions.length} versions
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-64">
            <div className="space-y-2">
              {sortedVersions.map((version, index) => {
                const versionType = getVersionType(version);
                const isCurrent = version.is_current;
                
                return (
                  <div
                    key={version.id}
                    className={`p-3 rounded-lg border transition-colors ${
                      isCurrent ? 'border-blue-200 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm">
                          {version.revision_number}
                        </span>
                        <Badge 
                          variant="outline" 
                          className={`text-xs ${getVersionColor(versionType)}`}
                        >
                          {versionType}
                        </Badge>
                        {isCurrent && (
                          <Badge variant="default" className="text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCompareVersions(version, currentVersion)}
                          disabled={isCurrent}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownloadVersion(version)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                        {!isCurrent && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRestoreVersion(version)}
                            >
                              <RotateCcw className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteVersion(version)}
                              className="text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-500 space-y-1">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(version.created_date)}
                      </div>
                      {version.notes && (
                        <div className="text-gray-600">
                          {version.notes}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Diff Viewer Modal */}
      {showDiff && (
        <DiffViewer
          oldVersion={selectedVersions.old}
          newVersion={selectedVersions.new}
          onClose={() => setShowDiff(false)}
        />
      )}
    </div>
  );
};

export default VersionHistory;
