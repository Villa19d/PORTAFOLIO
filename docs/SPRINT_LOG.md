# Registro de Sprints

| Sprint | Fecha | Resultado | Notas |
|---|---|---|---|
| Sprint 0 | 2024-10-06 | Estructura base, BD local (Docker) y CI/CD | Tickets 0.1 (Monorepo base) y 0.2 (Workflows de CI) completados. |
| Sprint 1 | 2024-10-XX | Backend base, modelos y lectura | Tickets 1.1 y 1.2 completados. API pública de proyectos operativa. |
| Sprint 2 | 2024-10-XX | Seguridad, Admin CRUD y Rate Limit | Tickets 2.1, 2.2 y 2.3 completados. JWT Stateless y Bucket4j implementados. |
| Sprint 3 | 2024-10-XX | Frontend scaffolding y Fundaciones | Tickets 3.1, 3.2 y 3.3 completados. Tailwind v4, useCapabilities y Snapshot Strategy. |
| Sprint 4 | 2024-10-XX | Despliegue a Producción y Hardening | Tickets 4.1, 4.2, 4.3 y 4.4 completados. Render, Vercel, Neon y mitigación de IP Spoofing. |
| Sprint 5 | 2024-10-XX | Hero, Navegación y Microinteracciones | S5-T1 y S5-T2 completados. S5-T3 (Cursor/Magnetic) en progreso. |
| Sprint 6 | 2024-10-XX | [TODO_CONTENT] | [TODO_CONTENT] |
| Sprint 7 | 2024-10-XX | Bento Grid Layout y optimizaciones | Tickets 7.1, 7.2 y 7.3 completados. |
| Sprint 8 | 2024-10-XX | Contacto seguro y retención | Persistencia previa, Turnstile fail-closed, retención de mensajes. |
| Sprint 9 | 2024-10-XX | Panel de administración | CRUD de proyectos, subida de imágenes a Cloudinary, gestión de mensajes. |
| Sprint 10 | 2024-10-XX | Experiencia interactiva y sonido | Carrusel (showcase/coverflow), paleta de comandos, terminal y sonido. |
| Sprint 11 | 2024-11-XX | Rendimiento adaptativo y Hero 3D | Modo lite adaptativo (usePerformanceTier) y fondo 3D en Hero (Three.js). |
| Sprint 12 | 2024-11-XX | Bento 3D World | Habitación 3D interactiva, física con cannon-es y sonido generativo. |
| Sprint 13 | 2024-11-XX | Multimedia de proyectos y CV administrable | Múltiples media/repos, modal de proyectos, CV en Cloudinary raw. |


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



## Reporte de Sprint S8
- **Tickets:** [TODO_CONTENT]
- **Estado de main:** Builds verdes. Funcionalidad de contacto integrada.
- **Decisiones clave (docs/DECISIONS.md ADR 2.1):**
  - Contacto seguro: persistencia del mensaje como `PENDING` antes de llamar a Resend para evitar pérdida ante caídas del proveedor.
  - Envío exclusivo en texto plano sin HTML crudo.
  - Turnstile fail-closed: rechazo con `403` si falla validación; `503` sin persistir si hay timeout o caída del servicio.
  - Límite diario de mensajes (protección con `503`).
  - Retención de mensajes de contacto durante 30 días (`CONTACT_RETENTION_DAYS`, mínimo 1 día), con tarea programada diaria y purga al arranque.
- **Hallazgos de rendimiento:** [TODO_CONTENT]

## Reporte de Sprint S9
- **Tickets:** [TODO_CONTENT]
- **Estado de main:** Builds verdes. Panel de administración operativo.
- **Decisiones clave (docs/DECISIONS.md ADR 3, ADR 5, ADR 9):**
  - Panel Admin con autenticación JWT stateless y refresh token en cookie HttpOnly + Secure + SameSite=Lax.
  - Almacenamiento de imágenes de proyectos en Cloudinary con URLs persistidas en BD (disco efímero de Render).
  - Firma directa de uploads a Cloudinary desde el backend para que el cliente suba directo sin pasar bytes por el servidor.
  - Visualización y gestión de mensajes de contacto desde admin.
- **Hallazgos de rendimiento:** [TODO_CONTENT]

