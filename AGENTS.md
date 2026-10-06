# AGENTS.md: Contexto maestro del Portafolio de Rodrigo

> Todo agente que trabaje en este repo DEBE leer este archivo completo antes de escribir código.

## 1. Qué es este proyecto
Portafolio profesional de Rodrigo Del Villar (Desarrollador Full-Stack) en `rodrigodvillar.com`.
Objetivo: impresionar a reclutadores y usuarios con un diseño moderno, interactivo y rápido, y demostrar buenas prácticas de ingeniería (el código también se evalúa).

## 2. Arquitectura
- Monorepo: `frontend/`, `backend/`, `docs/`, `docker-compose.yml`.
- **Frontend:** React 19 + Vite + TypeScript + Tailwind v4 (plugin `@tailwindcss/vite`, sin tailwind.config.js salvo necesidad) + `motion` (import desde `motion/react`) + Swiper + TanStack Query + react-i18next + Lenis. Deploy: Vercel.
- **Backend:** Java 21 + Spring Boot 3.5.x + Spring Security + JWT + Spring Data JPA + Flyway + Validation + Actuator + springdoc-openapi 2.8.x + Bucket4j. Deploy: Render (Docker).
- **BD:** PostgreSQL (Neon en producción, contenedor Postgres en local).
- **Servicios externos:** Resend (correo por API HTTP, NUNCA SMTP), Cloudinary (imágenes), Cloudflare Turnstile (anti-spam).
- **Dominios:** frontend `rodrigodvillar.com`, backend `api.rodrigodvillar.com`.

## 3. Restricciones de producción (no negociables)
- Render free bloquea SMTP: el correo se envía solo por API HTTP.
- Disco de Render efímero: prohibido guardar archivos en el servidor. Imágenes en Cloudinary, solo URL en BD.
- Backend con ~512 MB RAM: HikariCP máx. 5 conexiones, `-XX:MaxRAMPercentage=75`, evitar librerías pesadas.
- `/api/health` NO debe tocar la base de datos.
- El backend puede estar dormido: el frontend nunca debe mostrar pantallas vacías (usa datos de fallback).
- Prohibido guardar JWT en localStorage. Access token en memoria; refresh token en cookie HttpOnly + Secure + SameSite=Lax.

## 4. Reglas de rendimiento y móvil
- Hook `useCapabilities()` (se crea en S3) expone: `hasFinePointer` (`(hover: hover) and (pointer: fine)`), `isDesktopLayout` (ancho >= 1024px), `prefersReducedMotion`.
- En móvil/táctil: sin cursor personalizado, sin WebGL/3D, fondo con gradiente CSS animado, carrusel como swipe horizontal.
- Todo código 3D/WebGL se carga con `import()` dinámico o `React.lazy`, SOLO si las capacidades lo permiten. Un celular nunca debe descargar Three.js.
- Máximo un `<Canvas>` WebGL activo a la vez.
- Respetar `prefers-reduced-motion` en toda animación no esencial.
- Animar solo `transform` y `opacity` salvo justificación.

## 5. Convenciones de código
**General:** nombres en inglés en el código; textos de UI en i18n (ES por defecto, EN); sin `console.log` olvidados; sin código comentado; sin secretos en el repo.
**Frontend:** TypeScript estricto (sin `any`), componentes funcionales, carpeta por feature (`src/features/<nombre>`), componentes compartidos en `src/components`, hooks en `src/hooks`. Accesibilidad: HTML semántico, `alt`, foco visible, navegación por teclado.
**Backend:** paquetes por feature (`com.rodrigodvillar.portfolio.<feature>`), DTOs separados de entidades (records), validación con Bean Validation, manejo de errores global con `@RestControllerAdvice` y respuesta uniforme (RFC 7807 ProblemDetail), migraciones solo con Flyway (`ddl-auto=validate`), configuración por variables de entorno.

## 6. Flujo de trabajo con Git
- Rama por ticket: `feat/s<sprint>-t<ticket>-<slug>`.
- Commits convencionales: `feat:`, `fix:`, `chore:`, `docs:`, `refactor:`, `test:`.
- No hacer push a `main`. Un ticket = un PR.

## 7. Reglas para agentes
1. Haz SOLO lo que pide el ticket. Si ves algo mejorable fuera de alcance, anótalo en el reporte, no lo implementes.
2. No agregues dependencias que no estén en el ticket o en la sección 2 sin justificarlo en el reporte.
3. Si algo del ticket es ambiguo o contradice este archivo, DETENTE y pregunta antes de improvisar.
4. Verifica tu trabajo ejecutando los comandos de verificación del ticket. No declares "listo" sin haberlos corrido.
5. Antes de usar una versión de librería, confirma que es estable y compatible con el resto del stack.
6. Nunca pidas ni escribas secretos reales; usa `.env.example` con placeholders.

## 8. Definition of Done (todo ticket)
- [ ] Cumple todos los criterios de aceptación.
- [ ] Compila / build sin errores ni warnings nuevos.
- [ ] Lint y tests pasan.
- [ ] Sin secretos ni archivos basura.
- [ ] Documentación actualizada si aplica.
- [ ] Reporte de entrega completado (formato abajo).

## 9. Formato de REPORTE DE ENTREGA (obligatorio al terminar)
```
## Reporte de entrega: Ticket <id>
**Estado:** Completo / Parcial / Bloqueado
**Qué se hizo:** (máx. 5 bullets)
**Archivos creados/modificados:** (lista)
**Cómo verificar:** (comandos exactos)
**Resultado de verificación:** (qué corriste y qué salió)
**Decisiones tomadas:** (y por qué)
**Dependencias nuevas:** (nombre + versión + razón)
**Pendientes / deuda técnica / hallazgos fuera de alcance:**
**Dudas para el PM:**
```