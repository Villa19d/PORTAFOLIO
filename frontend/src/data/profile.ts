export interface StackItem {
  id: string;
  label: string;
  category: 'frontend' | 'backend' | 'devops' | 'tools';
  icon?: 'react' | 'typescript' | 'tailwind' | 'springboot' | 'postgresql' | 'docker';
  monogram?: string;
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
  bio: LocalizedText;
  stack: StackItem[];
  hobbies: LocalizedText;
  currently: LocalizedText;
  location: LocationInfo;
  cv: CvLinks;
}

export const PROFILE_DATA: ProfileData = {
  bio: {
    es: 'Ingeniero en Sistemas Computacionales y desarrollador Full Stack apasionado por la nube y arquitecturas escalables. Transformando problemas complejos en soluciones eficientes.',
    en: 'Computer Systems Engineer and Full Stack developer passionate about cloud computing and scalable architectures. Transforming complex problems into efficient solutions.',
  },
  stack: [
    { id: 'react', label: 'React', category: 'frontend', icon: 'react' },
    { id: 'typescript', label: 'TypeScript', category: 'frontend', icon: 'typescript' },
    { id: 'javascript', label: 'JavaScript', category: 'frontend', monogram: 'JS' },
    { id: 'tailwind', label: 'Tailwind CSS', category: 'frontend', icon: 'tailwind' },
    { id: 'node-express', label: 'Node.js / Express', category: 'backend', monogram: 'N/EX' },
    { id: 'python-django', label: 'Python / Django', category: 'backend', monogram: 'PY/DJ' },
    { id: 'java-spring', label: 'Java / Spring Boot', category: 'backend', icon: 'springboot' },
    { id: 'postgresql-mysql', label: 'PostgreSQL / MySQL', category: 'backend', icon: 'postgresql' },
    { id: 'aws', label: 'AWS', category: 'devops', monogram: 'AWS' },
    { id: 'docker', label: 'Docker', category: 'devops', icon: 'docker' },
    { id: 'cpp', label: 'C / C++', category: 'tools', monogram: 'C/C++' },
    { id: 'esp32-arduino', label: 'ESP32 / Arduino', category: 'tools', monogram: 'ESP/ARD' },
  ],
  hobbies: {
    es: 'Ajedrez competitivo, entrenamiento de fuerza, adiestramiento canino, guitarra, lectura e inversión en bolsa.',
    en: 'Competitive chess, strength training, dog training, guitar, reading, and stock market investing.',
  },
  currently: {
    es: 'Construyendo este portafolio con React 19 y Spring Boot; cursando 9.º semestre de Ing. en Sistemas Computacionales en el Instituto Tecnológico de Pachuca.',
    en: 'Building this portfolio with React 19 and Spring Boot; currently in the 9th semester of Computer Systems Engineering at Instituto Tecnológico de Pachuca.',
  },
  location: {
    city: 'Pachuca de Soto',
    country: 'México',
    timeZone: 'America/Mexico_City',
  },
  cv: {
    es: null,
    en: null,
  },
};
