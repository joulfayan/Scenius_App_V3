import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Presentation, File, Goal, Library } from 'lucide-react';

const ScriptManagement = () => {
  const features = [
    {
      id: 'script',
      title: 'Script Editor',
      description: 'Professional script writing and editing tools',
      icon: FileText,
      status: 'Available'
    },
    {
      id: 'av_script',
      title: 'AV Script',
      description: 'Audio-visual script formatting',
      icon: Presentation,
      status: 'Coming Soon'
    },
    {
      id: 'docs',
      title: 'Docs',
      description: 'Document management and collaboration',
      icon: File,
      status: 'Coming Soon'
    },
    {
      id: 'script_goals',
      title: 'Script Goals',
      description: 'Track writing goals and milestones',
      icon: Goal,
      status: 'Coming Soon'
    },
    {
      id: 'episodic_projects',
      title: 'Episodic Projects',
      description: 'Manage multi-episode content',
      icon: Library,
      status: 'Coming Soon'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Script Management</h1>
        <p className="text-muted-foreground">
          Professional script writing and management tools
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center space-x-2">
                  <Icon className="h-6 w-6 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </div>
                <CardDescription>{feature.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-sm ${
                    feature.status === 'Available' 
                      ? 'text-green-600' 
                      : 'text-muted-foreground'
                  }`}>
                    {feature.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ScriptManagement;
