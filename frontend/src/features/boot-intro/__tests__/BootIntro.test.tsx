import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BootIntro } from '../BootIntro';
import { BootIntroLauncher } from '../BootIntroLauncher';

const originalMatchMedia = window.matchMedia;
const originalConnection = Object.getOwnPropertyDescriptor(Navigator.prototype, 'connection');

function setMediaQuery(query: string, matches: boolean) {
  window.matchMedia = vi.fn().mockImplementation((value: string) => ({
    matches: value === query ? matches : false,
    media: value,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

function setConnection(connection: { saveData?: boolean; effectiveType?: string } | undefined) {
  Object.defineProperty(navigator, 'connection', {
    configurable: true,
    value: connection,
  });
}

function renderLauncher() {
  return render(<BootIntroLauncher />);
}

function dispatchLoadAndIdle() {
  window.dispatchEvent(new Event('load'));
  vi.runOnlyPendingTimers();
}

describe('BootIntro bypass rules', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    sessionStorage.clear();
    document.documentElement.removeAttribute('data-perf');
    window.history.replaceState({}, '', '/');
    setMediaQuery('', false);
    setConnection(undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    window.matchMedia = originalMatchMedia;
    if (originalConnection) {
      Object.defineProperty(Navigator.prototype, 'connection', originalConnection);
    } else {
      delete (navigator as Navigator & { connection?: unknown }).connection;
    }
  });

  it('mounts once, marks the session, and unmounts after the intro completes', async () => {
    renderLauncher();
    await act(async () => {
      dispatchLoadAndIdle();
      await vi.dynamicImportSettled();
    });
    const statusElement = screen.getByRole('status');
    expect(statusElement).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1_650);
    });
    expect(statusElement.parentElement).toHaveAttribute('aria-hidden', 'true');
    act(() => {
      vi.advanceTimersByTime(140);
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    expect(sessionStorage.getItem('boot_intro_seen')).toBe('1');

    renderLauncher();
    act(() => {
      dispatchLoadAndIdle();
    });
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it.each([
    ['session mark', () => sessionStorage.setItem('boot_intro_seen', '1')],
    ['reduced motion', () => setMediaQuery('(prefers-reduced-motion: reduce)', true)],
    ['lite mode', () => document.documentElement.setAttribute('data-perf', 'lite')],
    ['URL opt-out', () => window.history.replaceState({}, '', '/?intro=0')],
    ['save-data', () => setConnection({ saveData: true })],
    ['2g connection', () => setConnection({ effectiveType: '2g' })],
    ['slow-2g connection', () => setConnection({ effectiveType: 'slow-2g' })],
  ])('does not mount when %s is active', (_reason, setup) => {
    setup();
    renderLauncher();
    dispatchLoadAndIdle();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

describe('BootIntro dismissal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it.each([
    ['a key', () => fireEvent.keyDown(window, { key: 'Escape' })],
    ['a click', () => fireEvent.click(screen.getByRole('status'))],
    ['the skip button', () => fireEvent.click(screen.getByRole('button', { name: /saltar|skip/i }))],
  ])('dismisses immediately with %s', async (_action, dismiss) => {
    const onDone = vi.fn();
    render(<BootIntro onDone={onDone} />);
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();

    dismiss();
    expect(status.parentElement).toHaveAttribute('aria-hidden', 'true');
    vi.advanceTimersByTime(140);
    expect(onDone).toHaveBeenCalledOnce();
  });
});
