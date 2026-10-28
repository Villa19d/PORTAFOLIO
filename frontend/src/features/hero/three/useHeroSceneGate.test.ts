import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createHeroParticleScene, TUNING, type HeroParticleScene } from './heroParticleScene';

const three = vi.hoisted(() => ({
  rendererOptions: [] as Array<Record<string, unknown>>,
  materials: [] as Array<{ uniforms: Record<string, { value: unknown }> }>,
  colors: [] as Array<{ value: string }>,
  setPixelRatio: vi.fn(),
  setSize: vi.fn(),
  render: vi.fn(),
  rendererDispose: vi.fn(),
  forceContextLoss: vi.fn(),
  geometryDispose: vi.fn(),
  materialDispose: vi.fn(),
}));

vi.mock('three', () => {
  class Vector2 {
    x = 0;
    y = 0;
    constructor(x = 0, y = 0) {
      this.x = x;
      this.y = y;
    }
    set(x: number, y: number) {
      this.x = x;
      this.y = y;
      return this;
    }
  }

  class Color {
    value = '';
    constructor() {
      three.colors.push(this);
    }
    set(value: string) {
      this.value = value;
      return this;
    }
  }

  class BufferAttribute {
    array: Float32Array;
    itemSize: number;
    constructor(array: Float32Array, itemSize: number) {
      this.array = array;
      this.itemSize = itemSize;
    }
  }

  class BufferGeometry {
    attributes: Record<string, BufferAttribute> = {};
    setAttribute(name: string, attribute: BufferAttribute) {
      this.attributes[name] = attribute;
      return this;
    }
    dispose = three.geometryDispose;
  }

  class ShaderMaterial {
    uniforms: Record<string, { value: unknown }>;
    constructor(parameters: { uniforms: Record<string, { value: unknown }> }) {
      this.uniforms = parameters.uniforms;
      three.materials.push(this);
    }
    dispose = three.materialDispose;
  }

  class Points {
    geometry: unknown;
    material: unknown;
    frustumCulled = true;
    constructor(geometry: unknown, material: unknown) {
      this.geometry = geometry;
      this.material = material;
    }
  }

  class Scene {
    add = vi.fn();
    remove = vi.fn();
  }

  class PerspectiveCamera {
    aspect = 1;
    position = { z: 0 };
    updateProjectionMatrix = vi.fn();
  }

  class WebGLRenderer {
    domElement: HTMLCanvasElement;
    constructor(options: { canvas: HTMLCanvasElement }) {
      three.rendererOptions.push(options);
      this.domElement = options.canvas;
    }
    setPixelRatio = three.setPixelRatio;
    setSize = three.setSize;
    setClearColor = vi.fn();
    render = three.render;
    dispose = three.rendererDispose;
    forceContextLoss = three.forceContextLoss;
  }

  return {
    BufferAttribute,
    BufferGeometry,
    Color,
    PerspectiveCamera,
    Points,
    Scene,
    ShaderMaterial,
    Vector2,
    WebGLRenderer,
  };
});

class FakeIntersectionObserver {
  static latest: FakeIntersectionObserver | null = null;
  readonly callback: IntersectionObserverCallback;
  readonly observe = vi.fn();
  readonly disconnect = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.latest = this;
  }

  report(isIntersecting: boolean) {
    this.callback(
      [{ isIntersecting } as IntersectionObserverEntry],
      this as unknown as IntersectionObserver,
    );
  }
}

let frameCallbacks = new Map<number, FrameRequestCallback>();
let nextFrameId = 1;
let clock = 0;

function runFrame(time: number) {
  const pending = [...frameCallbacks.values()];
  frameCallbacks = new Map();
  pending.forEach((callback) => callback(time));
}

