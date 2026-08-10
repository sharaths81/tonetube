import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UrlInput from './UrlInput';

describe('UrlInput Component', () => {
  it('renders the form elements correctly', () => {
    render(<UrlInput onSubmit={vi.fn()} isLoading={false} />);
    
    expect(screen.getByText('Convert YouTube to Ringtone')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('https://www.youtube.com/watch?v=...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Extract Audio & Edit' })).toBeInTheDocument();
  });

  it('shows validation error for empty submission', async () => {
    render(<UrlInput onSubmit={vi.fn()} isLoading={false} />);
    
    const submitButton = screen.getByRole('button', { name: 'Extract Audio & Edit' });
    fireEvent.click(submitButton);

    expect(await screen.findByText('URL is required')).toBeInTheDocument();
  });

  it('shows validation error for non-YouTube URLs', async () => {
    render(<UrlInput onSubmit={vi.fn()} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
    fireEvent.change(input, { target: { value: 'https://google.com' } });
    
    const submitButton = screen.getByRole('button', { name: 'Extract Audio & Edit' });
    fireEvent.click(submitButton);

    expect(await screen.findByText(/Please enter a valid YouTube URL/)).toBeInTheDocument();
  });

  it('calls onSubmit with normalized URL on valid submission', async () => {
    const mockSubmit = vi.fn();
    render(<UrlInput onSubmit={mockSubmit} isLoading={false} />);
    
    const input = screen.getByPlaceholderText('https://www.youtube.com/watch?v=...');
    fireEvent.change(input, { target: { value: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' } });
    
    const submitButton = screen.getByRole('button', { name: 'Extract Audio & Edit' });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });
  });

  it('shows loading state when isLoading is true', () => {
    render(<UrlInput onSubmit={vi.fn()} isLoading={true} />);
    expect(screen.getByText('Analyzing Video...')).toBeInTheDocument();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
