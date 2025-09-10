import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Calendar, ClipboardList, MapPin, Library } from 'lucide-react';

const Production = () => {
  const features = [
    {
      id: 'budget',
      title: 'Budget',
      description: 'Track and manage production budget',
      icon: Wallet,
      status: 'Coming Soon'
    },
    {
      id: 'callsheet',
      title: 'Call Sheets',
      description: 'Generate and manage daily call sheets',
      icon: Calendar,
      status: 'Coming Soon'
    },
    {
      id: 'reports',
      title: 'Production Reports',
      description: 'Daily and weekly production reports',
      icon: ClipboardList,
      status: 'Coming Soon'
    },
    {
      id: 'locations',
      title: 'Locations',
      description: 'Location management and logistics',
      icon: MapPin,
      status: 'Coming Soon'
    },
    {
      id: 'media_library',
      title: 'Media Library',
      description: 'Organize and manage production media',
      icon: Library,
      status: 'Coming Soon'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Production</h1>
        <p className="text-muted-foreground">
          Production management and execution tools
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

export default Production;
