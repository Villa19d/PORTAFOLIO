# Registro de Decisiones de Arquitectura (ADR)

## 1. Base de Datos: Neon sobre Supabase
- **Contexto:** Se requiere una base de datos PostgreSQL para el backend del portafolio.
- **Decisión:** Se elige Neon en lugar de Supabase.
- **Consecuencia:** Menor sobrecarga (ya que el backend en Spring Boot maneja su propia lógica de autenticación y APIs), entorno serverless compatible con los recursos gratuitos, y fácil integración con contenedores Postgres para desarrollo local.

## 2. Envío de Correos: Resend por API HTTP (No SMTP)
- **Contexto:** Render gratuito bloquea los puertos SMTP estándar para evitar spam.
- **Decisión:** Se utilizará Resend a través de su API HTTP.
- **Consecuencia:** Aseguramos que el envío de correos funcione en el entorno de producción de Render sin configuraciones especiales ni problemas de bloqueo de puertos.

## 10. Contacto: Persistencia, seguridad y resiliencia
- **Guardar antes de enviar:** El mensaje se persiste como `PENDING` antes de llamar a Resend. Así un fallo del proveedor no pierde el contacto recibido.
- **Texto plano:** El correo se envía como texto plano, evitando HTML no confiable y reduciendo la superficie de inyección en plantillas.
- **Turnstile falla cerrado:** Un rechazo devuelve `403`; una caída o timeout del proveedor devuelve `503` y no se persiste el mensaje.
- **Límite diario:** Se cuentan los mensajes creados en las últimas 24 horas y se rechaza el exceso con `503`, protegiendo costes y capacidad operativa.
- **Retención:** Los mensajes de contacto se conservan durante 30 días desde `created_at`. Una tarea programada elimina diariamente los registros anteriores al período configurado y ejecuta también una purga al arrancar la aplicación. El período se puede ajustar mediante `CONTACT_RETENTION_DAYS`, con un mínimo de 1 día.

## 3. Almacenamiento de Imágenes: Cloudinary
- **Contexto:** El backend estará desplegado en Render usando un disco efímero (sin almacenamiento persistente).
- **Decisión:** Se utilizará Cloudinary para almacenar y servir imágenes.
- **Consecuencia:** Las imágenes no se perderán con los reinicios del servidor, y en la base de datos solo se guardarán las URLs proporcionadas por Cloudinary.

## 4. Estrategia de Despliegue: Vercel y Render (Docker)
- **Contexto:** Se requiere hospedar un frontend en React (Vite) y un backend en Spring Boot, ambos en capa gratuita.
- **Decisión:** Desplegar el frontend en Vercel y el backend en Render usando contenedores Docker.
- **Consecuencia:** Aprovechamiento óptimo de los tiers gratuitos. El frontend no se dockerizará en producción para aprovechar el CDN de Vercel.

## 5. Autenticación: JWT con Refresh en Cookie HttpOnly
- **Contexto:** Se necesita un mecanismo seguro de autenticación sin estados, previniendo ataques XSS.
- **Decisión:** Se usarán JSON Web Tokens (JWT). El *Access Token* se guardará en memoria en el frontend, y el *Refresh Token* se guardará en una cookie `HttpOnly`, `Secure` y `SameSite=Lax`.
- **Consecuencia:** Prohibición estricta de guardar tokens en localStorage, incrementando la seguridad general de la autenticación.

## 6. Versión de Spring Boot: 3.5.16 (Ticket 1.3)
- **Última revisión de la decisión de soporte:** 19 de octubre de 2026. La tabla oficial de soporte de Spring.io queda pendiente de inserción por el PM.
- **Contexto:** El proyecto arrancó en Spring Boot 3.4.3 por ser la versión que generó Spring Initializr en ese momento. El PM rechazó esta decisión porque el ticket original especificaba 3.5.x (rama con soporte vigente en el momento del Sprint 1).
- **Decisión:** Se actualizó a Spring Boot **3.5.16**, última patch release de la rama 3.5.x (lanzada el 25 de junio de 2026, también la última OSS de esa rama). Se documenta que la rama 3.5.x alcanzó EOL en junio 2026; una futura decisión de arquitectura deberá evaluar si migrar a 4.x para seguir recibiendo parches de seguridad.
- **Consecuencia:** La actualización es compatible binariamente con el código existente (mismo Java 21, mismo Hibernate 6, mismo Flyway de la rama compatible). El BOM actualizado trae versiones más recientes de Flyway y Testcontainers gestionadas automáticamente.
- **Auditoría de Soporte OSS (Ticket 4.4):**
  - **Línea actual:** Spring Boot 3.5.16. Su soporte OSS comunitario finalizó en junio de 2026.
  - **Líneas OSS vigentes hoy (spring.io):** Spring Boot 4.0.x y superiores cuentan con soporte OSS activo en la actualidad.
  - **Recomendación:** **Aceptar el riesgo en el corto plazo**. La aplicación tiene una superficie de ataque muy reducida (solo dos endpoints públicos y endpoints de admin protegidos), no utiliza dependencias con CVEs críticos activos y opera en un contenedor Alpine Linux con límite de memoria estricto (~512MB RAM en Render Free). Se recomienda programar la migración mayor a Spring Boot 4.x en un sprint técnico futuro cuando se aborde la actualización de dependencias pesadas.
