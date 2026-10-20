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

## Visual comparison

Capture the Hero and Projects at the same viewport, theme, language, browser
zoom, and loaded state before and after an optimization. Compare normal-motion
screenshots side by side; performance changes must not alter the rendered
design.
