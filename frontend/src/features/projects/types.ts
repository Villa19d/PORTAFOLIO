export interface LocalizedText {
  es: string;
  en: string;
}

export type MediaType = 'IMAGE' | 'YOUTUBE';

export interface MediaItem {
  type: MediaType;
  url: string;
}

export interface RepoItem {
  label?: string | null;
  url: string;
}

export interface Project {
  id: string;
  slug: string;
  title: LocalizedText;
  summary: LocalizedText;
  description: LocalizedText;
  techStack: string[];
  imageUrl: string;
  videoUrl: string | null;
  repoUrl: string;
  liveUrl: string | null;
  featured: boolean;
  published: boolean;
  displayOrder: number;
  createdAt: string;
  updatedAt: string;
  /** Optional: the snapshot written before S13 does not have it. Order = display order. */
  media?: MediaItem[];
  /** Optional for the same reason. `repoUrl` is always `repos[0].url` when present. */
  repos?: RepoItem[];
}