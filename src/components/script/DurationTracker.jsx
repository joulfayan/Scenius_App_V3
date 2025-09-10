import React, { useMemo } from 'react';
import { Clock, Play, Pause } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Duration calculation constants
const DURATION_CONSTANTS = {
  // Words per minute for different script types
  WORDS_PER_MINUTE: {
    film_tv: 150,
    stageplay: 120,
    multi_column_av: 180
  },
  // Pages per minute (industry standard)
  PAGES_PER_MINUTE: {
    film_tv: 1,
    stageplay: 0.67, // ~1.5 minutes per page
    multi_column_av: 0.5 // ~2 minutes per page
  },
  // Minimum scene duration
  MIN_SCENE_DURATION: 0.5, // 30 seconds
  // Maximum scene duration
  MAX_SCENE_DURATION: 10 // 10 minutes
};

const formatDuration = (minutes) => {
  if (minutes < 1) {
    return `${Math.round(minutes * 60)}s`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const calculateSceneDuration = (lines, scriptMode) => {
  if (!lines || lines.length === 0) return 0;
  
  const text = lines.map(l => l.text).join(' ');
  const words = text.split(/\s+/).filter(w => w.length > 0);
  const wordCount = words.length;
  
  // Calculate based on script mode
  const wordsPerMinute = DURATION_CONSTANTS.WORDS_PER_MINUTE[scriptMode] || 150;
  const baseDuration = wordCount / wordsPerMinute;
  
  // Apply scene type modifiers
  const sceneLines = lines.filter(l => l.type === 'scene');
  const actionLines = lines.filter(l => l.type === 'action');
  const dialogueLines = lines.filter(l => l.type === 'dialogue');
  
  let duration = baseDuration;
  
  // Dialogue-heavy scenes are typically faster
  if (dialogueLines.length > actionLines.length) {
    duration *= 0.8;
  }
  
  // Action-heavy scenes might be slower
  if (actionLines.length > dialogueLines.length * 2) {
    duration *= 1.2;
  }
  
  // Apply min/max constraints
  return Math.max(
    DURATION_CONSTANTS.MIN_SCENE_DURATION,
    Math.min(DURATION_CONSTANTS.MAX_SCENE_DURATION, duration)
  );
};

const DurationTracker = ({ scriptDoc, currentMode, isLive = true }) => {
  const durationData = useMemo(() => {
    if (!scriptDoc?.lines) return { scenes: [], total: 0 };
    
    const lines = scriptDoc.lines;
    const scenes = [];
    let currentSceneLines = [];
    let sceneNumber = 1;
    
    // Group lines by scenes
    lines.forEach((line, index) => {
      if (line.type === 'scene') {
        // Save previous scene if it exists
        if (currentSceneLines.length > 0) {
          const duration = calculateSceneDuration(currentSceneLines, currentMode);
          scenes.push({
            number: sceneNumber,
            lines: [...currentSceneLines],
            duration,
            startLine: index - currentSceneLines.length,
            endLine: index - 1
          });
          sceneNumber++;
        }
        // Start new scene
        currentSceneLines = [line];
      } else {
        currentSceneLines.push(line);
      }
    });
    
    // Add the last scene
    if (currentSceneLines.length > 0) {
      const duration = calculateSceneDuration(currentSceneLines, currentMode);
      scenes.push({
        number: sceneNumber,
        lines: [...currentSceneLines],
        duration,
        startLine: lines.length - currentSceneLines.length,
        endLine: lines.length - 1
      });
    }
    
    const totalDuration = scenes.reduce((sum, scene) => sum + scene.duration, 0);
    
    return { scenes, total: totalDuration };
  }, [scriptDoc?.lines, currentMode]);
  
  const averageSceneDuration = durationData.scenes.length > 0 
    ? durationData.total / durationData.scenes.length 
    : 0;
  
  const longestScene = durationData.scenes.reduce((longest, scene) => 
    scene.duration > longest.duration ? scene : longest, 
    { duration: 0, number: 0 }
  );
  
  const shortestScene = durationData.scenes.reduce((shortest, scene) => 
    scene.duration < shortest.duration ? scene : shortest, 
    { duration: Infinity, number: 0 }
  );

  return (
    <div className="space-y-4">
      {/* Total Duration Card */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-sm">
            <Clock className="w-4 h-4" />
            Total Duration
            {isLive && (
              <Badge variant="secondary" className="text-xs">
                Live
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-blue-600">
            {formatDuration(durationData.total)}
          </div>
          <div className="text-sm text-gray-500 mt-1">
            {durationData.scenes.length} scenes • {Math.round(averageSceneDuration * 10) / 10}m avg
          </div>
        </CardContent>
      </Card>

      {/* Scene Breakdown */}
      {durationData.scenes.length > 0 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Scene Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {durationData.scenes.map((scene) => (
                <div
                  key={scene.number}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">Scene {scene.number}</span>
                    <span className="text-xs text-gray-500">
                      {scene.lines.length} lines
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-mono">
                      {formatDuration(scene.duration)}
                    </span>
                    {scene.duration === longestScene.duration && scene.duration > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Longest
                      </Badge>
                    )}
                    {scene.duration === shortestScene.duration && scene.duration > 0 && (
                      <Badge variant="outline" className="text-xs">
                        Shortest
                      </Badge>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Duration Stats */}
      {durationData.scenes.length > 1 && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Duration Stats</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <div className="text-gray-500">Longest Scene</div>
                <div className="font-medium">
                  Scene {longestScene.number}: {formatDuration(longestScene.duration)}
                </div>
              </div>
              <div>
                <div className="text-gray-500">Shortest Scene</div>
                <div className="font-medium">
                  Scene {shortestScene.number}: {formatDuration(shortestScene.duration)}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DurationTracker;
