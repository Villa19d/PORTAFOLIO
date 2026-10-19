interface PlaceholderArtProps {
  slug: string;
  title: string;
}

function hashSlug(slug: string): number {
  let hash = 2166136261;
  for (let index = 0; index < slug.length; index++) {
    hash ^= slug.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function getInitials(title: string): string {
  return title
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase() ?? '')
    .join('');
}

export function PlaceholderArt({ slug, title }: PlaceholderArtProps) {
  const hash = hashSlug(slug);
  const rotation = hash % 360;
  const initials = getInitials(title);
  const gradientId = `placeholder-gradient-${hash}`;
  const gridId = `placeholder-grid-${hash}`;

  return (
    <svg
      className="project-card__placeholder"
      viewBox="0 0 800 500"
      role="img"
      aria-label={title}
      preserveAspectRatio="xMidYMid slice"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient
          id={gradientId}
          x1="0"
          y1="0"
          x2="800"
          y2="500"
          gradientTransform={`rotate(${rotation} 400 250)`}
        >
          <stop offset="0%" stopColor="var(--accent-primary)" />
          <stop offset="100%" stopColor="var(--accent-secondary)" />
        </linearGradient>
        <pattern id={gridId} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M 32 0 L 0 0 0 32" fill="none" stroke="white" strokeOpacity=".15" />
        </pattern>
      </defs>
      <rect width="800" height="500" fill="var(--surface-elevated)" />
      <path
        d="M 0 390 C 180 290 280 500 480 350 S 680 260 800 310 L 800 500 L 0 500 Z"
        fill={`url(#${gradientId})`}
        fillOpacity=".42"
      />
      <rect width="800" height="500" fill={`url(#${gridId})`} />
      <circle
        cx={160 + (hash % 480)}
        cy={100 + ((hash >>> 8) % 280)}
        r="150"
        fill={`url(#${gradientId})`}
        fillOpacity=".24"
      />
      <text
        x="400"
        y="275"
        fill="var(--text-main)"
        fillOpacity=".9"
        fontFamily="Space Grotesk Variable, sans-serif"
        fontSize="112"
        fontWeight="700"
        textAnchor="middle"
      >
        {initials}
      </text>
    </svg>
  );
}
