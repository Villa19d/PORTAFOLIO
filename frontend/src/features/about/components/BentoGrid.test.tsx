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

  it('renders tiles without variants when entrance motion is skipped (About must stay visible)', () => {
    const { container } = render(
      <I18nextProvider i18n={i18n}>
        <BentoGrid>
          <BentoTile label="Intro tile">
            <p>Profile intro</p>
          </BentoTile>
        </BentoGrid>
      </I18nextProvider>,
    );

    // The wrapper must not carry variants when skipEntrance is true; otherwise
    // descendants can inherit a `hidden` state and the section renders empty.
    const group = container.querySelector('[role="group"]');
    expect(group).not.toBeNull();
    expect(group?.querySelector('[style*="opacity: 0"]')).toBeNull();

    const tile = screen.getByRole('region', { name: 'Intro tile' });
    // Motion stores variants in an internal prop; the DOM should have no
    // leftover transform/opacity from an unresolved variant.
    expect(tile.style.opacity === '' || tile.style.opacity === '1').toBe(true);
  });
});