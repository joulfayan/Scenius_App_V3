import React from 'react';
import { render, screen } from '@testing-library/react';
import VersionHistory from '../VersionHistory';

// Mock versions data
const mockVersions = [
  {
    id: '1',
    revision_number: 'v1',
    created_date: '2024-01-01T10:00:00Z',
    notes: 'Initial version',
    is_current: false
  },
  {
    id: '2',
    revision_number: 'v2',
    created_date: '2024-01-02T10:00:00Z',
    notes: 'Added new scenes',
    is_current: true
  }
];

const mockCurrentVersion = mockVersions[1];

describe('VersionHistory', () => {
  it('renders version history', () => {
    render(
      <VersionHistory
        versions={mockVersions}
        currentVersion={mockCurrentVersion}
        onRestoreVersion={() => {}}
        onDeleteVersion={() => {}}
        onDownloadVersion={() => {}}
      />
    );
    
    expect(screen.getByText('Version History')).toBeInTheDocument();
    expect(screen.getByText('2 versions')).toBeInTheDocument();
  });

  it('shows current version', () => {
    render(
      <VersionHistory
        versions={mockVersions}
        currentVersion={mockCurrentVersion}
        onRestoreVersion={() => {}}
        onDeleteVersion={() => {}}
        onDownloadVersion={() => {}}
      />
    );
    
    expect(screen.getByText('v2')).toBeInTheDocument();
    expect(screen.getByText('Current')).toBeInTheDocument();
  });

  it('displays version notes', () => {
    render(
      <VersionHistory
        versions={mockVersions}
        currentVersion={mockCurrentVersion}
        onRestoreVersion={() => {}}
        onDeleteVersion={() => {}}
        onDownloadVersion={() => {}}
      />
    );
    
    expect(screen.getByText('Added new scenes')).toBeInTheDocument();
  });
});
