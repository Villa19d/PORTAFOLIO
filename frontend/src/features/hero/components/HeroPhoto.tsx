import { useTranslation } from 'react-i18next';

export function HeroPhoto() {
  const { t } = useTranslation('common');

  return (
    <div className="relative mx-auto flex items-center justify-center lg:mx-0">
      {/* Ambient gradient glow behind the photo */}
      <div
        className="absolute -inset-2 rounded-[12px] bg-gradient-to-r from-accent to-accent-2 opacity-25 blur-2xl transition-opacity duration-500"
        aria-hidden="true"
      />

      {/* Frame: 4px border radius with brand gradient border and subtle glow */}
      <div className="relative rounded-[6px] bg-gradient-to-tr from-accent via-accent-2 to-accent p-[2px] shadow-[0_0_35px_-5px_rgba(0,229,255,0.28)] dark:shadow-[0_0_40px_-5px_rgba(0,229,255,0.22)]">
        <picture className="block overflow-hidden rounded-[4px] bg-surface">
          <source
            type="image/avif"
            srcSet="/assets/rodrigo/rodrigo-480.avif 480w, /assets/rodrigo/rodrigo-800.avif 800w, /assets/rodrigo/rodrigo-1200.avif 1200w"
            sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 380px"
          />
          <source
            type="image/webp"
            srcSet="/assets/rodrigo/rodrigo-480.webp 480w, /assets/rodrigo/rodrigo-800.webp 800w, /assets/rodrigo/rodrigo-1200.webp 1200w"
            sizes="(max-width: 640px) 240px, (max-width: 1024px) 300px, 380px"
          />
          <img
            src="/assets/rodrigo/rodrigo-800.webp"
            alt={t('hero.photoAlt')}
            width={424}
            height={529}
            fetchPriority="high"
            decoding="async"
            className="h-auto w-[220px] rounded-[4px] object-cover sm:w-[280px] md:w-[320px] lg:w-[380px]"
          />
        </picture>
      </div>
    </div>
  );
}
