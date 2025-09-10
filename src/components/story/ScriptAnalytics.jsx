
import React, { useState, useEffect, useCallback } from 'react';
import { Project, ScriptRevision } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, Clock, Users, MessageSquare, TrendingUp, FileText, Eye } from 'lucide-react';

const analyzeScript = (project, content, revisions) => {
  if (!content) return null;

  // Basic metrics
  const words = content.split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const pages = Math.ceil(wordCount / 250); // ~250 words per page
  const estimatedRuntime = Math.ceil(pages); // ~1 page per minute

  // Scene analysis
  const sceneHeadings = content.match(/^(INT\.|EXT\.)[^\n]*/gm) || [];
  const sceneCount = sceneHeadings.length;

  // Character analysis
  const characterLines = content.match(/^\s*[A-Z][A-Z\s]+$/gm) || [];
  const characters = [...new Set(characterLines.map(line => line.trim()))];
  // Filter out empty strings or lines that might not be character names if regex picked them up
  const cleanedCharacters = characters.filter(name => name.length > 1 && !name.includes('\n'));
  const mainCharacters = cleanedCharacters.slice(0, 10); // Top 10 most mentioned

  // Dialogue vs Action ratio
  // Dialogue lines typically start with an empty space or are indented, and contain lowercase letters
  const dialogueMatches = content.match(/^[^A-Z\n]*[a-z][^A-Z\n]*$/gm) || [];
  // Action lines typically start with a capital letter and span the whole line (e.g., scene descriptions, parentheticals)
  const actionMatches = content.match(/^[A-Z][^\n]*$/gm) || []; // Adjusted regex for action lines
  
  // Ensure total is not zero to avoid division by zero
  const totalLines = dialogueMatches.length + actionMatches.length;
  const dialogueRatio = totalLines > 0 ? Math.round((dialogueMatches.length / totalLines) * 100) : 0;

  // Pacing analysis
  const shortScenes = sceneHeadings.filter((_, index) => {
    const nextSceneIndex = index + 1;
    const currentSceneStart = content.indexOf(sceneHeadings[index]);
    let nextSceneEnd = content.length;

    if (nextSceneIndex < sceneHeadings.length) {
      nextSceneEnd = content.indexOf(sceneHeadings[nextSceneIndex]);
    }
    
    const sceneContent = content.substring(currentSceneStart, nextSceneEnd);
    return sceneContent.split('\n').length < 20;
  });

  return {
    basic: {
      wordCount,
      pages,
      estimatedRuntime,
      sceneCount,
      characterCount: cleanedCharacters.length // Use cleanedCharacters for count
    },
    characters: mainCharacters.map(name => ({
      name,
      scenes: sceneHeadings.filter(scene => {
        const currentSceneStart = content.indexOf(scene);
        const nextSceneIndex = sceneHeadings.indexOf(scene) + 1;
        let nextSceneEnd = content.length;
        if (nextSceneIndex < sceneHeadings.length) {
          nextSceneEnd = content.indexOf(sceneHeadings[nextSceneIndex]);
        }
        const sceneContent = content.substring(currentSceneStart, nextSceneEnd);
        return sceneContent.includes(name);
      }).length
    })),
    pacing: {
      averageSceneLength: sceneCount > 0 ? Math.round(wordCount / sceneCount) : 0,
      shortScenesCount: shortScenes.length,
      shortScenesPercentage: sceneCount > 0 ? Math.round((shortScenes.length / sceneCount) * 100) : 0
    },
    dialogue: {
      dialogueRatio,
      actionRatio: 100 - dialogueRatio
    },
    revisions: {
      count: revisions.length,
      lastModified: revisions[0]?.created_date || project?.updated_date
    }
  };
};

export default function ScriptAnalytics({ projectId }) {
  const [analytics, setAnalytics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [project, setProject] = useState(null);

  const loadAnalytics = useCallback(async () => {
    setIsLoading(true);
    try {
      const fetchedProject = await Project.get(projectId);
      setProject(fetchedProject);
      
      const scriptContent = fetchedProject.script_content || '';
      const revisions = await ScriptRevision.filter({ project_id: projectId }, '-created_date');
      
      const analyticsData = analyzeScript(fetchedProject, scriptContent, revisions);
      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error loading analytics:', error);
      setAnalytics(null); // Ensure analytics is null on error if needed
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadAnalytics();
  }, [loadAnalytics]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="text-center py-16">
        <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-700 mb-2">No Script Content</h3>
        <p className="text-gray-500">Write your script to see detailed analytics and insights.</p>
      </div>
    );
  }

  const MetricCard = ({ title, value, subtitle, icon: Icon, trend }) => (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
          </div>
          <div className="flex items-center gap-2">
            {trend && <TrendingUp className="w-4 h-4 text-green-500" />}
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-800 mb-2">Script Analytics</h2>
        <p className="text-gray-600">Detailed insights into your screenplay structure and content</p>
      </div>

      {/* Basic Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Word Count"
          value={analytics.basic.wordCount.toLocaleString()}
          icon={FileText}
        />
        <MetricCard
          title="Pages"
          value={analytics.basic.pages}
          subtitle="Standard format"
          icon={Eye}
        />
        <MetricCard
          title="Est. Runtime"
          value={`${analytics.basic.estimatedRuntime} min`}
          subtitle="Approximate"
          icon={Clock}
        />
        <MetricCard
          title="Scenes"
          value={analytics.basic.sceneCount}
          icon={BarChart2}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Character Analysis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              Character Presence
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.characters.slice(0, 8).map((character) => (
                <div key={character.name} className="flex items-center justify-between">
                  <span className="font-medium text-gray-700">{character.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${analytics.basic.sceneCount > 0 ? (character.scenes / analytics.basic.sceneCount) * 100 : 0}%` }}
                      />
                    </div>
                    <span className="text-sm text-gray-500 w-8">{character.scenes}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Content Composition */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Content Composition
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Dialogue</span>
                  <span className="text-sm text-gray-500">{analytics.dialogue.dialogueRatio}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${analytics.dialogue.dialogueRatio}%` }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Action/Description</span>
                  <span className="text-sm text-gray-500">{analytics.dialogue.actionRatio}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${analytics.dialogue.actionRatio}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-200">
              <h4 className="font-medium text-gray-700 mb-2">Pacing Insights</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Average scene length: {analytics.pacing.averageSceneLength} words</p>
                <p>Short scenes: {analytics.pacing.shortScenesPercentage}% of total</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Script Development */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Script Development
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{analytics.revisions.count}</p>
              <p className="text-sm text-gray-600">Total Revisions</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">{analytics.basic.characterCount}</p>
              <p className="text-sm text-gray-600">Characters</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-gray-900">
                {analytics.revisions.lastModified ? 
                  new Date(analytics.revisions.lastModified).toLocaleDateString() : 
                  'Today'
                }
              </p>
              <p className="text-sm text-gray-600">Last Modified</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
