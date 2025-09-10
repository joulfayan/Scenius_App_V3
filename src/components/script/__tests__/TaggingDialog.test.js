import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TaggingDialog from '../TaggingDialog';

// Mock the API entities
jest.mock('@/api/entities', () => ({
  ProductionElement: {
    create: jest.fn(),
    filter: jest.fn()
  },
  Actor: {
    filter: jest.fn()
  }
}));

// Mock toast
jest.mock('sonner', () => ({
  toast: {
    success: jest.fn(),
    error: jest.fn()
  }
}));

describe('TaggingDialog', () => {
  const mockProps = {
    isOpen: true,
    onClose: jest.fn(),
    selectedText: 'John',
    projectId: 'test-project',
    sceneId: 'test-scene',
    onElementCreated: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders dialog when open', () => {
    render(<TaggingDialog {...mockProps} />);
    
    expect(screen.getByText('Tag Production Element')).toBeInTheDocument();
    expect(screen.getByText('Create or link a production element for: "John"')).toBeInTheDocument();
  });

  it('pre-fills element name with selected text', () => {
    render(<TaggingDialog {...mockProps} />);
    
    const nameInput = screen.getByDisplayValue('John');
    expect(nameInput).toBeInTheDocument();
  });

  it('shows element type options', () => {
    render(<TaggingDialog {...mockProps} />);
    
    expect(screen.getByText('Character')).toBeInTheDocument();
    expect(screen.getByText('Prop')).toBeInTheDocument();
    expect(screen.getByText('Costume')).toBeInTheDocument();
  });

  it('allows creating new element', async () => {
    const { ProductionElement } = require('@/api/entities');
    ProductionElement.create.mockResolvedValue({ id: 'new-element' });

    render(<TaggingDialog {...mockProps} />);
    
    const createButton = screen.getByText('Create Element');
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(ProductionElement.create).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel is clicked', () => {
    render(<TaggingDialog {...mockProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockProps.onClose).toHaveBeenCalled();
  });
});
