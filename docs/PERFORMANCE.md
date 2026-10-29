# Frontend performance measurement procedure

Use this procedure for production-performance tickets. Keep the browser, machine,
build, viewport, and network/CPU throttling consistent between before/after runs.

## Production build and preview

From `frontend/`, build and serve the production output:

```sh
npm run build
npm run preview -- --host 127.0.0.1
```

Use Chrome in an Incognito window with extensions disabled and a clean cache.
Open DevTools before navigating to the preview, enable **Disable cache** in
Network, and use the same viewport/device emulation in every run. If the preview
needs the production API, configure the API URL for the build; do not use a
development server for measurements.

## Lighthouse

Run Lighthouse in Mobile mode three times against the same preview URL and
report the median of Performance, Accessibility, Cumulative Layout Shift (CLS),
and Total Blocking Time (TBT). Record the Chrome/Lighthouse versions, URL,
viewport, and any throttling settings. Do not discard a slow run unless a
reproducible infrastructure failure is documented.

## Layout shifts

With Slow 4G enabled and cache disabled, run three reloads per case:

1. Production API available.
2. Production API blocked in DevTools Network (Block request domain).

Record the CLS value, section geometry and rendered state during loading and
after resolution/error. A test is specifically a skeleton-to-data CLS
measurement only if the browser records both states; do not label the fallback
snapshot transition as skeleton-to-data.

## Animation frame rate and long animation frames

In the Console, sample animation frames for the complete interaction interval.
Use timestamps from `requestAnimationFrame`, not visual estimates:

```js
const frameTimes = [];
let frameId;
const sampleFrame = (time) => {
  frameTimes.push(time);
  frameId = requestAnimationFrame(sampleFrame);
};
frameId = requestAnimationFrame(sampleFrame);
// After the fixed measurement interval:
cancelAnimationFrame(frameId);
const intervals = frameTimes.slice(1).map((time, i) => time - frameTimes[i]);
const fps = intervals.length
  ? 1000 / (intervals.reduce((sum, value) => sum + value, 0) / intervals.length)
  : 0;
console.table({ frames: frameTimes.length, approxFps: fps });
```

When supported, observe long animation frames separately; unsupported browsers
must be reported as such:

```js
const longAnimationFrames = [];
const observer = PerformanceObserver.supportedEntryTypes?.includes('long-animation-frame')
  ? new PerformanceObserver((list) => longAnimationFrames.push(...list.getEntries()))
  : null;
observer?.observe({ type: 'long-animation-frame', buffered: true });
// After the fixed interaction interval:
observer?.disconnect();
console.table(longAnimationFrames.map(({ startTime, duration }) => ({ startTime, duration })));
```

For scripted checks, the `longtask` entry type can additionally report main
thread tasks, but it is not a substitute for DevTools Performance analysis.
For animation tickets, record a five-second Performance trace with 6x CPU
slowdown for each named interaction, then report the longest task, Scripting,
Rendering, Painting, measured frame rate, and composited layer count. Use
DevTools' Layers panel for the layer count and state how the values were
aggregated.

## Bundle analysis

The Vite production build emits structured module data at
`frontend/dist/stats.json` from `rollup-plugin-visualizer`, including gzip and
Brotli sizes. Use it to inspect module contribution and chunk membership. Report
gzip bytes from the build output for the entry chunk, not an approximate value
from source sizes. The stats file and `dist/` are generated artifacts and must
not be committed.

### Ticket S7.3b: entry chunk comparison

Measure the entry file referenced by `dist/index.html`; do not choose an
arbitrary `index-*.js`, because a build can contain lazy chunks with the same
name pattern. From `frontend/`, run:

