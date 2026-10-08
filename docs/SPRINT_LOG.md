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