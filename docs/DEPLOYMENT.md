# Runbook de Despliegue (Backend)

Este documento describe el proceso manual para preparar y desplegar el backend de la aplicación en Render (vía Docker) usando una base de datos Neon (PostgreSQL Serverless).

## 1. Construcción de la Imagen Docker

El backend se distribuye a través de una imagen Docker. Se construye y se sube al registro deseado (por ejemplo, Docker Hub o directamente al registro privado de Render).

```bash
# 1. Construir la imagen
docker build -t portfolio-backend .

# 2. Etiquetar y subir (ejemplo genérico)
docker tag portfolio-backend <tu-usuario>/portfolio-backend:latest
docker push <tu-usuario>/portfolio-backend:latest
```

## 2. Configuración de Variables de Entorno en Render

En el dashboard de Render, al configurar el Web Service (o background worker), se deben establecer las siguientes variables de entorno. Ninguna debe faltar, de lo contrario la aplicación fallará al iniciar.

- **`PORT`**: `10000` (Render inyecta el puerto que desea exponer, típicamente se lee en Spring Boot).
- **`SPRING_PROFILES_ACTIVE`**: `prod`
- **`JWT_SECRET`**: Clave secreta (mínimo 32 caracteres) para firmar los tokens JWT.
- **`ADMIN_USERNAME`**: Usuario para el panel de administración.
- **`ADMIN_PASSWORD_HASH`**: Contraseña hasheada (BCrypt) para el administrador.
- **`RESEND_API_KEY`**: API key de Resend. Solo se usa desde el backend.
- **`CONTACT_TO_EMAIL`**: Buzón que recibe los mensajes de contacto.
- **`CONTACT_FROM`**: Remitente verificado en Resend, por ejemplo `Portfolio <contacto@rodrigodvillar.com>`.
- **`TURNSTILE_SECRET_KEY`**: Secret key privada de Cloudflare Turnstile.
- **`TURNSTILE_ALLOWED_HOSTNAMES`**: Lista separada por comas, por ejemplo `rodrigodvillar.com,www.rodrigodvillar.com`.
- **`CONTACT_DAILY_CAP`**: Límite de mensajes en 24 horas; por defecto `40`.
- **`CONTACT_MODE`**: `resend` en producción. `log` solo para desarrollo/local.

En el perfil `prod`, todas las variables de contacto son obligatorias y
`CONTACT_MODE=log` provoca un fallo rápido durante el arranque.

### 2.1 Configuración de Resend y Turnstile

En Resend, agrega y verifica el dominio remitente en **Domains**. Publica en DNS
los registros SPF y DKIM que Resend proporciona y espera a que el dominio aparezca
como verificado antes de usarlo en `CONTACT_FROM`. `CONTACT_TO_EMAIL` puede ser un
buzón distinto; no debe confundirse con el remitente verificado.

En Cloudflare Turnstile, crea un widget para los hostnames reales y configura su
secret key en `TURNSTILE_SECRET_KEY`. Los hostnames enviados por Cloudflare deben
coincidir con `TURNSTILE_ALLOWED_HOSTNAMES`; no se aceptan tokens de otro dominio.
Para desarrollo local usa las claves de prueba oficiales de Turnstile y `localhost`
en la lista permitida. No uses claves de producción ni las guardes en el repositorio.

### 2.2 Conversión de la URL de Neon (DB_URL)

Neon proporciona una cadena de conexión estándar de PostgreSQL con parámetros específicos. Spring Boot utiliza el driver JDBC y requiere una URL en formato `jdbc:postgresql://`. Además, Neon utiliza SNI (Server Name Indication) y requiere SSL, pero algunos parámetros como `channel_binding=require` no son soportados o necesarios en JDBC.

**Formato original de Neon:**
```text
postgresql://usuario:password@ep-midominio.neon.tech/neondb?sslmode=require&channel_binding=require
```

**Formato convertido para Render:**
Separa el usuario y la contraseña en `DB_USER` y `DB_PASSWORD`, y ajusta el `DB_URL` para que tenga el formato `jdbc:` eliminando parámetros incompatibles. 

- **`DB_URL`**: `jdbc:postgresql://ep-midominio.neon.tech/neondb?sslmode=require`
- **`DB_USER`**: `usuario`
- **`DB_PASSWORD`**: `password`

