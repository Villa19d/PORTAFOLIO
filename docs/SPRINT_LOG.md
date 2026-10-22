# Registro de Sprints

| Sprint | Fecha | Resultado | Notas |
|---|---|---|---|
| Sprint 0 | 2024-10-06 | Estructura base, BD local (Docker) y CI/CD | Tickets 0.1 (Monorepo base) y 0.2 (Workflows de CI) completados. |
| Sprint 1 | 2024-10-XX | Backend base, modelos y lectura | Tickets 1.1 y 1.2 completados. API pública de proyectos operativa. |
| Sprint 2 | 2024-10-XX | Seguridad, Admin CRUD y Rate Limit | Tickets 2.1, 2.2 y 2.3 completados. JWT Stateless y Bucket4j implementados. |
| Sprint 3 | 2024-10-XX | Frontend scaffolding y Fundaciones | Tickets 3.1, 3.2 y 3.3 completados. Tailwind v4, useCapabilities y Snapshot Strategy. |
| Sprint 4 | 2024-10-XX | Despliegue a Producción y Hardening | Tickets 4.1, 4.2, 4.3 y 4.4 completados. Render, Vercel, Neon y mitigación de IP Spoofing. |
| Sprint 5 | 2024-10-XX | Hero, Navegación y Microinteracciones | S5-T1 y S5-T2 completados. S5-T3 (Cursor/Magnetic) en progreso. |


## Reporte de Sprint S0
Tickets: completados 2/2 (S0-T1 Monorepo Base, S0-T2 CI Workflows)
Estado de main: Builds verdes. CI pasa correctamente. Docker con PostgreSQL local en estado healthy.
Desviaciones del plan: Ninguna. El monorepo base se levantó sin contratiempos.
Decisiones nuevas: La caché de GitHub Actions para el backend se configuró con hashFiles para soportar tanto Maven como Gradle desde el inicio.
Deuda técnica / riesgos detectados: Ninguno.
Hallazgos de rendimiento: N/A
Dudas para el PM: Ninguna. Sprint 0 completado con éxito.


## Reporte de Sprint S1
Tickets: completados 2/2 (S1-T1 Backend Skeleton, S1-T2 Projects Read)
Estado de main: Builds verdes. Docker healthy.
Desviaciones del plan:
- Se ajustó la versión de Spring Boot a la 3.4.3 para evitar conflictos de resolución de dependencias con Flyway.
Decisiones nuevas:
- Manejo de Errores: Se implementó RFC 7807 (ProblemDetail).
- Mapeo de Arrays: Soporte nativo de Hibernate 6 para mapear arrays de PostgreSQL a List<String>.
- Aislamiento de Seed Data: Separación del script V3__seed_projects.sql a db/seed (solo local).
Deuda técnica / riesgos detectados: Testcontainers en Windows (Docker Desktop) arroja un error ambiental por permisos de socket.
Hallazgos de rendimiento: Tamaño de imagen Docker ~129 MB usando Alpine.


## Reporte de Sprint S2
Tickets: completados 3/3 (S2-T1 Security JWT, S2-T2 Admin CRUD, S2-T3 Rate Limiting)
Estado de main: Builds verdes. CI ejecutando exitosamente (27/27 tests).
Desviaciones del plan: Ninguna.
Decisiones nuevas:
- Ticket 2.1: JWT Stateless con oauth2-resource-server y Nimbus (HmacSHA256).
- Ticket 2.2: CRUD de administración bajo /api/admin/projects. Manejo de DataIntegrityViolationException (409 Conflict).
- Ticket 2.3: Rate Limiting con Bucket4j y Caffeine. 
Deuda técnica / riesgos detectados: Asegurar protección contra spoofing de cabeceras en el proxy de Render. Subida de imágenes delegada al S9.
Hallazgos de rendimiento: Backend consume ~265.6 MiB en memoria, por debajo del límite de 512 MB.


## Reporte de Sprint S3
Tickets: completados 3/3 (S3-T1 Scaffold, S3-T2 Foundations, S3-T3 API Fallback)
Estado de main: Builds y CI en verde (tests unitarios 11/11).
Desviaciones del plan: Ninguna.
Decisiones nuevas:
- Ticket 3.1: Vitest con JSDOM.
- Ticket 3.2: Tokens nativos con Tailwind v4, script anti-FOUC, y hook `useCapabilities` para evaluar hardware.
- Ticket 3.3 (API Fallback): Implementación de Snapshot Strategy (`snapshot-projects.mjs`) para prevenir tiempos de espera masivos por el Cold-Start del backend.
Deuda técnica / riesgos detectados: Placeholders SEO en index.html pendientes de actualizar.
Hallazgos de rendimiento: N/A


