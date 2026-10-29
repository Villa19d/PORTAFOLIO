#!/usr/bin/env node

/**
 * scripts/smoke-prod.mjs
 *
 * Herramienta SRE/QA de verificación de humo (Smoke Test) contra entorno de producción.
 * Valida el contrato de API, cabeceras CORS, cookies seguras, Rate Limiting y resistencia a IP Spoofing.
 *
 * Parámetros de entorno o CLI:
 *   API_BASE      (default: https://api.rodrigodvillar.com)   o --api-base=<url>
 *   FRONT_ORIGIN  (default: https://rodrigodvillar.com)       o --front-origin=<origin>
 *   --cold-start  Solo mide e imprime el tiempo de GET /api/health y GET /api/projects
 *   --contact     Prueba Turnstile inválido y validación del endpoint de contacto.
 *                 Es opt-in, consume cuota de rate limit y nunca debe enviar un correo real.
 */

const args = process.argv.slice(2);

function getArgValue(flag) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === flag && i + 1 < args.length) {
      return args[i + 1];
    }
    if (args[i].startsWith(`${flag}=`)) {
      return args[i].substring(flag.length + 1);
    }
  }
  return null;
}

const isColdStart = args.includes('--cold-start') || process.env.COLD_START === 'true';
const isContactCheck = args.includes('--contact');

const rawApiBase = getArgValue('--api-base') || process.env.API_BASE || 'https://api.rodrigodvillar.com';
const rawFrontOrigin = getArgValue('--front-origin') || process.env.FRONT_ORIGIN || 'https://rodrigodvillar.com';

const API_BASE = rawApiBase.replace(/\/+$/, '');
const FRONT_ORIGIN = rawFrontOrigin.replace(/\/+$/, '');

// Colores ANSI para terminal
const isTTY = Boolean(process.stdout.isTTY);
const colors = {
  reset: isTTY ? '\x1b[0m' : '',
  bold: isTTY ? '\x1b[1m' : '',
  green: isTTY ? '\x1b[32m' : '',
  red: isTTY ? '\x1b[31m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  cyan: isTTY ? '\x1b[36m' : '',
  dim: isTTY ? '\x1b[2m' : ''
};

const SYMBOL_PASS = `${colors.green}✔${colors.reset}`;
const SYMBOL_FAIL = `${colors.red}✘${colors.reset}`;
const SYMBOL_WARN = `${colors.yellow}⚠${colors.reset}`;
const SYMBOL_INFO = `${colors.cyan}ℹ${colors.reset}`;

const REQUEST_TIMEOUT_MS = 60000;

async function fetchWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  const start = performance.now();
  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    const duration = Math.round(performance.now() - start);
    return { res, duration, error: null };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    return { res: null, duration, error: err };
  } finally {
    clearTimeout(timeoutId);
  }
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const results = [];

function recordResult(code, name, passed, durationMs, details = '', isCritical = false) {
  const resultObj = { code, name, passed, durationMs, details, isCritical };
  results.push(resultObj);

  const symbol = passed ? SYMBOL_PASS : SYMBOL_FAIL;
  const timeStr = `${colors.dim}[${durationMs}ms]${colors.reset}`;
  const statusStr = passed
    ? `${colors.green}PASS${colors.reset}`
    : `${colors.red}${isCritical ? 'CRITICAL FAIL' : 'FAIL'}${colors.reset}`;

  console.log(`${symbol} ${timeStr} ${colors.bold}${code}.${colors.reset} ${name} -> ${statusStr}`);
  if (details) {
    const detailLines = details.split('\n');
    for (const line of detailLines) {
      console.log(`    ${colors.dim}${line}${colors.reset}`);
    }
  }
}

