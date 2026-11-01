/**
 * `three`, `HeroScene` and the Bento mini world are optional: if they fail to download,
 * the Hero keeps its CSS poster and the Bento keeps its static card. Reloading the page
 * for them would hide the real failure, so the global preload handler lets the error
 * reach the error boundary of each feature instead.
 */
const OPTIONAL_CHUNK_PATTERN = /(?:^|\/)(?:three|HeroScene|BentoWorldCanvas)[-.][^/]*\.js/i;

function payloadText(payload: unknown): string {
  if (payload instanceof Error) return payload.message;
  return typeof payload === 'string' ? payload : '';
}

/** True when a `vite:preloadError` payload points at an optional 3D chunk. */
export function isOptionalChunkFailure(payload: unknown): boolean {
  return OPTIONAL_CHUNK_PATTERN.test(payloadText(payload));
}
