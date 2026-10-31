import {
  ACESFilmicToneMapping,
  AmbientLight,
  BackSide,
  BoxGeometry,
  CanvasTexture,
  Color,
  ConeGeometry,
  CylinderGeometry,
  DirectionalLight,
  Fog,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshStandardMaterial,
  PCFSoftShadowMap,
  PerspectiveCamera,
  PlaneGeometry,
  PointLight,
  RepeatWrapping,
  SRGBColorSpace,
  Scene,
  Sprite,
  SpriteMaterial,
  TorusGeometry,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
  type Material,
  type Texture,
} from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

export interface BentoWorldSceneOptions {
  host: HTMLElement;
  onFirstFrame: () => void;
  /** Called when the scene must stop for good (WebGL context lost). */
  onFailure: () => void;
}

/** `showcase` only drifts the camera; `interactive` is the first-person mode. */
export type BentoWorldMode = 'showcase' | 'interactive';

export interface BentoWorldScene {
  dispose: () => void;
  /** Switches mode without recreating any GPU resource. */
  setMode: (mode: BentoWorldMode) => void;
}

const MAX_PIXEL_RATIO = 1.5;
/** How far the camera leans with the pointer, in world units. */
const CAMERA_DRIFT = 0.5;
const POINTER_RESPONSE = 5;
const SETTLE_EPSILON = 0.002;
/** Above this average frame time the scene drops shadows and the screen glow. */
const FRAME_BUDGET_MS = 20;
const DEGRADE_WINDOW_MS = 2_000;
/** Screen canvas size and the fake code lines drawn on it. */
const SCREEN_WIDTH = 256;
const SCREEN_HEIGHT = 160;
const SCREEN_PLANE_WIDTH = 1.94;
const SCREEN_PLANE_HEIGHT = 1.1;
const SCREEN_LINES: { indent: number; width: number; tone: 'accent' | 'accentAlt' | 'muted' }[] = [
  { indent: 10, width: 92, tone: 'accent' },
  { indent: 22, width: 54, tone: 'muted' },
  { indent: 22, width: 74, tone: 'accentAlt' },
  { indent: 34, width: 40, tone: 'muted' },
  { indent: 22, width: 66, tone: 'accent' },
  { indent: 10, width: 84, tone: 'muted' },
  { indent: 22, width: 48, tone: 'accentAlt' },
  { indent: 34, width: 58, tone: 'accent' },
  { indent: 10, width: 70, tone: 'muted' },
  { indent: 22, width: 36, tone: 'accent' },
];
const LINE_TOP = 34;
const LINE_STEP = 12;

type Palette = {
  bg: string;
  surface: string;
  elevated: string;
  border: string;
  accent: string;
  accentAlt: string;
  muted: string;
};

/**
 * The room is always night time (ticket 12.2b): this palette is deliberately a fixed set
 * of values instead of CSS tokens, so switching the site theme does not change the scene.
 * Only the tile around it follows the theme.
 */
const NIGHT_PALETTE: Palette = {
  bg: '#05070f',
  surface: '#0b1120',
  elevated: '#141c2f',
  border: '#26334d',
  muted: '#5f708c',
  accent: '#22d3ee',
  accentAlt: '#a855f7',
};

/** Fake code editor: title bar with window dots and coloured code lines. */
function drawScreen(canvas: HTMLCanvasElement, palette: Palette): void {
  const context = canvas.getContext('2d');
  if (!context) return;

  context.globalAlpha = 1;
  context.fillStyle = palette.surface;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.fillStyle = palette.elevated;
  context.fillRect(0, 0, canvas.width, 22);

  [palette.accentAlt, palette.accent, palette.border].forEach((color, index) => {
    context.beginPath();
    context.arc(14 + index * 12, 11, 3.4, 0, Math.PI * 2);
    context.fillStyle = color;
    context.fill();
  });

  context.globalAlpha = 0.8;
  SCREEN_LINES.forEach((line, index) => {
    context.fillStyle = palette[line.tone];
    context.fillRect(line.indent, LINE_TOP + index * LINE_STEP, line.width, 4);
  });
  context.globalAlpha = 1;
}

/** Very faint grid so the floor reads as a surface instead of a void. */
function drawFloorGrid(canvas: HTMLCanvasElement, palette: Palette): void {
  const context = canvas.getContext('2d');
  if (!context) return;

  context.globalAlpha = 1;
  context.fillStyle = palette.surface;
  context.fillRect(0, 0, canvas.width, canvas.height);

  context.globalAlpha = 0.32;
  context.strokeStyle = palette.border;
  context.lineWidth = 2;
  const step = canvas.width / 8;
  for (let index = 0; index <= 8; index += 1) {
    const position = index * step;
    context.beginPath();
    context.moveTo(position, 0);
    context.lineTo(position, canvas.height);
    context.stroke();
    context.beginPath();
    context.moveTo(0, position);
    context.lineTo(canvas.width, position);
    context.stroke();
  }
  context.globalAlpha = 1;
}