console.log(`${colors.bold}=================================================================${colors.reset}`);
console.log(`${colors.bold}   PORTAFOLIO - PROD SMOKE VERIFICATION (SRE/QA)${colors.reset}`);
console.log(`${colors.bold}=================================================================${colors.reset}`);
console.log(`${SYMBOL_INFO} Target API:    ${colors.cyan}${API_BASE}${colors.reset}`);
console.log(`${SYMBOL_INFO} Frontend CORS: ${colors.cyan}${FRONT_ORIGIN}${colors.reset}`);
console.log(`${SYMBOL_INFO} Mode:          ${isColdStart ? `${colors.yellow}COLD-START ONLY${colors.reset}` : `${colors.green}FULL CHECKLIST (A-I)${colors.reset}`}`);
console.log('');

async function runColdStartOnly() {
  console.log(`${colors.bold}--- Comprobación de Tiempo de Arranque (Cold-Start) ---${colors.reset}`);
  
  // 1. GET /api/health
  const tHealthStart = performance.now();
  const healthRes = await fetchWithTimeout(`${API_BASE}/api/health`, { method: 'GET' });
  const healthTime = Math.round(performance.now() - tHealthStart);
  
  const healthPassed = Boolean(healthRes.res && healthRes.res.status === 200);
  recordResult(
    'cs-1',
    'GET /api/health (Cold Start Latency)',
    healthPassed,
    healthTime,
    healthPassed
      ? `HTTP Status: 200 OK | Latencia: ${healthTime} ms`
      : `Error: ${healthRes.error ? healthRes.error.message : `HTTP ${healthRes.res?.status}`}`
  );

  // 2. GET /api/projects
  const tProjStart = performance.now();
  const projRes = await fetchWithTimeout(`${API_BASE}/api/projects`, { method: 'GET' });
  const projTime = Math.round(performance.now() - tProjStart);

  const projPassed = Boolean(projRes.res && projRes.res.status === 200);
  recordResult(
    'cs-2',
    'GET /api/projects (Cold Start Latency)',
    projPassed,
    projTime,
    projPassed
      ? `HTTP Status: 200 OK | Latencia: ${projTime} ms`
      : `Error: ${projRes.error ? projRes.error.message : `HTTP ${projRes.res?.status}`}`
  );

  printSummary();
}

