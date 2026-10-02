import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AuthView } from '../components/AuthView';

describe('AuthView', () => {
  it('renders sign in mode with Google and email options', () => {
    render(
      <AuthView
        initialMode="login"
        onAuthSuccess={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    expect(screen.getByRole('heading', { name: 'Sign In to Workspace' })).toBeInTheDocument();
    expect(screen.getByText('Continue with Google')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('researcher@university.edu')).toBeInTheDocument();
  });

  it('switches to create account mode with full name field', () => {
    render(
      <AuthView
        initialMode="login"
        onAuthSuccess={vi.fn()}
        onNavigate={vi.fn()}
      />
    );

    const createTab = screen.getByRole('button', { name: 'Create Account' });
    fireEvent.click(createTab);

    expect(screen.getByPlaceholderText(/Dr\. Eleanor Vance/i)).toBeInTheDocument();
  });
});
