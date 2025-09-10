import { useState, useEffect, useRef } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase.client';

export interface PresenceUser {
  uid: string;
  displayName: string;
  lastSeen: Timestamp;
  cursor?: {
    x: number;
    y: number;
    page: string;
  };
}

export interface PresenceData {
  [uid: string]: PresenceUser;
}

/**
 * Hook for managing user presence in a project
 * @param projectId - The project ID to track presence for
 * @returns Object with online users and presence management functions
 */
export function usePresence(projectId: string | null) {
  const [onlineUsers, setOnlineUsers] = useState<PresenceUser[]>([]);
  const [isOnline, setIsOnline] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const presenceRef = useRef<() => void>();
  const cleanupRef = useRef<() => void>();

  // Set up presence when user is authenticated and projectId is available
  useEffect(() => {
    if (!projectId) {
      setOnlineUsers([]);
      setIsOnline(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      
      if (user) {
        // User is authenticated, set up presence
        await setupPresence(user, projectId);
      } else {
        // User is not authenticated, clean up presence
        cleanupPresence();
      }
    });

    return () => {
      unsubscribeAuth();
      cleanupPresence();
    };
  }, [projectId]);

  const setupPresence = async (user: User, projectId: string) => {
    if (!user) return;

    const presenceDoc = doc(db, 'projects', projectId, 'presence', user.uid);
    
    // Set user as online
    await setDoc(presenceDoc, {
      uid: user.uid,
      displayName: user.displayName || user.email || 'Anonymous',
      lastSeen: serverTimestamp(),
    });

    setIsOnline(true);

    // Set up real-time listener for online users
    const presenceQuery = query(
      collection(db, 'projects', projectId, 'presence'),
      orderBy('lastSeen', 'desc')
    );

    const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
      const users: PresenceUser[] = [];
      const now = new Date();
      
      snapshot.forEach((doc) => {
        const data = doc.data() as PresenceUser;
        // Only show users who were active in the last 30 seconds
        if (data.lastSeen && data.lastSeen.toDate) {
          const lastSeenDate = data.lastSeen.toDate();
          const timeDiff = now.getTime() - lastSeenDate.getTime();
          if (timeDiff < 30000) { // 30 seconds
            users.push(data);
          }
        }
      });

      setOnlineUsers(users);
    });

    // Store cleanup function
    cleanupRef.current = () => {
      unsubscribe();
    };

    // Set up heartbeat to keep user online
    const heartbeat = setInterval(async () => {
      if (isOnline) {
        await setDoc(presenceDoc, {
          uid: user.uid,
          displayName: user.displayName || user.email || 'Anonymous',
          lastSeen: serverTimestamp(),
        }, { merge: true });
      }
    }, 10000); // Update every 10 seconds

    // Store heartbeat cleanup
    presenceRef.current = () => {
      clearInterval(heartbeat);
    };
  };

  const cleanupPresence = async () => {
    if (currentUser && projectId) {
      const presenceDoc = doc(db, 'projects', projectId, 'presence', currentUser.uid);
      await deleteDoc(presenceDoc);
    }
    
    if (presenceRef.current) {
      presenceRef.current();
      presenceRef.current = undefined;
    }
    
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = undefined;
    }
    
    setIsOnline(false);
    setOnlineUsers([]);
  };

  const updateCursor = async (cursor: { x: number; y: number; page: string }) => {
    if (!currentUser || !projectId || !isOnline) return;

    const presenceDoc = doc(db, 'projects', projectId, 'presence', currentUser.uid);
    await setDoc(presenceDoc, {
      uid: currentUser.uid,
      displayName: currentUser.displayName || currentUser.email || 'Anonymous',
      lastSeen: serverTimestamp(),
      cursor,
    }, { merge: true });
  };

  const goOffline = async () => {
    await cleanupPresence();
  };

  const goOnline = async () => {
    if (currentUser && projectId) {
      await setupPresence(currentUser, projectId);
    }
  };

  return {
    onlineUsers,
    isOnline,
    currentUser,
    updateCursor,
    goOffline,
    goOnline,
  };
}
