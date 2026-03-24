/**
 * INT-023: Hook de Recalibração de Estimativas
 *
 * STATUS: PLACEHOLDER — implementação completa no V2
 *
 * CONCEITO:
 * Após cada conjunto de 10 projetos completados por tipo de projeto,
 * verificar se os preços estimados estão alinhados com os valores reais.
 * Se o desvio médio for > 20%, agendar recalibração manual dos pesos
 * no PricingConfig.
 *
 * TRIGGER:
 * - Lead.accuracy_feedback = false (projeto real divergiu muito)
 * - Contagem de projetos completos atingiu múltiplo de 10 por project_type
 *
 * IMPLEMENTAÇÃO V2:
 * 1. Monitorar tabela Lead para COUNT(*) WHERE status=COMPLETED GROUP BY project_type
 * 2. Quando COUNT atingir múltiplo de 10 → calcular desvio médio
 * 3. Se desvio > 20% → criar RecalibrationTask no banco
 * 4. Notificar admin via email (Resend) para revisão manual dos pesos
 * 5. Admin acessa /admin/pricing-config e ajusta multiplicadores
 */

import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

/**
 * Interface para uma tarefa de recalibração.
 * Criada quando um desvio significativo é detectado.
 */
export interface RecalibrationTask {
  project_type: string
  sample_size: number
  avg_deviation_pct: number
  suggested_action: string
  created_at: Date
}

/**
 * Verifica se uma recalibração deve ser agendada para um tipo de projeto.
 *
 * @param projectType - Tipo de projeto a verificar
 * @returns RecalibrationTask se desvio detectado, null caso contrário
 *
 * @example
 * // Chamado após cada lead ser marcado como COMPLETED:
 * const task = await checkRecalibrationNeeded('saas')
 * if (task) await scheduleRecalibration(task)
 */
export async function checkRecalibrationNeeded(
  projectType: string
): Promise<RecalibrationTask | null> {
  // TODO (V2): Implementar lógica completa
  logger.debug('recalibration_check', {
    project_type: projectType,
    status: 'placeholder_not_implemented',
  })
  return null
}

/**
 * Agenda uma tarefa de recalibração para revisão manual do admin.
 *
 * @param task - Dados da tarefa de recalibração
 *
 * @example
 * await scheduleRecalibration({
 *   project_type: 'saas',
 *   sample_size: 10,
 *   avg_deviation_pct: 25,
 *   suggested_action: 'Aumentar multiplicador base em 15%',
 *   created_at: new Date()
 * })
 */
export async function scheduleRecalibration(task: RecalibrationTask): Promise<void> {
  // TODO (V2): Implementar
  // 1. Salvar RecalibrationTask no banco (tabela a criar)
  // 2. Enviar email ao admin via Resend
  // 3. Criar notificação no painel admin
  logger.info('recalibration_scheduled', {
    project_type: task.project_type,
    sample_size: task.sample_size,
    avg_deviation_pct: task.avg_deviation_pct,
    status: 'placeholder_not_implemented',
  })
}

/**
 * Ponto de entrada chamado após cada lead ser marcado com feedback.
 * Esta função é o único ponto de integração necessário em V2.
 *
 * @param projectType - Tipo do projeto
 * @param leadId - ID do lead (para auditoria, não para PII)
 */
export async function onLeadCompleted(projectType: string, leadId: string): Promise<void> {
  // Verificar se atingiu múltiplo de 10 projetos completados
  const count = await prisma.lead.count({
    where: { project_type: projectType },
  })

  if (count % 10 !== 0) return // Não atingiu threshold

  logger.info('recalibration_threshold_reached', {
    project_type: projectType,
    count,
    lead_id: leadId,
  })

  const task = await checkRecalibrationNeeded(projectType)
  if (task) {
    await scheduleRecalibration(task)
  }
}
