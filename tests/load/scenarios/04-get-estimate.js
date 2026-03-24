/**
 * Cenário: Calcular Estimativa de Preço e Prazo
 * Endpoint: GET /api/v1/sessions/{id}/estimate
 * Auth: Nenhuma (público)
 * Rate limit: 50 req/60s por IP
 *
 * Uso:
 *   smoke:        k6 run --env SCENARIO=smoke tests/load/scenarios/04-get-estimate.js
 *   carga normal: k6 run tests/load/scenarios/04-get-estimate.js
 *   stress:       k6 run --env SCENARIO=stress tests/load/scenarios/04-get-estimate.js
 *
 * Variáveis de ambiente:
 *   BASE_URL              URL base da API (default: http://localhost:3000)
 *   COMPLETED_SESSION_ID  ID de uma sessão já completada (status=completed).
 *                         Se não fornecida, testa o comportamento de sessão incompleta (status 409).
 *
 * Nota: A lógica de cálculo é pesada — SLO p95=800ms (override sobre default de 200ms).
 *       Fórmula: (base_price + sum(price_impacts)) * complexity_multiplier * [0.85, 1.15]
 *       + conversão de moeda BRL→{locale}.
 *
 * Para obter um COMPLETED_SESSION_ID, execute o fluxo completo manualmente
 * ou use o script 06-full-flow.js com CAPTURE_SESSION_ID=true.
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const COMPLETED_SESSION_ID = __ENV.COMPLETED_SESSION_ID || null
const errorRate = new Rate('errors')
const estimateDuration = new Trend('estimate_duration', true)

// SLO override — operação pesada: cálculo + conversão de moeda
const SLO_P95 = 800
const SLO_P99 = 2000

export const options = {
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: __ENV.SCENARIO || 'default',
    endpoint: 'get-estimate',
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
    estimate_duration: [`p(95)<${SLO_P95}`],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.05'],
  },
}

export function setup() {
  if (COMPLETED_SESSION_ID) {
    console.log(`setup: usando sessão completada via ENV — id=${COMPLETED_SESSION_ID}`)
    return { sessionId: COMPLETED_SESSION_ID, isCompleted: true }
  }

  // Sem sessão completada: cria uma nova sessão incompleta para testar o comportamento de 409
  console.warn(
    'setup: COMPLETED_SESSION_ID não fornecida. Testando comportamento de sessão incompleta (409 esperado).\n' +
    'Para testar o cálculo real, forneça: --env COMPLETED_SESSION_ID=<id>'
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

  const estimateStart = Date.now()
  const res = http.get(`${BASE_URL}/api/v1/sessions/${sessionId}/estimate`)
  estimateDuration.add(Date.now() - estimateStart)

  if (isCompleted) {
    // Sessão completada: espera 200 com resultado de estimativa
    const ok = check(res, {
      'get-estimate status 200': (r) => r.status === 200,
      'get-estimate latência < SLO p95': (r) => r.timings.duration < SLO_P95,
      'get-estimate retorna price_min': (r) => {
        try {
          const body = JSON.parse(r.body)
          return typeof body.price_min === 'number'
        } catch {
          return false
        }
      },
      'get-estimate retorna complexity': (r) => {
        try {
          return JSON.parse(r.body).complexity !== undefined
        } catch {
          return false
        }
      },
      'get-estimate não retorna 5xx': (r) => r.status < 500,
    })
    errorRate.add(!ok)
  } else {
    // Sessão incompleta: espera 409 SESSION_NOT_COMPLETE (não um crash)
    const ok = check(res, {
      // 409 é a resposta correta para sessão incompleta (ERROR-CATALOG: ESTIMATE_050?)
      'get-estimate sessão incompleta retorna 409 ou 404': (r) => [409, 404].includes(r.status),
      'get-estimate latência < SLO p95 (mesmo no erro)': (r) => r.timings.duration < SLO_P95,
      'get-estimate não retorna 5xx': (r) => r.status < 500,
    })
    errorRate.add(!ok)
  }

  sleep(2)
}
