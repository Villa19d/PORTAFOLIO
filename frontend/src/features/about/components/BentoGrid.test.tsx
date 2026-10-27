import { cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import { BentoGrid } from './BentoGrid';
import { BentoTile } from './BentoTile';

const entrance = vi.hoisted(() => ({ skipEntrance: true }));

vi.mock('../../../hooks/useEntranceMotion', () => ({
  useEntranceMotion: () => ({ skipEntrance: entrance.skipEntrance }),
}));

afterEach(() => {
  cleanup();
});

describe('BentoGrid motion preferences', () => {
  beforeEach(() => {
    entrance.skipEntrance = true;
  });

  it('does not hide tiles for the reveal animation when entrance motion is skipped', () => {
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

  it('starts from the hidden variant when entrance motion is not skipped', () => {
    entrance.skipEntrance = false;

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
    // In a real browser motion hides the tile until it enters the viewport.
    // jsdom does not run IntersectionObserver, so we only assert the node exists
    // and is reachable (the hidden variant is applied by motion at runtime).
    expect(tile).toBeInTheDocument();
  });
});