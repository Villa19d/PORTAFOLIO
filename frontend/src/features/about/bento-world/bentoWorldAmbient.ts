/**
 * Room ambience (ticket 12.5 B): the visitor's local clock picks the initial mode and
 * the desk device can switch it by hand. Kept dependency free so it can be unit tested.
 */
export type AmbientMode = 'night' | 'day';

/** Day runs from 07:00 (inclusive) to 19:00 (exclusive), local time. */
export const DAY_START_HOUR = 7;
export const DAY_END_HOUR = 19;

/** Transition length between night and day, in seconds. */
export const AMBIENT_TRANSITION_SECONDS = 0.6;

/** Initial room mode from the visitor's clock: 07:00-19:00 is day, the rest is night. */
export function resolveAmbientMode(date: Date): AmbientMode {
  const hour = date.getHours();
  return hour >= DAY_START_HOUR && hour < DAY_END_HOUR ? 'day' : 'night';
}
