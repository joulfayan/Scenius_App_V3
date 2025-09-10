import React, { useState } from 'react';
import { Users, ChevronDown, ChevronUp } from 'lucide-react';
import { PresenceUser } from '../../hooks/usePresence';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator
} from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';

interface OnlineMembersProps {
  onlineUsers: PresenceUser[];
  currentUserId?: string;
  className?: string;
}

export function OnlineMembers({ onlineUsers, currentUserId, className = '' }: OnlineMembersProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Filter out current user from the list
  const otherUsers = onlineUsers.filter(user => user.uid !== currentUserId);
  const totalOnline = onlineUsers.length;

  if (totalOnline === 0) {
    return null;
  }

  const getInitials = (displayName: string) => {
    return displayName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (lastSeen: any) => {
    if (!lastSeen) return 'bg-gray-400';
    
    const now = new Date();
    const lastSeenDate = lastSeen.toDate ? lastSeen.toDate() : new Date(lastSeen);
    const timeDiff = now.getTime() - lastSeenDate.getTime();
    
    if (timeDiff < 5000) return 'bg-green-500'; // Very recent (5 seconds)
    if (timeDiff < 15000) return 'bg-yellow-500'; // Recent (15 seconds)
    return 'bg-gray-400'; // Older
  };

  return (
    <div className={`flex items-center ${className}`}>
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors border border-blue-200">
            <div className="flex items-center -space-x-1">
              {otherUsers.slice(0, 3).map((user, index) => (
                <Avatar key={user.uid} className="w-6 h-6 border-2 border-white">
                  <AvatarFallback className="text-xs bg-blue-100 text-blue-700">
                    {getInitials(user.displayName)}
                  </AvatarFallback>
                </Avatar>
              ))}
              {otherUsers.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs text-gray-600 font-medium">
                    +{otherUsers.length - 3}
                  </span>
                </div>
              )}
            </div>
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-700">
                {totalOnline}
              </span>
              {isOpen ? (
                <ChevronUp className="w-4 h-4 text-blue-600" />
              ) : (
                <ChevronDown className="w-4 h-4 text-blue-600" />
              )}
            </div>
          </button>
        </DropdownMenuTrigger>
        
        <DropdownMenuContent align="end" className="w-64">
          <div className="px-3 py-2 border-b">
            <h3 className="font-semibold text-sm text-gray-900">Online Members</h3>
            <p className="text-xs text-gray-500">
              {totalOnline} member{totalOnline !== 1 ? 's' : ''} online
            </p>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {onlineUsers.map((user) => (
              <DropdownMenuItem key={user.uid} className="flex items-center gap-3 p-3">
                <div className="relative">
                  <Avatar className="w-8 h-8">
                    <AvatarFallback className="text-sm bg-blue-100 text-blue-700">
                      {getInitials(user.displayName)}
                    </AvatarFallback>
                  </Avatar>
                  <div 
                    className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(user.lastSeen)}`}
                  />
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900 truncate">
                      {user.displayName}
                    </span>
                    {user.uid === currentUserId && (
                      <Badge variant="secondary" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  
                  {user.cursor && (
                    <p className="text-xs text-gray-500 truncate">
                      On {user.cursor.page}
                    </p>
                  )}
                  
                  <p className="text-xs text-gray-400">
                    {user.lastSeen && user.lastSeen.toDate ? (
                      (() => {
                        const now = new Date();
                        const lastSeenDate = user.lastSeen.toDate();
                        const timeDiff = now.getTime() - lastSeenDate.getTime();
                        
                        if (timeDiff < 5000) return 'Just now';
                        if (timeDiff < 60000) return `${Math.floor(timeDiff / 1000)}s ago`;
                        if (timeDiff < 3600000) return `${Math.floor(timeDiff / 60000)}m ago`;
                        return lastSeenDate.toLocaleTimeString();
                      })()
                    ) : 'Unknown'}
                  </p>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
