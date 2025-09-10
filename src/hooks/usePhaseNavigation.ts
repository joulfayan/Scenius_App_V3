import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function usePhaseNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentPhase, setCurrentPhase] = useState<string>('write');

  // Initialize phase from URL on mount
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);
    const phaseFromUrl = searchParams.get('phase');
    if (phaseFromUrl) {
      setCurrentPhase(phaseFromUrl);
    }
  }, [location.search]);

  const setPhase = (phase: string) => {
    setCurrentPhase(phase);
    
    // Update URL with phase parameter
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('phase', phase);
    
    // Preserve existing view parameter if it exists
    const currentView = searchParams.get('view');
    if (currentView) {
      searchParams.set('view', currentView);
    }
    
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  const setPhaseAndView = (phase: string, view: string) => {
    setCurrentPhase(phase);
    
    // Update URL with both phase and view parameters
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('phase', phase);
    searchParams.set('view', view);
    
    navigate(`${location.pathname}?${searchParams.toString()}`, { replace: true });
  };

  const getCurrentView = () => {
    const searchParams = new URLSearchParams(location.search);
    return searchParams.get('view');
  };

  const clearPhase = () => {
    setCurrentPhase('write');
    
    // Remove phase parameter from URL
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete('phase');
    
    const newUrl = searchParams.toString() 
      ? `${location.pathname}?${searchParams.toString()}`
      : location.pathname;
    
    navigate(newUrl, { replace: true });
  };

  return {
    currentPhase,
    setPhase,
    setPhaseAndView,
    getCurrentView,
    clearPhase
  };
}
