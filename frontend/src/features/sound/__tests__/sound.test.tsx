import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SoundProvider } from '../SoundContext';
import { SoundToggle } from '../SoundToggle';
import { useSound } from '../SoundContext';
import { createSoundEngine } from '../soundEngine';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../../lib/i18n';

const suspendMock = vi.fn();
const resumeMock = vi.fn();
const closeMock = vi.fn();
const oscillatorMock = vi.fn();
const audioContextCreatedMock = vi.fn();

type MockContextState = 'running' | 'suspended' | 'closed';

/** Browsers hand back a suspended context when it is built outside a user gesture. */
let initialContextState: MockContextState = 'running';

class MockAudioContext {
  state: MockContextState = initialContextState;
  currentTime = 0;
  destination = {};
  constructor() {
    audioContextCreatedMock();
  }
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
  suspend = () => {
    suspendMock();
    this.state = 'suspended';
    return Promise.resolve();
  };
  resume = () => {
    resumeMock();
    this.state = 'running';
    return Promise.resolve();
  };
  close = () => {
    closeMock();
    this.state = 'closed';
    return Promise.resolve();
  };
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
    initialContextState = 'running';
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

  it('does not create the AudioContext when the provider unmounts before the engine loads', async () => {
    const { unmount } = render(
      <I18nextProvider i18n={i18n}>
        <SoundProvider>
          <SoundToggle />
        </SoundProvider>
      </I18nextProvider>
    );

    fireEvent.click(screen.getByRole('button'));
    unmount();
    await vi.dynamicImportSettled();

    expect(audioContextCreatedMock).not.toHaveBeenCalled();
  });

  it('resumes a suspended AudioContext when a sound is played', () => {
    initialContextState = 'suspended';
    const engine = createSoundEngine();

    engine.play('click');

    expect(resumeMock).toHaveBeenCalledTimes(1);
    expect(oscillatorMock).toHaveBeenCalled();
  });

  it('does not resume the AudioContext when it is already running', () => {
    const engine = createSoundEngine();

    engine.play('click');

    expect(resumeMock).not.toHaveBeenCalled();
    expect(oscillatorMock).toHaveBeenCalled();
  });
});