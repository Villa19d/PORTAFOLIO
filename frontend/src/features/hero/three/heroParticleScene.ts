import {
  BufferAttribute,
  BufferGeometry,
  Color,
  PerspectiveCamera,
  Points,
  Scene,
  ShaderMaterial,
  Vector2,
  WebGLRenderer,
} from 'three';
import { LITE_FPS_THRESHOLD } from '../../../hooks/usePerformanceTier';

export interface HeroSceneTuning {
  particleCount: number;
  maxPixelRatio: number;
  fieldWidth: number;
  fieldHeight: number;
  fieldDepth: number;
  fov: number;
  cameraZ: number;
  waveAmplitude: number;
  /** Radians per second of the slow wave. */
  waveSpeed: number;
  /** Base point size in CSS pixels. */
  pointSize: number;
  repelRadius: number;
  repelStrength: number;
  /** Exponential smoothing rate (1/s) of the pointer position. */
  pointerResponse: number;
  /** Exponential smoothing rate (1/s) of the pointer influence fade in/out. */
  influenceResponse: number;
  baseAlpha: number;
  lowFpsThreshold: number;
}

export const TUNING: HeroSceneTuning = {
  particleCount: 3000,
  maxPixelRatio: 1.5,
  fieldWidth: 22,
  fieldHeight: 12,
  fieldDepth: 6,
  fov: 50,
  cameraZ: 10,
  waveAmplitude: 0.35,
  waveSpeed: 0.45,
  pointSize: 2.4,
  repelRadius: 1.9,
  repelStrength: 0.8,
  pointerResponse: 6,
  influenceResponse: 4,
  baseAlpha: 0.75,
  lowFpsThreshold: LITE_FPS_THRESHOLD,
};

export interface HeroParticleSceneOptions {
  host: HTMLElement;
  tuning?: Partial<HeroSceneTuning>;
  onFirstFrame?: () => void;
  onContextLost?: () => void;
  onLowPerformance?: () => void;
}

export interface HeroParticleScene {
  dispose: () => void;
}

const PARTICLE_SEED = 0x5eed;
const WARMUP_MS = 500;
const FPS_WINDOW_MS = 1_000;
const SLOW_WINDOWS_TO_DEGRADE = 3;
const MAX_WINDOW_SAMPLES = 512;
const MAX_FRAME_DELTA_MS = 100;
const THEME_TOKEN_PRIMARY = '--accent-primary';
const THEME_TOKEN_SECONDARY = '--accent-secondary';

const VERTEX_SHADER = /* glsl */ `
uniform float uTime;
uniform vec2 uPointer;
uniform float uInfluence;
uniform float uAmplitude;
uniform float uRepelRadius;
uniform float uRepelStrength;
uniform float uSize;
uniform float uCameraZ;
uniform float uAlpha;
uniform vec3 uColorA;
uniform vec3 uColorB;
attribute vec2 aSeed;
varying vec3 vColor;
varying float vAlpha;

void main() {
  vec3 p = position;
  float phase = aSeed.x * 6.2831853 * 0.25;
  p.z += sin(p.x * 0.45 + p.y * 0.3 + uTime + phase) * uAmplitude;
  p.y += cos(p.x * 0.3 + uTime * 0.8 + phase) * uAmplitude * 0.6;

  vec2 away = p.xy - uPointer;
  float dist = length(away);
  float push = smoothstep(uRepelRadius, 0.0, dist) * uInfluence;
  p.xy += (away / max(dist, 0.0001)) * push * uRepelStrength;

  vec4 mv = modelViewMatrix * vec4(p, 1.0);
  gl_Position = projectionMatrix * mv;
  gl_PointSize = uSize * (0.55 + aSeed.y * 0.9) * (uCameraZ / -mv.z);
  vColor = mix(uColorA, uColorB, aSeed.x);
  vAlpha = uAlpha * (0.45 + 0.55 * aSeed.y);
}
`;

const FRAGMENT_SHADER = /* glsl */ `
varying vec3 vColor;
varying float vAlpha;

void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float edge = smoothstep(0.5, 0.2, d);
  gl_FragColor = vec4(vColor, vAlpha * edge);
  #include <colorspace_fragment>
}
`;

