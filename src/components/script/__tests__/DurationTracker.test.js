import React from 'react';
import { render, screen } from '@testing-library/react';
import DurationTracker from '../DurationTracker';

// Mock script document
const mockScriptDoc = {
  lines: [
    { id: '1', type: 'scene', text: 'INT. LIVING ROOM - DAY' },
    { id: '2', type: 'action', text: 'John sits on the couch, looking at his phone.' },
    { id: '3', type: 'character', text: 'JOHN' },
    { id: '4', type: 'dialogue', text: 'I need to figure this out.' },
    { id: '5', type: 'scene', text: 'EXT. STREET - NIGHT' },
    { id: '6', type: 'action', text: 'John walks down the empty street.' },
    { id: '7', type: 'character', text: 'JOHN' },
    { id: '8', type: 'dialogue', text: 'This is getting complicated.' }
  ]
};

describe('DurationTracker', () => {
  it('renders duration information', () => {
    render(<DurationTracker scriptDoc={mockScriptDoc} currentMode="film_tv" />);
    
    expect(screen.getByText('Total Duration')).toBeInTheDocument();
    expect(screen.getByText('Scene Breakdown')).toBeInTheDocument();
  });

  it('calculates scene durations correctly', () => {
    render(<DurationTracker scriptDoc={mockScriptDoc} currentMode="film_tv" />);
    
    // Should show 2 scenes
    expect(screen.getByText('2 scenes')).toBeInTheDocument();
  });

  it('shows live indicator when enabled', () => {
    render(<DurationTracker scriptDoc={mockScriptDoc} currentMode="film_tv" isLive={true} />);
    
    expect(screen.getByText('Live')).toBeInTheDocument();
  });
});
