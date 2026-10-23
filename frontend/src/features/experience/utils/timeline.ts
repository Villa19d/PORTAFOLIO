import type { TimelineEntry } from '../../../data/profile';

export type TimelineLanguage = 'es' | 'en';

function normalizeLanguage(language: string): TimelineLanguage {
  return language.toLowerCase().startsWith('en') ? 'en' : 'es';
}

function parseTimelineDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})(?:-(\d{2}))?$/.exec(value);

  if (!match) {
    throw new RangeError(`Invalid timeline date: ${value}`);
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3] ?? '1');
  const date = new Date(0);
  date.setUTCHours(0, 0, 0, 0);
  date.setUTCFullYear(year, month - 1, day);

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new RangeError(`Invalid timeline date: ${value}`);
  }

  return date;
}

export function formatTimelineDate(value: string, language: string): string {
  const date = parseTimelineDate(value);
  const hasDay = value.length === 10;

  return new Intl.DateTimeFormat(normalizeLanguage(language), {
    ...(hasDay ? { day: 'numeric' as const } : {}),
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatTimelinePeriod(
  entry: Pick<TimelineEntry, 'start' | 'end'>,
  language: string,
): string {
  const start = formatTimelineDate(entry.start, language);

  if (entry.end === entry.start) {
    return start;
  }

  const end = entry.end
    ? formatTimelineDate(entry.end, language)
    : normalizeLanguage(language) === 'en'
      ? 'Present'
      : 'Presente';

  return `${start} – ${end}`;
}

export function sortTimelineEntries<T extends Pick<TimelineEntry, 'start' | 'end'>>(
  entries: readonly T[],
  today: Date = new Date(),
): T[] {
  const todayIso = today.toISOString().slice(0, 10);
  const todayTime = parseTimelineDate(todayIso).getTime();

  return [...entries].sort((left, right) => {
    const leftEndTime = left.end ? parseTimelineDate(left.end).getTime() : todayTime;
    const rightEndTime = right.end ? parseTimelineDate(right.end).getTime() : todayTime;

    if (leftEndTime !== rightEndTime) {
      return rightEndTime - leftEndTime;
    }

    return parseTimelineDate(right.start).getTime() - parseTimelineDate(left.start).getTime();
  });
}