async function runFullSmoke() {
  // -------------------------------------------------------------
  // a. GET y HEAD /api/health: 200
  // -------------------------------------------------------------
  {
    const start = performance.now();
    const getRes = await fetchWithTimeout(`${API_BASE}/api/health`, { method: 'GET' });
    const headRes = await fetchWithTimeout(`${API_BASE}/api/health`, { method: 'HEAD' });
    const duration = Math.round(performance.now() - start);

    const getOk = getRes.res?.status === 200;
    const headOk = headRes.res?.status === 200;
    const passed = getOk && headOk;

    recordResult(
      'a',
      'GET y HEAD /api/health',
      passed,
      duration,
      `GET status: ${getRes.res?.status ?? getRes.error?.message} | HEAD status: ${headRes.res?.status ?? headRes.error?.message}`
    );
  }

  // -------------------------------------------------------------
  // contact. Opt-in: no usa un token válido y nunca debe enviar correo.
  // Cada ejecución consume la cuota del rate limit del endpoint.
  // -------------------------------------------------------------
  if (isContactCheck) {
    const invalidTokenStart = performance.now();
    const invalidTokenRes = await fetchWithTimeout(`${API_BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Smoke Test',
        email: 'smoke@example.com',
        message: 'Mensaje de prueba que no debe enviarse.',
        turnstileToken: 'invalid-smoke-token'
      })
    });
    recordResult(
      'contact-1',
      'POST /api/contact con Turnstile inválido',
      invalidTokenRes.res?.status === 403,
      invalidTokenRes.duration,
      `HTTP status: ${invalidTokenRes.res?.status ?? invalidTokenRes.error?.message}`
    );

    const invalidBodyRes = await fetchWithTimeout(`${API_BASE}/api/contact`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: '', email: 'not-an-email', message: 'short', turnstileToken: '' })
    });
    recordResult(
      'contact-2',
      'POST /api/contact con cuerpo inválido',
      invalidBodyRes.res?.status === 400,
      invalidBodyRes.duration,
      `HTTP status: ${invalidBodyRes.res?.status ?? invalidBodyRes.error?.message}`
    );
  }

  // -------------------------------------------------------------
  // b. GET /api/projects: 200, JSON, estructura mínima, cabecera Cache-Control
  // -------------------------------------------------------------
  {
    const { res, duration, error } = await fetchWithTimeout(`${API_BASE}/api/projects`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    let passed = false;
    let detail = '';

    if (error || !res) {
      detail = `Network error: ${error?.message}`;
    } else {
      const statusOk = res.status === 200;
      const contentType = res.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const cacheControl = res.headers.get('cache-control');
      const hasCacheControl = Boolean(cacheControl && cacheControl.length > 0);

      let isArray = false;
      let validStructure = true;
      let count = 0;

      if (isJson) {
        try {
          const body = await res.json();
          isArray = Array.isArray(body);
          count = isArray ? body.length : 0;
          if (isArray && count > 0) {
            const first = body[0];
            const hasSlug = typeof first.slug === 'string';
            const hasTitle = typeof first.title === 'object' && first.title !== null;
            const hasTech = Array.isArray(first.techStack);
            const hasImage = typeof first.imageUrl === 'string';
            const hasRepo = typeof first.repoUrl === 'string';
            validStructure = hasSlug && hasTitle && hasTech && hasImage && hasRepo;
          }
        } catch (e) {
          validStructure = false;
          detail = `Error al parsear JSON: ${e.message}`;
        }
      }

      passed = statusOk && isJson && hasCacheControl && isArray && validStructure;
      detail = `Status: ${res.status} | JSON: ${isJson} | Cache-Control: ${cacheControl || 'MISSING'} | Proyectos: ${count}${count === 0 ? ' (vacío - sin semillas)' : ''}`;
      if (!validStructure) {
        detail += ` | Estructura inválida en proyecto`;
      }
    }

    recordResult('b', 'GET /api/projects (Estructura y Cache-Control)', passed, duration, detail);
  }

  // -------------------------------------------------------------
  // c. Preflight OPTIONS /api/auth/refresh con Origin = FRONT_ORIGIN
  // -------------------------------------------------------------
  {
    const { res, duration, error } = await fetchWithTimeout(`${API_BASE}/api/auth/refresh`, {
      method: 'OPTIONS',
      headers: {
        Origin: FRONT_ORIGIN,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    let passed = false;
    let detail = '';

    if (error || !res) {
      detail = `Network error: ${error?.message}`;
    } else {
      const allowOrigin = res.headers.get('access-control-allow-origin');
      const allowCreds = res.headers.get('access-control-allow-credentials');

      const originMatch = allowOrigin === FRONT_ORIGIN;
      const credsMatch = allowCreds === 'true';

      passed = originMatch && credsMatch;
      detail = `Status: ${res.status} | Allow-Origin: "${allowOrigin}" (esperado: "${FRONT_ORIGIN}") | Allow-Credentials: "${allowCreds}" (esperado: "true")`;
    }

    recordResult('c', 'Preflight OPTIONS /api/auth/refresh (CORS Legítimo)', passed, duration, detail);
  }

  // -------------------------------------------------------------
  // d. Preflight con Origin https://evil.example
  // -------------------------------------------------------------
  {
    const evilOrigin = 'https://evil.example';
    const { res, duration, error } = await fetchWithTimeout(`${API_BASE}/api/auth/refresh`, {
      method: 'OPTIONS',
      headers: {
        Origin: evilOrigin,
        'Access-Control-Request-Method': 'POST'
      }
    });

    let passed = false;
    let detail = '';

    if (error || !res) {
      detail = `Network error: ${error?.message}`;
    } else {
      const allowOrigin = res.headers.get('access-control-allow-origin');
      // No debe devolver Access-Control-Allow-Origin, o no debe coincidir con evil
      const rejected = !allowOrigin || allowOrigin !== evilOrigin;

      passed = rejected;
      detail = `Status: ${res.status} | Allow-Origin: ${allowOrigin ? `"${allowOrigin}" (INSEGURO)` : 'Cabecera ausente (OK, rechazado)'}`;
    }

    recordResult('d', 'Preflight OPTIONS con Origin no permitido (evil.example)', passed, duration, detail);
  }

  // -------------------------------------------------------------
  // e. POST /api/auth/login con credenciales inválidas inventadas
  // -------------------------------------------------------------
  {
    const { res, duration, error } = await fetchWithTimeout(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Origin: FRONT_ORIGIN
      },
      body: JSON.stringify({
        username: `smoke_invalid_${Date.now()}`,
        password: 'FakePassword123!'
      })
    });

    let passed = false;
    let detail = '';

    if (error || !res) {
      detail = `Network error: ${error?.message}`;
    } else {
      const statusOk = res.status === 401;
      const contentType = res.headers.get('content-type') || '';
      const isProblemJson = contentType.includes('application/problem+json');
      const setCookie = res.headers.get('set-cookie');
      const noSetCookie = !setCookie || !setCookie.includes('refreshToken=');

      passed = statusOk && isProblemJson && noSetCookie;
      detail = `Status: ${res.status} (esperado 401) | Content-Type: "${contentType}" | Set-Cookie: ${setCookie ? 'PRESENTE (FALLO)' : 'Ausente (OK)'}`;
    }

    recordResult('e', 'POST /api/auth/login con credenciales inválidas', passed, duration, detail);
  }

  // -------------------------------------------------------------
  // f. GET /api/admin/projects sin token
  // -------------------------------------------------------------
  {
    const { res, duration, error } = await fetchWithTimeout(`${API_BASE}/api/admin/projects`, {
      method: 'GET',
      headers: { Accept: 'application/json' }
    });

    let passed = false;
    let detail = '';

    if (error || !res) {
      detail = `Network error: ${error?.message}`;
    } else {
      const statusOk = res.status === 401;
      const contentType = res.headers.get('content-type') || '';
      const isProblemJson = contentType.includes('application/problem+json');

      passed = statusOk && isProblemJson;
      detail = `Status: ${res.status} (esperado 401) | Content-Type: "${contentType}"`;
    }

    recordResult('f', 'GET /api/admin/projects sin token', passed, duration, detail);
  }

  // -------------------------------------------------------------
  // g. GET /swagger-ui.html y /v3/api-docs
  // -------------------------------------------------------------
  {
    const start = performance.now();
    const swaggerRes = await fetchWithTimeout(`${API_BASE}/swagger-ui.html`, {
      method: 'GET',
      redirect: 'follow'
    });
    const apiDocsRes = await fetchWithTimeout(`${API_BASE}/v3/api-docs`, { method: 'GET' });
    const duration = Math.round(performance.now() - start);

    let passed = false;
    let detail = '';

    const swaggerOk = swaggerRes.res?.status === 200;
    const docsOk = apiDocsRes.res?.status === 200;
    let serverHttps = false;
    let serverUrlFound = '';

    if (docsOk) {
      try {
        const spec = await apiDocsRes.res.json();
        serverUrlFound = spec.servers?.[0]?.url || '';
        serverHttps = Boolean(serverUrlFound && serverUrlFound.startsWith('https://'));
      } catch (e) {
        detail = `Error parseando OpenAPI spec: ${e.message}`;
      }
    }

    passed = swaggerOk && docsOk && serverHttps;
    detail = `Swagger UI: ${swaggerRes.res?.status ?? 'ERR'} | /v3/api-docs: ${apiDocsRes.res?.status ?? 'ERR'} | servers[0].url: "${serverUrlFound || 'N/A'}" (requiere https)`;

    recordResult('g', 'GET /swagger-ui.html y /v3/api-docs (OpenAPI HTTPS)', passed, duration, detail);
  }

  // -------------------------------------------------------------
  // h. RATE LIMIT BÁSICO: 6 logins inválidos seguidos con el mismo origen
  // -------------------------------------------------------------
  let retryAfterSeconds = 60;
  {
    console.log(`\n${SYMBOL_INFO} Ejecutando prueba h: enviando 6 peticiones de login consecutivas para validar Rate Limit...`);
    const start = performance.now();
    let triggered429 = false;
    let triggerIndex = -1;
    let retryAfterHeader = null;

    for (let i = 1; i <= 6; i++) {
      const { res } = await fetchWithTimeout(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: FRONT_ORIGIN
        },
        body: JSON.stringify({
          username: `probe_rl_user_${i}`,
          password: 'ProbeWrongPassword!'
        })
      });

      if (res && res.status === 429) {
        triggered429 = true;
        triggerIndex = i;
        retryAfterHeader = res.headers.get('retry-after');
        if (retryAfterHeader) {
          const parsed = parseInt(retryAfterHeader, 10);
          if (!isNaN(parsed) && parsed > 0) {
            retryAfterSeconds = parsed;
          }
        }
        break;
      }
      // Pequeña pausa de 50ms entre ráfagas
      await sleep(50);
    }

    const duration = Math.round(performance.now() - start);
    const passed = triggered429 && Boolean(retryAfterHeader);
    const detail = triggered429
      ? `Rate limit disparado en petición #${triggerIndex}/6 (Status 429) | Retry-After: ${retryAfterHeader || 'FALTANTE'} s`
      : `Ninguna de las 6 peticiones retornó 429 Too Many Requests (Fallo en bucket)`;

    recordResult('h', 'RATE LIMIT BÁSICO: 6 logins con mismo origen', passed, duration, detail);
  }

  // -------------------------------------------------------------
  // i. SPOOFING MULTI-CABECERA: Una ronda por cada cabecera
  //    (X-Forwarded-For, CF-Connecting-IP, True-Client-IP, X-Real-IP, Forwarded)
  // -------------------------------------------------------------
  {
    console.log(`\n${SYMBOL_INFO} ${colors.bold}Iniciando Auditoría Anti-Spoofing (5 rondas de cabeceras)...${colors.reset}`);

    const SPOOF_HEADERS = [
      { code: 'i-1', header: 'X-Forwarded-For', generate: (i) => `198.51.100.${10 + i}` },
      { code: 'i-2', header: 'CF-Connecting-IP', generate: (i) => `198.51.100.${20 + i}` },
      { code: 'i-3', header: 'True-Client-IP', generate: (i) => `198.51.100.${30 + i}` },
      { code: 'i-4', header: 'X-Real-IP', generate: (i) => `198.51.100.${40 + i}` },
      { code: 'i-5', header: 'Forwarded', generate: (i) => `for=198.51.100.${50 + i};proto=https` }
    ];

    for (const testCase of SPOOF_HEADERS) {
      const waitSeconds = Math.max(retryAfterSeconds, 1) + 2;
      console.log(`\n${SYMBOL_INFO} [Ronda ${testCase.header}] Esperando ${waitSeconds}s a que expire la ventana (Retry-After: ${retryAfterSeconds}s + 2s)...`);

      // Cuenta regresiva visual
      for (let remaining = waitSeconds; remaining > 0; remaining -= 5) {
        process.stdout.write(`    ${colors.dim}Tiempo restante: ${remaining}s...${colors.reset}\r`);
        await sleep(Math.min(remaining, 5) * 1000);
      }
      console.log(`    ${colors.dim}Ventana expirada. Enviando 8 logins falsificando '${testCase.header}'...${colors.reset}`);

      const start = performance.now();
      let got429 = false;
      let blockedIndex = -1;
      const control = await fetchWithTimeout(`${API_BASE}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Origin: FRONT_ORIGIN
        },
        body: JSON.stringify({
          username: `probe_control_${testCase.code}`,
          password: 'ProbeWrongPassword!'
        })
      });

      if (!control.res || control.res.status === 429) {
        const duration = Math.round(performance.now() - start);
        const detail = [
          'FALLO CRÍTICO: el bucket ya estaba bloqueado antes de la ronda anti-spoofing.',
          'Esto indica un rate limit indiscriminado o un estado compartido entre clientes.',
          `La petición de control devolvió HTTP ${control.res?.status ?? 'ERR'} en lugar de una respuesta no limitada.`
        ].join('\n');
        recordResult(testCase.code, `SPOOFING: Resistencia ante '${testCase.header}' falsificada`, false, duration, detail, true);
        continue;
      }

      const statuses = [];
      let edgeRejected = 0;
      for (let i = 1; i <= 8; i++) {
        const { res } = await fetchWithTimeout(`${API_BASE}/api/auth/login`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Origin: FRONT_ORIGIN, [testCase.header]: testCase.generate(i) },
          body: JSON.stringify({ username: `probe_spoof_${testCase.code}_${i}`, password: 'ProbeWrongPassword!' })
        });
        statuses.push(res ? res.status : 'ERR');
        if (res && res.status === 403) {
          const text = await res.text().catch(() => '');
          if (text.includes('error code: 1000')) edgeRejected++;
        }
        if (res && res.status === 429) {
          got429 = true; blockedIndex = i;
          break;
        }
        await sleep(50);
      }
      const duration = Math.round(performance.now() - start);
      const reachedApp = statuses.filter((s) => s === 401).length;
      const inconclusive = statuses.includes('ERR');
      const passed = !inconclusive && (got429 || reachedApp === 0);
      const summary = `Códigos: [${statuses.join(', ')}] | Rechazadas por el edge de Cloudflare (1000): ${edgeRejected}`;
      recordResult(testCase.code, `SPOOFING: Resistencia ante '${testCase.header}' falsificada`, passed, duration,
        passed ? summary : `FALLO: ${reachedApp} peticiones con valores distintos llegaron al login sin 429.\n${summary}`, !passed);
    }
  }

  printSummary();
}

function printSummary() {
  console.log('\n=================================================================');
  console.log('                      RESUMEN DE PRUEBAS                         ');
  console.log('=================================================================');

  const total = results.length;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = total - passedCount;
  const hasCritical = results.some((r) => !r.passed && r.isCritical);

  for (const r of results) {
    const symbol = r.passed ? SYMBOL_PASS : SYMBOL_FAIL;
    const label = `${r.code}. ${r.name}`;
    const statusText = r.passed
      ? `${colors.green}PASS${colors.reset}`
      : `${colors.red}${r.isCritical ? 'CRITICAL FAIL' : 'FAIL'}${colors.reset}`;
    console.log(`${symbol} ${label.padEnd(65, '.')} ${statusText}`);
  }

  console.log('-----------------------------------------------------------------');
  console.log(`Total: ${total} | ${colors.green}Aprobadas: ${passedCount}${colors.reset} | ${failedCount > 0 ? `${colors.red}Fallidas: ${failedCount}${colors.reset}` : 'Fallidas: 0'}`);

  if (hasCritical) {
    console.log(`\n${colors.red}${colors.bold}🚨 ALERTA DE SEGURIDAD CRÍTICA DETECTADA:${colors.reset}`);
    console.log(`${colors.yellow}Existe una vulnerabilidad en la resolución de IP para el Rate Limiting.${colors.reset}`);
    console.log(`${colors.yellow}Verifica la sección de interpretación en docs/DEPLOYMENT.md para el fix recomendado.${colors.reset}\n`);
  }

  if (failedCount > 0) {
    process.exit(1);
  } else {
    console.log(`\n${colors.green}${colors.bold}✨ ¡Todas las comprobaciones pasaron exitosamente!${colors.reset}\n`);
    process.exit(0);
  }
}

// Ejecutar
if (isColdStart) {
  runColdStartOnly().catch((err) => {
    console.error(`\n${SYMBOL_FAIL} Error inesperado en cold-start:`, err);
    process.exit(1);
  });
} else {
  runFullSmoke().catch((err) => {
    console.error(`\n${SYMBOL_FAIL} Error inesperado en suite de pruebas:`, err);
    process.exit(1);
  });
}