- **Excepción del audit frontend (revisada el 20 de octubre de 2026):**
  - **Advisory:** GHSA-hmx5-qpq5-p643, Prototype pollution en `swiper` 6.5.1–12.1.1, severidad crítica; la versión corregida disponible es 14.3.0.
  - **Motivo:** La corrección requiere saltar al major 14. Se conserva Swiper 11 hasta que un ticket futuro permita migración y validación de compatibilidad.
  - **Política CI:** El audit bloquea cualquier advisory runtime high/crítico que no esté explícitamente aprobado. GHSA-hmx5-qpq5-p643 es la única excepción y debe retirarse al actualizar Swiper.
- **Versión de Java:** Se establece Java 21 LTS como estándar. Spring Boot 3.5 (actualmente en versión estable 3.5.16) y la rama 4.x garantizan soporte comercial y OSS continuo, asegurando la viabilidad a largo plazo.
- **Auditoría de Seguridad (Frontend):** CI configurado para fallar ante vulnerabilidades High/Critical. Se acepta temporalmente la vulnerabilidad de Swiper (Advisory ID: `GHSA-hmx5-qpq5-p643`, Severidad: Alta) ya que exige un cambio Major. Fecha de revisión programada: Sprint 13 (Estabilización final).
## 7. Testcontainers: 1.21.4 en lugar de serie 2.x (Ticket 1.3)
- **Contexto:** El BOM de Spring Boot 3.5.x gestiona una versión anterior de Testcontainers 1.x que no detecta correctamente el socket nombrado de Docker Desktop en Windows con Docker Engine ≥29 (error: `Could not find a valid Docker environment`).
- **Decisión:** Se forzó **Testcontainers 1.21.4** (última versión de la rama 1.x, que incluye el fix de detección de socket) mediante la propiedad `testcontainers.version` en `<properties>` del `pom.xml`. Spring Boot reconoce esta propiedad en su BOM padre y sobreescribe la versión automáticamente sin necesidad de un `<dependencyManagement>` explícito. Se descartó Testcontainers 2.0.5 (serie 2.x) porque esa versión renombró TODOS los artifactIds del ecosistema (ej. `junit-jupiter` → `testcontainers-junit-jupiter`, `postgresql` → `testcontainers-postgresql`), lo que habría requerido modificar el `pom.xml` Y potencialmente imports en el código de tests — cambio de mayor alcance que no estaba en el scope del ticket.
- **Consecuencia:** Los tests de integración locales pueden conectar con Docker Desktop en Windows. La migración a Testcontainers 2.x queda como **deuda técnica pendiente** para cuando se actualice Spring Boot a la rama 4.x.

## 8. Lazy Initialization en Producción: Análisis y Solución (Ticket 1.3)
- **Contexto:** El perfil `prod` tenía `spring.main.lazy-initialization=true` pero sin documentación ni verificación de su impacto en Actuator y Springdoc.
- **Decisión y análisis:**
  - **Actuator (`/actuator/health`, `/actuator/info`):** NO se rompe. Spring Boot marca internamente sus endpoints de management como eager cuando están incluidos en la lista de exposición, por lo que se inicializan al arranque independientemente del flag de lazy-init.
  - **Springdoc (`/v3/api-docs`, Swagger UI):** En versiones anteriores (≤2.8.x), el primer request podía tardar 1-2 segundos extra o generar un 500 en contextos con dependencias cruzadas. **Solución aplicada:** `springdoc.pre-loading-enabled=true` en `application-prod.yml`. Esto le indica a Springdoc que construya el spec OpenAPI durante el arranque del contexto, eliminando la latencia del primer request sin perder el beneficio del lazy-init en el resto de los beans de negocio.
