export interface StackItem {
  id: string;
  label: string;
  category: 'frontend' | 'backend' | 'devops' | 'tools';
}

export interface LocationInfo {
  city: string;
  country: string;
  timeZone: string;
}

export interface CvLinks {
  es: string | null;
  en: string | null;
}

export interface LocalizedText {
  es: string;
  en: string;
}

export interface Experience {
  id: string;
  company: string;
  role: LocalizedText;
  period: string;
  description: LocalizedText;
  skills?: string[];
}

export interface Education {
  id: string;
  institution: string;
  degree: LocalizedText;
  period: string;
}

export interface ProfileData {
  stack: StackItem[];
  hobbies: LocalizedText;
  currently: LocalizedText;
  location: LocationInfo;
  cv: CvLinks;
}

export const PROFILE_DATA: ProfileData = {
  stack: [
    { id: 'react', label: 'React', category: 'frontend' },
    { id: 'typescript', label: 'TypeScript', category: 'frontend' },
    { id: 'vite', label: 'Vite', category: 'frontend' },
    { id: 'tailwind', label: 'Tailwind CSS', category: 'frontend' },
    { id: 'java', label: 'Java', category: 'backend' },
    { id: 'springboot', label: 'Spring Boot', category: 'backend' },
    { id: 'postgresql', label: 'PostgreSQL', category: 'backend' },
    { id: 'docker', label: 'Docker', category: 'devops' },
    { id: 'git', label: 'Git', category: 'tools' },
    { id: 'vercel', label: 'Vercel', category: 'devops' },
    { id: 'render', label: 'Render', category: 'devops' },
  ],
  hobbies: {
    es: 'Videojuegos, lectura, gimnasio y fotografía.',
    en: 'Video games, reading, gym, and photography.',
  },
  currently: {
    es: '[TODO_CONTENT] Construyendo este portafolio con React 19 y Spring Boot',
    en: '[TODO_CONTENT] Building this portfolio with React 19 and Spring Boot',
  },
  location: {
    city: 'Pachuca, Hidalgo',
    country: 'México',
    timeZone: 'America/Mexico_City',
  },
  cv: {
    es: '/cv/cv-es.pdf',
    en: '/cv/cv-en.pdf',
  },
};
