import { act, cleanup, render, screen } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import { afterEach, describe, expect, it, vi } from 'vitest';
import i18n from '../../../lib/i18n';
import { LocationTile } from './LocationTile';

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('LocationTile', () => {
  it('formats the injected clock in the injected timezone and updates each minute', () => {
    vi.useFakeTimers();
    let currentDate = new Date('2025-01-01T12:00:00.000Z');
    const clock = () => currentDate;

    render(
      <I18nextProvider i18n={i18n}>
        <LocationTile clock={clock} timeZone="America/Mexico_City" />
      </I18nextProvider>,
    );

    expect(screen.getByText('06:00')).toBeInTheDocument();
    currentDate = new Date('2025-01-01T13:00:00.000Z');
    act(() => {
      vi.advanceTimersByTime(60_000);
    });
    expect(screen.getByText('07:00')).toBeInTheDocument();
  });
});
