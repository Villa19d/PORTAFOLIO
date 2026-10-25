import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SoundProvider } from '../SoundContext';
import { SoundToggle } from '../SoundToggle';
import { useSound } from '../SoundContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../lib/i18n';

const suspendMock = vi.fn();
const resumeMock = vi.fn();
const closeMock = vi.fn();
const oscillatorMock = vi.fn();

class MockAudioContext {
  state = 'running';
  currentTime = 0;
  destination = {};
  createOscillator() {
    oscillatorMock();
    return {
      type: 'sine',
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      addEventListener: vi.fn(),
      start: vi.fn(),
      stop: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
      disconnect: vi.fn(),
    };
  }
  suspend = suspendMock;
  resume = resumeMock;
  close = closeMock;
}

function SoundProbe() {
  const { enabled, play } = useSound();
  return (
    <>
      <output data-testid="enabled">{String(enabled)}</output>
      <button onClick={() => play('tick')}>Play tick</button>
    </>
  );
}

describe('sound controls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    vi.stubGlobal('AudioContext', MockAudioContext);
    document.documentElement.dataset.perf = '';
  });

  it('starts disabled and does not create AudioContext before activation', () => {
    const constructorSpy = vi.spyOn(window, 'AudioContext');
    render(
      <I18nextProvider i18n={i18n}>
        <SoundProvider>
          <SoundToggle />
        </SoundProvider>
      </I18nextProvider>
    );

    expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'false');
    expect(constructorSpy).not.toHaveBeenCalled();
  });

  it('creates the context after activation and persists the preference', async () => {
    render(
      <I18nextProvider i18n={i18n}>
        <SoundProvider>
          <SoundToggle />
        </SoundProvider>
      </I18nextProvider>
    );

    fireEvent.click(screen.getByRole('button'));
    await waitFor(() => expect(screen.getByRole('button')).toHaveAttribute('aria-pressed', 'true'));
    expect(localStorage.getItem('portfolio-sound-enabled')).toBe('true');
  });

  it('omits tick sounds in lite mode', async () => {
    document.documentElement.dataset.perf = 'lite';
    render(
      <I18nextProvider i18n={i18n}>
        <SoundProvider>
          <SoundToggle />
          <SoundProbe />
        </SoundProvider>
      </I18nextProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: /activar|enable/i }));
    await waitFor(() => expect(screen.getByTestId('enabled')).toHaveTextContent('true'));
    const oscillatorCountAfterActivation = oscillatorMock.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: 'Play tick' }));
    expect(oscillatorMock).toHaveBeenCalledTimes(oscillatorCountAfterActivation);
  });
});
