-- Datos de muestra (seed) para entorno local.
-- IMPORTANTE: Este archivo es una migración REPETIBLE (prefijo R__).
-- Flyway la re-ejecuta si el checksum del archivo cambia.
-- Los INSERT son idempotentes: ON CONFLICT (slug) DO NOTHING garantiza
-- que re-ejecutar este archivo nunca causa errores ni duplicados.
-- Este archivo NO llega a producción porque solo se incluye en la ubicación
-- classpath:db/seed, que solo se carga en el perfil 'local'
-- (ver application-local.yml → spring.flyway.locations).

INSERT INTO projects (
    slug, title_es, title_en, summary_es, summary_en, description_es, description_en,
    tech_stack, image_url, video_url, repo_url, live_url, featured, published, display_order
) VALUES (
    'proyecto-alpha',
    'Proyecto Alpha (Seed)',
    'Project Alpha (Seed)',
    'Un proyecto de muestra para el portafolio.',
    'A sample project for the portfolio.',
    'Descripción larga del **Proyecto Alpha**.',
    'Long description for **Project Alpha**.',
    ARRAY['Java', 'Spring Boot', 'PostgreSQL'],
    'https://example.com/image1.jpg',
    NULL,
    'https://github.com/example/alpha',
    'https://alpha.example.com',
    true,
    true,
    1
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO projects (
    slug, title_es, title_en, summary_es, summary_en, description_es, description_en,
    tech_stack, image_url, video_url, repo_url, live_url, featured, published, display_order
) VALUES (
    'proyecto-beta',
    'Proyecto Beta (Seed)',
    'Project Beta (Seed)',
    'Segundo proyecto de muestra.',
    'Second sample project.',
    'Descripción del proyecto beta.',
    'Beta project description.',
    ARRAY['React', 'TypeScript', 'Tailwind'],
    'https://example.com/image2.jpg',
    'https://example.com/video2.mp4',
    'https://github.com/example/beta',
    NULL,
    false,
    true,
    2
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO projects (
    slug, title_es, title_en, summary_es, summary_en, description_es, description_en,
    tech_stack, image_url, video_url, repo_url, live_url, featured, published, display_order
) VALUES (
    'proyecto-oculto',
    'Proyecto Oculto (Seed)',
    'Hidden Project (Seed)',
    'Este proyecto no debe verse en producción.',
    'This project should not be seen in production.',
    'Detalles ocultos.',
    'Hidden details.',
    ARRAY['Node.js', 'MongoDB'],
    'https://example.com/image3.jpg',
    NULL,
    'https://github.com/example/hidden',
    NULL,
    false,
    false,
    3
) ON CONFLICT (slug) DO NOTHING;
