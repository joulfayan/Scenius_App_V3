import React, { useState, useEffect, useCallback } from 'react';
import { ProjectMember, ProjectInvite, ResourcePermission, TeamActivity, User } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Crown, 
  Eye, 
  Edit, 
  Trash2, 
  Clock, 
  CheckCircle2,
  AlertCircle,
  Activity,
  Settings
} from 'lucide-react';
import { toast } from "sonner";

const ROLE_CONFIG = {
  owner: { label: 'Owner', icon: Crown, color: 'text-yellow-600', bgColor: 'bg-yellow-100' },
  admin: { label: 'Admin', icon: Shield, color: 'text-purple-600', bgColor: 'bg-purple-100' },
  editor: { label: 'Editor', icon: Edit, color: 'text-blue-600', bgColor: 'bg-blue-100' },
  viewer: { label: 'Viewer', icon: Eye, color: 'text-green-600', bgColor: 'bg-green-100' },
  guest: { label: 'Guest', icon: Users, color: 'text-gray-600', bgColor: 'bg-gray-100' }
};

const RESOURCES = [
  { key: 'script', label: 'Script' },
  { key: 'breakdown', label: 'Breakdown' },
  { key: 'catalog', label: 'Catalog' },
  { key: 'shotlist', label: 'Shot List' },
  { key: 'schedule', label: 'Schedule' },
  { key: 'cast_crew', label: 'Cast & Crew' },
  { key: 'budget', label: 'Budget' },
  { key: 'callsheets', label: 'Call Sheets' },
  { key: 'storyboard', label: 'Storyboard' },
  { key: 'moodboard', label: 'Mood Board' },
  { key: 'reports', label: 'Reports' }
];

