import { PROFILE_DATA } from '../../data/profile';
import projects from '../../data/projects.snapshot.json';

export type TerminalLanguage = 'es' | 'en';

export type TerminalContext = {
  language: TerminalLanguage;
  history: string[];
  username?: string;
  onContact: () => void;
  onTheme: (theme: 'dark' | 'light') => void;
  onLanguage: (language: TerminalLanguage) => void;
  onSound: (enabled: boolean) => void;
};

type ProjectSnapshot = { title: { es: string; en: string }; summary: { es: string; en: string } };

const virtualFiles = {
  'about.md': (language: TerminalLanguage) => PROFILE_DATA.bio[language],
  'stack.txt': () => PROFILE_DATA.stack.map((item) => item.label).join('\n'),
  'projects.json': (language: TerminalLanguage) =>
    JSON.stringify(
      (projects as ProjectSnapshot[]).map(({ title, summary }) => ({
        title: title[language],
        summary: summary[language],
      })),
      null,
      2,
    ),
} as const;

const text = {
  es: {
    help: 'Comandos: help, about, skills, projects, experience, contact, whoami, ls, cat <archivo>, history, clear, theme dark|light, lang es|en, sound on|off, sudo hire rodrigo',
    about: PROFILE_DATA.bio.es,
    skills: () => PROFILE_DATA.stack.map((item) => item.label).join(' · '),
    projects: (count: number) => `${count} proyectos publicados.`,
    experience: (count: number) => `${count} entradas en la trayectoria profesional.`,
    contact: 'Desplazando a contacto…',
    whoami: (username: string) => `usuario: ${username}`,
    files: 'about.md\nstack.txt\nprojects.json',
    missingFile: 'cat: archivo no encontrado',
    history: 'Historial de la sesión:',
    theme: (theme: string) => `Tema cambiado a ${theme}.`,
    lang: (language: string) => `Idioma cambiado a ${language}.`,
    sound: (state: string) => `Sonido ${state === 'on' ? 'activado' : 'desactivado'}.`,
    hire: 'sudo: excelente decisión. Hablemos.',
    unknown: (command: string) => `${command}: command not found. Prueba "help".`,
    usage: 'Uso: ',
  },
  en: {
    help: 'Commands: help, about, skills, projects, experience, contact, whoami, ls, cat <file>, history, clear, theme dark|light, lang es|en, sound on|off, sudo hire rodrigo',
    about: PROFILE_DATA.bio.en,
    skills: () => PROFILE_DATA.stack.map((item) => item.label).join(' · '),
    projects: (count: number) => `${count} published projects.`,
    experience: (count: number) => `${count} career entries.`,
    contact: 'Scrolling to contact…',
    whoami: (username: string) => `user: ${username}`,
    files: 'about.md\nstack.txt\nprojects.json',
    missingFile: 'cat: file not found',
    history: 'Session history:',
    theme: (theme: string) => `Theme changed to ${theme}.`,
    lang: (language: string) => `Language changed to ${language}.`,
    sound: (state: string) => `Sound ${state === 'on' ? 'enabled' : 'disabled'}.`,
    hire: 'sudo: excellent decision. Let’s talk.',
    unknown: (command: string) => `${command}: command not found. Try "help".`,
    usage: 'Usage: ',
  },
} as const;

/**
 * Presentation tag for a result line. The window colours each line from it, so the
 * classification lives here, where the outcome is actually known.
 */
export type TerminalResultKind = 'output' | 'success' | 'error';

export type TerminalResultLine = {
  kind: TerminalResultKind;
  text: string;
};

const output = (text: string): TerminalResultLine => ({ kind: 'output', text });
const success = (text: string): TerminalResultLine => ({ kind: 'success', text });
const failure = (text: string): TerminalResultLine => ({ kind: 'error', text });

/**
 * Same commands, same order, same side effects and the same strings as before;
 * each line just carries its kind. `executeCommand` below keeps the plain API.
 */
export function executeCommandLines(cmd: string, context: TerminalContext): TerminalResultLine[] {
  const input = cmd.trim();
  if (!input) return [];
  const [command, ...args] = input.toLocaleLowerCase().split(/\s+/);
  const copy = text[context.language];

  switch (command) {
    case 'help':
      return [output(copy.help)];
    case 'about':
      return [output(PROFILE_DATA.bio[context.language])];
    case 'skills':
      return [output(copy.skills())];
    case 'projects':
      return [output(copy.projects(projects.length))];
    case 'experience':
      return [output(copy.experience(PROFILE_DATA.timeline.length))];
    case 'contact':
      context.onContact();
      return [output(copy.contact)];
    case 'whoami':
      return [output(copy.whoami(context.username ?? (context.language === 'es' ? 'invitado' : 'guest')))];
    case 'ls':
      return [output(copy.files)];
    case 'cat': {
      const filename = args[0] as keyof typeof virtualFiles | undefined;
      return filename && filename in virtualFiles
        ? [output(virtualFiles[filename](context.language))]
        : [failure(`${copy.missingFile}: ${args[0] ?? ''}`)];
    }
    case 'history':
      return [output(copy.history), ...context.history.map(output)];
    case 'clear':
      return [];
    case 'theme':
      if (args[0] === 'dark' || args[0] === 'light') {
        context.onTheme(args[0]);
        return [success(copy.theme(args[0]))];
      }
      return [failure(`${copy.usage}theme dark|light`)];
    case 'lang':
      if (args[0] === 'es' || args[0] === 'en') {
        context.onLanguage(args[0]);
        return [success(copy.lang(args[0]))];
      }
      return [failure(`${copy.usage}lang es|en`)];
    case 'sound':
      if (args[0] === 'on' || args[0] === 'off') {
        context.onSound(args[0] === 'on');
        return [success(copy.sound(args[0]))];
      }
      return [failure(`${copy.usage}sound on|off`)];
    case 'sudo':
      return args.join(' ') === 'hire rodrigo' ? [success(copy.hire)] : [failure(copy.unknown(input))];
    default:
      return [failure(copy.unknown(input))];
  }
}

/** Plain text result, kept for callers that do not need the presentation tag. */
export function executeCommand(cmd: string, context: TerminalContext): string[] {
  return executeCommandLines(cmd, context).map((line) => line.text);
}
