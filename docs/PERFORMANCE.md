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

## Visual comparison

Capture the Hero and Projects at the same viewport, theme, language, browser
zoom, and loaded state before and after an optimization. Compare normal-motion
screenshots side by side; performance changes must not alter the rendered
design.
