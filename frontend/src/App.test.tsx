import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import { AppProviders } from './components/AppProviders';
import '@testing-library/jest-dom';

describe('App Component', () => {
  it('renders the heading', () => {
    render(
      <AppProviders>
        <App />
      </AppProviders>
    );
    const heading = screen.getByRole('heading', { name: /portfolio foundations/i });
    expect(heading).toBeInTheDocument();
  });
});
