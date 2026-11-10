# S13: Órdenes para los chalanes

Copiar a `docs/S13_ORDENES.md`. Al chalán se le dice solo:
> "Lee `docs/S13_ORDENES.md`: la sección 0 y el ticket <ID>. Ejecútalo. No corras ningún comando de npm/mvn."

Cada ticket es autocontenido. Si algo no cuadra con el código real: **PARA y pregunta** (el diseño se hizo sin ver todos los archivos).

---

## 0. Reglas comunes (aplican a TODOS los tickets)

**Proyecto:** portafolio de Rodrigo (rodrigodvillar.com). Frontend React 19 + Vite + TS estricto + Tailwind v4 + `motion` + three directo, en Vercel. Backend Java 21 + Spring Boot 3.5.16 + Neon + Flyway, en Render. Monorepo `frontend/`, `backend/`, `docs/`.

**Antes de escribir código:** lee `AGENTS.md` y `docs/DECISIONS.md` (ADR 14 a 18 sobre rendimiento). Lee solo los archivos que el ticket lista. No explores el repo completo.

**Prohibido:**
- Ejecutar `npm`, `npx`, `mvn`, `./mvnw`, `vitest`, lint, build, dev server. Los corre el humano (se traban). Solo puedes leer (`cat`, `grep`) y editar archivos.
- Operaciones de git (rama, commit, push). Las hace el humano.
- Instalar o agregar dependencias. Ninguna.
- Tocar three/WebGL (Hero y Bento).
- Mover archivos del admin a otra carpeta (los archivos admin viven sueltos en `frontend/src/`; sigue esa convención).
- Reescribir archivos completos que no cambian. Usa ediciones puntuales.

**Obligatorio:**
- Haz SOLO lo del ticket. Lo demás va al reporte, no lo implementes.
- Código en inglés. Textos públicos en i18n (`frontend/src/locales/{es,en}/common.json`); las keys ya las agrega el ticket G0, usa EXACTAMENTE esas. El panel admin está hardcodeado en español (convención existente).
- Solo tokens CSS (`var(--accent-primary)`, `--surface`, `--border`, `color-mix(...)`). Cero colores sueltos. Debe verse bien en tema claro y oscuro.
- Todo efecto costoso: se apaga con `useCapabilities().canUseHeavyEffects`, con un bloque `[data-perf="lite"]` en `index.css` y con `prefers-reduced-motion`.
- Animar solo `transform` y `opacity`. `backdrop-filter` solo estático (en `::backdrop` o un contenedor fijo), nunca en elementos animados, y apagado en lite.
- Motion: `import { m } from 'motion/react'` (LazyMotion ya está montado). Nunca `motion.div`.
- TS estricto, sin `any`, sin `console.log`, sin código comentado, accesibilidad (HTML semántico, foco visible, teclado, `aria-*`).
- CSS nuevo: añádelo AL FINAL de `frontend/src/index.css` bajo un banner `/* S13-<ID> */`. No reformatees lo existente.
- Tests: escribe los que pide el ticket imitando los vecinos del mismo directorio, pero NO los corras.
- Presupuesto del bundle inicial: <= 150,000 B gzip. Lo que no sea necesario en la carga inicial va con `React.lazy` / `import()`.

**Reporte final:** formato de `AGENTS.md` sección 9, más "Cómo verificar (humano)".

## Orden de ejecución

| Orden | ID | Chalán | Depende de |
|---|---|---|---|
| 1 | G0 | Copilot | nada |
| 2 | G1 | DeepSeek | G0 |
| 3 | G2 | DeepSeek | G0 |
| 4 | G3 | DeepSeek | G2 |
| 5 | G4 | DeepSeek | G0, G1, G2 |
| 6 | G5 | DeepSeek | G0 |


**Acciones del humano (no son de los chalanes):**
1. Cloudinary > Settings > Security: activar **"Allow delivery of PDF and ZIP files"**.
2. Cloudinary > Settings > Upload > Upload presets: crear preset **Signed**, carpeta `portfolio/cv`, formatos permitidos `pdf`. Anotar el nombre.
3. Render: agregar `CLOUDINARY_CV_UPLOAD_PRESET=<nombre>` (antes o después del deploy de G2; sin ella la subida del CV responde 503 pero la app arranca).
4. Después de desplegar G2 y subir el CV desde `/admin`, regenerar el snapshot de proyectos: `API_URL=https://api.rodrigodvillar.com npm run snapshot` (el carrito IoT no muestra repos ni imágenes extra porque el snapshot actual no las trae).

---

