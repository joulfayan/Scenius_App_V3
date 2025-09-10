import { useState, useEffect, useCallback } from 'react';
import { ScriptRevision } from '@/api/entities';

export const useScriptVersions = (projectId) => {
  const [versions, setVersions] = useState([]);
  const [currentVersion, setCurrentVersion] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load versions for a project
  const loadVersions = useCallback(async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedVersions = await ScriptRevision.filter(
        { project_id: projectId }, 
        '-created_date'
      );
      setVersions(fetchedVersions);
      
      // Find current version
      const current = fetchedVersions.find(v => v.is_current);
      setCurrentVersion(current || null);
    } catch (err) {
      console.error('Error loading script versions:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Create a new version
  const createVersion = useCallback(async (scriptDoc, notes = 'Manual save') => {
    if (!projectId) return null;
    
    try {
      // Get next version number
      const existingVersions = await ScriptRevision.filter({ project_id: projectId }, '-created_date');
      const nextVersionNumber = `v${existingVersions.length + 1}`;
      
      // Mark all existing versions as not current
      await Promise.all(
        existingVersions.map(version => 
          ScriptRevision.update(version.id, { is_current: false })
        )
      );
      
      // Create new version
      const newVersion = await ScriptRevision.create({
        project_id: projectId,
        revision_number: nextVersionNumber,
        content: JSON.stringify(scriptDoc),
        notes,
        is_current: true
      });
      
      // Update local state
      setVersions(prev => [newVersion, ...prev]);
      setCurrentVersion(newVersion);
      
      return newVersion;
    } catch (err) {
      console.error('Error creating script version:', err);
      setError(err.message);
      return null;
    }
  }, [projectId]);

  // Restore a version
  const restoreVersion = useCallback(async (version) => {
    if (!projectId || !version) return null;
    
    try {
      // Mark all versions as not current
      await Promise.all(
        versions.map(v => 
          ScriptRevision.update(v.id, { is_current: false })
        )
      );
      
      // Mark selected version as current
      await ScriptRevision.update(version.id, { is_current: true });
      
      // Update local state
      setVersions(prev => 
        prev.map(v => ({ ...v, is_current: v.id === version.id }))
      );
      setCurrentVersion(version);
      
      return version;
    } catch (err) {
      console.error('Error restoring script version:', err);
      setError(err.message);
      return null;
    }
  }, [projectId, versions]);

  // Delete a version
  const deleteVersion = useCallback(async (version) => {
    if (!version) return false;
    
    try {
      await ScriptRevision.delete(version.id);
      
      // Update local state
      setVersions(prev => prev.filter(v => v.id !== version.id));
      
      // If we deleted the current version, set the most recent as current
      if (version.is_current && versions.length > 1) {
        const remainingVersions = versions.filter(v => v.id !== version.id);
        const newCurrent = remainingVersions[0];
        await restoreVersion(newCurrent);
      }
      
      return true;
    } catch (err) {
      console.error('Error deleting script version:', err);
      setError(err.message);
      return false;
    }
  }, [versions, restoreVersion]);

  // Download version content
  const downloadVersion = useCallback((version) => {
    if (!version) return;
    
    try {
      const scriptDoc = JSON.parse(version.content);
      const content = scriptDoc.lines.map(line => line.text).join('\n');
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `script_${version.revision_number}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading version:', err);
      setError(err.message);
    }
  }, []);

  // Auto-save functionality
  const autoSave = useCallback(async (scriptDoc) => {
    if (!projectId || !scriptDoc) return;
    
    try {
      const existingVersions = await ScriptRevision.filter({ project_id: projectId }, '-created_date');
      const autoSaveVersion = existingVersions.find(v => 
        v.notes?.toLowerCase().includes('auto-saved') && v.is_current
      );
      
      if (autoSaveVersion) {
        // Update existing auto-save
        await ScriptRevision.update(autoSaveVersion.id, {
          content: JSON.stringify(scriptDoc),
          created_date: new Date().toISOString()
        });
      } else {
        // Create new auto-save
        const nextVersionNumber = `v${existingVersions.length + 1}`;
        await ScriptRevision.create({
          project_id: projectId,
          revision_number: nextVersionNumber,
          content: JSON.stringify(scriptDoc),
          notes: `Auto-saved on ${new Date().toLocaleString()}`,
          is_current: true
        });
      }
      
      // Reload versions to get updated data
      await loadVersions();
    } catch (err) {
      console.error('Error auto-saving script:', err);
      setError(err.message);
    }
  }, [projectId, loadVersions]);

  // Load versions on mount
  useEffect(() => {
    loadVersions();
  }, [loadVersions]);

  return {
    versions,
    currentVersion,
    isLoading,
    error,
    loadVersions,
    createVersion,
    restoreVersion,
    deleteVersion,
    downloadVersion,
    autoSave
  };
};
