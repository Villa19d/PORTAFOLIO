import { useTranslation } from 'react-i18next';
import { useCapabilities } from './hooks/useCapabilities';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageToggle } from './components/LanguageToggle';
import { useSmoothScroll } from './components/SmoothScrollProvider';

export default function App() {
  const { t } = useTranslation('common');
  const caps = useCapabilities();
  const { scrollTo } = useSmoothScroll();

  return (
    <div className="min-h-screen p-8 max-w-4xl mx-auto space-y-12">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-2xl shadow-soft border border-border-subtle">
        <div>
          <h1 className="text-3xl font-display font-bold text-accent-violet">
            Portfolio Foundations
          </h1>
          <p className="text-text-muted mt-2">Página de pruebas visuales (Temporal)</p>
        </div>
        <div className="flex gap-4">
          <LanguageToggle />
          <ThemeToggle />
        </div>
      </header>

      <section className="bg-surface p-6 rounded-2xl shadow-soft border border-border-subtle space-y-4">
        <h2 className="text-2xl font-bold font-display">Traducciones</h2>
        <div className="flex gap-4">
          <span className="px-3 py-1 bg-accent-cyan/10 text-accent-cyan rounded-full font-mono text-sm">nav.projects: {t('nav.projects')}</span>
          <span className="px-3 py-1 bg-accent-violet/10 text-accent-violet rounded-full font-mono text-sm">hero.placeholder: {t('hero.placeholder')}</span>
        </div>
      </section>

      <section className="bg-surface p-6 rounded-2xl shadow-soft border border-border-subtle space-y-4">
        <h2 className="text-2xl font-bold font-display">useCapabilities</h2>
        <ul className="space-y-2 font-mono text-sm">
          <li>hasFinePointer: <span className={caps.hasFinePointer ? "text-accent-cyan" : "text-red-500"}>{String(caps.hasFinePointer)}</span></li>
          <li>isDesktopLayout: <span className={caps.isDesktopLayout ? "text-accent-cyan" : "text-red-500"}>{String(caps.isDesktopLayout)}</span></li>
          <li>prefersReducedMotion: <span className={caps.prefersReducedMotion ? "text-accent-cyan" : "text-red-500"}>{String(caps.prefersReducedMotion)}</span></li>
          <li>canUseHeavyEffects: <span className={caps.canUseHeavyEffects ? "text-accent-cyan" : "text-red-500"}>{String(caps.canUseHeavyEffects)}</span></li>
        </ul>
      </section>

      <section className="bg-surface p-6 rounded-2xl shadow-soft border border-border-subtle space-y-4">
        <h2 className="text-2xl font-bold font-display">Paleta de Colores</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="h-24 rounded-xl bg-bg border border-border-subtle flex items-center justify-center font-mono text-xs">bg</div>
          <div className="h-24 rounded-xl bg-surface border border-border-subtle flex items-center justify-center font-mono text-xs">surface</div>
          <div className="h-24 rounded-xl bg-accent-violet flex items-center justify-center font-mono text-xs text-white">accent-violet</div>
          <div className="h-24 rounded-xl bg-accent-cyan flex items-center justify-center font-mono text-xs text-black">accent-cyan</div>
        </div>
      </section>

      <section className="bg-surface p-6 rounded-2xl shadow-soft border border-border-subtle space-y-4">
        <h2 className="text-2xl font-bold font-display">Prueba de Scroll (Lenis)</h2>
        <div className="flex gap-4">
          <button 
            onClick={() => scrollTo('#seccion-proyectos')}
            className="px-6 py-2 bg-accent-violet text-white rounded-xl font-bold hover:opacity-90 transition-opacity focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-cyan"
          >
            Ver proyectos
          </button>
          <button 
            onClick={() => scrollTo('#seccion-contacto')}
            className="px-6 py-2 border-2 border-accent-cyan text-accent-cyan rounded-xl font-bold hover:bg-accent-cyan/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent-violet"
          >
            Contáctame
          </button>
        </div>
      </section>

      <div className="h-[100vh] border-l-4 border-dashed border-border-subtle flex items-center pl-8 text-text-muted">
        Espacio para scroll...
      </div>

      <section id="seccion-proyectos" className="min-h-screen bg-surface p-12 rounded-3xl shadow-glow border border-accent-violet flex items-center justify-center">
        <h2 className="text-5xl font-display font-bold text-accent-violet">SECCIÓN PROYECTOS</h2>
      </section>

      <div className="h-[50vh] border-l-4 border-dashed border-border-subtle flex items-center pl-8 text-text-muted">
        Más espacio...
      </div>

      <section id="seccion-contacto" className="min-h-screen bg-surface p-12 rounded-3xl shadow-glow border border-accent-cyan flex items-center justify-center">
        <h2 className="text-5xl font-display font-bold text-accent-cyan">SECCIÓN CONTACTO</h2>
      </section>
    </div>
  );
}