```sh
npm run build
node --input-type=module -e 'import { readFileSync } from "node:fs"; import { gzipSync } from "node:zlib"; const html = readFileSync("dist/index.html", "utf8"); const source = html.match(/<script type="module"[^>]*src="([^"]+)"/)?.[1]; if (!source) throw new Error("Entry script not found in dist/index.html"); const file = `dist/${source.replace(/^\//, "")}`; const bytes = readFileSync(file); console.log(`${file}: ${bytes.length} bytes; ${gzipSync(bytes).length} bytes gzip`);'
```

If Vite reports `EBUSY` while clearing `dist/` in a Dropbox-synced Windows
checkout, rerun as `npm run build -- --emptyOutDir false`. This keeps old
unreferenced assets in `dist/`, so measure only the entry selected from the
current `index.html` and the chunks referenced by that build.

Record that entry size separately from the JavaScript files in `modulepreload`
links in `dist/index.html`. Splitting an eagerly imported vendor module into a
separate chunk lowers the entry size but does not defer that vendor download.
Use `dist/stats.json` for module attribution; its per-module gzip estimates are
independent and must not be added together as a chunk total.

The comparable production artifacts for this ticket measured:

| Build | Entry gzip | Entry measurement |
| --- | ---: | --- |
| S7.0b artifact | 118,609 bytes | `index-DGR5yJwN.js` |
| Before S7.3b optimization | 129,006 bytes | `index-BPltPHkF.js` |
| After S7.3b optimization | 38,488 bytes | Entry referenced by `dist/index.html` |

The recorded 76 KB S7.0b figure did not match the available production artifact;
the comparable increase before this optimization was 10,397 gzip bytes. The
optimized build defers About until it enters the viewport and Projects until it
is within 280 px of the viewport. The React Query client is scoped to Projects.
React DOM is emitted as its own statically preloaded vendor chunk, so include it
when reporting the initial JavaScript transfer: after optimization, the entry
and static modulepreloads total 131,174 gzip bytes (React 3,203; React DOM
66,372; Motion 23,111; entry 38,488). Before optimization those same initial
chunks totaled 156,487 gzip bytes (React 4,370; Motion 23,111; entry 129,006).

### Ticket S11.2: 3D Hero chunk (three)

The 3D scene lives in a lazy chunk (`three-*.js`, plus the small `HeroScene-*.js`)
that must only be requested through a dynamic import. Budget: the three chunk
must not exceed **180 KB gzip**; if it does, stop and consult before continuing.
The entry chunk must not grow compared with the previous ticket.

From `frontend/`, build and run these checks (with `--emptyOutDir false` only if
Vite reports `EBUSY`, and then ignore stale files in `dist/assets`):

```sh
npm run build
```

1. Three must be absent from the initial HTML (no output expected). In PowerShell:

```powershell
Select-String -Path dist/index.html -Pattern 'three'
```

2. Gzip size of every JavaScript chunk, including `three-*.js` and `HeroScene-*.js`:

```sh
node --input-type=module -e 'import { readdirSync, readFileSync } from "node:fs"; import { gzipSync } from "node:zlib"; for (const name of readdirSync("dist/assets").filter((file) => file.endsWith(".js"))) { const bytes = readFileSync(`dist/assets/${name}`); console.log(`${name}: ${bytes.length} bytes; ${gzipSync(bytes).length} bytes gzip`); }'
```

3. Entry chunk gzip: reuse the S7.3b command above and compare with the previous ticket.

#### Network checks (no 3D download)

In Chrome DevTools, Network tab, Disable cache, filter by `three`:

| Case | Expected requests for `three-*.js` |
| --- | --- |
| Desktop, full tier, WebGL available | 1, after the `load` event |
| Mobile emulation (touch, narrow viewport) | 0 |
| Desktop with `?perf=lite` | 0 |
| Desktop with `prefers-reduced-motion: reduce` emulated | 0 |

Clear `sessionStorage` between runs (`sessionStorage.clear()`), because a stored
tier decision takes precedence over measurement.

#### Lighthouse with and without 3D

Run Lighthouse desktop and mobile, three runs each, report the median of
Performance, CLS and TBT (see the Lighthouse section). The "without 3D" case is
the build from the previous ticket (S11.1); `?perf=lite` is not an equivalent
baseline because lite also turns off other effects. Mobile must show no
difference caused by this ticket.

#### Frame rate with the pointer moving

With the 3D active on desktop, record a 10 s DevTools Performance trace while
moving the pointer across the Hero continuously, and report the average fps
shown by the trace. As a cross-check, run the `requestAnimationFrame` sampling
snippet from the frame-rate section over the same 10 s.

#### Degradation with 6x CPU

1. Enable CPU 6x slowdown, clear `sessionStorage` and open the page with `?perf=full`. This disables the base tier measurement, so only the scene's own monitor is tested.
2. As soon as the page has loaded, paste in the Console:

```js
const start = performance.now();
const observer = new MutationObserver(() => {
  if (document.documentElement.dataset.perf === 'lite') {
    console.log('lite after ms:', Math.round(performance.now() - start));
    console.log('canvas mounted:', Boolean(document.querySelector('[data-testid="hero-scene"] canvas')));
    observer.disconnect();
  }
});
observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-perf'] });
```

3. Expected: `data-perf="lite"` and no canvas in about 4 s after the scene starts (0.5 s warm-up plus three 1 s windows). The snippet starts counting when pasted, so the figure can differ by about a second; report it as measured. Repeat three times and report all values.
4. Context loss check: in the Console run `document.querySelector('[data-testid="hero-scene"] canvas').getContext('webgl2').getExtension('WEBGL_lose_context').loseContext()`. Expected: the canvas disappears and the CSS background remains, with no errors in the Console.

#### Layout shift

Record CLS with the 3D enabled (Slow 4G, cache disabled, three reloads). The
canvas is absolutely positioned inside the Hero background and fades in over the
CSS background, so the expected CLS contribution is 0.

## Visual comparison

Capture the Hero and Projects at the same viewport, theme, language, browser
zoom, and loaded state before and after an optimization. Compare normal-motion
screenshots side by side; performance changes must not alter the rendered
design.