import React, { useState, useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { Project, ProjectSettings as ProjectSettingsEntity, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from "sonner";
import { Loader2, Info, FileText } from 'lucide-react';

const ProjectInfoTab = ({ project, settings, onUpdate, isAllowed }) => {
    const [formData, setFormData] = useState({
        title: project?.title || '',
        logline: project?.logline || '',
        project_code: settings?.project_code || '',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (project && settings) {
            setFormData({
                title: project.title || '',
                logline: project.logline || '',
                project_code: settings.project_code || '',
            });
        }
    }, [project, settings]);

    if (!isAllowed) {
        return <p>You do not have permission to edit these settings.</p>;
    }
    
    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate(formData);
            toast.success("Project settings updated.");
        } catch (error) {
            toast.error("Failed to update project settings.");
        }
        setIsSaving(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Project Information</CardTitle>
                <CardDescription>Manage core details for this project.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="title">Project Title</Label>
                    <Input id="title" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="logline">Logline</Label>
                    <Input id="logline" value={formData.logline} onChange={e => setFormData({...formData, logline: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="project_code">Project Code</Label>
                    <Input id="project_code" value={formData.project_code} onChange={e => setFormData({...formData, project_code: e.target.value})} />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave} disabled={isSaving}>
                        {isSaving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        Save Changes
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};

export default function ProjectSettingsPage() {
    const [project, setProject] = useState(null);
    const [settings, setSettings] = useState(null);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const location = useLocation();

    const loadData = useCallback(async (projectId) => {
        setIsLoading(true);
        try {
            const [fetchedProject, currentUser, settingsList] = await Promise.all([
                Project.get(projectId),
                User.me(),
                ProjectSettingsEntity.filter({ project_id: projectId }),
            ]);
            
            setProject(fetchedProject);
            setUser(currentUser);
            
            if (settingsList.length > 0) {
                setSettings(settingsList[0]);
            } else {
                const newSettings = await ProjectSettingsEntity.create({ project_id: projectId });
                setSettings(newSettings);
            }
        } catch (error) {
            console.error("Failed to load project settings:", error);
            toast.error("Could not load project settings.");
        }
        setIsLoading(false);
    }, []);

    useEffect(() => {
        const projectId = new URLSearchParams(location.search).get('id');
        if (projectId) {
            loadData(projectId);
        } else {
            // TODO: Handle missing project ID, maybe redirect
        }
    }, [location, loadData]);

    const handleUpdate = async (updates) => {
        const { title, logline, ...settingsUpdates } = updates;
        
        await Promise.all([
            Project.update(project.id, { title, logline }),
            ProjectSettingsEntity.update(settings.id, settingsUpdates)
        ]);

        setProject(prev => ({...prev, title, logline}));
        setSettings(prev => ({...prev, ...settingsUpdates}));
    };

    if (isLoading) {
        return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
    }
    
    if (!project) {
        return <div className="p-8">Project not found.</div>
    }

    // TODO: Implement proper role checking based on ProjectMember entity
    const isProjectAdmin = user?.role === 'admin'; 

    return (
        <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-2">Project Settings</h1>
            <p className="text-lg text-gray-500 mb-6">{project.title}</p>
            <Tabs defaultValue="info" className="w-full">
                <TabsList>
                    <TabsTrigger value="info"><Info className="w-4 h-4 mr-2" />Project Info</TabsTrigger>
                    <TabsTrigger value="script" disabled={true}><FileText className="w-4 h-4 mr-2" />Script & Sides</TabsTrigger>
                </TabsList>
                <TabsContent value="info" className="mt-4">
                    <ProjectInfoTab project={project} settings={settings} onUpdate={handleUpdate} isAllowed={isProjectAdmin} />
                </TabsContent>
            </Tabs>
        </div>
    );
}