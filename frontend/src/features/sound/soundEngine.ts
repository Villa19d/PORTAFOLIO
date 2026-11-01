export type SoundName =
  | 'tick'
  | 'click'
  | 'whoosh'
  | 'key'
  | 'success'
  | 'error'
  | 'ceramic'
  | 'metal'
  | 'paper';

type Voice = {
  gain: GainNode;
  oscillator: OscillatorNode;
};

const MASTER_VOLUME = 0.15;
const MAX_VOICES = 3;

const SOUND_CONFIG: Record<
  SoundName,
  { frequency: number; duration: number; type: OscillatorType; endFrequency?: number }
> = {
  tick: { frequency: 880, duration: 0.035, type: 'sine' },
  click: { frequency: 520, duration: 0.08, type: 'triangle', endFrequency: 680 },
  whoosh: { frequency: 180, duration: 0.18, type: 'sine', endFrequency: 620 },
  key: { frequency: 720, duration: 0.045, type: 'square' },
  success: { frequency: 660, duration: 0.16, type: 'sine', endFrequency: 990 },
  error: { frequency: 220, duration: 0.18, type: 'sawtooth', endFrequency: 140 },
  ceramic: { frequency: 260, duration: 0.16, type: 'sine', endFrequency: 180 },
  metal: { frequency: 105, duration: 0.34, type: 'triangle', endFrequency: 70 },
  paper: { frequency: 190, duration: 0.12, type: 'triangle', endFrequency: 130 },
};

export type SoundEngine = {
  play: (sound: SoundName) => void;
  /** Starts or stops the generated lofi track (ticket 12.5 B2). */
  setLofi: (on: boolean) => void;
  suspend: () => void;
  resume: () => void;
  close: () => void;
};

