# Instrucciones del repo (obligatorias)
Antes de cada tarea lee AGENTS.md y docs/DECISIONS.md. Si una instrucción choca con ellos, DETENTE y pregunta.

ESTADO: portafolio React 19 + Vite + TS estricto (/frontend) y Spring Boot (/backend, terminado). Sprints S0-S12 entregados (sonido, paleta Ctrl+K, terminal, intro, Hero 3D con three, mundo 3D del Bento con three + cannon-es). Estamos en el cierre de S11-S12 y entrando a S13 (contenido real, SEO, CSP, README).

ROL: eres el ejecutor. Trabajas solo en /frontend salvo que la tarea diga otra cosa. El humano hace ramas, commits, PRs y merges; antes de cada tarea hace un commit de respaldo.
PROHIBIDO: git commit/push/merge/rebase/reset/checkout/restore/stash; scripts que reemplazan texto a ciegas; reescribir archivos completos para un cambio pequeño. Edita con la herramienta de edición, un archivo a la vez, cambios mínimos.
ALCANCE: solo lo que pide la tarea. No renombres, muevas ni borres nada fuera de ella. No dejes copias de respaldo dentro de src.
CONGELADO: frontend/src/**/bentoWorldScene.ts solo admite correcciones de bugs, nada de features.
DEPENDENCIAS: prohibido instalar, actualizar o quitar paquetes sin permiso explícito en la tarea. Nunca --force.
SECRETOS: nunca leas ni imprimas .env* ni tokens.
NO INVENTES: rutas, props, claves i18n y tokens se buscan en el repo. Contenido personal nunca se inventa: usa [TODO_CONTENT].
VERIFICACIÓN: antes de terminar corre en /frontend: npm run lint && npm run typecheck && npm test && npm run build y resume la salida. Si los tests fallan por falta de RAM usa npx vitest run --maxWorkers=2. Nunca sondees con el mismo comando repetido.
SI TE QUEDAS SIN PRESUPUESTO A MEDIAS: detente en un estado coherente (que compile) y di exactamente qué falta. Nunca dejes archivos a medio editar.
HONESTIDAD: distingue "ejecuté y vi X" de "creo que X". Tests en verde no prueban que algo funcione en el navegador: describe cómo lo verificará el humano (máx. 3 pasos).
DISEÑO Y RENDIMIENTO: todo lo pesado va lazy y solo con canUseHeavyEffects; todo efecto costoso se apaga con data-perf="lite" y reduced-motion; solo se anima transform/opacity; un solo canvas WebGL activo a la vez; colores desde tokens de index.css; textos solo vía i18n (ES/EN); accesibilidad (foco, teclado, aria).
REPORTE FINAL: formato breve de AGENTS.md §9.