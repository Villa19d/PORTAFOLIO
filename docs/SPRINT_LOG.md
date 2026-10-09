# Registro de Sprints

| Sprint | Fecha | Resultado | Notas |
|---|---|---|---|
| Sprint 0 | 2024-10-06 | Estructura base, BD local (Docker) y CI/CD | Tickets 0.1 (Monorepo base) y 0.2 (Workflows de CI) completados. |


## Reporte de Sprint S0
Tickets: completados 2/2 (S0-T1 Monorepo Base, S0-T2 CI Workflows)
Estado de main: Builds verdes. CI pasa correctamente (Workflows configurados para saltar con éxito hasta que haya código). Docker con PostgreSQL local en estado healthy.
Desviaciones del plan: Ninguna. El monorepo base se levantó sin contratiempos.
Decisiones nuevas: La caché de GitHub Actions para el backend se configuró con hashFiles para soportar tanto Maven como Gradle desde el inicio, preparándonos para cualquier gestor de dependencias.
Deuda técnica / riesgos detectados: Ninguno.
Hallazgos de rendimiento (si aplica): N/A
Dudas para Claude PM: Ninguna. Sprint 0 completado con éxito, infraestructura base lista.

## Reporte de Sprint S1
Tickets: completados 2/2 (S1-T1 Backend Skeleton, S1-T2 Projects Read)
Estado de main: Builds verdes. Docker con PostgreSQL local en estado healthy. El contenedor del backend compila correctamente y respeta el límite de memoria (~234 MiB en reposo).
Desviaciones del plan:

Se ajustó la versión de Spring Boot a la 3.4.3 para evitar conflictos de resolución de dependencias con Flyway y otras librerías en las versiones 3.5.x.
Decisiones nuevas:

Manejo de Errores: Se implementó RFC 7807 (ProblemDetail) para respuestas de error estandarizadas.

Mapeo de Arrays: Se utilizó el soporte nativo de Hibernate 6 para mapear arrays de PostgreSQL a List<String> en Java, evitando el uso de librerías externas (como hypersistence).

Aislamiento de Seed Data: Se separó el script de datos de prueba (V3__seed_projects.sql) a un directorio db/seed. El perfil application.yml solo carga db/migration, mientras que application-local.yml incluye ambos.
Deuda técnica / riesgos detectados:

El Test de Integración con Testcontainers en Windows (Docker Desktop) arroja un error ambiental debido a permisos del socket de Docker. Se confía en que el CI de GitHub Actions lo ejecute correctamente en entorno Linux.
Hallazgos de rendimiento (si aplica):

El tamaño final de la imagen Docker es de ~129 MB usando Alpine, optimizado para el despliegue en Render.
Dudas para Claude PM: Ninguna. Sprint 1 completado con éxito, API pública de lectura funcionando según el contrato.




## Reporte de Sprint S2
**Tickets:** completados 3/3 (S2-T1 Security JWT, S2-T2 Admin CRUD, S2-T3 Rate Limiting)
**Estado de main:** Builds verdes. CI ejecutando exitosamente. Todos los tests de integración (27/27) pasando.
**Desviaciones del plan:**
*   Ninguna.
**Decisiones nuevas:**
*   **Ticket 2.1:** Implementación de JWT Stateless usando `oauth2-resource-server` con Nimbus (HmacSHA256). Refresh Token configurado en cookie HttpOnly.
*   **Ticket 2.2:** CRUD de administración protegido bajo `/api/admin/projects`. Intercepción de `DataIntegrityViolationException` para garantizar unicidad de slugs (409 Conflict).
*   **Ticket 2.3:** Rate Limiting implementado con Bucket4j y Caffeine para control de RAM. 
*   **Ticket 2.3:** Resolución de IPs confiando en `server.forward-headers-strategy=framework`, compatible con el proxy de Render. Se resolvió la limitación de pruebas inyectando una `@TestConfiguration` para sobreescribir el comportamiento de merge de listas YAML de Spring Boot.
**Deuda técnica / riesgos detectados:**
*   Asegurar en producción que no existan accesos directos al servidor Java evadiendo el proxy de Render, para evitar "spoofing" de la cabecera X-Forwarded-For.
*   Subida de imágenes delegada al Sprint 9.
**Hallazgos de rendimiento:**
*   El servidor backend arranca ocupando ~265.6 MiB en memoria (evaluado con `docker stats`), manteniéndose ampliamente por debajo del límite de 512 MB.
**Links:** 
* PRs mergeados: git merge feat/s2-t3-rate-limit, git merge feat/s2-t2-admin-crud, git merge feat/s2-t1-security-jwt a main 





In Progres...



## Reporte de Sprint S3 (EN PROGRESO)
**Tickets:** completados 2/3 (S3-T1 Scaffold, S3-T2 Foundations. Falta: S3-T3 API Fallback)
**Estado de main:** Builds verdes. CI de frontend ejecutando `lint`, `typecheck`, `test` y `build` exitosamente. Tests unitarios 11/11 pasando.
**Desviaciones del plan:**
*   Ninguna.
**Decisiones nuevas:**
*   **Ticket 3.1:** Se integró Vitest con JSDOM compartiendo la configuración de tipos globales de Vite.
*   **Ticket 3.2:** Se establecieron tokens de diseño nativos con Tailwind v4.
*   **Ticket 3.2:** Se implementó `useCapabilities` para evaluar en tiempo real las capacidades del hardware del cliente, protegiendo animaciones pesadas.
*   **Ticket 3.2:** Script anti-FOUC inyectado en `index.html` para prevenir el parpadeo del modo oscuro.
*   **Ticket 3.2:** Mocks globales de `ResizeObserver` y `matchMedia` inyectados en JSDOM para pruebas consistentes.
**Deuda técnica / riesgos detectados:**
*   Los placeholders de SEO en `index.html` deben ser actualizados antes del despliegue final.
**Hallazgos de rendimiento:**
*   N/A
**Links:** 
* PRs: git merge feat/s3-t2-foundations, git merge feat/s3-t1-scaffold a main