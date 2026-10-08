# Registro de Decisiones de Arquitectura (ADR)

## 1. Base de Datos: Neon sobre Supabase
- **Contexto:** Se requiere una base de datos PostgreSQL para el backend del portafolio.
- **Decisión:** Se elige Neon en lugar de Supabase.
- **Consecuencia:** Menor sobrecarga (ya que el backend en Spring Boot maneja su propia lógica de autenticación y APIs), entorno serverless compatible con los recursos gratuitos, y fácil integración con contenedores Postgres para desarrollo local.

## 2. Envío de Correos: Resend por API HTTP (No SMTP)
- **Contexto:** Render gratuito bloquea los puertos SMTP estándar para evitar spam.
- **Decisión:** Se utilizará Resend a través de su API HTTP.
- **Consecuencia:** Aseguramos que el envío de correos funcione en el entorno de producción de Render sin configuraciones especiales ni problemas de bloqueo de puertos.

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
- **Contexto:** El proyecto arrancó en Spring Boot 3.4.3 por ser la versión que generó Spring Initializr en ese momento. El PM rechazó esta decisión porque el ticket original especificaba 3.5.x (rama con soporte vigente en el momento del Sprint 1).
- **Decisión:** Se actualizó a Spring Boot **3.5.16**, última patch release de la rama 3.5.x (lanzada el 25 de junio de 2026, también la última OSS de esa rama). Se documenta que la rama 3.5.x alcanzó EOL en junio 2026; una futura decisión de arquitectura deberá evaluar si migrar a 4.x para seguir recibiendo parches de seguridad.
- **Consecuencia:** La actualización es compatible binariamente con el código existente (mismo Java 21, mismo Hibernate 6, mismo Flyway de la rama compatible). El BOM actualizado trae versiones más recientes de Flyway y Testcontainers gestionadas automáticamente.

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
