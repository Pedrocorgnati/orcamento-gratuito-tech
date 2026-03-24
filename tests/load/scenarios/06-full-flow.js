/**
 * Cenário: Fluxo Completo do Usuário
 * Fluxo: POST /sessions → N × POST /actions/submit-answer → GET /sessions/{id}/estimate → POST /leads
 * Auth: Nenhuma (público)
 *
 * Uso:
 *   smoke:        k6 run --env SCENARIO=smoke tests/load/scenarios/06-full-flow.js
 *   carga normal: k6 run tests/load/scenarios/06-full-flow.js
 *   stress:       k6 run --env SCENARIO=stress tests/load/scenarios/06-full-flow.js
 *
 * Variáveis de ambiente:
 *   BASE_URL         URL base da API (default: http://localhost:3000)
 *   OPTION_IDS       IDs de opções separados por vírgula, uma por pergunta (ex: "opt_web,opt_auth,opt_medium")
 *                    Se não fornecida, usa opções padrão que devem existir no seed.
 *   QUESTION_IDS     IDs de perguntas separados por vírgula (default: Q001,Q002,Q003)
 *   SKIP_LEAD        Se "true", pula a captura de lead (útil para testar apenas o fluxo de estimativa)
 *
 * Nota: Este cenário simula a jornada real do usuário.
 *       Cada VU representa um usuário independente com sua própria sessão.
 *       O fluxo respeita os rate limits: 50 req/60s para sessões/respostas, 10 req/60s para leads.
 *
 * SLO do fluxo completo: p95 < 3000ms (soma dos SLOs individuais)
 */

import http from 'k6/http'
import { check, sleep, group } from 'k6'
import { Rate, Trend, Counter } from 'k6/metrics'

const BASE_URL = __ENV.BASE_URL || 'http://localhost:3000'
const OPTION_IDS = (__ENV.OPTION_IDS || 'opt_web_system,opt_auth_basic,opt_medium').split(',')
const QUESTION_IDS = (__ENV.QUESTION_IDS || 'Q001,Q002,Q003').split(',')
const SKIP_LEAD = __ENV.SKIP_LEAD === 'true'

const errorRate = new Rate('errors')
const fullFlowDuration = new Trend('full_flow_duration', true)
const completedFlows = new Counter('completed_flows')
const failedFlows = new Counter('failed_flows')

// SLOs por etapa
const SLO_SESSION = 200
const SLO_ANSWER = 200
const SLO_ESTIMATE = 800   // operação pesada
const SLO_LEAD = 200
const SLO_FULL_FLOW = 3000 // fluxo completo

export const options = {
  tags: {
    commit: __ENV.COMMIT_SHA || 'local',
    scenario: __ENV.SCENARIO || 'default',
    endpoint: 'full-flow',
  },
  scenarios: {
    smoke: {
      executor: 'constant-vus',
      vus: 1,
      duration: '2m', // fluxo mais longo — 2 minutos para smoke
    },
    average_load: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 3 },
        { duration: '5m', target: 3 },
        { duration: '2m', target: 0 },
      ],
      startTime: '2m',
    },
    stress: {
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '2m', target: 10 },
        { duration: '5m', target: 10 },
        { duration: '2m', target: 0 },
      ],
      startTime: '11m',
    },
  },
  thresholds: {
    full_flow_duration: [`p(95)<${SLO_FULL_FLOW}`],
    errors: ['rate<0.01'],
    http_req_failed: ['rate<0.05'],
  },
}