- **Consecuencia:** Startup más rápido en Render (~30% menos según benchmarks de Spring), con Actuator y Swagger disponibles inmediatamente tras el primer request al servidor.

## 9. Seguridad: JWT Stateless y Refresh Tokens en Cookie (Ticket 2.1)
- **Contexto:** La API necesita un método de autenticación para el administrador que prevenga robo de tokens vía XSS y funcione eficientemente en un entorno de memoria restringida (512MB).
- **Decisión:** Se usa Spring Security con OAuth2 Resource Server y Nimbus para la emisión de tokens JWT `HS256`. El Access Token es de corta duración (15 min) y se devuelve en el body de la respuesta. El Refresh Token es de larga duración (7 días) y se entrega de manera exclusiva mediante una Cookie `HttpOnly`, `Secure` y `SameSite=Lax`.
- **Consecuencia:** 
  - **Eficiencia**: Es totalmente *stateless* (sin guardar tokens en la DB). 
  - **Trade-off de revocación**: Al no guardar estado en la base de datos, no se puede revocar un token individual si se compromete, excepto rotando la variable de entorno `JWT_SECRET` (lo cual invalidaría TODOS los accesos, algo aceptable siendo un portafolio de un único usuario).

## 10. Sanitización de Markdown (Ticket 2.2)
- **Contexto:** Los proyectos permiten escribir descripciones usando Markdown. Hay un riesgo de inyección de código XSS si el usuario escribe HTML directamente en el texto Markdown.
- **Decisión:** La descripción markdown se renderiza en el frontend SIN HTML crudo (sanitizada). El backend asume que el frontend aplicará esta restricción (una restricción para el Sprint S6).
- **Consecuencia:** Menor riesgo de ataques XSS. El backend no necesita procesar, limpiar o sanitizar el markdown antes de guardarlo en base de datos.

## 11. Conexiones de Base de Datos y HikariCP en Neon (Ticket 4.1)
- **Contexto:** Neon, al ser una base de datos serverless (con escalado a cero), cierra abruptamente las conexiones inactivas (idle) después de 5 minutos, provocando errores en HikariCP si intenta reutilizarlas.
- **Decisión:** Se bajó el parámetro `max-lifetime` de HikariCP a 4 minutos (240000 ms) en el perfil de producción (`application-prod.yml`).
- **Consecuencia:** HikariCP cerrará y reciclará proactivamente las conexiones antes de que Neon las cierre a la fuerza, evitando picos de errores o latencia intermitente al levantar la app.

