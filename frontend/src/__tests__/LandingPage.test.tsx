import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { LandingPage } from '../components/LandingPage';

describe('LandingPage', () => {
  it('renders editorial masthead headline and call to action', () => {
    render(
      <MemoryRouter>
        <LandingPage
          onNavigate={vi.fn()}
          isAuthenticated={false}
        />
      </MemoryRouter>
    );

    expect(screen.getByText(/Autonomous Investigation/i)).toBeInTheDocument();
    expect(screen.getByText('Enter Research Desk')).toBeInTheDocument();
    expect(screen.getByText('The Four-Stage Autonomous Pipeline')).toBeInTheDocument();
    expect(screen.getByText('Scoper Agent')).toBeInTheDocument();
  });
});
