import { useState, useEffect, useCallback } from 'react';
import { ProductionElement, Actor } from '@/api/entities';

export const useProductionElements = (projectId) => {
  const [elements, setElements] = useState([]);
  const [actors, setActors] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load production elements
  const loadElements = useCallback(async () => {
    if (!projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const fetchedElements = await ProductionElement.filter(
        { project_id: projectId }, 
        '-created_date'
      );
      setElements(fetchedElements);
    } catch (err) {
      console.error('Error loading production elements:', err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  // Load actors
  const loadActors = useCallback(async () => {
    if (!projectId) return;
    
    try {
      const fetchedActors = await Actor.filter(
        { project_id: projectId }, 
        '-created_date'
      );
      setActors(fetchedActors);
    } catch (err) {
      console.error('Error loading actors:', err);
    }
  }, [projectId]);

  // Create new element
  const createElement = useCallback(async (elementData) => {
    try {
      const newElement = await ProductionElement.create({
        ...elementData,
        project_id: projectId
      });
      
      setElements(prev => [newElement, ...prev]);
      return newElement;
    } catch (err) {
      console.error('Error creating production element:', err);
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  // Update element
  const updateElement = useCallback(async (elementId, updates) => {
    try {
      const updatedElement = await ProductionElement.update(elementId, updates);
      
      setElements(prev => 
        prev.map(element => 
          element.id === elementId ? updatedElement : element
        )
      );
      return updatedElement;
    } catch (err) {
      console.error('Error updating production element:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete element
  const deleteElement = useCallback(async (elementId) => {
    try {
      await ProductionElement.delete(elementId);
      
      setElements(prev => prev.filter(element => element.id !== elementId));
      return true;
    } catch (err) {
      console.error('Error deleting production element:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Link element to scene
  const linkElementToScene = useCallback(async (elementId, sceneId) => {
    try {
      const element = elements.find(e => e.id === elementId);
      if (!element) throw new Error('Element not found');
      
      const linkedScenes = [...(element.linked_scenes || []), sceneId];
      return await updateElement(elementId, { linked_scenes: linkedScenes });
    } catch (err) {
      console.error('Error linking element to scene:', err);
      setError(err.message);
      throw err;
    }
  }, [elements, updateElement]);

  // Unlink element from scene
  const unlinkElementFromScene = useCallback(async (elementId, sceneId) => {
    try {
      const element = elements.find(e => e.id === elementId);
      if (!element) throw new Error('Element not found');
      
      const linkedScenes = (element.linked_scenes || []).filter(id => id !== sceneId);
      return await updateElement(elementId, { linked_scenes: linkedScenes });
    } catch (err) {
      console.error('Error unlinking element from scene:', err);
      setError(err.message);
      throw err;
    }
  }, [elements, updateElement]);

  // Get elements by type
  const getElementsByType = useCallback((type) => {
    return elements.filter(element => element.type === type);
  }, [elements]);

  // Get elements by scene
  const getElementsByScene = useCallback((sceneId) => {
    return elements.filter(element => 
      element.linked_scenes?.includes(sceneId)
    );
  }, [elements]);

  // Search elements
  const searchElements = useCallback((query) => {
    const lowercaseQuery = query.toLowerCase();
    return elements.filter(element => 
      element.name.toLowerCase().includes(lowercaseQuery) ||
      element.description?.toLowerCase().includes(lowercaseQuery)
    );
  }, [elements]);

  // Create actor
  const createActor = useCallback(async (actorData) => {
    try {
      const newActor = await Actor.create({
        ...actorData,
        project_id: projectId
      });
      
      setActors(prev => [newActor, ...prev]);
      return newActor;
    } catch (err) {
      console.error('Error creating actor:', err);
      setError(err.message);
      throw err;
    }
  }, [projectId]);

  // Update actor
  const updateActor = useCallback(async (actorId, updates) => {
    try {
      const updatedActor = await Actor.update(actorId, updates);
      
      setActors(prev => 
        prev.map(actor => 
          actor.id === actorId ? updatedActor : actor
        )
      );
      return updatedActor;
    } catch (err) {
      console.error('Error updating actor:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Delete actor
  const deleteActor = useCallback(async (actorId) => {
    try {
      await Actor.delete(actorId);
      
      setActors(prev => prev.filter(actor => actor.id !== actorId));
      return true;
    } catch (err) {
      console.error('Error deleting actor:', err);
      setError(err.message);
      throw err;
    }
  }, []);

  // Load data on mount
  useEffect(() => {
    loadElements();
    loadActors();
  }, [loadElements, loadActors]);

  return {
    // Elements
    elements,
    isLoading,
    error,
    loadElements,
    createElement,
    updateElement,
    deleteElement,
    linkElementToScene,
    unlinkElementFromScene,
    getElementsByType,
    getElementsByScene,
    searchElements,
    
    // Actors
    actors,
    createActor,
    updateActor,
    deleteActor
  };
};