/** Night skyline behind the glass: gradient, distant blocks and blurred city lights. */
function drawNightView(canvas: HTMLCanvasElement, palette: Palette): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const { width, height } = canvas;

  const sky = context.createLinearGradient(0, 0, 0, height);
  sky.addColorStop(0, palette.bg);
  sky.addColorStop(0.55, palette.surface);
  sky.addColorStop(1, palette.elevated);
  context.fillStyle = sky;
  context.fillRect(0, 0, width, height);

  context.fillStyle = palette.border;
  context.globalAlpha = 0.55;
  [0.04, 0.18, 0.33, 0.5, 0.63, 0.78].forEach((position, index) => {
    const buildingWidth = width * 0.11;
    const buildingHeight = height * (0.16 + (index % 3) * 0.09);
    context.fillRect(position * width, height - buildingHeight, buildingWidth, buildingHeight);
  });
  context.globalAlpha = 1;

  const lights: { x: number; y: number; radius: number; tone: 'accent' | 'accentAlt' }[] = [
    { x: 0.22, y: 0.74, radius: 0.24, tone: 'accent' },
    { x: 0.56, y: 0.84, radius: 0.28, tone: 'accentAlt' },
    { x: 0.84, y: 0.68, radius: 0.2, tone: 'accent' },
  ];
  for (const light of lights) {
    const glow = context.createRadialGradient(
      light.x * width,
      light.y * height,
      0,
      light.x * width,
      light.y * height,
      light.radius * width,
    );
    glow.addColorStop(0, palette[light.tone]);
    glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
    context.globalAlpha = 0.32;
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
  }
  context.globalAlpha = 1;
}

/** Rain streaks; the plane scrolls this texture so it reads as falling rain. */
function drawRain(canvas: HTMLCanvasElement, palette: Palette): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  context.clearRect(0, 0, canvas.width, canvas.height);
  context.strokeStyle = palette.muted;
  context.lineWidth = 1.5;
  context.globalAlpha = 0.5;

  // Deterministic pseudo-random: the pattern stays stable between repaints.
  let seed = 7;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return seed / 2147483647;
  };

  for (let index = 0; index < 70; index += 1) {
    const length = 8 + random() * 14;
    const x = random() * canvas.width;
    const y = random() * (canvas.height - length);
    context.beginPath();
    context.moveTo(x, y);
    context.lineTo(x - 1.5, y + length);
    context.stroke();
  }
  context.globalAlpha = 1;
}

/** Three posters drawn with plain shapes; no text and no external images. */
function drawPoster(canvas: HTMLCanvasElement, palette: Palette, variant: number): void {
  const context = canvas.getContext('2d');
  if (!context) return;
  const { width, height } = canvas;
  const tones: (keyof Palette)[] = ['accent', 'accentAlt', 'muted'];
  const tone = tones[variant % tones.length] ?? 'accent';

  context.fillStyle = palette.surface;
  context.fillRect(0, 0, width, height);
  context.strokeStyle = palette.border;
  context.lineWidth = 3;
  context.strokeRect(1.5, 1.5, width - 3, height - 3);

  context.fillStyle = palette[tone];
  if (variant === 0) {
    for (let ring = 3; ring > 0; ring -= 1) {
      context.globalAlpha = 0.22 * ring;
      context.beginPath();
      context.arc(width / 2, height * 0.42, (width / 2) * (ring / 3.4), 0, Math.PI * 2);
      context.fill();
    }
  } else if (variant === 1) {
    context.globalAlpha = 0.85;
    for (let bar = 0; bar < 4; bar += 1) {
      context.fillRect(width * 0.18, height * (0.16 + bar * 0.12), width * 0.64, 6);
    }
  } else {
    context.globalAlpha = 0.9;
    context.beginPath();
    context.moveTo(width / 2, height * 0.16);
    context.lineTo(width * 0.84, height * 0.58);
    context.lineTo(width * 0.16, height * 0.58);
    context.closePath();
    context.fill();
    context.beginPath();
    context.arc(width / 2, height * 0.74, width * 0.1, 0, Math.PI * 2);
    context.fill();
  }
  context.globalAlpha = 1;
}

type CanvasTarget = { texture: CanvasTexture; redraw: (palette: Palette) => void };

/** Canvas texture that can be repainted when the theme changes. */
function createCanvasTexture(
  width: number,
  height: number,
  draw: (canvas: HTMLCanvasElement, palette: Palette) => void,
  palette: Palette,
): CanvasTarget {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas, palette);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return { texture, redraw: (next) => draw(canvas, next) };
}

/** Soft white blob used by the steam sprites. */
function createSteamTexture(): CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const context = canvas.getContext('2d');
  if (context) {
    const gradient = context.createRadialGradient(32, 32, 0, 32, 32, 32);
    gradient.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
  }
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  return texture;
}

type TintedMaterial = { color: Color; emissive?: Color; emissiveIntensity?: number };

type Registry = {
  geometries: BufferGeometry[];
  materials: Material[];
  textures: Texture[];
  canvases: CanvasTarget[];
  tinted: { material: TintedMaterial; token: keyof Palette; emissive: number }[];
};

type PartOptions = {
  cast?: boolean;
  receive?: boolean;
  roughness?: number;
  metalness?: number;
  /** Emissive intensity; 0 keeps the material non-emissive. */
  emissive?: number;
};

/** Builds meshes that are tracked for disposal and re-tinted on a theme change. */
function createPartFactory(palette: Palette, registry: Registry) {
  return (geometry: BufferGeometry, token: keyof Palette, options: PartOptions = {}): Mesh => {
    const emissive = options.emissive ?? 0;
    const material = new MeshStandardMaterial({
      color: new Color(palette[token]),
      roughness: options.roughness ?? 0.85,
      metalness: options.metalness ?? 0.05,
    });
    if (emissive > 0) {
      material.emissive.set(palette[token]);
      material.emissiveIntensity = emissive;
    }
    const mesh = new Mesh(geometry, material);
    mesh.castShadow = options.cast ?? true;
    mesh.receiveShadow = options.receive ?? false;
    registry.geometries.push(geometry);
    registry.materials.push(material);
    registry.tinted.push({ material, token, emissive });
    return mesh;
  };
}

