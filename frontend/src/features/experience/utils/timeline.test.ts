import { describe, expect, it } from 'vitest';
import type { TimelineEntry } from '../../../data/profile';
import {
  formatTimelineDate,
  formatTimelinePeriod,
  sortTimelineEntries,
} from './timeline';

function createEntry(
  id: string,
  start: string,
  end: string | null,
): Pick<TimelineEntry, 'id' | 'start' | 'end'> {
  return { id, start, end };
}

describe('timeline date helpers', () => {
  it('formats month-only and full dates using the requested locale', () => {
    expect(formatTimelineDate('2026-10', 'es')).toBe('oct 2026');
    expect(formatTimelineDate('2026-04-23', 'en')).toBe('Apr 23, 2026');
  });

  it('shows one date when start and end are the same', () => {
    expect(
      formatTimelinePeriod({ start: '2026-04-23', end: '2026-04-23' }, 'es'),
    ).toBe('23 abr 2026');
  });

  it('shows a range or the localized present label', () => {
    expect(
      formatTimelinePeriod({ start: '2026-02', end: '2026-04' }, 'en'),
    ).toBe('Feb 2026 – Apr 2026');
    expect(formatTimelinePeriod({ start: '2026-10', end: null }, 'es')).toBe(
      'oct 2026 – Presente',
    );
    expect(formatTimelinePeriod({ start: '2026-10', end: null }, 'en-US')).toBe(
      'Oct 2026 – Present',
    );
  });

  it('sorts by effective end date, then start date, without mutating the source', () => {
    const entries = [
      createEntry('active-older-start', '2025-01', null),
      createEntry('closed-later', '2020-01', '2026-10-10'),
      createEntry('active-newer-start', '2026-10', null),
      createEntry('closed-earlier', '2024-01', '2026-05-20'),
      createEntry('same-end-older-start', '2021-01', '2026-04-30'),
      createEntry('same-end-newer-start', '2024-01', '2026-04-30'),
    ];

    const sorted = sortTimelineEntries(entries, new Date('2026-10-22T12:00:00.000Z'));

    expect(sorted.map(({ id }) => id)).toEqual([
      'active-newer-start',
      'active-older-start',
      'closed-later',
      'closed-earlier',
      'same-end-newer-start',
      'same-end-older-start',
    ]);
    expect(entries.map(({ id }) => id)).toEqual([
      'active-older-start',
      'closed-later',
      'active-newer-start',
      'closed-earlier',
      'same-end-older-start',
      'same-end-newer-start',
    ]);
  });

  it('rejects malformed or impossible dates', () => {
    expect(() => formatTimelineDate('2026-13', 'en')).toThrow(RangeError);
    expect(() => formatTimelineDate('2026-02-30', 'es')).toThrow(RangeError);
  });
});
