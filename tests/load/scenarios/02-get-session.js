/**
 * Cenário: Buscar Sessão por ID
 * Endpoint: GET /api/v1/sessions/{id}
 * Auth: Nenhuma (público)
 * Rate limit: 50 req/60s por IP
 *
 * Uso:
 *   smoke:        k6 run --env SCENARIO=smoke tests/load/scenarios/02-get-session.js
 *   carga normal: k6 run tests/load/scenarios/02-get-session.js
 *   stress:       k6 run --env SCENARIO=stress tests/load/scenarios/02-get-session.js
 *
 * Nota: Em setup(), cria uma sessão fixture. Todos os VUs reutilizam esse ID.
 *       Em produção, forneça uma sessão existente via: --env SESSION_ID=<id>
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const errorRate = new Rate('errors')

// SLOs — PRD.md: API Routes p95 < 200ms
const SLO_P95 = 200
const SLO_P99 = 400

export const options = {
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: __ENV.SCENARIO || 'default',
    endpoint: 'get-session',
  },
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
    },
    average_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '1m', target: 5 },
        { duration: '3m', target: 5 },
        { duration: '1m', target: 0 },
      ],
      startTime: '1m',
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 20 },
        { duration: '3m', target: 20 },
        { duration: '2m', target: 0 },
      ],
      startTime: '6m',
    },
  },
  thresholds: {
    http_req_duration: [`p(95)<${SLO_P95}`, `p(99)<${SLO_P99}`],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.05'],
  },
}

export function setup() {
  // Usa SESSION_ID do env ou cria uma nova sessão como fixture
  if (__ENV.SESSION_ID) {
    return { sessionId: __ENV.SESSION_ID }
  }

  const res = http.post(
    `${BASE_URL}/api/v1/sessions`,
    JSON.stringify({ locale: 'pt-BR' }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  if (res.status !== 201) {
    console.warn(`setup: falhou ao criar sessão fixture — HTTP ${res.status}. Verifique se a aplicação está rodando.`)
    return { sessionId: 'fixture-not-created' }
  }

  const body = JSON.parse(res.body)
  console.log(`setup: sessão fixture criada — id=${body.id}`)
  return { sessionId: body.id }
}

export default function (data) {
  const sessionId = data.sessionId

  const res = http.get(`${BASE_URL}/api/v1/sessions/${sessionId}`)

  const ok = check(res, {
    'get-session status 200 ou 404 ou 410': (r) => [200, 404, 410].includes(r.status),
    'get-session latência < SLO p95': (r) => r.timings.duration < SLO_P95,
    // 404 SESSION_NOT_FOUND e 410 SESSION_EXPIRED são respostas esperadas (ERROR-CATALOG: SESSION_080)
    'get-session não retorna 5xx': (r) => r.status < 500,
  })

  errorRate.add(!ok)
  sleep(2)
}