/** Desk, monitor with a live screen, keyboard and mug. */
function buildDesk(
  palette: Palette,
  registry: Registry,
  screen: CanvasTarget,
): { group: Group; cursor: Mesh } {
  const part = createPartFactory(palette, registry);
  const group = new Group();

  const top = part(new RoundedBoxGeometry(4.6, 0.18, 2.1, 3, 0.06), 'elevated', { receive: true });
  group.add(top);

  for (const x of [-2.05, 2.05]) {
    const panel = part(new RoundedBoxGeometry(0.14, 1.3, 1.8, 2, 0.04), 'border');
    panel.position.set(x, -0.73, 0);
    group.add(panel);
  }

  // Monitor: base, neck, frame
  const base = part(new RoundedBoxGeometry(0.72, 0.06, 0.42, 2, 0.03), 'border');
  base.position.set(0, 0.11, -0.5);
  group.add(base);

  const neck = part(new RoundedBoxGeometry(0.12, 0.52, 0.12, 2, 0.03), 'border');
  neck.position.set(0, 0.4, -0.5);
  group.add(neck);

  const frame = part(new RoundedBoxGeometry(2.1, 1.26, 0.09, 3, 0.06), 'border');
  frame.position.set(0, 1.24, -0.5);
  group.add(frame);

  // Screen: the generated canvas is both the colour map and the emissive map.
  const screenGeometry = new PlaneGeometry(SCREEN_PLANE_WIDTH, SCREEN_PLANE_HEIGHT);
  const screenMaterial = new MeshStandardMaterial({
    map: screen.texture,
    emissive: new Color(0xffffff),
    emissiveMap: screen.texture,
    emissiveIntensity: 0.85,
    roughness: 0.35,
    metalness: 0,
  });
  const screenMesh = new Mesh(screenGeometry, screenMaterial);
  screenMesh.position.set(0, 1.24, -0.44);
  registry.geometries.push(screenGeometry);
  registry.materials.push(screenMaterial);
  group.add(screenMesh);

  // Blinking cursor at the end of the last drawn line.
  const lastLine = SCREEN_LINES[SCREEN_LINES.length - 1] ?? { indent: 22, width: 36, tone: 'accent' as const };
  const cursorGeometry = new PlaneGeometry(0.05, 0.12);
  const cursorMaterial = new MeshStandardMaterial({
    color: new Color(palette.accent),
    emissive: new Color(palette.accent),
    emissiveIntensity: 1.1,
    roughness: 0.4,
    metalness: 0,
  });
  const cursor = new Mesh(cursorGeometry, cursorMaterial);
  const cursorX = lastLine.indent + lastLine.width + 5;
  const cursorY = LINE_TOP + (SCREEN_LINES.length - 1) * LINE_STEP + 2;
  cursor.position.set(
    (cursorX / SCREEN_WIDTH) * SCREEN_PLANE_WIDTH - SCREEN_PLANE_WIDTH / 2,
    SCREEN_PLANE_HEIGHT / 2 - (cursorY / SCREEN_HEIGHT) * SCREEN_PLANE_HEIGHT,
    -0.43,
  );
  registry.geometries.push(cursorGeometry);
  registry.materials.push(cursorMaterial);
  registry.tinted.push({ material: cursorMaterial, token: 'accent', emissive: 1.1 });
  group.add(cursor);

  // Keyboard
  const keyboard = part(new RoundedBoxGeometry(1.5, 0.06, 0.52, 2, 0.03), 'surface');
  keyboard.position.set(-0.35, 0.11, 0.45);
  group.add(keyboard);

  // Mug with a torus handle
  const mug = part(new CylinderGeometry(0.17, 0.15, 0.36, 12), 'accentAlt');
  mug.position.set(1.55, 0.26, 0.35);
  group.add(mug);

  const handle = part(new TorusGeometry(0.1, 0.028, 8, 12), 'accentAlt');
  handle.position.set(1.74, 0.3, 0.35);
  handle.rotation.y = Math.PI / 2;
  group.add(handle);

  return { group, cursor };
}

