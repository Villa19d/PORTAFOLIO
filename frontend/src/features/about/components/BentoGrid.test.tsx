import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import { BentoGrid } from './BentoGrid';
import { BentoTile } from './BentoTile';

const motionState = vi.hoisted(() => ({ prefersReducedMotion: true }));

vi.mock('motion/react', async (importOriginal) => {
  const actual = await importOriginal<typeof import('motion/react')>();

  return {
    ...actual,
    useReducedMotion: () => motionState.prefersReducedMotion,
  };
});

afterEach(() => {
  cleanup();
});

describe('BentoGrid motion preferences', () => {
  it('does not hide tiles for the reveal animation when reduced motion is preferred', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <BentoGrid>
          <BentoTile label="Intro tile">
            <p>Profile intro</p>
          </BentoTile>
        </BentoGrid>
      </I18nextProvider>,
    );

    const tile = screen.getByRole('region', { name: 'Intro tile' });
    expect(tile.style.opacity).not.toBe('0');
    expect(tile.style.transform).not.toContain('12px');
  });
});
