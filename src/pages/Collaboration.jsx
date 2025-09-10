import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, MessageSquare, CheckCircle, Share2 } from 'lucide-react';

const Collaboration = () => {
  const features = [
    {
      id: 'team',
      title: 'Team Management',
      description: 'Manage team members and permissions',
      icon: Users,
      status: 'Coming Soon'
    },
    {
      id: 'comments',
      title: 'Comments',
      description: 'Collaborative commenting system',
      icon: MessageSquare,
      status: 'Coming Soon'
    },
    {
      id: 'approvals',
      title: 'Approvals',
      description: 'Workflow and approval management',
      icon: CheckCircle,
      status: 'Coming Soon'
    },
    {
      id: 'sharing',
      title: 'Sharing',
      description: 'Share projects and collaborate',
      icon: Share2,
      status: 'Coming Soon'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Collaboration</h1>
        <p className="text-muted-foreground">
          Team collaboration and communication tools
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

export default Collaboration;
