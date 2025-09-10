import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Scissors, Diamond, Camera, Columns, Calendar, BookUser, RectangleVertical } from 'lucide-react';

const PreProduction = () => {
  const features = [
    {
      id: 'breakdowns',
      title: 'Breakdown',
      description: 'Scene breakdown and element tracking',
      icon: Scissors,
      status: 'Coming Soon'
    },
    {
      id: 'catalog',
      title: 'Catalog',
      description: 'Asset and resource cataloging',
      icon: Diamond,
      status: 'Coming Soon'
    },
    {
      id: 'shotlist',
      title: 'Shot List',
      description: 'Plan and organize your shots',
      icon: Camera,
      status: 'Coming Soon'
    },
    {
      id: 'stripboard',
      title: 'Stripboard',
      description: 'Visual scheduling and planning',
      icon: Columns,
      status: 'Coming Soon'
    },
    {
      id: 'schedule',
      title: 'Schedule',
      description: 'Production scheduling and timeline',
      icon: Calendar,
      status: 'Coming Soon'
    },
    {
      id: 'contacts',
      title: 'Cast & Crew',
      description: 'Manage your team and contacts',
      icon: BookUser,
      status: 'Coming Soon'
    },
    {
      id: 'sides',
      title: 'Script Sides',
      description: 'Generate script sides for production',
      icon: RectangleVertical,
      status: 'Coming Soon'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Pre-Production</h1>
        <p className="text-muted-foreground">
          Planning and organization tools for pre-production
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

export default PreProduction;