export function createSoundEngine(): SoundEngine {
  const AudioContextConstructor =
    window.AudioContext ??
    (window as typeof window & { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;

  if (!AudioContextConstructor) {
    return {
      play: () => undefined,
      setLofi: () => undefined,
      suspend: () => undefined,
      resume: () => undefined,
      close: () => undefined,
    };
  }

  const context = new AudioContextConstructor();
  const voices: Voice[] = [];

  /**
   * The engine loads through a dynamic import, so the AudioContext is built outside
   * the user gesture and browsers hand it back `suspended`. Every play() call comes
   * from a user interaction, which is the right moment to resume it.
   */
  const resumeContext = () => {
    if (context.state !== 'suspended') return;
    void context.resume().catch(() => undefined);
  };

  const removeVoice = (voice: Voice) => {
    const index = voices.indexOf(voice);
    if (index >= 0) voices.splice(index, 1);
  };

  // --- Generated lofi track (ticket 12.5 B2): no audio files, same AudioContext ---
  const LOFI_VOLUME = 0.05;
  const LOFI_BEAT = 60 / 72;
  /** Imaj7 - vi7 - IIm7 - V7 in C. */
  const LOFI_CHORDS: number[][] = [
    [130.81, 164.81, 196.0, 246.94],
    [110.0, 130.81, 164.81, 196.0],
    [146.83, 174.61, 220.0, 261.63],
    [98.0, 123.47, 146.83, 174.61],
  ];
  let lofiBus: GainNode | null = null;
  let lofiHiss: AudioBufferSourceNode | null = null;
  let lofiTimer: number | null = null;
  let lofiNextBar = 0;
  let lofiBar = 0;

  const canBuildLofi = (): boolean =>
    typeof context.createBuffer === 'function' &&
    typeof context.createBufferSource === 'function' &&
    typeof context.createBiquadFilter === 'function';

  /** Two seconds of deterministic hiss with sparse crackle. */
  const createVinylBuffer = (): AudioBuffer | null => {
    if (typeof context.createBuffer !== 'function') return null;
    const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 2), context.sampleRate);
    const data = buffer.getChannelData(0);
    let seed = 11;
    for (let index = 0; index < data.length; index += 1) {
      seed = (seed * 16807) % 2147483647;
      const noise = (seed / 2147483647) * 2 - 1;
      data[index] = noise * 0.12 + (index % 4800 === 0 ? 0.5 : 0);
    }
    return buffer;
  };

  /** Soft chord: four triangle oscillators with a slow attack and release. */
  const playLofiChord = (frequencies: number[], at: number, duration: number): void => {
    for (const frequency of frequencies) {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(frequency, at);
      gain.gain.setValueAtTime(0.0001, at);
      gain.gain.exponentialRampToValueAtTime(0.18, at + duration * 0.4);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
      oscillator.connect(gain);
      if (lofiBus) gain.connect(lofiBus);
      oscillator.start(at);
      oscillator.stop(at + duration + 0.05);
    }
  };

  /** Quiet kick on the beat and a brushed hat off it. */
  const playLofiPercussion = (at: number, beat: number): void => {
    if (beat % 2 === 0) {
      const kick = context.createOscillator();
      const kickGain = context.createGain();
      kick.type = 'sine';
      kick.frequency.setValueAtTime(120, at);
      kick.frequency.exponentialRampToValueAtTime(48, at + 0.16);
      kickGain.gain.setValueAtTime(0.0001, at);
      kickGain.gain.exponentialRampToValueAtTime(0.22, at + 0.02);
      kickGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.22);
      kick.connect(kickGain);
      if (lofiBus) kickGain.connect(lofiBus);
      kick.start(at);
      kick.stop(at + 0.26);
    }

    const hat = context.createOscillator();
    const hatGain = context.createGain();
    const hatAt = at + LOFI_BEAT / 2;
    hat.type = 'square';
    hat.frequency.setValueAtTime(beat % 2 === 0 ? 3200 : 3800, hatAt);
    hatGain.gain.setValueAtTime(0.0001, hatAt);
    hatGain.gain.exponentialRampToValueAtTime(0.035, hatAt + 0.01);
    hatGain.gain.exponentialRampToValueAtTime(0.0001, hatAt + 0.07);
    hat.connect(hatGain);
    if (lofiBus) hatGain.connect(lofiBus);
    hat.start(hatAt);
    hat.stop(hatAt + 0.09);
  };

  /** Look-ahead scheduler: keeps half a second of music queued. */
  const scheduleLofi = (): void => {
    if (!lofiBus) return;
    const barLength = LOFI_BEAT * 4;
    while (lofiNextBar < context.currentTime + 0.5) {
      const chord = LOFI_CHORDS[lofiBar % LOFI_CHORDS.length] ?? [];
      playLofiChord(chord, lofiNextBar, barLength);
      for (let beat = 0; beat < 4; beat += 1) {
        playLofiPercussion(lofiNextBar + beat * LOFI_BEAT, beat);
      }
      lofiNextBar += barLength;
      lofiBar += 1;
    }
    lofiTimer = window.setTimeout(scheduleLofi, 200);
  };

  const stopLofi = (): void => {
    if (lofiTimer !== null) {
      window.clearTimeout(lofiTimer);
      lofiTimer = null;
    }
    if (lofiHiss) {
      const hiss = lofiHiss;
      lofiHiss = null;
      try {
        hiss.stop();
      } catch {
        // The browser already stopped it.
      }
      hiss.disconnect();
    }
    if (lofiBus) {
      const bus = lofiBus;
      lofiBus = null;
      try {
        bus.gain.setValueAtTime(bus.gain.value, context.currentTime);
        bus.gain.linearRampToValueAtTime(0.0001, context.currentTime + 0.35);
      } catch {
        // Some contexts do not expose ramps; the disconnect below still frees it.
      }
      window.setTimeout(() => bus.disconnect(), 450);
    }
  };

  const startLofi = (): void => {
    if (lofiBus || context.state === 'closed' || !canBuildLofi()) return;
    resumeContext();
    const bus = context.createGain();
    bus.gain.setValueAtTime(0.0001, context.currentTime);
    bus.gain.exponentialRampToValueAtTime(LOFI_VOLUME, context.currentTime + 1.5);
    bus.connect(context.destination);
    lofiBus = bus;

    const buffer = createVinylBuffer();
    if (buffer) {
      const source = context.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const filter = context.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1500, context.currentTime);
      const hissGain = context.createGain();
      hissGain.gain.setValueAtTime(0.35, context.currentTime);
      source.connect(filter);
      filter.connect(hissGain);
      hissGain.connect(bus);
      source.start();
      lofiHiss = source;
    }

    lofiBar = 0;
    lofiNextBar = context.currentTime + 0.15;
    scheduleLofi();
  };


  return {
    setLofi(on) {
      if (on) startLofi();
      else stopLofi();
    },
    play(sound) {
      if (context.state === 'closed') return;
      resumeContext();

      while (voices.length >= MAX_VOICES) {
        const oldest = voices.shift();
        oldest?.oscillator.stop();
      }

      const config = SOUND_CONFIG[sound];
      const now = context.currentTime;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const voice = { oscillator, gain };

      oscillator.type = config.type;
      oscillator.frequency.setValueAtTime(config.frequency, now);
      if (config.endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(
          Math.max(config.endFrequency, 1),
          now + config.duration
        );
      }

      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(MASTER_VOLUME, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + config.duration);
      oscillator.connect(gain);
      gain.connect(context.destination);
      voices.push(voice);
      oscillator.addEventListener('ended', () => {
        removeVoice(voice);
        oscillator.disconnect();
        gain.disconnect();
      });
      oscillator.start(now);
      oscillator.stop(now + config.duration + 0.01);
    },
    suspend() {
      if (context.state === 'running') void context.suspend();
    },
    resume() {
      if (context.state === 'suspended') void context.resume();
    },
    close() {
      stopLofi();
      void context.close();
    },
  };
}
