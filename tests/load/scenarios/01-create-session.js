/**
 * Cenário: Criar Sessão de Orçamento
 * Endpoint: POST /api/v1/sessions
 * Auth: Nenhuma (público)
 * Rate limit: 50 req/60s por IP
 *
 * Uso:
 *   smoke:        k6 run --env SCENARIO=smoke tests/load/scenarios/01-create-session.js
 *   carga normal: k6 run tests/load/scenarios/01-create-session.js
 *   stress:       k6 run --env SCENARIO=stress tests/load/scenarios/01-create-session.js
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const errorRate = new Rate('errors')

// SLOs — PRD.md: API Routes p95 < 200ms
const SLO_P95 = 200
const SLO_P99 = 500

export const options = {
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: __ENV.SCENARIO || 'default',
    endpoint: 'create-session',
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

export default function () {
  const payload = JSON.stringify({ locale: 'pt-BR' })
  const headers = { 'Content-Type': 'application/json' }

  const res = http.post(`${BASE_URL}/api/v1/sessions`, payload, { headers })

  const ok = check(res, {
    'create-session status 201': (r) => r.status === 201,
    'create-session latência < SLO p95': (r) => r.timings.duration < SLO_P95,
    'create-session retorna id': (r) => {
      try {
        const body = JSON.parse(r.body)
        return typeof body.id === 'string' && body.id.length > 0
      } catch {
        return false
      }
    },
    'create-session retorna current_question_id Q001': (r) => {
      try {
        return JSON.parse(r.body).current_question_id === 'Q001'
      } catch {
        return false
      }
    },
    // Validar que rate limit retorna 429, não 500 (ERROR-CATALOG: RATE_*)
    'create-session não retorna 5xx': (r) => r.status < 500,
  })

  errorRate.add(!ok)
  // ~0.5 req/s por VU — dentro do rate limit de 50 req/60s por IP (até 25 VUs simultâneos)
  sleep(2)
}
