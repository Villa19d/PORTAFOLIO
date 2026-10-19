import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { Swiper as SwiperInstance } from 'swiper';
import { A11y, EffectCoverflow, Keyboard } from 'swiper/modules';
import { Swiper, SwiperSlide } from 'swiper/react';
import type { Project } from '../types';
import { ProjectCard } from './ProjectCard';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

interface CoverflowTrackProps {
  projects: Project[];
}

export function CoverflowTrack({ projects }: CoverflowTrackProps) {
  const { t } = useTranslation('common');
  const swiperRef = useRef<SwiperInstance | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  return (
    <div className="project-coverflow">
      <Swiper
        modules={[EffectCoverflow, Keyboard, A11y]}
        effect="coverflow"
        centeredSlides
        slidesPerView="auto"
        loop={false}
        slideToClickedSlide
        keyboard={{ enabled: true, onlyInViewport: true }}
        coverflowEffect={{
          rotate: 35,
          depth: 180,
          slideShadows: false,
        }}
        speed={600}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
          setActiveIndex(swiper.activeIndex);
        }}
        onSlideChange={(swiper) => setActiveIndex(swiper.activeIndex)}
        a11y={{
          prevSlideMessage: t('projects.previous'),
          nextSlideMessage: t('projects.next'),
          firstSlideMessage: t('projects.firstSlide'),
          lastSlideMessage: t('projects.lastSlide'),
          slideLabelMessage: t('projects.slideLabel'),
        }}
        className="project-coverflow__swiper"
      >
        {projects.map((project, index) => (
          <SwiperSlide
            className="project-coverflow__slide"
            key={project.slug}
            onClickCapture={(event) => {
              const swiper = swiperRef.current;
              if (swiper && index !== swiper.activeIndex) {
                event.preventDefault();
                event.stopPropagation();
                swiper.slideTo(index);
              }
            }}
          >
            {({ isActive }) => (
              <>
                <ProjectCard project={project} isActive={isActive} />
                <div
                  className="project-coverflow__overlay"
                  aria-hidden="true"
                  data-active={isActive}
                />
                <span className="sr-only">
                  {t('projects.slidePosition', { current: index + 1, total: projects.length })}
                </span>
              </>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="project-coverflow__controls">
        <button
          className="project-coverflow__navigation"
          type="button"
          aria-label={t('projects.previous')}
          disabled={activeIndex === 0}
          onClick={() => swiperRef.current?.slidePrev()}
        >
          <span aria-hidden="true">←</span>
        </button>
        <div
          className="project-coverflow__pagination"
          role="group"
          aria-label={t('projects.pagination')}
        >
          {projects.map((project, index) => (
            <button
              className="project-coverflow__pagination-button"
              type="button"
              key={project.slug}
              aria-label={t('projects.goToSlide', {
                current: index + 1,
                total: projects.length,
              })}
              aria-current={activeIndex === index ? 'true' : undefined}
              onClick={() => swiperRef.current?.slideTo(index)}
            />
          ))}
        </div>
        <button
          className="project-coverflow__navigation"
          type="button"
          aria-label={t('projects.next')}
          disabled={activeIndex === projects.length - 1}
          onClick={() => swiperRef.current?.slideNext()}
        >
          <span aria-hidden="true">→</span>
        </button>
      </div>
    </div>
  );
}