export default function () {
  const headers = { 'Content-Type': 'application/json' }
  const flowStart = Date.now()
  let sessionId = null

  // ── Etapa 1: Criar sessão ────────────────────────────────────────────────────
  group('1. Criar sessão', () => {
    const res = http.post(
      `${BASE_URL}/api/v1/sessions`,
      JSON.stringify({ locale: 'pt-BR' }),
      { headers, tags: { step: 'create-session' } }
    )

    const ok = check(res, {
      '[1] status 201': (r) => r.status === 201,
      '[1] latência < SLO': (r) => r.timings.duration < SLO_SESSION,
      '[1] não 5xx': (r) => r.status < 500,
    })

    if (!ok || res.status !== 201) {
      failedFlows.add(1)
      errorRate.add(1)
      return
    }

    sessionId = JSON.parse(res.body).id
  })

  if (!sessionId) return

  sleep(1) // pausa realista — usuário lendo a primeira pergunta

  // ── Etapa 2: Submeter respostas ──────────────────────────────────────────────
  let flowComplete = false

  group('2. Submeter respostas', () => {
    for (let i = 0; i < QUESTION_IDS.length; i++) {
      const questionId = QUESTION_IDS[i]
      const optionId = OPTION_IDS[i] || OPTION_IDS[0] // fallback para primeira opção

      const res = http.post(
        `${BASE_URL}/api/v1/actions/submit-answer`,
        JSON.stringify({ sessionId, questionId, optionId, textValue: null }),
        { headers, tags: { step: 'submit-answer', question: questionId } }
      )

      const ok = check(res, {
        [`[2.${i + 1}] Q${questionId} status 200`]: (r) => r.status === 200,
        [`[2.${i + 1}] Q${questionId} latência < SLO`]: (r) => r.timings.duration < SLO_ANSWER,
        [`[2.${i + 1}] Q${questionId} não 5xx`]: (r) => r.status < 500,
      })

      if (!ok) {
        failedFlows.add(1)
        errorRate.add(1)
        return
      }

      const body = JSON.parse(res.body)
      if (body.isComplete) {
        flowComplete = true
        break
      }

      sleep(1.5) // pausa realista — usuário pensando na próxima resposta
    }

    if (!flowComplete && QUESTION_IDS.length >= 3) {
      // Simula sessão completada após N respostas (sem conhecer todas as perguntas)
      flowComplete = true
    }
  })

  if (!flowComplete) {
    sleep(2)
    return
  }

  sleep(1) // pausa — usuário visualizando progresso antes da estimativa

  // ── Etapa 3: Calcular estimativa ─────────────────────────────────────────────
  let estimateOk = false

  group('3. Calcular estimativa', () => {
    const res = http.get(
      `${BASE_URL}/api/v1/sessions/${sessionId}/estimate`,
      { tags: { step: 'get-estimate' } }
    )

    estimateOk = check(res, {
      '[3] estimativa status 200 ou 409': (r) => [200, 409].includes(r.status),
      '[3] estimativa latência < SLO': (r) => r.timings.duration < SLO_ESTIMATE,
      '[3] estimativa não 5xx': (r) => r.status < 500,
    })

    if (!estimateOk) {
      failedFlows.add(1)
      errorRate.add(1)
    }
  })

  if (!estimateOk) return

  if (SKIP_LEAD) {
    fullFlowDuration.add(Date.now() - flowStart)
    completedFlows.add(1)
    sleep(3)
    return
  }

  sleep(2) // pausa — usuário visualizando estimativa antes de preencher formulário

  // ── Etapa 4: Capturar lead ───────────────────────────────────────────────────
  group('4. Capturar lead', () => {
    const res = http.post(
      `${BASE_URL}/api/v1/leads`,
      JSON.stringify({
        session_id: sessionId,
        name: 'Usuário Load Test',
        email: `loadtest+${Date.now()}@example.com`,
        phone: null,
        company: null,
        consent_given: true,
        consent_version: '1.0',
      }),
      { headers, tags: { step: 'capture-lead' } }
    )

    const ok = check(res, {
      '[4] lead status 201 ou 400 ou 409': (r) => [201, 400, 409].includes(r.status),
      '[4] lead latência < SLO': (r) => r.timings.duration < SLO_LEAD,
      '[4] lead não 5xx': (r) => r.status < 500,
    })

    if (!ok) {
      failedFlows.add(1)
      errorRate.add(1)
    }
  })

  fullFlowDuration.add(Date.now() - flowStart)
  completedFlows.add(1)

  // Pausa maior no fluxo completo — respeita o rate limit de leads (10 req/60s)
  sleep(8)
}
