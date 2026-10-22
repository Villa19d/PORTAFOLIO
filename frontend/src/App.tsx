import { useTranslation } from 'react-i18next';
import { Navbar } from './components/layout/Navbar';
import { Section } from './components/layout/Section';
import { Hero } from './features/hero/components/Hero';
import { ProjectsSection } from './features/projects/components/ProjectsSection';
import { SITE_CONFIG } from './data/site';
import { AboutSection } from './features/about/AboutSection';

export default function App() {
  const { t } = useTranslation('common');
  const currentYear = new Date().getFullYear();

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main id="main-content" className="flex-1">
        <Hero />

        <AboutSection />

        <ProjectsSection />

        <Section id="contact" titleKey="sections.contact" title={t('sections.contact')}>
          <p className="text-text-muted text-lg max-w-prose">{t('sections.contactPlaceholder')}</p>
        </Section>
      </main>

      <footer className="border-t border-border py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-text-muted">
          <span>
            &copy; {currentYear} {SITE_CONFIG.authorName}. {t('footer.rights')}
          </span>
          <div className="flex items-center gap-6">
            {SITE_CONFIG.githubUrl && (
              <a
                href={SITE_CONFIG.githubUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-accent transition-colors"
              >
                GitHub
              </a>
            )}
            <a
              href={SITE_CONFIG.linkedinUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-accent transition-colors"
            >
              LinkedIn
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
