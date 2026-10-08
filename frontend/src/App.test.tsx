import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';

describe('App Component', () => {
  it('renders the heading', () => {
    render(<App />);
    const heading = screen.getByRole('heading', { name: /portfolio frontend/i });
    expect(heading).toBeInTheDocument();
  });
});