> **Importante:** Utiliza la conexión directa (direct connection) en Neon, NO el connection pooler (`-pooler`), debido a que Flyway requiere *advisory locks* que fallan a través del pooler pgbouncer de Neon. HikariCP en Spring Boot ya se encarga del connection pooling, por lo que el pooling intermedio no es necesario y puede causar problemas.

## 3. Consideraciones de Base de Datos y Semillas

- En el perfil `prod`, Flyway ejecutará las migraciones principales (`db/migration`), por lo que la estructura de la base de datos se crea o actualiza automáticamente.
- Los scripts de semillas o datos de ejemplo (`db/seed/R__*.sql`) **NO** se ejecutan en producción. Si se requiere insertar datos iniciales, deben inyectarse mediante scripts SQL manuales, o utilizando la API administrativa provista.

## 4. Validaciones de Salud

- Render utilizará la ruta de salud configurada (ej. `HEAD /api/health` o `GET /api/health`) para monitorear si la aplicación se levantó correctamente. El controller de health no se conecta a la base de datos, garantizando que un reinicio de la base de datos no marque a la aplicación como caída (si esto no es deseado) y evitando falsos positivos o negativos al escalar a cero la base de datos Neon.


## 5. Despliegue de Frontend (Vercel)

El frontend de la aplicación está optimizado para su despliegue en Vercel, ofreciendo un proceso rápido e integrado.

### 5.1 Configuración del Proyecto en Vercel

Al importar el repositorio en Vercel, asegúrate de configurar los siguientes parámetros:

- **Framework Preset**: `Vite`
- **Root Directory**: `frontend`
- **Node.js Version**: `22.x` (en la configuración del proyecto -> General -> Node.js Version)
- **Build Command**: `npm run build` (o se detecta automáticamente con Vite)
- **Output Directory**: `dist` (o se detecta automáticamente)

### 5.2 Variables de Entorno

Debes configurar **ambas** variables de entorno en Vercel para que el proyecto construya correctamente:

1. **`VITE_API_URL`**: `https://api.rodrigodvillar.com`
   - **Por qué**: Vite inyecta en el *bundle* público (accesible en el navegador del usuario) cualquier variable que empiece con `VITE_`. Esta es la URL a la que la aplicación web hará las llamadas HTTP en vivo.
2. **`API_URL`**: `https://api.rodrigodvillar.com`
   - **Por qué**: Se usa exclusivamente en el entorno de Node.js durante el proceso de *build* (script `prebuild` -> `snapshot-projects.mjs`). No es expuesta al navegador. Permite que el proceso de despliegue extraiga un *snapshot* inicial de la base de datos de forma segura, incluso si la API de producción estuviera dormida.

### 5.3 Regeneración de Snapshots de Proyectos

El frontend usa un archivo local estático (`src/data/projects.snapshot.json`) como respaldo. Esto garantiza que la página web jamás quede "en blanco", incluso mientras el backend (en su plan gratuito de Render) está despertando (*cold start*, que puede tardar ~30 a 50 segundos).

El script `npm run snapshot` actualiza este archivo en Vercel durante cada despliegue, logrando una sincronización continua con la base de datos de producción.

Para commitear un *snapshot* real por primera vez o actualizarlo manualmente para persistirlo en el código fuente:
1. Asegúrate de tener proyectos reales creados en producción.
2. Desde la terminal, en la carpeta `frontend`, ejecuta:
   ```bash
   API_URL=https://api.rodrigodvillar.com npm run snapshot
   ```
3. Verifica los cambios en `src/data/projects.snapshot.json` y realiza un *commit*.

## 6. Pruebas de Humo en Producción (Smoke Tests)

Para verificar la integridad del contrato de producción (CORS, cookies, rate limit, seguridad y prevención de spoofing), el repositorio cuenta con el script automatizado `scripts/smoke-prod.mjs` (requiere Node 22, sin dependencias externas).

### 6.1 Cómo Ejecutar el Script

Desde la raíz del repositorio:

