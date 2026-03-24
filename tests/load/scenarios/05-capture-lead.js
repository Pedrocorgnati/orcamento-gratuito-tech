/**
 * Cenário: Capturar Lead (Contato do Visitante)
 * Endpoint: POST /api/v1/leads
 * Auth: Nenhuma (público)
 * Rate limit: 10 req/60s por IP (RESTRITO — atenção ao stress test)
 *
 * Uso:
 *   smoke:        k6 run --env SCENARIO=smoke tests/load/scenarios/05-capture-lead.js
 *   carga normal: k6 run tests/load/scenarios/05-capture-lead.js
 *   stress:       k6 run --env SCENARIO=stress tests/load/scenarios/05-capture-lead.js
 *
 * Variáveis de ambiente:
 *   BASE_URL              URL base da API (default: http://localhost:3000)
 *   COMPLETED_SESSION_ID  ID de uma sessão já completada. Obrigatório para testar o happy path.
 *
 * ATENÇÃO — Rate limit:
 *   - O endpoint /leads tem rate limit de 10 req/60s por IP (5x mais restrito que /sessions).
 *   - Em testes com múltiplos VUs, respostas 429 são ESPERADAS e não indicam falha do servidor.
 *   - Para carga real, use proxies ou distribua as requisições entre múltiplos IPs.
 *   - O sleep de 7s por VU garante ~0.14 req/s — seguro para até 1 VU sem 429.
 *
 * Nota: unique constraint em session_id — um lead por sessão.
 *       Para smoke test real, forneça COMPLETED_SESSION_ID de uma sessão sem lead.
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const COMPLETED_SESSION_ID = __ENV.COMPLETED_SESSION_ID || null
const errorRate = new Rate('errors')
const leadDuration = new Trend('lead_duration', true)

// SLOs — PRD.md: API Routes p95 < 200ms
const SLO_P95 = 200
const SLO_P99 = 500

export const options = {
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: __ENV.SCENARIO || 'default',
    endpoint: 'capture-lead',
  },
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '1m',
    },
    // Carga moderada — respeitando o rate limit de 10 req/60s
    average_load: {
      executor: 'constant-arrival-rate',
      rate: 5,           // 5 req/min (~0.08 req/s) — dentro do rate limit de 10 req/60s
      timeUnit: '1m',
      duration: '5m',
      preAllocatedVUs: 2,
      maxVUs: 5,
      startTime: '1m',
    },
    stress: {
      executor: 'constant-arrival-rate',
      rate: 8,           // 8 req/min — próximo do limite; valida comportamento antes do 429
      timeUnit: '1m',
      duration: '5m',
      preAllocatedVUs: 3,
      maxVUs: 8,
      startTime: '7m',
    },
  },
  thresholds: {
    http_req_duration: [`p(95)<${SLO_P95}`, `p(99)<${SLO_P99}`],
    lead_duration: [`p(95)<${SLO_P95}`],
    errors: ['rate<0.01'],
    // 429 é esperado próximo ao rate limit — não conta como falha
    'http_req_failed{status:429}': ['rate<0.10'],
    http_req_failed: ['rate<0.05'],
  },
}

export function setup() {
  if (COMPLETED_SESSION_ID) {
    console.log(`setup: usando sessão completada via ENV — id=${COMPLETED_SESSION_ID}`)
    return { sessionId: COMPLETED_SESSION_ID, isCompleted: true }
  }

  console.warn(
    'setup: COMPLETED_SESSION_ID não fornecida. Testando rejeição de sessão incompleta (400 esperado).\n' +
    'Para testar o happy path, forneça: --env COMPLETED_SESSION_ID=<id>'
  )

  const res = http.post(
    `${BASE_URL}/api/v1/sessions`,
    JSON.stringify({ locale: 'pt-BR' }),
    { headers: { 'Content-Type': 'application/json' } }
  )

  if (res.status !== 201) {
    return { sessionId: 'session-not-created', isCompleted: false }
  }

  return { sessionId: JSON.parse(res.body).id, isCompleted: false }
}

export default function (data) {
  const { sessionId, isCompleted } = data
  const headers = { 'Content-Type': 'application/json' }

  const payload = JSON.stringify({
    session_id: sessionId,
    name: 'Teste de Carga',
    email: `loadtest+${Date.now()}@example.com`,
    phone: null,
    company: null,
    consent_given: true,
    consent_version: '1.0',
  })

  const leadStart = Date.now()
  const res = http.post(`${BASE_URL}/api/v1/leads`, payload, { headers })
  leadDuration.add(Date.now() - leadStart)

  if (isCompleted) {
    // Sessão completada: espera 201 (ou 409 se já criou lead para essa sessão)
    const ok = check(res, {
      'capture-lead status 201 ou 409': (r) => [201, 409].includes(r.status),
      'capture-lead latência < SLO p95': (r) => r.timings.duration < SLO_P95,
      'capture-lead não retorna 5xx': (r) => r.status < 500,
    })
    errorRate.add(!ok)
  } else {
    // Sessão incompleta: espera 400 SESSION_NOT_COMPLETE (não um crash)
    const ok = check(res, {
      'capture-lead sessão incompleta retorna 400': (r) => r.status === 400,
      'capture-lead latência < SLO p95': (r) => r.timings.duration < SLO_P95,
      'capture-lead não retorna 5xx': (r) => r.status < 500,
    })
    errorRate.add(!ok)
  }

  // ~0.14 req/s — dentro do rate limit de 10 req/60s por IP (até 1 VU)
  sleep(7)
}