export default function TeamManager({ projectId }) {
  const [members, setMembers] = useState([]);
  const [invites, setInvites] = useState([]);
  const [activities, setActivities] = useState([]);
  const [permissions, setPermissions] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [currentUserRole, setCurrentUserRole] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('viewer');

  const loadTeamData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [
        fetchedMembers,
        fetchedInvites,
        fetchedActivities,
        fetchedPermissions,
        user
      ] = await Promise.all([
        ProjectMember.filter({ project_id: projectId }, '-joined_date'),
        ProjectInvite.filter({ project_id: projectId, status: 'pending' }, '-created_date'),
        TeamActivity.filter({ project_id: projectId }, '-timestamp', 20),
        ResourcePermission.filter({ project_id: projectId }),
        User.me()
      ]);

      setMembers(fetchedMembers);
      setInvites(fetchedInvites);
      setActivities(fetchedActivities);
      setPermissions(fetchedPermissions);
      setCurrentUser(user);
      
      const userMember = fetchedMembers.find(m => m.user_id === user.id);
      setCurrentUserRole(userMember?.role);
    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Failed to load team data');
    }
    setIsLoading(false);
  }, [projectId]);

  useEffect(() => {
    loadTeamData();
  }, [loadTeamData]);

  const canManageTeam = () => {
    return currentUserRole === 'owner' || currentUserRole === 'admin';
  };

  const handleInviteMember = async () => {
    if (!inviteEmail || !inviteRole) return;
    
    try {
      // Generate a unique token
      const token = crypto.randomUUID();
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

      await ProjectInvite.create({
        project_id: projectId,
        email: inviteEmail,
        role: inviteRole,
        token: token,
        invited_by: currentUser.id,
        expires_at: expiresAt
      });

      // Log activity
      await TeamActivity.create({
        project_id: projectId,
        user_id: currentUser.id,
        action: 'member_invited',
        target_email: inviteEmail,
        details: { role: inviteRole },
        timestamp: new Date().toISOString()
      });

      toast.success(`Invitation sent to ${inviteEmail}`);
      setInviteEmail('');
      setInviteRole('viewer');
      setShowInviteDialog(false);
      loadTeamData();
    } catch (error) {
      console.error('Error sending invitation:', error);
      toast.error('Failed to send invitation');
    }
  };

  const handleChangeRole = async (memberId, newRole) => {
    try {
      await ProjectMember.update(memberId, { role: newRole });
      
      const member = members.find(m => m.id === memberId);
      await TeamActivity.create({
        project_id: projectId,
        user_id: currentUser.id,
        action: 'role_changed',
        target_user_id: member.user_id,
        details: { from: member.role, to: newRole },
        timestamp: new Date().toISOString()
      });

      toast.success('Role updated successfully');
      loadTeamData();
    } catch (error) {
      console.error('Error updating role:', error);
      toast.error('Failed to update role');
    }
  };

  const handleRevokeInvite = async (inviteId) => {
    try {
      await ProjectInvite.update(inviteId, { status: 'revoked' });
      
      const invite = invites.find(i => i.id === inviteId);
      await TeamActivity.create({
        project_id: projectId,
        user_id: currentUser.id,
        action: 'invite_revoked',
        target_email: invite.email,
        timestamp: new Date().toISOString()
      });

      toast.success('Invitation revoked');
      loadTeamData();
    } catch (error) {
      console.error('Error revoking invitation:', error);
      toast.error('Failed to revoke invitation');
    }
  };

  const handleTogglePermission = async (userId, resource, currentPermission) => {
    try {
      const existingPermission = permissions.find(
        p => p.user_id === userId && p.resource === resource
      );

      if (existingPermission) {
        if (currentPermission === 'write') {
          // Remove permission (set to read-only via role)
          await ResourcePermission.delete(existingPermission.id);
        } else {
          // Update to write
          await ResourcePermission.update(existingPermission.id, { permission: 'write' });
        }
      } else {
        // Create new write permission
        await ResourcePermission.create({
          project_id: projectId,
          user_id: userId,
          resource: resource,
          permission: 'write',
          granted_by: currentUser.id
        });
      }

      await TeamActivity.create({
        project_id: projectId,
        user_id: currentUser.id,
        action: currentPermission === 'write' ? 'permission_revoked' : 'permission_granted',
        target_user_id: userId,
        details: { resource, permission: currentPermission === 'write' ? 'read' : 'write' },
        timestamp: new Date().toISOString()
      });

      loadTeamData();
    } catch (error) {
      console.error('Error toggling permission:', error);
      toast.error('Failed to update permission');
    }
  };

  const getEffectivePermission = (member, resource) => {
    const rolePermissions = {
      owner: 'write',
      admin: 'write',
      editor: 'write',
      viewer: 'read',
      guest: 'read'
    };

    const specificPermission = permissions.find(
      p => p.user_id === member.user_id && p.resource === resource
    );

    if (specificPermission && specificPermission.permission === 'write') {
      return 'write';
    }

    return rolePermissions[member.role] || 'read';
  };

  const RoleBadge = ({ role }) => {
    const config = ROLE_CONFIG[role];
    const Icon = config.icon;
    
    return (
      <Badge className={`${config.bgColor} ${config.color} border-none`}>
        <Icon className="w-3 h-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const MemberCard = ({ member }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={member.avatar_url} />
              <AvatarFallback>{member.full_name?.charAt(0) || member.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-semibold">{member.full_name || member.email}</p>
              <p className="text-sm text-gray-500">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={member.role} />
            {canManageTeam() && member.role !== 'owner' && (
              <Select
                value={member.role}
                onValueChange={(newRole) => handleChangeRole(member.id, newRole)}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                    key !== 'owner' && (
                      <SelectItem key={key} value={key}>
                        {config.label}
                      </SelectItem>
                    )
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const InviteCard = ({ invite }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              <Mail className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="font-semibold">{invite.email}</p>
              <p className="text-sm text-gray-500">Invited {new Date(invite.created_date).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <RoleBadge role={invite.role} />
            <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
              <Clock className="w-3 h-3 mr-1" />
              Pending
            </Badge>
            {canManageTeam() && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleRevokeInvite(invite.id)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const PermissionsMatrix = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-2 text-xs font-medium text-gray-500 mb-2">
        <div className="col-span-3">Member</div>
        <div className="col-span-1">Role</div>
        {RESOURCES.slice(0, 8).map(resource => (
          <div key={resource.key} className="col-span-1 text-center">{resource.label}</div>
        ))}
      </div>
      
      {members.map(member => (
        <div key={member.id} className="grid grid-cols-12 gap-2 items-center p-2 border rounded-lg">
          <div className="col-span-3 flex items-center gap-2">
            <Avatar className="w-6 h-6">
              <AvatarFallback className="text-xs">{member.full_name?.charAt(0) || member.email?.charAt(0)}</AvatarFallback>
            </Avatar>
            <span className="text-sm truncate">{member.full_name || member.email}</span>
          </div>
          <div className="col-span-1">
            <RoleBadge role={member.role} />
          </div>
          {RESOURCES.slice(0, 8).map(resource => {
            const permission = getEffectivePermission(member, resource.key);
            return (
              <div key={resource.key} className="col-span-1 flex justify-center">
                {canManageTeam() && member.role !== 'owner' ? (
                  <Switch
                    checked={permission === 'write'}
                    onCheckedChange={() => handleTogglePermission(member.user_id, resource.key, permission)}
                    size="sm"
                  />
                ) : (
                  <Badge variant={permission === 'write' ? 'default' : 'secondary'} className="text-xs">
                    {permission === 'write' ? 'W' : 'R'}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );

  const ActivityFeed = () => (
    <ScrollArea className="h-64">
      <div className="space-y-3">
        {activities.map(activity => (
          <div key={activity.id} className="flex items-start gap-3 p-3 border rounded-lg">
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
              <Activity className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm">
                <span className="font-semibold">{activity.user_full_name}</span>
                {' '}
                {activity.action === 'member_invited' && `invited ${activity.target_email} as ${activity.details?.role}`}
                {activity.action === 'role_changed' && `changed ${activity.target_user_name}'s role from ${activity.details?.from} to ${activity.details?.to}`}
                {activity.action === 'permission_granted' && `granted ${activity.details?.permission} access to ${activity.details?.resource} for ${activity.target_user_name}`}
                {activity.action === 'invite_revoked' && `revoked invitation for ${activity.target_email}`}
              </p>
              <p className="text-xs text-gray-500">
                {new Date(activity.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-800">Team</h2>
          <p className="text-gray-600">Manage project members and permissions</p>
        </div>
        {canManageTeam() && (
          <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite Team Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to collaborate on this project
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Email Address</Label>
                  <Input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="colleague@example.com"
                  />
                </div>
                <div>
                  <Label>Role</Label>
                  <Select value={inviteRole} onValueChange={setInviteRole}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(ROLE_CONFIG).map(([key, config]) => (
                        key !== 'owner' && (
                          <SelectItem key={key} value={key}>
                            {config.label}
                          </SelectItem>
                        )
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleInviteMember} disabled={!inviteEmail}>
                    Send Invitation
                  </Button>
                  <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          {invites.length > 0 && (
            <TabsTrigger value="invites">Pending Invites ({invites.length})</TabsTrigger>
          )}
          {canManageTeam() && (
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
          )}
          <TabsTrigger value="activity">Activity</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-4">
          {members.map(member => (
            <MemberCard key={member.id} member={member} />
          ))}
        </TabsContent>

        <TabsContent value="invites" className="space-y-4">
          {invites.map(invite => (
            <InviteCard key={invite.id} invite={invite} />
          ))}
        </TabsContent>

        {canManageTeam() && (
          <TabsContent value="permissions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Resource Permissions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PermissionsMatrix />
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="activity" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityFeed />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}