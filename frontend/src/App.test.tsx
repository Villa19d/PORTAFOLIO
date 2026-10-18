import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AppProviders } from './components/AppProviders';
import '@testing-library/jest-dom';

describe('App Component', () => {
  it('renders the main content landmark', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>
    );
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('renders the navigation', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>
    );
    expect(screen.getByRole('navigation')).toBeInTheDocument();
  });
});