## Reporte de Sprint S10
- **Tickets:** [TODO_CONTENT]
- **Estado de main:** Builds verdes.
- **Decisiones clave (docs/DECISIONS.md ADR 17, ADR 18):**
  - Carrusel de proyectos: showcase para 1–3 proyectos y Coverflow con 4 o más; superficie compartida `TiltSurface`.
  - Sonido sintetizado generativo mediante Web Audio API, sin dependencias de audio externas ni archivos con licencia.
  - Modal de terminal, paleta de comandos (Ctrl+K) e intro de arranque (boot intro).
- **Hallazgos de rendimiento:** [TODO_CONTENT]

## Reporte de Sprint S11
- **Tickets:** Ticket 11.0 (Rendimiento adaptativo / Modo lite), Ticket 11.2 (Fondo 3D Hero).
- **Estado de main:** Builds verdes. Three.js integrado en chunk independiente y lazy.
- **Decisiones clave (docs/DECISIONS.md ADR 14, ADR 15; docs/PERFORMANCE.md):**
  - Modo `lite` adaptativo vía `usePerformanceTier`: medición de FPS con requestAnimationFrame en ventanas de 500 ms (umbral < 40 fps), o detección por hardware (`hardwareConcurrency <= 2` o `deviceMemory <= 2`). Aplica atributo `data-perf="lite"`.
  - Fondo 3D del Hero con Three.js directo (0.186.1, sin React Three Fiber ni postprocessing), escena imperativa de partículas (`BufferGeometry` + `ShaderMaterial`).
  - Compuertas de carga (`useHeroSceneGate`): solo escritorio, tier full, WebGL2 disponible, idle callback y Hero en viewport. En móvil nunca se descarga Three.js.
  - Degradación automática a modo lite si los FPS caen por debajo de 40 en 3 ventanas consecutivas de 1 s.
  - Presupuesto: chunk Three <= 180 KB gzip (JS inicial total gzip en S11.0: 141,512 B según docs/PERFORMANCE.md).
- **Hallazgos de rendimiento:** CLS de 0 gracias a fade-in sobre fondo CSS existente y posicionamiento absoluto.

## Reporte de Sprint S12
- **Tickets:** Tickets 12.2, 12.3, 12.4 (Bento 3D World).
- **Estado de main:** Builds verdes.
- **Decisiones clave (docs/DECISIONS.md ADR 16, ADR 17; docs/PERFORMANCE.md):**
  - Mundo 3D del Bento con Three.js imperativo y física de cuerpos rígidos con `cannon-es` (sin Rapier ni React Three Fiber), cargado en su propio chunk lazy.
  - Física activa únicamente en modo interactivo (primera persona); la cámara solo hace drift suave en modo showcase.
  - Habitación nocturna con paleta propia fija aislada del tema global.
  - Sonido lofi y efectos de interacción (clics, teclas, materiales) sintetizados con Web Audio API.
  - Presupuesto de bundle medido en docs/PERFORMANCE.md: JS inicial total gzip en S12 de 143,700 B (dentro del presupuesto de <= 150,000 B).
- **Hallazgos de rendimiento:** Un solo canvas WebGL animando a la vez (pausado fuera de pantalla).

## Reporte de Sprint S13
- **Tickets:** Sprint 13 (Tickets G0 a G5, fix modales, media y CV).
- **Estado de main:** Builds verdes. Sprints S0 a S13 funcionalmente completos.
- **Decisiones clave (docs/DECISIONS.md ADR 6, ADR 12, ADR 18, ADR 19; docs/PERFORMANCE.md):**
  - CV administrable (ADR 19): tabla `cv_documents`, subida directa de PDF a Cloudinary (`/raw/upload`) con preset firmado, visor en modal con iframe en escritorio y enlace con `fl_attachment` para descarga.
  - Proyectos con multimedia extendida: `media[]` (máx. 15 ítems entre imágenes y videos de YouTube) y `repos[]` (máx. 5 enlaces a repositorios).
  - Modal de detalle de proyectos (`ProjectDetailModal`) con galería interactiva (`ProjectMediaGallery`).
  - Animación ligera en el nombre del Hero con canvas (`CanvasText`).
  - Resolución de IP del cliente corregida (ADR 12): `ClientIpResolver` con `TRUSTED_HOPS = 3` para proxies de Render y fallback a `request.getRemoteAddr()`.
  - Cierre de auditoría Swiper (ADR 6): actualización a `swiper` `^14.3.0` (cierre de GHSA-hmx5-qpq5-p643).
  - Mejora opcional: desmontar Hero al montar Bento para garantizar un solo canvas WebGL.
- **Hallazgos de rendimiento:** Respeto estricto del presupuesto inicial de JavaScript (<= 150,000 B gzip).
