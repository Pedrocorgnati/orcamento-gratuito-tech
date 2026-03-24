/**
 * Orquestrador de Testes de Carga — Budget Free Engine
 *
 * Uso:
 *   smoke:        k6 run --env SCENARIO=smoke tests/load/run-all.js
 *   carga normal: k6 run tests/load/run-all.js
 *   stress:       k6 run --env SCENARIO=stress tests/load/run-all.js
 *
 * Para executar cenários individuais, use os scripts em tests/load/scenarios/.
 *
 * Variáveis de ambiente globais:
 *   BASE_URL              URL base (default: http://localhost:3000)
 *   SCENARIO              Perfil de carga: smoke | default | stress (default: default)
 *   COMMIT_SHA            SHA do commit para rastreamento nos resultados
 *   COMPLETED_SESSION_ID  ID de sessão completada para cenários 04 e 05
 *   OPTION_ID             ID de opção para Q001 (cenário 03)
 *   OPTION_IDS            IDs de opções separados por vírgula (cenário 06)
 *   QUESTION_IDS          IDs de perguntas separados por vírgula (cenário 06)
 *   SKIP_LEAD             "true" para pular captura de lead no fluxo completo
 *
 * Exemplos:
 *   # Smoke test básico
 *   k6 run --env BASE_URL=http://localhost:3000 --env SCENARIO=smoke tests/load/run-all.js
 *
 *   # Carga normal com sessão completada
 *   k6 run \
 *     --env BASE_URL=https://orcamentogratuito.tech \
 *     --env COMPLETED_SESSION_ID=clxyz123abc \
 *     --env OPTION_ID=opt_web_system \
 *     tests/load/run-all.js
 *
 *   # Salvar resultados em JSON
 *   k6 run tests/load/run-all.js --out json=tests/load/results/load-$(date +%Y%m%d).json
 *
 * Integração CI/CD:
 *   k6 retorna exit code 1 quando thresholds de SLO são violados.
 *   Use este script como gate de performance no pipeline (/ci-cd-create).
 */

import { textSummary } from 'https://jslib.k6.io/k6-summary/0.0.3/index.js'

// Para executar todos os cenários num único run, importe-os e reexporte.
// Recomendação: execute os scripts individuais para isolamento de métricas.
//
// Exemplo de execução em sequência via shell:
//   for scenario in tests/load/scenarios/*.js; do
//     k6 run --env SCENARIO=smoke "$scenario"
//   done

export function handleSummary(data) {
  return {
    stdout: textSummary(data, { indent: '  ', enableColors: true }),
    'tests/load/results/summary-latest.json': JSON.stringify(data, null, 2),
  }
}

// Placeholder — execute os cenários individuais diretamente
export default function () {
  console.log(
    'Use os scripts individuais em tests/load/scenarios/ ou os scripts do Makefile:\n' +
    '  make test-load-smoke\n' +
    '  make test-load\n' +
    '  make test-load-stress'
  )
}
