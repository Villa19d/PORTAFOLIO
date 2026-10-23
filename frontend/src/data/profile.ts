import { PROFILE_BASE_DATA } from './profile-base';

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

export type TimelineEntryKind = 'work' | 'education' | 'certification';

export interface TimelineEntry {
  id: string;
  kind: TimelineEntryKind;
  start: string;
  end: string | null;
  organization: string;
  title: LocalizedText;
  bullets: LocalizedText[];
  tags?: string[];
  draft: boolean;
}

export interface ProfileBaseData {
  bio: LocalizedText;
  stack: StackItem[];
  hobbies: LocalizedText;
  currently: LocalizedText;
  location: LocationInfo;
  cv: CvLinks;
}

export interface ProfileData extends ProfileBaseData {
  timeline: TimelineEntry[];
}

export const PROFILE_DATA: ProfileData = {
  ...PROFILE_BASE_DATA,
  timeline: [
    {
      id: 'outlier-ai-trainer',
      kind: 'work',
      start: '2026-10',
      end: null,
      organization: 'Outlier',
      title: { es: 'AI Trainer (freelance)', en: 'AI Trainer (freelance)' },
      bullets: [
        {
          es: 'Trabajo remoto bajo acuerdo de confidencialidad; los detalles no se publican.',
          en: 'Remote work under a confidentiality agreement; details are not published.',
        },
      ],
      draft: false,
    },
    {
      id: 'itp-sistemas',
      kind: 'education',
      start: '2022-08',
      end: null,
      organization: 'Instituto Tecnológico de Pachuca',
      title: {
        es: 'Ingeniería en Sistemas Computacionales (9.º semestre)',
        en: 'B.Eng. in Computer Systems (9th semester)',
      },
      bullets: [
        {
          es: 'Representé al instituto en el Torneo Nacional Intertecnológicos de Ajedrez (Colima, octubre de 2026) y quedé en 8.º lugar general.',
          en: 'Represented the institute at the National Intertechnological Chess Tournament (Colima, October 2026), finishing 8th overall.',
        },
      ],
      draft: false,
    },
    {
      id: 'unam-seminario-ia-java',
      kind: 'certification',
      start: '2026-04-23',
      end: '2026-04-23',
      organization: 'DGTIC, UNAM',
      title: {
        es: 'Seminario TIC: IA + Java, cinco patrones reales en producción',
        en: 'ICT Seminar: AI + Java, five real production patterns',
      },
      bullets: [
        {
          es: 'Constancia de asistencia (60 min). Integración de modelos de IA en ecosistemas Java empresariales.',
          en: 'Attendance certificate (60 min). Integrating AI models into enterprise Java ecosystems.',
        },
      ],
      draft: false,
    },
    {
      id: 'aws-academy-cloud-foundations',
      kind: 'certification',
      start: '2026-02-14',
      end: '2026-02-14',
      organization: 'AWS Academy',
      title: {
        es: 'Cloud Foundations (insignia de capacitación)',
        en: 'Cloud Foundations (training badge)',
      },
      bullets: [
        {
          es: 'EC2, S3, RDS y VPC; modelo de responsabilidad compartida, IAM y estructuras de costos.',
          en: 'EC2, S3, RDS and VPC; shared responsibility model, IAM and cost structures.',
        },
      ],
      tags: ['AWS'],
      draft: false,
    },
    {
      id: 'cisco-python-essentials',
      kind: 'certification',
      start: '2026-02-15',
      end: '2026-04-01',
      organization: 'Cisco Networking Academy',
      title: { es: 'Python Essentials 1 y 2', en: 'Python Essentials 1 & 2' },
      bullets: [
        {
          es: 'Control de flujo, tipos de datos y lógica (nivel 1); POO, módulos, excepciones y archivos (nivel 2).',
          en: 'Control flow, data types and logic (level 1); OOP, modules, exceptions and file processing (level 2).',
        },
      ],
      tags: ['Python'],
      draft: false,
    },
    {
      id: 'aws-educate-badges',
      kind: 'certification',
      start: '2026-03-28',
      end: '2026-04-04',
      organization: 'AWS Educate',
      title: {
        es: 'Introduction to Cloud 101 y Getting Started with Storage (insignias)',
        en: 'Introduction to Cloud 101 and Getting Started with Storage (badges)',
      },
      bullets: [
        {
          es: 'Fundamentos de la nube y almacenamiento: S3, EBS y EFS, y selección de clases de almacenamiento por costo.',
          en: 'Cloud fundamentals and storage: S3, EBS and EFS, and choosing storage classes by cost.',
        },
      ],
      tags: ['AWS'],
      draft: false,
    },
    {
      id: 'hacking-etico',
      kind: 'certification',
      start: '2026-03-31',
      end: '2026-03-31',
      organization: 'Udemy',
      title: {
        es: 'Hacking Ético: Rastreo y Pentesting',
        en: 'Ethical Hacking: Tracing and Pentesting',
      },
      bullets: [
        {
          es: 'Auditoría de redes con Nmap, Metasploit y Aircrack-ng, y OSINT, en entornos controlados.',
          en: 'Network auditing with Nmap, Metasploit and Aircrack-ng, and OSINT, in controlled environments.',
        },
      ],
      tags: ['Seguridad'],
      draft: false,
    },
    {
      id: 'git-github',
      kind: 'certification',
      start: '2024-04-10',
      end: '2024-04-10',
      organization: 'Udemy',
      title: {
        es: 'Git + GitHub: un sistema de control de versiones desde cero',
        en: 'Git + GitHub: a version control system from scratch',
      },
      bullets: [
        {
          es: 'Ramas, fusiones, resolución de conflictos, Git Flow, forks y pull requests.',
          en: 'Branching, merging, conflict resolution, Git Flow, forks and pull requests.',
        },
      ],
      draft: false,
    },
    {
      id: 'js-moderno',
      kind: 'certification',
      start: '2026-04-29',
      end: '2026-04-29',
      organization: 'Udemy (Juan Pablo de la Torre)',
      title: {
        es: 'JavaScript Moderno: guía definitiva (+20 proyectos)',
        en: 'Modern JavaScript: definitive guide (20+ projects)',
      },
      bullets: [
        {
          es: '52 horas de curso; app MERN con JWT y envío de correos, y migración de proyectos a TypeScript.',
          en: '52-hour course; MERN app with JWT and email delivery, and migration of projects to TypeScript.',
        },
      ],
      tags: ['JavaScript', 'React'],
      draft: false,
    },
    {
      id: 'pet-b1',
      kind: 'certification',
      start: '2018-06',
      end: '2018-06',
      organization: 'Cambridge English',
      title: {
        es: 'PET (Preliminary English Test), nivel B1',
        en: 'PET (Preliminary English Test), level B1',
      },
      bullets: [],
      draft: false,
    },
  ],
};
