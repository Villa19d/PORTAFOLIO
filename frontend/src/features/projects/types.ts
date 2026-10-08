export interface LocalizedText {
  es: string;
  en: string;
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
}