/** Lamp, plant, two books and a mousepad: five meshes at most per prop. */
function buildProps(palette: Palette, registry: Registry): Group {
  const part = createPartFactory(palette, registry);
  const group = new Group();

  // Desk lamp: base, arm, head and a small emissive bulb.
  const lampBase = part(new CylinderGeometry(0.2, 0.24, 0.06, 12), 'border');
  lampBase.position.set(-1.88, 0.12, -0.55);
  group.add(lampBase);

  const lampArm = part(new RoundedBoxGeometry(0.05, 1.02, 0.05, 2, 0.02), 'border');
  lampArm.position.set(-1.83, 0.66, -0.5);
  lampArm.rotation.z = 0.3;
  group.add(lampArm);

  const lampHead = part(new ConeGeometry(0.2, 0.24, 10, 1, true), 'border', { cast: false });
  lampHead.position.set(-1.56, 1.18, -0.44);
  lampHead.rotation.set(0.55, 0, -1.05);
  group.add(lampHead);

  const bulb = part(new IcosahedronGeometry(0.06, 0), 'accent', {
    emissive: 1.1,
    roughness: 0.4,
    cast: false,
  });
  bulb.position.set(-1.55, 1.08, -0.44);
  group.add(bulb);

  // Low-poly plant: pot plus three foliage blobs.
  const pot = part(new CylinderGeometry(0.16, 0.12, 0.24, 10), 'border');
  pot.position.set(1.92, 0.21, -0.68);
  group.add(pot);

  const foliage: [number, number, number][] = [
    [1.92, 0.44, -0.68],
    [1.82, 0.36, -0.62],
    [2.02, 0.37, -0.74],
  ];
  for (const [x, y, z] of foliage) {
    const leaf = part(new IcosahedronGeometry(0.14, 0), 'accentAlt', { roughness: 0.9 });
    leaf.position.set(x, y, z);
    group.add(leaf);
  }

  // Two stacked books.
  const firstBook = part(new RoundedBoxGeometry(0.52, 0.07, 0.36, 2, 0.015), 'accent');
  firstBook.position.set(-1.32, 0.125, 0.72);
  firstBook.rotation.y = 0.18;
  group.add(firstBook);

  const secondBook = part(new RoundedBoxGeometry(0.5, 0.06, 0.34, 2, 0.015), 'border');
  secondBook.position.set(-1.3, 0.19, 0.74);
  secondBook.rotation.y = -0.12;
  group.add(secondBook);

  // Mousepad: a flat plane a couple of millimetres above the desk top.
  const mousepadGeometry = new PlaneGeometry(0.66, 0.44);
  const mousepadMaterial = new MeshStandardMaterial({
    color: new Color(palette.surface),
    roughness: 0.95,
    metalness: 0,
  });
  const mousepad = new Mesh(mousepadGeometry, mousepadMaterial);
  mousepad.rotation.x = -Math.PI / 2;
  mousepad.position.set(0.72, 0.095, 0.48);
  mousepad.receiveShadow = true;
  registry.geometries.push(mousepadGeometry);
  registry.materials.push(mousepadMaterial);
  registry.tinted.push({ material: mousepadMaterial, token: 'surface', emissive: 0 });
  group.add(mousepad);

  return group;
}

/** Floor with a very faint grid; the fog fades it into the background. */
function buildFloor(registry: Registry, grid: CanvasTarget): Mesh {
  const geometry = new PlaneGeometry(26, 26);
  const material = new MeshStandardMaterial({
    map: grid.texture,
    roughness: 0.95,
    metalness: 0,
  });
  const floor = new Mesh(geometry, material);
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.38;
  floor.receiveShadow = true;
  registry.geometries.push(geometry);
  registry.materials.push(material);
  return floor;
}

type RoomParts = { group: Group; rainTexture: CanvasTexture; neonMaterial: MeshStandardMaterial };