/** Runs frames until `totalMs` of fake time passed; `stepFor` picks the frame length. */
function runUntil(totalMs: number, stepFor: (time: number) => number) {
  while (clock < totalMs && frameCallbacks.size > 0) {
    clock += stepFor(clock);
    runFrame(clock);
  }
}

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
  document.dispatchEvent(new Event('visibilitychange'));
}

function getUniform<T>(name: string): { value: T } {
  const uniform = three.materials[0]?.uniforms[name];
  if (!uniform) throw new Error(`Uniform ${name} not found`);
  return uniform as { value: T };
}

describe('createHeroParticleScene', () => {
  let host: HTMLElement;
  let scene: HeroParticleScene | null;

  function create(options: Partial<Parameters<typeof createHeroParticleScene>[0]> = {}) {
    scene = createHeroParticleScene({ host, ...options });
    return scene;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    three.rendererOptions.length = 0;
    three.materials.length = 0;
    three.colors.length = 0;
    frameCallbacks = new Map();
    nextFrameId = 1;
    clock = 0;
    scene = null;

    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    FakeIntersectionObserver.latest = null;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      const id = nextFrameId++;
      frameCallbacks.set(id, callback);
      return id;
    });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => {
      frameCallbacks.delete(id);
    });

    host = document.createElement('div');
    document.body.appendChild(host);
  });

  afterEach(() => {
    scene?.dispose();
    host.remove();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    Reflect.deleteProperty(document, 'visibilityState');
    document.documentElement.removeAttribute('data-theme');
  });

  it('creates a non-antialiased transparent renderer with the pixel ratio capped at 1.5', () => {
    vi.stubGlobal('devicePixelRatio', 3);

    create();

    expect(three.rendererOptions[0]).toMatchObject({ antialias: false, alpha: true });
    expect(three.setPixelRatio).toHaveBeenCalledWith(1.5);
    expect(host.querySelector('canvas')).toBeInTheDocument();
    expect(host.querySelector('canvas')).toHaveAttribute('aria-hidden', 'true');
  });

  it('keeps the particle count inside the 2500-3500 budget', () => {
    expect(TUNING.particleCount).toBeGreaterThanOrEqual(2500);
    expect(TUNING.particleCount).toBeLessThanOrEqual(3500);
  });

  it('renders each frame and reports the first one only once', () => {
    const onFirstFrame = vi.fn();
    create({ onFirstFrame });

    runFrame(16);
    runFrame(33);

    expect(three.render).toHaveBeenCalledTimes(2);
    expect(onFirstFrame).toHaveBeenCalledTimes(1);
  });

  it('listens to the pointer on window with a passive listener', () => {
    const addSpy = vi.spyOn(window, 'addEventListener');

    create();

    expect(addSpy).toHaveBeenCalledWith('pointermove', expect.any(Function), { passive: true });
  });

  it('pauses rendering while the Hero is out of view and resumes when it returns', () => {
    create();
    expect(frameCallbacks.size).toBe(1);

    FakeIntersectionObserver.latest?.report(false);
    expect(frameCallbacks.size).toBe(0);

    FakeIntersectionObserver.latest?.report(true);
    expect(frameCallbacks.size).toBe(1);
  });

  it('pauses rendering while the tab is hidden', () => {
    create();

    setVisibility('hidden');
    expect(frameCallbacks.size).toBe(0);

    setVisibility('visible');
    expect(frameCallbacks.size).toBe(1);
  });

  it('requests lite once after three consecutive slow windows and stops rendering', () => {
    const onLowPerformance = vi.fn();
    create({ onLowPerformance });

    runUntil(6_000, () => 50);

    expect(onLowPerformance).toHaveBeenCalledTimes(1);
    expect(frameCallbacks.size).toBe(0);
  });

  it('does not degrade at a steady 60 fps', () => {
    const onLowPerformance = vi.fn();
    create({ onLowPerformance });

    runUntil(8_000, () => 16.7);

    expect(onLowPerformance).not.toHaveBeenCalled();
    expect(frameCallbacks.size).toBe(1);
  });

  it('a good window breaks the slow streak', () => {
    const onLowPerformance = vi.fn();
    create({ onLowPerformance });

    runUntil(5_900, (time) => (time >= 2_600 && time < 4_100 ? 16.7 : 50));

    expect(onLowPerformance).not.toHaveBeenCalled();
  });

  it('returns to the CSS background when the WebGL context is lost', () => {
    const onContextLost = vi.fn();
    create({ onContextLost });

    host.querySelector('canvas')?.dispatchEvent(new Event('webglcontextlost'));

    expect(onContextLost).toHaveBeenCalledTimes(1);
    expect(frameCallbacks.size).toBe(0);
  });

  it('maps the pointer to the field and fades its influence in and out', () => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getBoundingClientRect').mockReturnValue({
      left: 0,
      top: 0,
      width: 100,
      height: 100,
      right: 100,
      bottom: 100,
      x: 0,
      y: 0,
      toJSON: () => ({}),
    });
    create();
    const halfHeight = Math.tan((TUNING.fov * Math.PI) / 360) * TUNING.cameraZ;

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 75, clientY: 25 }));
    const pointer = getUniform<{ x: number; y: number }>('uPointer').value;
    expect(pointer.x).toBeCloseTo(0.5 * halfHeight);
    expect(pointer.y).toBeCloseTo(0.5 * halfHeight);

    runUntil(500, () => 16.7);
    const influence = getUniform<number>('uInfluence');
    expect(influence.value).toBeGreaterThan(0.5);

    window.dispatchEvent(new MouseEvent('pointermove', { clientX: 500, clientY: 500 }));
    runUntil(2_500, () => 16.7);
    expect(influence.value).toBeLessThan(0.01);
  });

  it('reads colors from the CSS tokens on mount and when the theme changes', async () => {
    const tokens: Record<string, string> = {
      '--accent-primary': ' #00e5ff',
      '--accent-secondary': '#39ff88',
    };
    vi.spyOn(window, 'getComputedStyle').mockImplementation(
      () =>
        ({
          getPropertyValue: (name: string) => tokens[name] ?? '',
          color: '',
        }) as unknown as CSSStyleDeclaration,
    );

    create();
    expect(three.colors[0]?.value).toBe('#00e5ff');
    expect(three.colors[1]?.value).toBe('#39ff88');

    tokens['--accent-primary'] = '#00798c';
    tokens['--accent-secondary'] = '#1a7f37';
    document.documentElement.setAttribute('data-theme', 'light');

    await vi.waitFor(() => {
      expect(three.colors[0]?.value).toBe('#00798c');
      expect(three.colors[1]?.value).toBe('#1a7f37');
    });
  });

  it('releases every GPU resource, listener and observer on dispose', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener');
    create();
    const observer = FakeIntersectionObserver.latest;

    scene?.dispose();

    expect(three.geometryDispose).toHaveBeenCalledTimes(1);
    expect(three.materialDispose).toHaveBeenCalledTimes(1);
    expect(three.rendererDispose).toHaveBeenCalledTimes(1);
    expect(three.forceContextLoss).toHaveBeenCalledTimes(1);
    expect(removeSpy).toHaveBeenCalledWith('pointermove', expect.any(Function));
    expect(observer?.disconnect).toHaveBeenCalled();
    expect(host.querySelector('canvas')).not.toBeInTheDocument();
    expect(frameCallbacks.size).toBe(0);
  });

  it('is safe to dispose twice and ignores late context loss events', () => {
    const onContextLost = vi.fn();
    create({ onContextLost });
    const canvas = host.querySelector('canvas');

    scene?.dispose();
    scene?.dispose();
    canvas?.dispatchEvent(new Event('webglcontextlost'));

    expect(three.rendererDispose).toHaveBeenCalledTimes(1);
    expect(onContextLost).not.toHaveBeenCalled();
  });
});