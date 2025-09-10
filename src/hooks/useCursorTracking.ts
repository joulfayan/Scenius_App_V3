import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { usePresence } from './usePresence';

interface CursorPosition {
  x: number;
  y: number;
  page: string;
}

/**
 * Hook for tracking cursor position and updating presence
 * @param projectId - The project ID to track cursor for
 * @param enabled - Whether cursor tracking is enabled
 */
export function useCursorTracking(projectId: string | null, enabled: boolean = true) {
  const location = useLocation();
  const { updateCursor, isOnline } = usePresence(projectId);
  const lastUpdateRef = useRef<number>(0);
  const throttledUpdateRef = useRef<CursorPosition | null>(null);

  const throttledUpdate = useCallback(
    (position: CursorPosition) => {
      const now = Date.now();
      const timeSinceLastUpdate = now - lastUpdateRef.current;
      
      // Throttle updates to every 2 seconds
      if (timeSinceLastUpdate >= 2000) {
        updateCursor(position);
        lastUpdateRef.current = now;
        throttledUpdateRef.current = null;
      } else {
        // Store the latest position for the next update
        throttledUpdateRef.current = position;
      }
    },
    [updateCursor]
  );

  const handleMouseMove = useCallback(
    (event: MouseEvent) => {
      if (!enabled || !isOnline || !projectId) return;

      const position: CursorPosition = {
        x: event.clientX,
        y: event.clientY,
        page: location.pathname + location.search,
      };

      throttledUpdate(position);
    },
    [enabled, isOnline, projectId, location.pathname, location.search, throttledUpdate]
  );

  // Set up mouse tracking
  useEffect(() => {
    if (!enabled || !isOnline || !projectId) return;

    document.addEventListener('mousemove', handleMouseMove, { passive: true });

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
    };
  }, [enabled, isOnline, projectId, handleMouseMove]);

  // Update cursor when page changes
  useEffect(() => {
    if (!enabled || !isOnline || !projectId) return;

    const position: CursorPosition = {
      x: 0,
      y: 0,
      page: location.pathname + location.search,
    };

    throttledUpdate(position);
  }, [location.pathname, location.search, enabled, isOnline, projectId, throttledUpdate]);

  // Process any pending throttled updates when component unmounts or dependencies change
  useEffect(() => {
    if (throttledUpdateRef.current) {
      const timeoutId = setTimeout(() => {
        if (throttledUpdateRef.current) {
          updateCursor(throttledUpdateRef.current);
          throttledUpdateRef.current = null;
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [updateCursor]);

  return {
    isTracking: enabled && isOnline && !!projectId,
  };
}
