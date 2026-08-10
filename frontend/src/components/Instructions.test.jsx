import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Instructions from './Instructions';

describe('Instructions Component', () => {
  it('renders instructions structure correctly', () => {
    render(<Instructions />);
    
    expect(screen.getByText(/How to Install custom Ringtone on your iPhone/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /GarageBand/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Finder/ })).toBeInTheDocument();
  });

  it('defaults to GarageBand method and displays its instructions', () => {
    render(<Instructions />);
    
    expect(screen.getByText(/This method uses the free Apple/)).toBeInTheDocument();
    expect(screen.getByText(/Open Loop Browser:/)).toBeInTheDocument();
    expect(screen.queryByText(/On macOS/)).not.toBeInTheDocument();
  });

  it('switches tabs and displays Finder/iTunes instructions', () => {
    render(<Instructions />);
    
    const computerTab = screen.getByRole('button', { name: /Finder/ });
    fireEvent.click(computerTab);

    expect(screen.queryByText(/Open Loop Browser:/)).not.toBeInTheDocument();
    expect(screen.getByText(/On Windows PC/)).toBeInTheDocument();
    expect(screen.getByText(/Finder window showing your iPhone screen/)).toBeInTheDocument();
  });
});
