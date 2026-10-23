import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { PROFILE_BASE_DATA } from '../../../data/profile-base';

interface LocationTileProps {
  clock?: () => Date;
  timeZone?: string;
}

const systemClock = () => new Date();

function getLocalTime(timeZone: string, clock: () => Date): string {
  return new Intl.DateTimeFormat('en-GB', {
    timeZone,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).format(clock());
}

export function LocationTile({
  clock = systemClock,
  timeZone = PROFILE_BASE_DATA.location.timeZone,
}: LocationTileProps) {
  const { t } = useTranslation('common');
  const { city, country } = PROFILE_BASE_DATA.location;
  const [localTime, setLocalTime] = useState(() => getLocalTime(timeZone, clock));

  useEffect(() => {
    const updateTime = () => setLocalTime(getLocalTime(timeZone, clock));

    updateTime();
    const intervalId = window.setInterval(updateTime, 60_000);

    return () => window.clearInterval(intervalId);
  }, [clock, timeZone]);

  return (
    <section
      aria-label={t('about.locationLabel')}
      className="
        relative isolate overflow-hidden
        h-full min-h-0
        bg-surface p-5
      "
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 h-full w-full text-white opacity-[0.03]"
        viewBox="0 0 160 160"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <pattern
            id="location-tile-dots"
            width="16"
            height="16"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1" fill="currentColor" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#location-tile-dots)" />
      </svg>

      <div className="relative flex h-full flex-col gap-3">
        <h3 className="text-sm font-mono uppercase tracking-widest text-text-muted">
          {t('about.locationLabel')}
        </h3>

        <div>
          <p className="font-display text-lg leading-snug text-text">{city}</p>
          <p className="text-sm text-text-muted">{country}</p>
        </div>

        <time
          className="mt-auto font-mono text-2xl tabular-nums text-text"
          dateTime={localTime}
          aria-label={localTime}
        >
          {localTime}
        </time>
      </div>
    </section>
  );
}
