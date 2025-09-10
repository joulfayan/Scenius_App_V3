import React, { useState, useEffect, useCallback } from 'react';
import { User, OrgSettings } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from "sonner";
import { Loader2, User as UserIcon, Building, Palette } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { Link } from 'react-router-dom';

const PersonalSettingsTab = ({ user, onUpdate }) => {
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    profession: user?.profession || 'Writer',
    bio: user?.bio || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await onUpdate(formData);
      toast.success("Personal settings updated.");
    } catch (error) {
      toast.error("Failed to update settings.");
      console.error(error);
    }
    setIsSaving(false);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Personal Information</CardTitle>
        <CardDescription>Update your profile details.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="full_name">Full Name</Label>
          <Input id="full_name" value={formData.full_name} onChange={e => setFormData({...formData, full_name: e.target.value})} />
        </div>
        <div>
          <Label htmlFor="profession">Profession</Label>
          <Select value={formData.profession} onValueChange={value => setFormData({...formData, profession: value})}>
            <SelectTrigger id="profession"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="Writer">Writer</SelectItem>
              <SelectItem value="Director">Director</SelectItem>
              <SelectItem value="Producer">Producer</SelectItem>
              <SelectItem value="Editor">Editor</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
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

const OrganizationSettingsTab = ({ settings, onUpdate, isAllowed }) => {
    const [formData, setFormData] = useState({
        org_name: settings?.org_name || '',
        default_currency: settings?.default_currency || 'USD',
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (settings) {
            setFormData({
                org_name: settings.org_name || '',
                default_currency: settings.default_currency || 'USD',
            });
        }
    }, [settings]);

    if (!isAllowed) {
        return <p>You do not have permission to view or edit these settings.</p>;
    }

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await onUpdate(formData);
            toast.success("Organization settings updated.");
        } catch (error) {
            toast.error("Failed to update organization settings.");
            console.error(error);
        }
        setIsSaving(false);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Organization</CardTitle>
                <CardDescription>Manage your organization's global settings.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div>
                    <Label htmlFor="org_name">Organization Name</Label>
                    <Input id="org_name" value={formData.org_name} onChange={e => setFormData({...formData, org_name: e.target.value})} />
                </div>
                <div>
                    <Label htmlFor="default_currency">Default Currency</Label>
                    <Select value={formData.default_currency} onValueChange={value => setFormData({...formData, default_currency: value})}>
                        <SelectTrigger id="default_currency"><SelectValue /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="USD">USD - US Dollar</SelectItem>
                            <SelectItem value="EUR">EUR - Euro</SelectItem>
                            <SelectItem value="GBP">GBP - British Pound</SelectItem>
                        </SelectContent>
                    </Select>
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

export default function GlobalSettingsPage() {
  const [user, setUser] = useState(null);
  const [orgSettings, setOrgSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
        const currentUser = await User.me();
        setUser(currentUser);

        const settingsList = await OrgSettings.list();
        if (settingsList.length > 0) {
            setOrgSettings(settingsList[0]);
        } else if (currentUser.role === 'admin') {
            // Create default settings if none exist and user is admin
            const newSettings = await OrgSettings.create({ org_name: `${currentUser.full_name}'s Org` });
            setOrgSettings(newSettings);
        }
    } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Could not load settings data.");
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);
  
  const handleUserUpdate = async (updates) => {
    await User.updateMyUserData(updates);
    setUser(prev => ({...prev, ...updates}));
  };
  
  const handleOrgUpdate = async (updates) => {
    if (orgSettings) {
        await OrgSettings.update(orgSettings.id, updates);
        setOrgSettings(prev => ({...prev, ...updates}));
    }
  };

  if (isLoading) {
    return <div className="p-8 flex items-center justify-center h-full"><Loader2 className="w-8 h-8 animate-spin" /></div>;
  }

  const isOrgAdmin = user?.role === 'admin';

  return (
    <div className="p-4 sm:p-6 md:p-8 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Global Settings</h1>
      <Tabs defaultValue="personal" className="w-full">
        <TabsList>
          <TabsTrigger value="personal"><UserIcon className="w-4 h-4 mr-2" />Personal</TabsTrigger>
          <TabsTrigger value="organization" disabled={!isOrgAdmin}><Building className="w-4 h-4 mr-2" />Organization</TabsTrigger>
          <TabsTrigger value="branding" disabled={true}><Palette className="w-4 h-4 mr-2" />Branding</TabsTrigger>
        </TabsList>
        <TabsContent value="personal" className="mt-4">
            {user && <PersonalSettingsTab user={user} onUpdate={handleUserUpdate} />}
        </TabsContent>
        <TabsContent value="organization" className="mt-4">
            <OrganizationSettingsTab settings={orgSettings} onUpdate={handleOrgUpdate} isAllowed={isOrgAdmin} />
        </TabsContent>
      </Tabs>
    </div>
  );
}