/** Room shell, window with rain, neon strip, shelves with books and three posters. */
function buildRoom(palette: Palette, registry: Registry): RoomParts {
  const part = createPartFactory(palette, registry);
  const group = new Group();
  const ceilingY = ROOM_FLOOR_Y + ROOM_HEIGHT;
  const wallCenterY = ROOM_FLOOR_Y + ROOM_HEIGHT / 2;

  // Shell (the floor is the grid plane built by buildFloor). The ceiling sits far above
  // the eye and is only visible from inside (BackSide), so it never crops the view.
  const ceilingGeometry = new PlaneGeometry(ROOM_HALF_WIDTH * 2, ROOM_DEPTH);
  const ceilingMaterial = new MeshStandardMaterial({
    color: new Color(palette.bg),
    roughness: 0.95,
    metalness: 0,
    side: BackSide,
  });
  const ceiling = new Mesh(ceilingGeometry, ceilingMaterial);
  ceiling.rotation.x = -Math.PI / 2;
  ceiling.position.set(0, ceilingY, 0);
  registry.geometries.push(ceilingGeometry);
  registry.materials.push(ceilingMaterial);
  group.add(ceiling);

  const backWall = part(new PlaneGeometry(ROOM_HALF_WIDTH * 2, ROOM_HEIGHT), 'surface', {
    receive: true,
    cast: false,
  });
  backWall.position.set(0, wallCenterY, WALL_BACK_Z);
  group.add(backWall);

  const leftWall = part(new PlaneGeometry(ROOM_DEPTH, ROOM_HEIGHT), 'surface', {
    receive: true,
    cast: false,
  });
  leftWall.rotation.y = Math.PI / 2;
  leftWall.position.set(WALL_LEFT_X, wallCenterY, 0);
  group.add(leftWall);

  // Window on the left wall: night view, rain behind the glass, glass and frame.
  const windowWidth = 1.9;
  const windowHeight = 1.3;
  const windowY = WINDOW_Y;
  const night = createCanvasTexture(320, 220, drawNightView, palette);
  const rain = createCanvasTexture(160, 220, drawRain, palette);
  rain.texture.wrapS = RepeatWrapping;
  rain.texture.wrapT = RepeatWrapping;
  registry.canvases.push(night, rain);
  registry.textures.push(night.texture, rain.texture);

  const nightGeometry = new PlaneGeometry(windowWidth, windowHeight);
  const nightMaterial = new MeshStandardMaterial({
    map: night.texture,
    emissive: new Color(0xffffff),
    emissiveMap: night.texture,
    emissiveIntensity: 0.55,
    roughness: 0.9,
    metalness: 0,
  });
  const nightMesh = new Mesh(nightGeometry, nightMaterial);
  nightMesh.rotation.y = Math.PI / 2;
  nightMesh.position.set(WALL_LEFT_X + 0.02, windowY, 0);
  registry.geometries.push(nightGeometry);
  registry.materials.push(nightMaterial);
  group.add(nightMesh);

  const rainGeometry = new PlaneGeometry(windowWidth, windowHeight);
  const rainMaterial = new MeshStandardMaterial({
    map: rain.texture,
    color: new Color(0xffffff),
    transparent: true,
    roughness: 1,
    metalness: 0,
  });
  const rainMesh = new Mesh(rainGeometry, rainMaterial);
  rainMesh.rotation.y = Math.PI / 2;
  rainMesh.position.set(WALL_LEFT_X + 0.04, windowY, 0);
  registry.geometries.push(rainGeometry);
  registry.materials.push(rainMaterial);
  group.add(rainMesh);

  const glassGeometry = new PlaneGeometry(windowWidth, windowHeight);
  const glassMaterial = new MeshStandardMaterial({
    color: new Color(palette.accent),
    transparent: true,
    opacity: 0.07,
    roughness: 0.1,
    metalness: 0,
  });
  const glass = new Mesh(glassGeometry, glassMaterial);
  glass.rotation.y = Math.PI / 2;
  glass.position.set(WALL_LEFT_X + 0.06, windowY, 0);
  registry.geometries.push(glassGeometry);
  registry.materials.push(glassMaterial);
  registry.tinted.push({ material: glassMaterial, token: 'accent', emissive: 0 });
  group.add(glass);

  // Frame: two verticals and two horizontals, a few centimetres off the wall.
  const frameX = WALL_LEFT_X + 0.08;
  const frameDepth = 0.09;
  const frameThickness = 0.08;
  const verticals: number[] = [-windowWidth / 2, windowWidth / 2];
  for (const offset of verticals) {
    const bar = part(
      new BoxGeometry(frameThickness, windowHeight + frameThickness * 2, frameDepth),
      'border',
    );
    bar.position.set(frameX, windowY, offset);
    group.add(bar);
  }
  const horizontals: number[] = [-windowHeight / 2, windowHeight / 2];
  for (const offset of horizontals) {
    const bar = part(
      new BoxGeometry(frameDepth, frameThickness, windowWidth + frameThickness * 2),
      'border',
    );
    bar.position.set(frameX, windowY + offset, 0);
    group.add(bar);
  }

  // Two shelves with coloured book spines, right of the monitor.
  const bookTones: (keyof Palette)[] = ['accent', 'accentAlt', 'border', 'muted', 'elevated', 'accent'];
  [0.72, 1.22].forEach((shelfY, shelfIndex) => {
    const shelf = part(new BoxGeometry(1.7, 0.05, 0.24), 'border', { cast: false });
    shelf.position.set(2.35, shelfY, WALL_BACK_Z + 0.14);
    group.add(shelf);

    for (let book = 0; book < 3; book += 1) {
      const tone = bookTones[(shelfIndex * 3 + book) % bookTones.length] ?? 'accent';
      const spine = part(new BoxGeometry(0.055, 0.26, 0.19), tone);
      spine.position.set(1.78 + book * 0.17, shelfY + 0.155, WALL_BACK_Z + 0.14);
      spine.rotation.z = book % 2 === 0 ? 0.02 : -0.035;
      group.add(spine);
    }
  });

  // Three posters, each with its own texture drawn in code.
  [0, 1, 2].forEach((variant) => {
    const poster = createCanvasTexture(140, 180, (canvas, next) => drawPoster(canvas, next, variant), palette);
    registry.canvases.push(poster);
    registry.textures.push(poster.texture);

    const posterGeometry = new PlaneGeometry(0.5, 0.64);
    const posterMaterial = new MeshStandardMaterial({
      map: poster.texture,
      roughness: 0.9,
      metalness: 0,
    });
    const posterMesh = new Mesh(posterGeometry, posterMaterial);
    posterMesh.position.set(-2.7 + variant * 0.66, 1.3, WALL_BACK_Z + 0.03);
    registry.geometries.push(posterGeometry);
    registry.materials.push(posterMaterial);
    group.add(posterMesh);
  });

  // Neon strip on the back wall, just above the monitor.
  const neonGeometry = new BoxGeometry(2.7, 0.07, 0.05);
  const neonMaterial = new MeshStandardMaterial({
    color: new Color(palette[NEON_TOKEN]),
    emissive: new Color(palette[NEON_TOKEN]),
    emissiveIntensity: 1.5,
    roughness: 0.5,
    metalness: 0,
  });
  const neon = new Mesh(neonGeometry, neonMaterial);
  neon.position.set(0, 1.72, WALL_BACK_Z + 0.04);
  registry.geometries.push(neonGeometry);
  registry.materials.push(neonMaterial);
  registry.tinted.push({ material: neonMaterial, token: NEON_TOKEN, emissive: 1.5 });
  group.add(neon);

  return { group, rainTexture: rain.texture, neonMaterial };
}

type SteamPuff = { sprite: Sprite; phase: number; speed: number; drift: number };

