# HANDOFF: estado del proyecto al 2026-11-10

## Equipo
Claude PM (arquitectura, revisión de sprints) > Gemini > Copilot > DeepSeek en Cline > Humano (squash and merge, commits, ramas, PRs y verificación visible).

## Producción
- Frontend: Vercel, dominio canónico `www.rodrigodvillar.com` (el dominio raíz redirige 308 a `www`).
- Backend: Render (Docker, free) en `api.rodrigodvillar.com` + UptimeRobot cada 5 min a `/api/health`. BD: Neon (host directo, sin pooler).
- Correo: Resend (dominio verificado, API HTTP). Anti-spam: Cloudflare Turnstile. Imágenes y documentos: Cloudinary con presets firmados.
- NitroStore (proyecto aparte) corre también en Render, misma cuenta. PENDIENTE (ADR 13): moverlo a otra cuenta de Render antes de mandar el portafolio a reclutadores (las 750 h/mes son por workspace; si se agotan, se suspenden TODOS los servicios gratuitos).

## Estado de sprints
S0 a S13 funcionalmente completos:
- **S0 a S7:** Fundamentos, base de datos, CI/CD, seguridad base, scaffolding frontend, despliegues iniciales, Bento grid y proyectos.
- **S8:** Contacto seguro (persistencia previa PENDING, Turnstile fail-closed, retención y depuración programada de 30 días).
- **S9:** Panel de administración (Admin shell, CRUD de proyectos con subida firmada de imágenes, visor de mensajes de contacto).
- **S10:** Sound engine generativo con Web Audio, Command Palette (Ctrl+K), Terminal interactiva modal y boot intro diferido.
- **S11:** Rendimiento adaptativo con compuertas de hardware/FPS (`usePerformanceTier`, modo `lite`), y fondo de partículas 3D en Hero con Three.js imperativo diferido.
- **S12:** Mini mundo 3D del Bento (Three.js + Cannon-es imperativo, física interactiva, sonido sintetizado lofi y paleta nocturna aislada).
- **S13:** Admin con múltiples imágenes y videos de YouTube (`media[]`, máx. 15) y múltiples repositorios (`repos[]`, máx. 5); canvas ligero en el nombre (`CanvasText` / `TechText`); modal del carrusel funcionando (`ProjectDetailModal` con `ProjectMediaGallery`); rate limit/IP cerrado (TRUSTED_HOPS=3, ADR 12 corregido); CV administrable con subida de PDF directo a Cloudinary (`/raw/upload`) y modal con iframe en escritorio.

## Estado de Rate Limit e IP de Cliente
Rate limit/IP cerrado y estabilizado:
- `ClientIpResolver` configurado con `TRUSTED_HOPS = 3` para la infraestructura de Render (`[cliente, edge Cloudflare, proxy interno]`).
- Fallback seguro a `request.getRemoteAddr()` si la cadena `X-Forwarded-For` tiene menos de 3 saltos o formato inválido.
- Normalización de IPv6 agrupada en prefijos `/64`. ADR 12 actualizado y alineado con la implementación.

## Pendientes abiertos
1. **Infraestructura (ADR 13):** Mover NitroStore a otra cuenta de Render para evitar agotar las 750 h/mes compartidas de la capa gratuita.
2. **Auditoría de Rendimiento:** Ejecución de Lighthouse final con el protocolo estricto de `docs/PERFORMANCE.md` (build de producción, Chrome incógnito, mediana de 3 ejecuciones, throttling móvil y CPU 6x).
3. **SEO & Open Graph:** Reemplazar metadatos y placeholders genéricos en `index.html` (imágenes OG/Twitter, descripciones definitivas).
4. **Seguridad (CSP Enforcement):** Migrar `Content-Security-Policy-Report-Only` a enforcement activo en `vercel.json` una vez validados todos los orígenes en producción (Cloudflare Turnstile, Cloudinary, YouTube nocookie).

## Stack clave
- **Frontend:** React 19, TypeScript estricto, Vite, Tailwind CSS v4, `motion` con `LazyMotion` (`motion/react`), TanStack Query, react-i18next, Lenis, Swiper 14 (`^14.3.0`, vulnerabilidad GHSA-hmx5-qpq5-p643 cerrada), Three.js directo (imperativo diferido).
- **Backend:** Java 21 LTS, Spring Boot 3.5.16, Spring Security + OAuth2 Resource Server / Nimbus (JWT stateless con refresh token en cookie HttpOnly + Secure + SameSite=Lax), Spring Data JPA, Flyway, Bucket4j + Caffeine.
