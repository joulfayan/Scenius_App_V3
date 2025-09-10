import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import CatalogManager from '../CatalogManager';

// Mock the hooks
jest.mock('@/hooks/useProductionElements', () => ({
  useProductionElements: () => ({
    elements: [
      {
        id: '1',
        name: 'Test Character',
        type: 'character',
        description: 'Main character',
        linked_scenes: ['scene1'],
        linked_actor_id: 'actor1'
      }
    ],
    actors: [
      {
        id: 'actor1',
        name: 'John Doe',
        role: 'Lead Actor'
      }
    ],
    isLoading: false,
    createElement: jest.fn(),
    updateElement: jest.fn(),
    deleteElement: jest.fn(),
    createActor: jest.fn(),
    updateActor: jest.fn(),
    deleteActor: jest.fn()
  })
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('CatalogManager', () => {
  const mockProps = {
    projectId: 'test-project'
  };

  it('renders catalog manager', () => {
    render(<CatalogManager {...mockProps} />);
    
    expect(screen.getByText('Production Catalog')).toBeInTheDocument();
    expect(screen.getByText('Manage production elements and character→actor links')).toBeInTheDocument();
  });

  it('shows elements in table', () => {
    render(<CatalogManager {...mockProps} />);
    
    expect(screen.getByText('Test Character')).toBeInTheDocument();
    expect(screen.getByText('Main character')).toBeInTheDocument();
  });

  it('shows add element button', () => {
    render(<CatalogManager {...mockProps} />);
    
    expect(screen.getByText('Add Element')).toBeInTheDocument();
  });

  it('shows search input', () => {
    render(<CatalogManager {...mockProps} />);
    
    expect(screen.getByPlaceholderText('Search elements...')).toBeInTheDocument();
  });

  it('shows filter dropdowns', () => {
    render(<CatalogManager {...mockProps} />);
    
    expect(screen.getByText('All Types')).toBeInTheDocument();
    expect(screen.getByText('All Elements')).toBeInTheDocument();
  });
});
