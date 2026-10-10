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

### 2.1 Conversión de la URL de Neon (DB_URL)

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