## G0 (Copilot): prefabricados

Tareas mecánicas. Copia tal cual.

### G0.1 `frontend/src/data/site.ts` (reemplazar completo)

```ts
export const SITE_CONFIG = {
  authorName: 'Rodrigo Del Villar',
  githubUrl: 'https://github.com/Villa19d',
  githubHandle: 'Villa19d',
  linkedinUrl: 'https://www.linkedin.com/in/luis-rodrigo-del-villar-morales-720810325/',
  linkedinHandle: 'in/luis-rodrigo-del-villar-morales',
  instagramUrl: 'https://www.instagram.com/rodrigovillar_3',
  instagramHandle: '@rodrigovillar_3',
  contactEmail: ['luisrodrigo1005', 'gmail.com'].join('@'),
} as const;
```

Luego `grep -rn "githubUrl\|linkedinUrl" frontend/src --include=*.test.tsx` y ajusta SOLO las expectativas de tests que dependan de los valores viejos (`githubUrl: null`, LinkedIn anterior). Lista en el reporte cuáles tocaste.

### G0.2 `frontend/vercel.json`

En el valor de `Content-Security-Policy-Report-Only`, cambia `frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com` por `frame-src https://challenges.cloudflare.com https://www.youtube-nocookie.com https://res.cloudinary.com`. No cambies nada más.

### G0.3 `frontend/src/data/cv.snapshot.json` (crear)

```json
{ "es": null, "en": null }
```

### G0.4 `frontend/src/components/icons/UiIcons.tsx` (crear)

```tsx
import type { ReactNode, SVGProps } from 'react';

type IconProps = Omit<SVGProps<SVGSVGElement>, 'children'>;

function Icon({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="1em"
      height="1em"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const LinkedinIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </Icon>
);

export const InstagramIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </Icon>
);

export const GithubIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
    <path d="M9 18c-4.51 2-5-2-7-2" />
  </Icon>
);

export const MailIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </Icon>
);

export const CopyIcon = (props: IconProps) => (
  <Icon {...props}>
    <rect width="14" height="14" x="8" y="8" rx="2" ry="2" />
    <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
  </Icon>
);

export const CheckIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M20 6 9 17l-5-5" />
  </Icon>
);

export const ArrowUpIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="m5 12 7-7 7 7" />
    <path d="M12 19V5" />
  </Icon>
);

export const ArrowUpRightIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M7 7h10v10" />
    <path d="M7 17 17 7" />
  </Icon>
);

export const FileTextIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z" />
    <path d="M14 2v4a2 2 0 0 0 2 2h4" />
    <path d="M10 9H8" />
    <path d="M16 13H8" />
    <path d="M16 17H8" />
  </Icon>
);

export const DownloadIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" x2="12" y1="15" y2="3" />
  </Icon>
);

export const CloseIcon = (props: IconProps) => (
  <Icon {...props}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);
```

### G0.5 i18n: agregar keys (no borrar ni renombrar nada existente)

En `es/common.json` y `en/common.json`, agrega estos bloques de primer nivel (`cv`, `social`) y estas keys dentro de `footer` (que ya existe con `rights`):

**es**
```json
"cv": {
  "title": "Currículum",
  "open": "Ver CV",
  "openEs": "Ver CV (ES)",
  "openEn": "Ver CV (EN)",
  "download": "Descargar",
  "close": "Cerrar",
  "modalLabel": "Visor de currículum",
  "languageSwitch": "Idioma del CV",
  "langEs": "Español",
  "langEn": "English",
  "mobileNote": "Tu navegador no muestra PDF aquí. Descárgalo o ábrelo en otra pestaña.",
  "openNewTab": "Abrir en otra pestaña",
  "loading": "Cargando currículum",
  "unavailable": "Currículum próximamente"
},
"social": {
  "linkedin": "LinkedIn",
  "instagram": "Instagram",
  "github": "GitHub",
  "email": "Correo",
  "emailHint": "Copiar y escribirme",
  "emailCopied": "Correo copiado",
  "copyFailed": "No se pudo copiar. Usa el formulario de contacto.",
  "opensNewTab": "se abre en otra pestaña"
}
```
y en `footer`:
```json
"tagline": "Desarrollador Full-Stack. Construyo cosas rápidas, seguras y con detalle.",
"navLabel": "Navegación del pie de página",
"socialLabel": "Redes",
"builtWith": "Hecho con React 19, TypeScript y Spring Boot.",
"backToTop": "Volver arriba"
```

