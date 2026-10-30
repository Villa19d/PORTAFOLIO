# HANDOFF: estado del proyecto al 25-oct-2026

## Equipo
Claude PM (arquitectura, revisión de sprints) > PM diario (Gemini, chat nuevo) > Chalán ejecutor: DeepSeek V4.1 en Cline (VS Code, vía OpenRouter), con acceso directo al repo y a la terminal > Humano (ramas, commits, PRs, merges y verificación visible).

## Producción
- Frontend: Vercel, dominio canónico www.rodrigodvillar.com (el dominio raíz redirige 308 a www).
- Backend: Render (Docker, free) en api.rodrigodvillar.com + UptimeRobot cada 5 min a /api/health. BD: Neon (host directo, sin pooler).
- Correo: Resend (dominio verificado, API HTTP). Anti-spam: Cloudflare Turnstile. Imágenes: Cloudinary con presets firmados.
- NitroStore (proyecto aparte) corre también en Render, misma cuenta. PENDIENTE: moverlo a otra cuenta antes de mandar el portafolio a reclutadores (las 750 h/mes son por workspace; si se agotan, se suspenden TODOS los servicios gratuitos).

## Estado de sprints
S0 a S10 entregados. S10: sonido sintetizado, paleta Ctrl+K, terminal, intro tipo boot (todo diferido).
Siguiente: 11.0 rendimiento adaptativo (prerrequisito) > S11 fondo 3D del Hero (solo escritorio) > S12 mini mundo 3D del Bento > S13 pulido.

## Pendientes abiertos
P0 Rate limit / IP del cliente (ticket 9.5): el smoke test contra producción falla la ronda i-2 (rotar CF-Connecting-IP). En Render la cadena X-Forwarded-For es [cliente, edge Cloudflare, proxy interno] (cliente = 3.ª desde la derecha). Hipótesis del chalán sin probar. Hacer el experimento de Claude PM y endurecer ClientIpResolver (si hay menos de 3 entradas usar remoteAddr). Actualizar ADR 12.
P1 Mover NitroStore a otra cuenta de Render.
P1 S10: faltan Lighthouse con números (con y sin intro) y CI de 10.3 y 10.4 (se subieron directo a main).
P2 Higiene: carpetas dist-audit-* en frontend, gitleaks-report.json, skills-lock.json, package.json raíz; archivos del admin sueltos en src/ (mover a features/admin).
P2 DECISIONS.md: dos secciones 10, severidad de Swiper inconsistente (crítica/Alta), ADR 6 con "tabla pendiente", ADR 12 contradictorio con el código.
P2 data-perf="lite" lo consultan el S10 y otros, pero nada lo establece hasta el 11.0.

## Backlog S13
Verificar en spring.io el soporte de Spring Boot 3.5 y evaluar 4.x con medición de RAM; actualizar Swiper (excepción GHSA-hmx5-qpq5-p643, retirar de la lista blanca); CSP real (hoy en Report-Only; permitir Cloudinary y Turnstile); ESLint a flat config; migrar @MockBean a @MockitoBean; SEO (OG real, sitemap, robots, theme-color); Lighthouse CI; revisión de accesibilidad; README con diagrama; botón o hook para redeploy de Vercel y regenerar el snapshot; revisar refs/pull de GitHub tras el filter-repo; quitar dist/stats.json de producción (visualizer solo con ANALYZE).

## Reglas del proyecto (resumen, manda AGENTS.md)
- Secretos solo en Render/Vercel, nunca en archivos ni chats.
- Contenido personal nunca se inventa ([TODO_CONTENT]).
- Un ticket = una rama = un PR. Evidencia con números y links reales a PR y run de CI.
- Todo código 3D/pesado: import() dinámico, solo con canUseHeavyEffects y data-perf distinto de lite. Un solo Canvas WebGL a la vez.
- Solo transform y opacity en animaciones; sin filter/backdrop-filter en elementos animados.
- Mediciones con docs/PERFORMANCE.md (build de producción, Chrome incógnito, mediana de 3, CPU 6x).

## Stack clave
React 19, TypeScript estricto, Vite, Tailwind v4, motion con LazyMotion (componentes m), TanStack Query, react-i18next, Lenis, Swiper 11. Backend: Java 21, Spring Boot 3.5.16, Spring Security + JWT (refresh en cookie HttpOnly, access en memoria), Flyway, Bucket4j.