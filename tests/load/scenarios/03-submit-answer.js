/**
 * Cenário: Submeter Resposta a uma Pergunta
 * Endpoint: POST /api/v1/actions/submit-answer
 * Auth: Nenhuma (público)
 * Rate limit: 50 req/60s por IP
 *
 * Uso:
 *   smoke:        k6 run --env SCENARIO=smoke tests/load/scenarios/03-submit-answer.js
 *   carga normal: k6 run tests/load/scenarios/03-submit-answer.js
 *   stress:       k6 run --env SCENARIO=stress tests/load/scenarios/03-submit-answer.js
 *
 * Variáveis de ambiente:
 *   BASE_URL    URL base da API (default: http://localhost:3000)
 *   OPTION_ID   ID da opção para Q001 (default: 'opt_web_system' — ajustar ao seed real)
 *
 * Nota: Cada VU cria sua própria sessão antes de submeter a resposta.
 *       Isso testa a transação Prisma: upsert Answer + update Session (isComplete/progress).
 */

import http from 'k6/http'
import { check, sleep } from 'k6'
import { Rate, Trend } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const OPTION_ID = __ENV.OPTION_ID || 'opt_web_system'
const errorRate = new Rate('errors')
const answerDuration = new Trend('answer_duration', true)

// SLOs — PRD.md: API Routes p95 < 200ms
const SLO_P95 = 200
const SLO_P99 = 400

export const options = {
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: __ENV.SCENARIO || 'default',
    endpoint: 'submit-answer',
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
    answer_duration: [`p(95)<${SLO_P95}`],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.05'],
  },
}

export default function () {
  const headers = { 'Content-Type': 'application/json' }

  // Passo 1: Criar sessão (cada VU tem sua própria sessão — simula usuários independentes)
  const sessionRes = http.post(
    `${BASE_URL}/api/v1/sessions`,
    JSON.stringify({ locale: 'pt-BR' }),
    { headers }
  )

  if (sessionRes.status !== 201) {
    errorRate.add(1)
    sleep(2)
    return
  }

  const sessionId = JSON.parse(sessionRes.body).id
  sleep(0.5) // pausa realista entre criar sessão e submeter resposta

  // Passo 2: Submeter resposta à Q001
  const answerStart = Date.now()
  const answerRes = http.post(
    `${BASE_URL}/api/v1/actions/submit-answer`,
    JSON.stringify({
      sessionId,
      questionId: 'Q001',
      optionId: OPTION_ID,
      textValue: null,
    }),
    { headers }
  )
  answerDuration.add(Date.now() - answerStart)

  const ok = check(answerRes, {
    'submit-answer status 200': (r) => r.status === 200,
    'submit-answer latência < SLO p95': (r) => r.timings.duration < SLO_P95,
    'submit-answer retorna nextQuestionId ou isComplete': (r) => {
      try {
        const body = JSON.parse(r.body)
        return body.nextQuestionId !== undefined || body.isComplete === true
      } catch {
        return false
      }
    },
    // VAL_001 (400) e SESSION_080 (404) são erros esperados — não devem ser 500
    'submit-answer não retorna 5xx': (r) => r.status < 500,
  })

  errorRate.add(!ok)
  // ~0.5 req/s por VU (considerando o POST /sessions anterior)
  sleep(2)
}