**en**
```json
"cv": {
  "title": "Résumé",
  "open": "View CV",
  "openEs": "View CV (ES)",
  "openEn": "View CV (EN)",
  "download": "Download",
  "close": "Close",
  "modalLabel": "Résumé viewer",
  "languageSwitch": "CV language",
  "langEs": "Español",
  "langEn": "English",
  "mobileNote": "Your browser can't show PDFs here. Download it or open it in a new tab.",
  "openNewTab": "Open in a new tab",
  "loading": "Loading résumé",
  "unavailable": "Résumé coming soon"
},
"social": {
  "linkedin": "LinkedIn",
  "instagram": "Instagram",
  "github": "GitHub",
  "email": "Email",
  "emailHint": "Copy and write to me",
  "emailCopied": "Email copied",
  "copyFailed": "Couldn't copy. Use the contact form.",
  "opensNewTab": "opens in a new tab"
}
```
y en `footer`:
```json
"tagline": "Full-Stack Developer. I build fast, secure things with attention to detail.",
"navLabel": "Footer navigation",
"socialLabel": "Social links",
"builtWith": "Built with React 19, TypeScript and Spring Boot.",
"backToTop": "Back to top"
```

### G0.6 Docs

**`docs/API_CONTRACT.md`**: agrega 4 filas a la tabla de endpoints y una sección "CV" al final:

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/cv` | Public | CV por idioma. |
| PUT | `/api/admin/cv/{lang}` | JWT | Asocia el CV de un idioma (`es` o `en`). |
| DELETE | `/api/admin/cv/{lang}` | JWT | Desvincula el CV de un idioma (204 aunque no exista). |
| POST | `/api/admin/uploads/sign-document` | JWT | Firma de subida directa a Cloudinary para el PDF del CV. |

Sección "CV":
- `GET /api/cv` responde 200 `{ "es": {url, fileName, updatedAt} | null, "en": {...} | null }` con `Cache-Control: public, max-age=60`. Sin datos devuelve `{ "es": null, "en": null }`.
- `PUT /api/admin/cv/{lang}` body `{ "url": string, "fileName": string }`. `url`: https, host `res.cloudinary.com`, ruta con `/raw/upload/`, termina en `.pdf`. `fileName`: 1 a 120 caracteres sin caracteres de control. Respuesta 200 con el objeto del slot, `Cache-Control: no-store`. `lang` distinto de `es|en` o body inválido: 400 (RFC 7807).
- `POST /api/admin/uploads/sign-document` responde igual que `/sign` (misma forma, sin secreto) pero con el preset y la carpeta del CV. 503 si el preset del CV no está configurado. Límite de 20 por hora, igual que `/sign`.

**`docs/DEPLOYMENT.md`**: en la lista de variables de Render agrega `CLOUDINARY_CV_UPLOAD_PRESET` (preset firmado para PDF del CV; opcional al arrancar, sin él la subida del CV responde 503) y `CLOUDINARY_CV_FOLDER` (por defecto `portfolio/cv`). Agrega subsección "Preset de Cloudinary para el CV" con los pasos 1 y 2 de "Acciones del humano" de este documento.

**`docs/DECISIONS.md`**: agrega al final:

```md
## 19. CV administrable: tabla propia y Cloudinary raw (Sprint 13)
- **Contexto:** El CV debe subirse desde /admin y verse en "Sobre mí" sin redeploy. El disco de Render es efímero.
- **Decisión:** Tabla `cv_documents` (PK `lang` es|en, una fila por idioma), `GET /api/cv` público (cache 60 s), `PUT/DELETE /api/admin/cv/{lang}` y firma `POST /api/admin/uploads/sign-document` con preset propio. El navegador sube el PDF directo a Cloudinary (`/raw/upload`) y el backend solo guarda la URL, validada (https, res.cloudinary.com, /raw/upload/, .pdf). El preset es opcional al arrancar para que un deploy sin la variable no tumbe la app.
- **Frontend:** snapshot (`cv.snapshot.json`, generado en el build) más revalidación en vivo, para no mostrar "próximamente" mientras Render despierta. Visor en iframe en escritorio; en móvil, descarga o pestaña nueva. Descarga con `fl_attachment`.
- **Consecuencia:** Quitar un CV solo lo desvincula; el archivo queda en Cloudinary. Requiere activar "Allow delivery of PDF and ZIP files" en Cloudinary.
```

---

## G1 (DeepSeek): modal de proyectos (centrado, cursor, galería, repos)

**Leer:** `frontend/src/index.css` (bloques `.project-detail-modal` y "Modal dialogs and the custom cursor"), `components/cursor/CustomCursor.tsx`, `CursorLoader.tsx`, sus tests, `features/projects/components/ProjectDetailModal.tsx`, `ProjectMediaGallery.tsx` (+ test), `ProjectCard.tsx`, `utils/projectHelpers.ts`, `api/useProjects.ts`, `data/projects.snapshot.json`.

### A. Centrado
El `<dialog>` queda en la esquina porque Tailwind v4 (preflight) pone `margin: 0` y anula el `margin: auto` del navegador. `.terminal-window` ya lo resuelve con `position: fixed; inset: 0; height: fit-content; margin: auto`. Aplica lo mismo a `.project-detail-modal` (banner `S13-G1` al final de `index.css`). No pongas `display` en la regla base: un dialog cerrado debe seguir oculto. Revisa que ninguna regla posterior lo pise (hay dos bloques `.project-detail-modal`).

### B. Cursor dentro del modal
Un `<dialog>` con `showModal()` vive en la top layer y se pinta sobre cualquier z-index. Por eso hoy el cursor se oculta mientras hay modal (bloque "Modal dialogs and the custom cursor"). Meta: punto + anillo visibles y por encima del modal, con el cursor nativo oculto.

Implementación pedida:
1. En `CustomCursor`, renderiza el punto y el anillo con `createPortal` hacia el `dialog` modal abierto (`document.querySelector('dialog[open]:modal')`), o `document.body` si no hay.
2. Detecta apertura/cierre con un único `MutationObserver` sobre `document.body` (`subtree: true`, `attributes: true`, `attributeFilter: ['open']`). Actívalo solo si el cursor está activo. Desconéctalo al desmontar.
3. Al cambiar el destino React remonta los nodos: guarda la última posición del puntero en una ref y aplícala en `useLayoutEffect` tras montar para que no salte a (0,0).
4. Mantén `position: fixed`, `pointer-events: none` y `z-index: 9999`. Comprueba que el dialog no tenga `transform`/`filter`/`contain` propios que cambien el bloque contenedor del `fixed`. `.terminal-window` anima `transform` 180 ms al abrir; si eso desplaza el cursor ese instante, tolérálo y anótalo en el reporte.
5. Borra del CSS las reglas que devuelven `cursor: auto` y ocultan punto/anillo con `dialog:modal` (todo el bloque "Modal dialogs and the custom cursor"). Mantén `cursor: text` en inputs/textarea. Añade `html.custom-cursor-active dialog::backdrop { cursor: none; }`.
6. Funciona para cualquier modal (proyectos, terminal, paleta, y el futuro modal del CV), sin tocar cada uno.
7. Actualiza `CustomCursor.test.tsx` y añade un test: con un `dialog[open]` en el DOM, el cursor se renderiza dentro del dialog.

### C. Galería y repos (carrito IoT: 2 repos, 2 imágenes extra, solo se ven 1 y 1)
Causa probable (ya vista): `projects.snapshot.json` del carrito IoT no trae `media` ni `repos`, y `useProjects` usa `initialData` con `staleTime: Infinity`, así que la UI solo ve el snapshot. Eso NO es un bug de código y NO se arregla aquí (lo regenera el humano).
Tu trabajo:
1. Traza por lectura `getProjectGallery`, `getProjectRepos`, `ProjectMediaGallery`, `ProjectDetailModal` y `ProjectCard` con un proyecto que tenga `imageUrl` + `media` con 2 imágenes + `repos` con 2 entradas. Busca bugs reales: índice activo fuera de rango al cambiar items, keys duplicadas, miniaturas que no se renderizan, dedupe que descarta una imagen válida (por ejemplo una imagen del `media` con la misma URL que la portada se descarta a propósito), estilos que ocultan elementos.
2. Si encuentras un bug real: corrígelo con el cambio mínimo y añade un test.
3. Si no hay bug: no cambies código; di en el reporte que la causa es el snapshot.
4. Añade en `ProjectDetailModal.test.tsx` un test: proyecto con `media` de 2 imágenes extra, el modal muestra 3 miniaturas (portada + 2) y, con 2 repos, 2 botones de código en las acciones. Si ya existe uno equivalente, no lo dupliques.
5. NO toques `useProjects.ts`.

**Cómo verificar (humano):** modal centrado en 375, 768 y 1280 px; cursor visible en el modal de proyectos y en la terminal; cerrar el modal devuelve el cursor al `body` sin saltos.

---

## G2 (DeepSeek): backend del CV

**Leer:** `backend/.../security/SecurityConfig.java`, `config/CorsConfig.java`, `controller/AdminUploadController.java`, `service/CloudinarySignatureService.java`, `config/CloudinaryProperties.java`, `config/CloudinaryProductionValidator.java`, `dto/CloudinarySignatureResponse.java`, `controller/AdminMessageController.java`, `service/AdminMessageService.java`, `exception/GlobalExceptionHandler.java`, `security/RateLimitFilter.java`, `config/RateLimitProperties.java`, `db/migration/V4__add_project_media_and_repos.sql`, `src/main/resources/application.yml`, y los tests `AdminUploadControllerTest`, `AdminMessageControllerTest`, `AdminProjectIntegrationTest`, `SecurityIntegrationTest`. Contrato en `docs/API_CONTRACT.md` sección "CV" (G0.6).

**Construir** (paquete base `com.rodrigodvillar.portfolio`):
1. `db/migration/V5__create_cv_documents.sql` (solo Flyway, nada en `db/seed`):
```sql
CREATE TABLE cv_documents (
    lang VARCHAR(2) PRIMARY KEY,
    url VARCHAR(500) NOT NULL,
    file_name VARCHAR(120) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT cv_documents_lang_check CHECK (lang IN ('es', 'en'))
);
```
2. `entity/CvDocument` (`@Id` = `lang` String; `ddl-auto=validate` debe pasar) y `repository/CvDocumentRepository extends JpaRepository<CvDocument, String>`.
3. DTOs como `record` en `dto/`: `CvDocumentDto(String url, String fileName, OffsetDateTime updatedAt)`, `CvResponse(CvDocumentDto es, CvDocumentDto en)`, `CvUpsertRequest` con `@NotBlank @Size(max = 500) @Pattern(regexp = "^https://res\\.cloudinary\\.com/[^\\s?#]+/raw/upload/[^\\s?#]+\\.pdf$") String url` y `@NotBlank @Size(max = 120) @Pattern(regexp = "^[^\\p{Cntrl}]+$") String fileName`.
4. `service/CvService` (`@Transactional(readOnly = true)` por defecto): `getAll()`, `upsert(lang, request)` (actualiza `updatedAt` a ahora en UTC), `delete(lang)` idempotente.
5. `controller/CvController`: `GET /api/cv` con `CacheControl.maxAge(60, SECONDS).cachePublic()`; vacío devuelve `{es:null,en:null}`, nunca 500.
6. `controller/AdminCvController`: `PUT` y `DELETE /api/admin/cv/{lang}`, `CacheControl.noStore()`, `@SecurityRequirement(name = "bearerAuth")`, anotaciones Swagger como `AdminProjectController`. `lang` solo `es|en`: otro valor devuelve 400 ProblemDetail (mira cómo `GlobalExceptionHandler` maneja validación de path variables y usa lo consistente con el proyecto).
7. `SecurityConfig`: `GET /api/cv` público. Verifica que `/api/admin/**` ya exija JWT y que CORS permita `PUT`, `DELETE` y `Authorization` (los proyectos ya los usan; no cambies CORS si ya sirve).
8. Firma del CV: en `AdminUploadController` agrega `POST /api/admin/uploads/sign-document`. Reutiliza `CloudinarySignatureService` parametrizando preset y carpeta. En `CloudinaryProperties` y `application.yml` agrega `cv-upload-preset: ${CLOUDINARY_CV_UPLOAD_PRESET:}` y `cv-folder: ${CLOUDINARY_CV_FOLDER:portfolio/cv}`. Si el preset está vacío responde **503 ProblemDetail** (excepción propia mapeada en `GlobalExceptionHandler`). **No** hagas obligatoria la variable en `CloudinaryProductionValidator` (un deploy sin ella no debe tumbar la app). Agrega regla de rate limit para `POST /api/admin/uploads/sign-document` (20 por hora) en `application.yml`; revisa en `RateLimitFilter` cómo se casan los paths para que aplique.
9. No toques el contrato de `/api/admin/uploads/sign` existente.

**Tests (escribirlos, no correrlos), mismo estilo de los vecinos (Testcontainers, `@DirtiesContext`, propiedades dinámicas de seguridad):**
- `CvControllerIntegrationTest`: vacío devuelve `{es:null,en:null}`; tras guardar aparece; header de cache.
- `AdminCvIntegrationTest`: 401 sin token; PUT válido 200; 400 con url `http`, otro host, sin `/raw/upload/`, sin `.pdf`; 400 con `lang` inválido; DELETE 204 y repetido 204.
- Sumar a `AdminUploadControllerTest`: `sign-document` 200 con forma correcta y sin `apiSecret`; 503 con preset vacío.
- Si hace falta, agregar propiedades a `src/test/resources/application-test.yml`.

**Cómo verificar (humano):** `cd backend && ./mvnw -q test`; con el backend corriendo, `curl localhost:8080/api/cv`.

---

## G3 (DeepSeek): admin, vista "CV"

**Leer:** `frontend/src/AdminApp.tsx`, `adminApi.ts`, `adminMessagesApi.ts`, `useAdminMessages.ts`, `MessagesView.tsx` y su test, `cloudinaryUpload.ts`, `ImageUpload.tsx` y su test, `useAdminProjects.ts`, `lib/api.ts`.

**Construir** (archivos sueltos en `frontend/src/`, igual que los demás del admin; textos en español hardcodeados):
1. `adminCvApi.ts`: tipos `CvDocument {url, fileName, updatedAt}` y `CvState {es: CvDocument | null; en: CvDocument | null}`; `getAdminCv()` sobre `GET /api/cv` sin caché (si `adminFetch` acepta `RequestInit`, pasa `{ cache: 'no-store' }`; si no, usa `fetchApi`); `saveAdminCv(lang, {url, fileName})` (PUT); `deleteAdminCv(lang)` (DELETE).
2. `useAdminCv.ts`: query `['admin','cv']` y dos mutaciones que invalidan, igual que `useAdminProjects.ts`.
3. `cloudinaryUpload.ts`: agrega `getCloudinaryDocumentSignature()` (POST `/api/admin/uploads/sign-document`), `uploadPdfToCloudinary(file, signature)` hacia `https://api.cloudinary.com/v1_1/{cloudName}/raw/upload` (devuelve `secure_url`) y `uploadAdminCv(file)`. Reutiliza la lógica de armado de FormData sin romper `ImageUpload.test.tsx` (el orden de llamadas a fetch de la subida de imágenes no debe cambiar).
4. `CvView.tsx`: encabezado "Currículum" y dos tarjetas (Español, English). Cada una muestra el estado (cargado con `fileName`, fecha de actualización en `es-MX` y enlace "Ver" en pestaña nueva, o "Sin archivo"), un `<input type="file" accept=".pdf,application/pdf">` y botones "Subir"/"Reemplazar" y "Quitar" (con `window.confirm`, como `ProjectsView`). Valida antes de subir: tipo `application/pdf` y tamaño <= 5 MB (si falla, mensaje y cero llamadas de red). Flujo: firma, subida a Cloudinary, PUT al backend. Estados de carga/éxito/error con `aria-live`. Nota visible: "Quitar solo desvincula el CV del sitio; el archivo permanece en Cloudinary."
5. `AdminApp.tsx`: añade la entrada "CV" siguiendo el mecanismo de navegación existente (si las demás vistas son lazy, esta también).
6. Tests (escribir, no correr): `CvView.test.tsx` (dos estados; rechaza no-PDF y > 5 MB sin hacer fetch; flujo de subida llama firma, Cloudinary y PUT en orden; quitar con confirm), imitando `MessagesView.test.tsx` e `ImageUpload.test.tsx`.

**Cómo verificar (humano):** en `/admin` subir un PDF ES y uno EN, ver el estado, reemplazar, quitar.

---

## G4 (DeepSeek): web pública, tile CV + modal glass

**Leer:** `features/about/AboutSection.tsx`, `components/BentoGrid.tsx`, `BentoTile.tsx`, `CvTile.tsx` y los tests `AboutSection.test.tsx`, `BentoGrid.test.tsx`; `data/profile.ts` y `profile-base.ts` (campo `cv`); `lib/api.ts`; `hooks/useCapabilities.ts`; `features/projects/components/ProjectDetailModal.tsx` y su CSS en `index.css` (bloques S13-F y `[data-perf="lite"]`); `scripts/snapshot-projects.mjs` (patrón); `package.json` (scripts `prebuild`/`snapshot`); `src/components/icons/UiIcons.tsx` (G0). Las keys `cv.*` ya existen (G0).

**Construir:**
1. `features/cv/useCv.ts`: estado inicial desde `data/cv.snapshot.json`; al montar hace `fetchApi('/api/cv')` y, si responde, reemplaza el estado; si falla, conserva el snapshot. Caché a nivel de módulo (TTL 5 min) para que remontar no repita la petición. **Sin TanStack Query** (su `QueryClient` está acotado a Projects y no debe crecer la entrada). Devuelve `{ cv, status: 'loading' | 'ready' | 'error' }`.
2. `features/cv/cvHelpers.ts`: `getCvDownloadUrl(url)` inserta `fl_attachment/` justo después de `/raw/upload/` (si la URL no tiene ese patrón devuelve la original); `pickDefaultLang(cv, uiLang)` prefiere el idioma de la UI si existe, si no el otro. Con `cvHelpers.test.ts`.
3. `components/ui/GlassModal.tsx`: wrapper de `<dialog>` reutilizable. `showModal()` al montar, cierre con Esc y clic en el fondo, `data-lenis-prevent="true"`, `aria-labelledby`, `onClose` (el foco de regreso lo maneja quien lo abre, como `ProjectCard`). Entrada con `m.div` solo `opacity`/`y`/`scale`, y solo si `!useReducedMotion() && canUseHeavyEffects`. CSS `.glass-modal` con el mismo look del modal de proyectos (superficie de vidrio con `color-mix`, línea de acento superior con `--gradient-brand`, borde tintado, `::backdrop` con `blur(10px)` estático) más **centrado** (`position: fixed; inset: 0; margin: auto; height: fit-content`, sin `display`). En lite: `::backdrop` sólido sin blur y sin animaciones. NO refactorices `ProjectDetailModal` para usarlo.
4. `features/cv/CvModal.tsx` (con `React.lazy` desde `CvTile`, para no engordar el chunk de About): encabezado con eyebrow "Currículum" y el título; si existen ES y EN, un selector segmentado (`role="group"`, botones con `aria-pressed`). Cuerpo: en escritorio (`isDesktopLayout`) un `<iframe title src={url + '#view=FitH'} loading="lazy">` de alto `min(70dvh, 46rem)`, con un overlay de carga que desaparece al `onLoad`; en móvil/táctil NO iframe: tarjeta con icono, nombre del archivo y `cv.mobileNote`. Siempre visible un enlace "Abrir en otra pestaña" (respaldo si el iframe falla). Pie: botón principal **Descargar** (`<a href={getCvDownloadUrl(url)} download rel="noopener noreferrer">`) y botón secundario **Cerrar**. Micro-interacciones: hover con `translateY(-2px)` solo con `(hover: hover)` y sin reduced motion, `scale(0.98)` al presionar, foco visible; nada de `filter`. Iconos de `UiIcons` (`FileTextIcon`, `DownloadIcon`, `CloseIcon`, `ArrowUpRightIcon`).
5. `CvTile.tsx`: deja de leer `PROFILE_DATA.cv` y usa `useCv`. Con algún CV: botón "Ver CV" (abre el modal con `pickDefaultLang`) más una línea con los idiomas disponibles. Sin CV: `about.cvUnavailable`. Mientras `status === 'loading'` y el snapshot vacío: `cv.loading`, no "próximamente". Devuelve el foco al botón al cerrar. Respeta el layout y la altura actuales del tile; léelo antes de editar.
6. Snapshot en build: `scripts/snapshot-cv.mjs` (mismo patrón y política "si falla, conserva y sal con 0"): hace GET a `${API_URL}/api/cv` (hasta 3 intentos separados 10 s, timeout 30 s cada uno; el snapshot de proyectos ya despertó el backend), valida la forma `{es, en}` (cada uno `null` o con `url` y `fileName` strings) y escribe `src/data/cv.snapshot.json`. Exporta la función de validación y haz `snapshot-cv.test.js` mínimo. En `package.json`: script `"snapshot:cv": "node scripts/snapshot-cv.mjs"` y `"prebuild": "npm run snapshot && npm run snapshot:cv"`.
7. Tests (escribir, no correr): `useCv.test.ts` (snapshot inicial, la respuesta en vivo lo reemplaza, error conserva), `CvModal.test.tsx` (imitar `ProjectDetailModal.test.tsx`: mock de `showModal`/`close`; con `useCapabilities` mockeado, escritorio tiene iframe y móvil no; el enlace de descarga lleva `fl_attachment`; Cerrar cierra; el selector cambia de idioma), y ajusta los tests de About/CvTile que dependían de los enlaces de descarga.

Nota para el reporte: `cv` en `profile.ts`/`profile-base.ts` queda sin uso; no lo borres, anótalo como deuda.

**Cómo verificar (humano):** con un CV subido, "Ver CV" abre el modal centrado con blur de fondo, cursor visible, iframe en escritorio, Descargar baja el PDF, Cerrar devuelve el foco; tema claro/oscuro; `?perf=lite`; emulación móvil.

---

## G5 (DeepSeek): enlaces de "Sobre mí" y footer

**Leer:** `features/about/AboutSection.tsx` y `components/BentoGrid.tsx`/`BentoTile.tsx` (dónde se pinta "Enlaces", clave `about.linksLabel`), `App.tsx` (footer actual), `components/layout/Navbar.tsx` y `components/SmoothScrollProvider.tsx` (cómo se hace el scroll a secciones), `data/site.ts`, `data/profile-base.ts` (ubicación), `components/icons/UiIcons.tsx`, `components/icons/stack/SimpleIcons.tsx` (estilo), `hooks/useCapabilities.ts`, tokens en `index.css`, `App.test.tsx` y tests de About. Keys i18n `social.*` y `footer.*` ya existen (G0).

**Construir:**
1. `data/socials.ts`: arreglo único `SOCIAL_LINKS` (id, i18n key, `url`, `handle`, icono) para LinkedIn, GitHub, Instagram, usando `SITE_CONFIG`. Lo comparten el tile y el footer. El correo NO va aquí.
2. `features/about/components/SocialLinks.tsx`, que reemplaza el contenido actual de "Enlaces" dentro del `BentoTile` existente. Orden: LinkedIn, GitHub, Instagram, Correo. Los tres primeros son `<a target="_blank" rel="noopener noreferrer">` con `aria-label` que incluya `social.opensNewTab`, icono en cuadro tintado (`color-mix` del acento), nombre, handle en mono (con ellipsis) y `ArrowUpRightIcon`. El correo es un `<button>`: copia `SITE_CONFIG.contactEmail` con `navigator.clipboard.writeText` (try/catch), cambia el icono a `CheckIcon` 2 s y muestra `social.emailCopied` en un `role="status"`; luego hace scroll a `#contact` con el mismo mecanismo que usa el Navbar (smooth, `auto` si reduced motion). Si falla el portapapeles, muestra `social.copyFailed` y aun así hace el scroll. Subtexto del botón: `social.emailHint` (no pintes la dirección en el HTML).
3. Diseño: contenedor tipo vidrio estático (un solo `backdrop-filter: blur(8px)` en el contenedor, nunca por enlace), grilla de 2 columnas (1 en pantallas muy angostas), hover con `translateY(-2px)` y borde de acento (solo `(hover: hover)` y sin reduced motion), entrada escalonada con `m.li` (`opacity`/`y`) solo si `canUseHeavyEffects && !reduced`. En lite: sin blur, sin animaciones, sin transiciones.
4. `components/layout/Footer.tsx` (reemplaza el `<footer>` de `App.tsx`; en `App.tsx` solo quita el bloque y monta `<Footer />`, y conserva `TerminalLauncher` y `BootIntroLauncher`). Contenido: columna marca (nombre, `footer.tagline`, ubicación desde `PROFILE_DATA.location`), columna de navegación (Inicio, Sobre mí, Experiencia, Proyectos, Contacto con los mismos ids y labels `nav.*` del Navbar), columna de redes con iconos desde `SOCIAL_LINKS`; barra inferior con `© año`, `footer.rights`, `footer.builtWith`, botón "Volver arriba" (`ArrowUpIcon`, `footer.backToTop`) y el botón `>_` de la terminal que ya existe (`openTerminal`). `<footer>` con `<nav aria-label={t('footer.navLabel')}>` y `aria-label` en la lista de redes. **Sin `motion`** (va en el chunk de entrada): solo CSS, hover con transform, `transition: none` en lite y reduced motion. Mantén el bundle inicial <= 150,000 B gzip.
5. CSS al final de `index.css` con banner `S13-G5`, solo tokens, claro/oscuro, bloque lite.
6. Tests (escribir, no correr): `SocialLinks.test.tsx` (hrefs y atributos externos de los 3 enlaces; el botón de correo llama a `clipboard.writeText` con el correo, muestra el estado copiado y hace scroll), `Footer.test.tsx` (nav, redes con href correcto, año), y ajusta `App.test.tsx` en lo que cambie el footer.

**Cómo verificar (humano):** "Sobre mí" y footer en claro/oscuro, móvil y escritorio; los enlaces abren los perfiles correctos; el botón de correo copia y baja al formulario; `?perf=lite`; teclado (Tab/Enter).

---

## Fuera de alcance (anotar, no implementar)
- `useProjects` usa `staleTime: Infinity`: los cambios del admin en proyectos no se ven sin regenerar el snapshot y redeploy. Decisión del humano si se revisa en S13.
- Borrar el asset de Cloudinary al quitar un CV (requiere llamada admin con el secreto).
- Mover los archivos del admin a `features/admin`.
