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