/** Deterministic PRNG (mulberry32) so the particle field is identical on every load. */
function createRandom(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function buildParticleAttributes(tuning: HeroSceneTuning) {
  const random = createRandom(PARTICLE_SEED);
  const positions = new Float32Array(tuning.particleCount * 3);
  const seeds = new Float32Array(tuning.particleCount * 2);

  for (let i = 0; i < tuning.particleCount; i += 1) {
    positions[i * 3] = (random() - 0.5) * tuning.fieldWidth;
    positions[i * 3 + 1] = (random() - 0.5) * tuning.fieldHeight;
    positions[i * 3 + 2] = (random() - 0.5) * tuning.fieldDepth;
    seeds[i * 2] = random();
    seeds[i * 2 + 1] = random();
  }

  return { positions, seeds };
}

function medianOfSorted(values: Float32Array): number {
  const middle = Math.floor(values.length / 2);
  const upper = values[middle] ?? 0;
  if (values.length % 2 === 1) return upper;
  return ((values[middle - 1] ?? upper) + upper) / 2;
}

/**
 * Frame-rate watchdog. Frame deltas are collected into 1 s windows (after a short
 * warm-up for shader compilation); a window is slow when the median frame rate is
 * below the threshold. Three consecutive slow windows trigger `onSlow`.
 */
function createFpsMonitor(threshold: number, onSlow: () => void) {
  const deltas = new Float32Array(MAX_WINDOW_SAMPLES);
  let size = 0;
  let windowStart = -1;
  let slowStreak = 0;

  return {
    reset() {
      size = 0;
      windowStart = -1;
      slowStreak = 0;
    },
    record(now: number, delta: number) {
      if (delta <= 0) return;
      if (windowStart < 0) {
        windowStart = now + WARMUP_MS;
        return;
      }
      if (now < windowStart) return;

      if (size < deltas.length) {
        deltas[size] = delta;
        size += 1;
      }

      if (now - windowStart < FPS_WINDOW_MS) return;

      const window = deltas.subarray(0, size);
      window.sort();
      const medianDelta = medianOfSorted(window);
      const fps = medianDelta > 0 ? 1_000 / medianDelta : Number.POSITIVE_INFINITY;
      size = 0;
      windowStart = now;

      if (fps < threshold) {
        slowStreak += 1;
        if (slowStreak >= SLOW_WINDOWS_TO_DEGRADE) onSlow();
      } else {
        slowStreak = 0;
      }
    },
  };
}

function readToken(style: CSSStyleDeclaration, name: string): string {
  return style.getPropertyValue(name).trim() || style.color;
}

/**
 * Imperative particle field. React only owns the host element; everything GPU-related
 * is created here and released by `dispose()`.
 */
export function createHeroParticleScene(options: HeroParticleSceneOptions): HeroParticleScene {
  const tuning: HeroSceneTuning = { ...TUNING, ...options.tuning };
  const { host } = options;

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';

  const renderer = new WebGLRenderer({
    canvas,
    antialias: false,
    alpha: true,
    depth: false,
    stencil: false,
  });
  const pixelRatio = Math.min(window.devicePixelRatio || 1, tuning.maxPixelRatio);
  renderer.setPixelRatio(pixelRatio);
  renderer.setClearColor(0x000000, 0);
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(tuning.fov, 1, 0.1, 100);
  camera.position.z = tuning.cameraZ;

  const uTime = { value: 0 };
  const uPointer = { value: new Vector2(0, 0) };
  const uInfluence = { value: 0 };
  const uColorA = { value: new Color() };
  const uColorB = { value: new Color() };

  const { positions, seeds } = buildParticleAttributes(tuning);
  const geometry = new BufferGeometry();
  geometry.setAttribute('position', new BufferAttribute(positions, 3));
  geometry.setAttribute('aSeed', new BufferAttribute(seeds, 2));

  const material = new ShaderMaterial({
    uniforms: {
      uTime,
      uPointer,
      uInfluence,
      uColorA,
      uColorB,
      uAmplitude: { value: tuning.waveAmplitude },
      uRepelRadius: { value: tuning.repelRadius },
      uRepelStrength: { value: tuning.repelStrength },
      uSize: { value: tuning.pointSize * pixelRatio },
      uCameraZ: { value: tuning.cameraZ },
      uAlpha: { value: tuning.baseAlpha },
    },
    vertexShader: VERTEX_SHADER,
    fragmentShader: FRAGMENT_SHADER,
    transparent: true,
    depthTest: false,
    depthWrite: false,
  });

  const points = new Points(geometry, material);
  points.frustumCulled = false;
  scene.add(points);

  const halfHeight = Math.tan((tuning.fov * Math.PI) / 360) * tuning.cameraZ;
  let halfWidth = halfHeight;
  let targetX = 0;
  let targetY = 0;
  let targetInfluence = 0;
  let hasPointer = false;

  let frameId = 0;
  let lastFrameTime: number | null = null;
  let inView = true;
  let tabVisible = document.visibilityState !== 'hidden';
  let lost = false;
  let degraded = false;
  let disposed = false;
  let firstFrameDone = false;

  const monitor = createFpsMonitor(tuning.lowFpsThreshold, () => {
    if (degraded || disposed) return;
    degraded = true;
    sync();
    options.onLowPerformance?.();
  });

  function applyThemeColors(): void {
    const style = window.getComputedStyle(document.documentElement);
    uColorA.value.set(readToken(style, THEME_TOKEN_PRIMARY));
    uColorB.value.set(readToken(style, THEME_TOKEN_SECONDARY));
  }

  function resize(): void {
    const width = Math.max(1, canvas.clientWidth);
    const height = Math.max(1, canvas.clientHeight);
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    halfWidth = halfHeight * camera.aspect;
  }

  function tick(now: number): void {
    frameId = window.requestAnimationFrame(tick);

    const delta = lastFrameTime === null ? 0 : now - lastFrameTime;
    lastFrameTime = now;
    const dt = Math.min(delta, MAX_FRAME_DELTA_MS) / 1_000;

    uTime.value += dt * tuning.waveSpeed;
    const pointerBlend = 1 - Math.exp(-dt * tuning.pointerResponse);
    uPointer.value.x += (targetX - uPointer.value.x) * pointerBlend;
    uPointer.value.y += (targetY - uPointer.value.y) * pointerBlend;
    uInfluence.value +=
      (targetInfluence - uInfluence.value) * (1 - Math.exp(-dt * tuning.influenceResponse));

    renderer.render(scene, camera);

    if (!firstFrameDone) {
      firstFrameDone = true;
      options.onFirstFrame?.();
    }

    monitor.record(now, delta);
  }

  function sync(): void {
    const shouldRun = !disposed && !lost && !degraded && inView && tabVisible;
    if (shouldRun && frameId === 0) {
      lastFrameTime = null;
      monitor.reset();
      frameId = window.requestAnimationFrame(tick);
    } else if (!shouldRun && frameId !== 0) {
      window.cancelAnimationFrame(frameId);
      frameId = 0;
      lastFrameTime = null;
      monitor.reset();
    }
  }

  const handlePointerMove = (event: PointerEvent): void => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const normalizedX = (event.clientX - rect.left) / rect.width;
    const normalizedY = (event.clientY - rect.top) / rect.height;
    const isInside =
      normalizedX >= 0 && normalizedX <= 1 && normalizedY >= 0 && normalizedY <= 1;

    targetInfluence = isInside ? 1 : 0;
    if (!isInside) return;

    targetX = (normalizedX * 2 - 1) * halfWidth;
    targetY = (1 - normalizedY * 2) * halfHeight;
    if (!hasPointer) {
      hasPointer = true;
      uPointer.value.set(targetX, targetY);
    }
  };

  const handlePointerAway = (): void => {
    targetInfluence = 0;
  };

  const handleVisibilityChange = (): void => {
    tabVisible = document.visibilityState !== 'hidden';
    sync();
  };

  const handleContextLost = (): void => {
    if (disposed) return;
    lost = true;
    sync();
    options.onContextLost?.();
  };

  const intersectionObserver =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver((entries) => {
          const entry = entries[entries.length - 1];
          if (entry) inView = entry.isIntersecting;
          sync();
        });
  const resizeObserver = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(resize);
  const themeObserver = new MutationObserver(applyThemeColors);

  applyThemeColors();
  resize();

  window.addEventListener('pointermove', handlePointerMove, { passive: true });
  document.documentElement.addEventListener('pointerleave', handlePointerAway, { passive: true });
  document.addEventListener('visibilitychange', handleVisibilityChange);
  canvas.addEventListener('webglcontextlost', handleContextLost);
  intersectionObserver?.observe(canvas);
  resizeObserver?.observe(canvas);
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['data-theme'],
  });

  sync();

  function dispose(): void {
    if (disposed) return;
    disposed = true;
    sync();

    window.removeEventListener('pointermove', handlePointerMove);
    document.documentElement.removeEventListener('pointerleave', handlePointerAway);
    document.removeEventListener('visibilitychange', handleVisibilityChange);
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    intersectionObserver?.disconnect();
    resizeObserver?.disconnect();
    themeObserver.disconnect();

    scene.remove(points);
    geometry.dispose();
    material.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
  }

  return { dispose };
}