import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { HeartPulse, BarChart2, Clapperboard, LayoutGrid } from 'lucide-react';

const StoryDevelopment = () => {
  const features = [
    {
      id: 'beat_sheet',
      title: 'Beat Sheet',
      description: 'Structure your story with key beats and plot points',
      icon: HeartPulse,
      status: 'Coming Soon'
    },
    {
      id: 'script_analytics',
      title: 'Script Analytics',
      description: 'Analyze your script with data-driven insights',
      icon: BarChart2,
      status: 'Coming Soon'
    },
    {
      id: 'storyboard',
      title: 'Storyboard',
      description: 'Visualize your scenes with storyboards',
      icon: Clapperboard,
      status: 'Coming Soon'
    },
    {
      id: 'moodboard',
      title: 'Mood Board',
      description: 'Create visual inspiration boards',
      icon: LayoutGrid,
      status: 'Coming Soon'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Story Development</h1>
        <p className="text-muted-foreground">
          Tools for developing and structuring your story
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                  <span className="text-sm text-muted-foreground">{feature.status}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default StoryDevelopment;
