import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Editor from './Editor';

describe('Editor Component', () => {
  const defaultProps = {
    audioId: 'test-audio-id',
    title: 'Awesome Beats Track',
    duration: 120, // 2 minutes
    onConvert: vi.fn(),
    isConverting: false,
    onBack: vi.fn()
  };

  it('renders track details and UI elements correctly', () => {
    render(<Editor {...defaultProps} />);
    
    expect(screen.getByText('Awesome Beats Track')).toBeInTheDocument();
    expect(screen.getByText('Original Duration: 2:00.00')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Back to URL' })).toBeInTheDocument();
    expect(screen.getByText('Export Ringtone (.m4r)')).toBeInTheDocument();
  });

  it('renders numeric inputs for trim start and end times', () => {
    render(<Editor {...defaultProps} />);
    
    const startInput = screen.getByLabelText('Start (s)');
    const endInput = screen.getByLabelText('End (s)');
    
    expect(startInput).toBeInTheDocument();
    expect(endInput).toBeInTheDocument();
  });

  it('calls onConvert with current parameters when export is clicked', async () => {
    const mockConvert = vi.fn();
    render(<Editor {...defaultProps} onConvert={mockConvert} />);
    
    // Simulating clicking generate
    const exportButton = screen.getByRole('button', { name: 'Export Ringtone (.m4r)' });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockConvert).toHaveBeenCalledWith({
        id: 'test-audio-id',
        start: 0,
        duration: 30, // Default duration end - start (30 - 0)
        volume: 1.0,
        fadeIn: 2.0,
        fadeOut: 2.0
      });
    });
  });

  it('restricts conversion click when processing', () => {
    render(<Editor {...defaultProps} isConverting={true} />);
    
    const exportButton = screen.getByRole('button', { name: 'Processing Ringtone on Server...' });
    expect(exportButton).toBeDisabled();
  });
});
