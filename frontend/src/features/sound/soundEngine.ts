export type SoundName = 'tick' | 'click' | 'whoosh' | 'key' | 'success' | 'error';

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
};

export type SoundEngine = {
  play: (sound: SoundName) => void;
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
    return { play: () => undefined, suspend: () => undefined, resume: () => undefined, close: () => undefined };
  }

  const context = new AudioContextConstructor();
  const voices: Voice[] = [];

  const removeVoice = (voice: Voice) => {
    const index = voices.indexOf(voice);
    if (index >= 0) voices.splice(index, 1);
  };

  return {
    play(sound) {
      if (context.state === 'closed') return;

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
      void context.close();
    },
  };
}
