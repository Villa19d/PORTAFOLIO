/**
 * `three` and `HeroScene` are optional for the first paint: if they fail to download,
 * the Hero keeps its CSS poster. Reloading the page for them would hide the real
 * failure, so the global preload handler must let the error reach the Hero error
 * boundary instead.
 */
const OPTIONAL_CHUNK_PATTERN = /(?:^|\/)(?:three|HeroScene)[-.][^/]*\.js/i;

function payloadText(payload: unknown): string {
  if (payload instanceof Error) return payload.message;
  return typeof payload === 'string' ? payload : '';
}

/** True when a `vite:preloadError` payload points at an optional 3D chunk. */
export function isOptionalChunkFailure(payload: unknown): boolean {
  return OPTIONAL_CHUNK_PATTERN.test(payloadText(payload));
}