/** Four soft sprites rising from the mug. */
function buildSteam(palette: Palette, registry: Registry): SteamPuff[] {
  const texture = createSteamTexture();
  registry.textures.push(texture);

  const puffs: SteamPuff[] = [];
  for (let index = 0; index < 4; index += 1) {
    const material = new SpriteMaterial({
      map: texture,
      color: new Color(palette.muted),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    registry.materials.push(material);
    registry.tinted.push({ material, token: 'muted', emissive: 0 });

    const sprite = new Sprite(material);
    sprite.position.set(1.55, 0.46, 0.35);
    sprite.scale.setScalar(0.14);
    puffs.push({
      sprite,
      phase: index / 4,
      speed: 0.17 + index * 0.02,
      drift: index % 2 === 0 ? 0.06 : -0.06,
    });
  }

  return puffs;
}

const BASE_FOV = 35;
/** Wide tiles get a narrower field of view so the monitor keeps its size in frame. */
const WIDE_TILE_FOV = 26;
const WIDE_TILE_ASPECT = 2.2;

/** Room box: half width, ceiling height and the back/left wall positions. */
const ROOM_HALF_WIDTH = 3.4;
const ROOM_DEPTH = 3.2;
/** Tall enough to keep the ceiling well above the eye and the monitor. */
const ROOM_HEIGHT = 3.9;
/** The desk legs already end here, so the room floor shares the level. */
const ROOM_FLOOR_Y = -1.38;
const WALL_BACK_Z = -ROOM_DEPTH / 2;
const WALL_LEFT_X = -ROOM_HALF_WIDTH;
/** Neon strip colour. Swap this token for the purple accent when it exists. */
const NEON_TOKEN: keyof Palette = 'accent';

/** First-person limits and eye position (sitting in front of the desk). */
const EYE = { x: 0, y: 1.2, z: 2.7 };
/** Vertical field of view for the first-person mode; narrowed on very wide tiles. */
const INTERACTIVE_FOV = 66;
/** The horizontal field of view never goes past this, so the view never distorts. */
const INTERACTIVE_HFOV_LIMIT = 92;
/** Height of the window on the left wall. */
const WINDOW_Y = 0.85;
const YAW_LIMIT = (50 * Math.PI) / 180;
const PITCH_UP = (20 * Math.PI) / 180;
const PITCH_DOWN = (25 * Math.PI) / 180;
const LOOK_RESPONSE = 8;
/** About -8 degrees: the first-person view looks slightly down at the desk. */
const BASE_PITCH = -0.14;
/** Keyboard step for the reduced-motion look (no smoothing there). */
const LOOK_KEY_STEP = 0.08;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Imperative mini world. React only owns the host element; every GPU resource is
 * created here and released by `dispose()`. Frames run while the scene is alive and
 * visible, and stop when the tile leaves the screen or the tab is hidden.
 */
export function createBentoWorldScene(options: BentoWorldSceneOptions): BentoWorldScene {
  const { host } = options;
  const registry: Registry = { geometries: [], materials: [], textures: [], canvases: [], tinted: [] };

  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.display = 'block';
  canvas.style.width = '100%';
  canvas.style.height = '100%';
  canvas.style.pointerEvents = 'none';

  const renderer = new WebGLRenderer({ canvas, antialias: false, alpha: true, stencil: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, MAX_PIXEL_RATIO));
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;
  // The world is only offered on desktop (see the gate), so soft shadows are affordable.
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = PCFSoftShadowMap;
  host.appendChild(canvas);

  const palette = NIGHT_PALETTE;
  const scene = new Scene();
  const fog = new Fog(new Color(palette.bg), 9, 26);
  scene.fog = fog;

  const camera = new PerspectiveCamera(BASE_FOV, 1, 0.1, 60);
  // Yaw then pitch: the first-person look never rolls.
  camera.rotation.order = 'YXZ';
  const lookAt = new Vector3(0, 0.85, -0.35);

  // Textures generated in code, repainted when the theme changes.
  const screen = createCanvasTexture(SCREEN_WIDTH, SCREEN_HEIGHT, drawScreen, palette);
  const floorGrid = createCanvasTexture(256, 256, drawFloorGrid, palette);
  floorGrid.texture.wrapS = RepeatWrapping;
  floorGrid.texture.wrapT = RepeatWrapping;
  floorGrid.texture.repeat.set(6, 6);
  registry.textures.push(screen.texture, floorGrid.texture);
  registry.canvases.push(screen, floorGrid);

  const { group: desk, cursor } = buildDesk(palette, registry, screen);
  scene.add(desk);
  scene.add(buildProps(palette, registry));
  scene.add(buildFloor(registry, floorGrid));

  const room = buildRoom(palette, registry);
  scene.add(room.group);

  const puffs = buildSteam(palette, registry);
  for (const puff of puffs) scene.add(puff.sprite);

  // Three lights at most: low ambient, the key light with shadows and the neon point.
  const ambient = new AmbientLight(0xffffff, 0.42);
  const key = new DirectionalLight(0xffffff, 1.6);
  key.position.set(3.4, 5.6, 3.8);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.near = 1;
  key.shadow.camera.far = 16;
  key.shadow.camera.left = -5;
  key.shadow.camera.right = 5;
  key.shadow.camera.top = 5;
  key.shadow.camera.bottom = -5;
  key.shadow.bias = -0.0008;
  // The screen keeps its own emissive map, so no extra light is needed for the glow.
  const neonLight = new PointLight(new Color(palette[NEON_TOKEN]), 2.2, 7, 2);
  neonLight.position.set(0, 1.6, WALL_BACK_Z + 0.6);
  scene.add(ambient, key, neonLight);

  /** Applies the constant night palette. There is no theme observer any more. */
  const applyNightPalette = (): void => {
    for (const { material, token, emissive } of registry.tinted) {
      material.color.set(palette[token]);
      if (emissive > 0 && material.emissive) {
        material.emissive.set(palette[token]);
        material.emissiveIntensity = emissive;
      }
    }
  };

  /** Aspect ratio of the canvas: the field of view is derived from it and the mode. */
  let currentAspect = 1;
  const target = { x: 0, y: 0 };
  const current = { x: 0, y: 0 };
  let mode: BentoWorldMode = 'showcase';
  const lookTarget = { yaw: 0, pitch: BASE_PITCH };
  const lookCurrent = { yaw: 0, pitch: BASE_PITCH };
  const animated = !(
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
  );
  let disposed = false;
  let lost = false;
  let inView = true;
  let tabVisible = document.visibilityState === 'visible';
  let frameId: number | null = null;
  let lastTime = 0;
  let firstFrameSent = false;
  let elapsed = 0;
  let degraded = false;
  let frameSum = 0;
  let frameCount = 0;
  let windowStart = 0;

  const shouldRun = (): boolean => !disposed && !lost && inView && tabVisible;

  const placeCamera = (): void => {
    if (mode === 'interactive') {
      camera.position.set(EYE.x, EYE.y, EYE.z);
      camera.rotation.set(lookCurrent.pitch, lookCurrent.yaw, 0);
      return;
    }
    camera.position.set(2.95 + current.x * CAMERA_DRIFT, 2.45 - current.y * CAMERA_DRIFT * 0.55, 5.7);
    camera.lookAt(lookAt);
  };

  const updateLife = (): void => {
    for (const puff of puffs) {
      const progress = (elapsed * puff.speed + puff.phase) % 1;
      puff.sprite.material.opacity = 0.3 * Math.min(progress * 4, 1) * (1 - progress);
      puff.sprite.position.set(1.55 + puff.drift * progress, 0.46 + progress * 0.85, 0.35);
      puff.sprite.scale.setScalar(0.12 + progress * 0.24);
    }
    cursor.visible = Math.floor(elapsed / 0.6) % 2 === 0;
  };

  /** Drops shadows and the screen glow instead of breaking the scene. */
  const degrade = (): void => {
    if (degraded) return;
    degraded = true;
    renderer.shadowMap.enabled = false;
    key.castShadow = false;
    neonLight.visible = false;
    // three needs a shader recompile after toggling renderer.shadowMap.enabled.
    for (const material of registry.materials) material.needsUpdate = true;
  };

  const monitorFrameTime = (now: number, deltaMs: number): void => {
    if (degraded) return;
    if (windowStart === 0) {
      windowStart = now;
      return;
    }
    frameSum += deltaMs;
    frameCount += 1;
    if (now - windowStart < DEGRADE_WINDOW_MS) return;
    if (frameCount > 0 && frameSum / frameCount > FRAME_BUDGET_MS) degrade();
    windowStart = now;
    frameSum = 0;
    frameCount = 0;
  };

  /** Showcase and first person use independent fields of view. */
  function fovForMode(aspect: number): number {
    if (mode === 'interactive') {
      // Cap the horizontal field of view so wide tiles do not distort the room.
      const halfLimit = Math.tan((INTERACTIVE_HFOV_LIMIT * Math.PI) / 360) / aspect;
      const capped = (2 * Math.atan(halfLimit) * 180) / Math.PI;
      return Math.min(INTERACTIVE_FOV, capped);
    }
    return aspect >= WIDE_TILE_ASPECT ? WIDE_TILE_FOV : BASE_FOV;
  }

  function applyFov(): void {
    camera.fov = fovForMode(currentAspect);
    camera.updateProjectionMatrix();
  }

  /** Switches between showcase and first person without touching any GPU resource. */
  const setMode = (next: BentoWorldMode): void => {
    if (mode === next) return;
    mode = next;
    if (next === 'showcase') {
      lookTarget.yaw = 0;
      lookTarget.pitch = BASE_PITCH;
      lookCurrent.yaw = 0;
      lookCurrent.pitch = BASE_PITCH;
      target.x = 0;
      target.y = 0;
    }
    lastTime = 0;
    applyFov();
    placeCamera();
    requestFrame();
  };

  const isTypingTarget = (target: EventTarget | null): boolean =>
    target instanceof HTMLElement &&
    (target.matches('input, textarea, select, [contenteditable="true"]') || target.isContentEditable);

  /** Reduced motion: fixed angles moved with the arrow keys, no drift. */
  const handleLookKey = (event: KeyboardEvent): void => {
    if (mode !== 'interactive' || animated || isTypingTarget(event.target)) return;

    if (event.key === 'ArrowLeft') {
      lookTarget.yaw = clamp(lookTarget.yaw + LOOK_KEY_STEP, -YAW_LIMIT, YAW_LIMIT);
    } else if (event.key === 'ArrowRight') {
      lookTarget.yaw = clamp(lookTarget.yaw - LOOK_KEY_STEP, -YAW_LIMIT, YAW_LIMIT);
    } else if (event.key === 'ArrowUp') {
      lookTarget.pitch = clamp(lookTarget.pitch + LOOK_KEY_STEP, -PITCH_DOWN, PITCH_UP);
    } else if (event.key === 'ArrowDown') {
      lookTarget.pitch = clamp(lookTarget.pitch - LOOK_KEY_STEP, -PITCH_DOWN, PITCH_UP);
    } else {
      return;
    }

    event.preventDefault();
    lookCurrent.yaw = lookTarget.yaw;
    lookCurrent.pitch = lookTarget.pitch;
    placeCamera();
    requestFrame();
  };

  function requestFrame(): void {
    if (!shouldRun() || frameId !== null) return;
    frameId = window.requestAnimationFrame(tick);
  }

  function tick(now: number): void {
    frameId = null;
    if (!shouldRun()) return;

    const deltaMs = lastTime ? now - lastTime : 0;
    const dt = Math.min(deltaMs / 1000, 0.1);
    lastTime = now;
    monitorFrameTime(now, deltaMs);

    if (mode === 'interactive') {
      const lookBlend = 1 - Math.exp(-dt * LOOK_RESPONSE);
      lookCurrent.yaw += (lookTarget.yaw - lookCurrent.yaw) * lookBlend;
      lookCurrent.pitch += (lookTarget.pitch - lookCurrent.pitch) * lookBlend;
    } else {
      const blend = 1 - Math.exp(-dt * POINTER_RESPONSE);
      current.x += (target.x - current.x) * blend;
      current.y += (target.y - current.y) * blend;
    }
    placeCamera();

    if (animated) {
      elapsed += dt;
      updateLife();
      room.rainTexture.offset.y = (room.rainTexture.offset.y - dt * 1.5) % 1;
    }

    renderer.render(scene, camera);

    if (!firstFrameSent) {
      firstFrameSent = true;
      options.onFirstFrame();
    }

    const settled =
      mode === 'interactive'
        ? Math.abs(lookTarget.yaw - lookCurrent.yaw) < SETTLE_EPSILON &&
          Math.abs(lookTarget.pitch - lookCurrent.pitch) < SETTLE_EPSILON
        : Math.abs(target.x - current.x) < SETTLE_EPSILON &&
          Math.abs(target.y - current.y) < SETTLE_EPSILON;
    if (animated || !settled) requestFrame();
  }

  const sizeRenderer = (): void => {
    const rect = host.getBoundingClientRect();
    const width = Math.max(Math.round(rect.width), 1);
    const height = Math.max(Math.round(rect.height), 1);
    renderer.setSize(width, height, false);
    currentAspect = width / height;
    camera.aspect = currentAspect;
    applyFov();
    requestFrame();
  };

  const handlePointerMove = (event: PointerEvent): void => {
    if (event.pointerType !== 'mouse') return;
    const rect = host.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    const offsetX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    const offsetY = ((event.clientY - rect.top) / rect.height) * 2 - 1;

    if (mode === 'interactive') {
      // No pointer lock: the tile position maps to the look angles.
      if (!animated) return;
      lookTarget.yaw = clamp(-offsetX * YAW_LIMIT, -YAW_LIMIT, YAW_LIMIT);
      lookTarget.pitch = clamp(-offsetY * PITCH_DOWN, -PITCH_DOWN, PITCH_UP);
      requestFrame();
      return;
    }

    target.x = offsetX;
    target.y = offsetY;
    requestFrame();
  };

  const handlePointerLeave = (): void => {
    target.x = 0;
    target.y = 0;
    requestFrame();
  };

  const handleVisibility = (): void => {
    tabVisible = document.visibilityState === 'visible';
    if (tabVisible) requestFrame();
  };

  const handleContextLost = (event: Event): void => {
    event.preventDefault();
    lost = true;
    options.onFailure();
  };

  const resizeObserver =
    typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => sizeRenderer());
  const intersectionObserver =
    typeof IntersectionObserver === 'undefined'
      ? null
      : new IntersectionObserver(
          (entries) => {
            const entry = entries[entries.length - 1];
            if (!entry) return;
            inView = entry.isIntersecting;
            if (inView) requestFrame();
          },
          { threshold: 0 },
        );
  resizeObserver?.observe(host);
  intersectionObserver?.observe(host);
  host.addEventListener('pointermove', handlePointerMove, { passive: true });
  host.addEventListener('pointerleave', handlePointerLeave, { passive: true });
  canvas.addEventListener('webglcontextlost', handleContextLost);
  document.addEventListener('visibilitychange', handleVisibility);
  document.addEventListener('keydown', handleLookKey);

  if (!animated) {
    for (const puff of puffs) puff.sprite.visible = false;
    cursor.visible = true;
  }

  applyNightPalette();
  placeCamera();
  sizeRenderer();

  const dispose = (): void => {
    if (disposed) return;
    disposed = true;
    if (frameId !== null) window.cancelAnimationFrame(frameId);
    frameId = null;
    document.removeEventListener('visibilitychange', handleVisibility);
    document.removeEventListener('keydown', handleLookKey);
    host.removeEventListener('pointermove', handlePointerMove);
    host.removeEventListener('pointerleave', handlePointerLeave);
    canvas.removeEventListener('webglcontextlost', handleContextLost);
    resizeObserver?.disconnect();
    intersectionObserver?.disconnect();
    for (const geometry of registry.geometries) geometry.dispose();
    for (const material of registry.materials) material.dispose();
    for (const texture of registry.textures) texture.dispose();
    renderer.dispose();
    canvas.remove();
  };

  return { dispose, setMode };
}