```bash
# Ejecución completa (verificaciones a - i) con URLs por defecto:
node scripts/smoke-prod.mjs

# Medición rápida de arranque en frío (Cold Start) sin pruebas destructivas ni rate limits:
node scripts/smoke-prod.mjs --cold-start

# Pruebas opt-in del contacto: usa token inválido, no envía correo, pero consume
# la cuota de rate limit del endpoint.
node scripts/smoke-prod.mjs --contact

# Especificando URLs personalizadas (ej. URL temporal de Render):
node scripts/smoke-prod.mjs --api-base=https://portafolio-ml6g.onrender.com --front-origin=https://rodrigodvillar.com

# O mediante variables de entorno:
API_BASE=https://api.rodrigodvillar.com FRONT_ORIGIN=https://rodrigodvillar.com node scripts/smoke-prod.mjs
```

### 6.2 Guía de Interpretación de Resultados

El script evalúa las siguientes comprobaciones en estricto orden y muestra una salida tipo checklist (`✔` / `✘`):

| Check | Descripción | Criterio de Éxito | Interpretación si Falla |
|---|---|---|---|
| **a** | `GET` y `HEAD` `/api/health` | HTTP 200 | El backend está inactivo, en hibernación sin responder o bloqueado a nivel de red/firewall. |
| **b** | `GET` `/api/projects` | HTTP 200, JSON, Array, cabecera `Cache-Control` | Falla de conexión a base de datos, JSON corrupto o falta de cabecera de caché en el endpoint público. |
| **c** | Preflight `OPTIONS /api/auth/refresh` con `Origin = FRONT_ORIGIN` | `Access-Control-Allow-Origin: FRONT_ORIGIN` (exacto) y `Access-Control-Allow-Credentials: true` | CORS mal configurado para el frontend legítimo. El usuario no podrá refrescar tokens ni autenticarse desde Vercel. |
| **d** | Preflight `OPTIONS` con `Origin: https://evil.example` | Cabecera `Access-Control-Allow-Origin` omitida o rechazada | CORS permisivo / abierto indebidamente (permite orígenes no autorizados). |
| **e** | `POST /api/auth/login` con credenciales inválidas | HTTP 401, `application/problem+json`, **SIN** cabecera `Set-Cookie` | Se está emitiendo una cookie de refresh token ante credenciales erróneas o el formato de error no cumple RFC 7807. |
| **f** | `GET /api/admin/projects` sin token | HTTP 401, `application/problem+json` | Endpoint administrativo desprotegido o exponiendo información sin autenticación. |
| **g** | `GET /swagger-ui.html` y `/v3/api-docs` | HTTP 200, `servers[0].url` inicia con `https://` | Swagger deshabilitado o proxy headers mal procesados (OpenAPI anuncia `http://` en lugar de `https://`). |
| **h** | **Rate Limit Básico** (6 logins fallidos seguidos) | Al menos una petición (la #6 o antes) devuelve HTTP 429 con cabecera `Retry-After` | Bucket4j inactivo o umbral de login mal configurado. Ataques de fuerza bruta no serían mitigados. |
| **i** | **Spoofing de IP** (8 logins con `X-Forwarded-For` variables) | Al menos una petición devuelve HTTP 429 | **FALLO CRÍTICO:** La aplicación confía ciegamente en `X-Forwarded-For` enviado por el cliente. Un atacante puede eludir el rate limit simplemente cambiando esta cabecera en cada intento. |

### 6.3 Diagnóstico y Propuesta de Fix ante Fallo en Spoofing (Check i)

Si la prueba **i** es marcada como `CRITICAL FAIL`:
- **Causa Raíz:** `server.forward-headers-strategy: framework` hace que Spring extraiga la dirección IP del primer elemento en `X-Forwarded-For`. Si Render no sanitiza ni sobrescribe esta cabecera (o agrega la IP del cliente al final en lugar de al principio), el servidor confía en la IP falsificada.
- **Propuesta de Mitigación:**
  1. Cambiar `server.forward-headers-strategy: native` y configurar una lista blanca de proxies confiables en Tomcat (`internal-proxies`), o
  2. Implementar un `ClientIpResolver` personalizado que priorice cabeceras de proxy de confianza específicas de la plataforma (por ejemplo, cabeceras seguras de Render o Cloudflare `CF-Connecting-IP`), ignorando `X-Forwarded-For` arbitrarios enviados por el cliente.