## 12. Auditoría de Cabeceras de Cliente y Resolución Anti-Spoofing de IP (Ticket 4.4)
- **Contexto:** El script de humo detectó evasión de Rate Limit al inyectar cabeceras manipuladas por el cliente. Se requirió auditar el camino real de la petición (`Cliente → Edge de Render / Cloudflare → App en Tomcat`) para identificar qué cabeceras son de confianza estricta.
- **Matriz de Auditoría:**
  | Cabecera | Quién la establece | ¿El Edge la sobrescribe / elimina? | Fuente Oficial | ¿Confiable? |
  |---|---|---|---|---|
  | `CF-Connecting-IP` | Cloudflare (Edge de Render) | **SÍ, la sobrescribe siempre.** Cloudflare sobreescribe cualquier valor que envíe el cliente con la IP real del socket TCP del visitante. | [Cloudflare Request Headers](https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#cf-connecting-ip) | **SÍ (Fuente autoritativa primaria)** |
  | `True-Client-IP` | Cloudflare Enterprise (Managed Transforms) | **NO en planes estándar.** Sólo se normaliza en Enterprise. En planes estándar pasa tal cual si el cliente la inyecta. | [Cloudflare True-Client-IP Docs](https://developers.cloudflare.com/fundamentals/reference/http-request-headers/#true-client-ip) | **NO (Eliminada de la lista de confianza)** |
  | `X-Real-IP` | Proxies inversos genéricos (Nginx/Envoy) | **NO garantizado por Render.** Si el cliente la envía, Render la deja pasar tal cual. | [Render Web Services Docs](https://render.com/docs/web-services) | **NO (Eliminada de la lista de confianza)** |
  | `Forwarded` (RFC 7239) | Cliente / Proxies | **NO garantizado.** Render no normaliza ni reescribe RFC 7239 en el edge. | [Cloudflare Request Headers](https://developers.cloudflare.com/fundamentals/reference/http-request-headers/) | **NO (Eliminada de la lista de confianza)** |
  | `X-Forwarded-For` | Cliente / Cloudflare / Render | **Concatena (Append), NO sobrescribe.** Render añade la IP real al final de la lista. | [Render Proxy Documentation](https://render.com/docs/web-services) | **SÓLO el rightmost si proviene de proxy interno confiable (Fallback)** |

- **Decisión:**
  1. Se eliminan `CF-Connecting-IP`, `True-Client-IP`, `X-Real-IP` y `Forwarded` del resolver: la aplicación no confía en ninguna de esas cabeceras porque una petición directa al origen de Render puede incluirlas arbitrariamente.
  2. Render es la infraestructura de borde confiable y añade la IP real del cliente al final de `X-Forwarded-For`. El resolver usa únicamente el valor válido situado más a la derecha.
  3. Si no existe un `X-Forwarded-For` utilizable, se usa `request.getRemoteAddr()` como fallback de la conexión TCP.
  4. Se desactiva el procesamiento `native` de cabeceras reenviadas en Tomcat (`server.forward-headers-strategy: none`) para que `remoteAddr` conserve el peer TCP original y nunca sea una decisión basada en una cabecera ya reescrita.
- **Consecuencia:** Las cabeceras falsificables no alteran la clave del rate limit. La IP usada en producción depende de la cadena `X-Forwarded-For` que Render completa en su borde; en acceso directo sin esa cadena se conserva la IP del socket.


## 13. Infraestructura (Sprint 7)
**Render:** NitroStore se moverá a una cuenta separada (vinculada al mismo GitHub) para no agotar las 750 horas gratuitas. Límite: antes de enviar el portafolio a reclutadores. UptimeRobot se mantiene en el portafolio.



## 14. Rendimiento adaptativo: modo lite (Ticket 11.0)
- **Contexto:** `canUseHeavyEffects` decidía por tipo de dispositivo (puntero fino, escritorio, sin reduced motion, sin saveData), no por capacidad real de pintar. En un equipo sin aceleración por GPU (caso reproducido en Brave) las animaciones van lentas aunque el dispositivo parezca potente. Es prerrequisito de los sprints 3D (S11, S12).
- **Decisión:**
  1. `usePerformanceTier` (`src/hooks/`) mide fps con `requestAnimationFrame` durante ~2 s, empezando tras `load`, un momento idle y ~1 s de gracia, y solo con la pestaña visible (si se oculta, descarta la muestra y la reinicia al volver). Se ignora el primer medio segundo, se calcula el fps de cada ventana de 500 ms y se decide con la **mediana**: menos de 40 fps (`LITE_FPS_THRESHOLD`) => `lite`.
  2. También es `lite` si `navigator.hardwareConcurrency <= 2` o `navigator.deviceMemory <= 2` (lectura segura de tipos, sin medir).
  3. Orden de precedencia: `?perf=lite|full` en la URL, luego la decisión guardada en `sessionStorage` (`portfolio-perf-tier`), luego hardware, luego medición. `?perf=` es solo para pruebas y **no** escribe en `sessionStorage`, para no dejar al usuario atrapado en un modo forzado.
  4. Al decidir `lite` se escribe `document.documentElement.dataset.perf = "lite"`; en `full` se elimina el atributo. La decisión medida se guarda en `sessionStorage` (con `try/catch`) para no medir de nuevo en la sesión.
  5. El estado es un store externo leído con `useSyncExternalStore`, integrado en `useCapabilities`: `canUseHeavyEffects` es `false` en lite, se mantienen las banderas existentes y se exporta `perfTier`.
  6. En lite: fondo del Hero estático (gradiente sin animación), sin spotlight, sin cursor personalizado, sin botones magnéticos, sin tilt, sin resplandor del Bento, `backdrop-filter` del Navbar sustituido por fondo sólido y duraciones de entrada del Hero reducidas. El CSS vive en un único bloque `[data-perf="lite"]` de `index.css`; el resto se desmonta por JS con `canUseHeavyEffects`.
- **Consecuencia:** Los equipos buenos no ven cambios (en full no se altera ningún valor). Las decisiones sincrónicas (URL, sesión, hardware) aplican `data-perf` en el primer render, antes del primer pintado de React. La medición llega unos 3 s después de la carga, así que en la primera visita las animaciones de entrada ya habrán corrido; el beneficio es sobre todo para el resto de la sesión y las visitas siguientes. Una medición puede dar falsos positivos (picos puntuales de CPU) o falsos negativos; se acepta porque el modo lite solo degrada efectos, nunca contenido. El código de medición añade unos pocos bytes al bundle; su impacto sobre el chunk de entrada de S7.3b se evalúa con `dist/stats.json` al cierre del sprint.