## Reporte de Sprint S4
Tickets: completados 4/4 (S4-T1 Backend Prod, S4-T2 Frontend Prod, S4-T3 Smoke Tests, S4-T4 IP Spoofing Hardening)
Estado de main: Despliegues en Render (Backend) y Vercel (Frontend) exitosos. CI y Smoke Tests en verde.
Desviaciones del plan:
- Tiempos de CI superados por filtraciones de hilos de HikariCP en testing (solucionado usando `@DirtiesContext`).
- Duplicidad de llaves YAML en el backend corregida en el PR #3.
Decisiones nuevas:
- Ticket 4.1 (BD Neon): Configuración de `max-lifetime` a 4 minutos (240000ms) para evitar cortes por la suspensión inactiva de 5 minutos de Neon. Conexión directa JDBC sin pooler para proteger los advisory locks de Flyway.
- Ticket 4.4 (Seguridad/Spoofing): Se creó el ADR 12 en `DECISIONS.md`. Se purgó el uso de True-Client-IP y X-Forwarded-For puro, adoptando `CF-Connecting-IP` como única fuente de verdad autoritaria para el Rate Limit en Render.
- Script SRE: `scripts/smoke-prod.mjs` implementado para medir latencia de cold-start y probar discriminación de IP (WiFi vs 4G).
Deuda técnica / riesgos detectados: Mantener monitorización sobre la versión de Spring Boot (3.5.16 EOL temporalmente aceptada).
Hallazgos de rendimiento: Cold Start real evaluado en ~691ms para healthcheck y ~2.5s con Neon reactivándose. La estrategia de frontend snapshot validó su total necesidad.


## Reporte de Sprint S5 (EN PROGRESO)
Tickets: completados 3/3 (S5-T1 Tokens y Navbar, S5-T2 Hero Section. S5-T3 Cursor y Botones Magnéticos)
Estado de main: Builds y pruebas verdes (32/32 tests del frontend). Lighthouse métricas de producción móvil: Performance 91, Accessibility 100, CLS 0.0001.
Desviaciones del plan: Ninguna.
Decisiones nuevas:
- Ticket 5.1: Se redefinió la paleta a Cian (#00e5ff) y Verde Fosforescente (#39ff88). Tema Light contrastado con Teal (#00798c) logrando umbrales WCAG AA estrictos. Navbar con `IntersectionObserver` para scroll-spy.
- Ticket 5.2: Se integró `sharp` (devDependency) mediante `scripts/optimize-images.mjs` para generación de AVIF/WebP automático. 
- Ticket 5.2: El componente animado `HeroSpotlight` se condicionó a renderizarse *únicamente* si `canUseHeavyEffects` es verdadero, y el fondo CSS se pausa fuera del viewport (`hero-paused`) ahorrando batería en móviles.
Deuda técnica / riesgos detectados: SEO tags y título en `index.html` aún genéricos. La duplicidad de imágenes generadas en `src/assets/generated` se resolvió en el ticket 7.1b; el destino de optimización queda en `public/assets/rodrigo`.
Hallazgos de rendimiento: Renderizado responsivo impecable (LCP de 2.9s atribuido exclusivamente al servidor, resuelto visualmente vía caché y snapshot del S3).
Dudas para el PM (Próximo Sprint): Definir si el Sprint 6 usará capturas reales de los proyectos para el Coverflow o continuará con placeholders.




Reporte Sprint s7
### 📝 Reporte de Cierre: Sprints 0 al 7.0 (Fundamentos y Proyectos)
**Estado:** COMPLETADO y en `main`
**Entorno:** Producción (Render / Vercel / Neon)

**Resumen Arquitectónico:**
- **Backend:** Spring Boot 3.5.16 (Java 21) desplegado en Render. Configuración aislada de HikariCP para Neon Serverless PostgreSQL.
- **Seguridad:** Spring Security con JWT Stateless, Rate Limiting (Bucket4j), y prevención de IP Spoofing (ADR 12: `CF-Connecting-IP`). Auditoría Gitleaks limpia.
- **Frontend:** React 19, Vite, Tailwind CSS v4. Configurado con Framer Motion (LazyMotion) y Lenis para scroll suave.
- **Features integradas:** Hero, Navigation, y Projects Carousel. 
- **SRE & Rendimiento:** Script de Snapshot SRE habilitado. Lighthouse en móvil ≥ 90, CLS en 0 gracias a `PlaceholderArt` y la pre-carga segura de Markdown.


### 📝 Reporte de Cierre: Ticket 7.1 (Bento Grid Layout & Optimización)
**Estado:** COMPLETADO y listo para Merge a `main`
**Rama:** `feat/s7-t1-bento-layout`

**Resumen de Implementación:**
- **Estructura de Datos (`profile.ts`):** Creación del modelo estricto y tipado para StackItem, Hobbies, Ubicación (Pachuca/CDMX) y CV.
- **Bento Grid Layout:** Desarrollo de contenedor asimétrico usando CSS Grid (`BentoGrid.tsx` y `BentoTile.tsx`) 100% responsivo (1 col en móvil, 2 en tablet, 4 en desktop con `--bento-row`).
- **Iconografía Vectorial (`SimpleIcons.tsx`):** Creación manual de componentes funcionales SVG inline (cero dependencias externas) para 11 tecnologías del stack (incluyendo OpenJDK).
- **Traducciones:** Integración fluida con `i18next` en `common.json` (ES/EN) para todos los títulos y textos de la cuadrícula.
- **Optimización Crítica (React Query):** Se refactorizó `useProjects.ts` migrando de `placeholderData` a `initialData` con `staleTime: Infinity`. 
  * *Impacto:* Se eliminaron las peticiones HTTP de fondo redundantes desde el cliente, forzando la lectura del snapshot de Vercel. Esto resolvió errores de entorno local (CORS/Proxy) y garantizó un CLS de 0 estricto en producción sin costo de base de datos.
