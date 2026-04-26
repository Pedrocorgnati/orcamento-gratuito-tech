/**
 * INT-023: Hook de recalibração
 *
 * V1 mínima: a cada 10 novos feedbacks (accuracy_feedback != null) disparar
 * rotina de recalibração que revisita PricingConfig. Atualmente apenas
 * marca `updated_at` (via touch) para registrar o momento da recalibração e
 * loga um evento. A atualização real dos multiplicadores continua manual
 * (ver runbook pricing-calibration-v1).
 */
import { prisma } from '@/lib/prisma'
import { logger } from '@/lib/logger'

const RECALIBRATION_THRESHOLD = 10

export interface RecalibrationResult {
  ran: boolean
  reason: string
  feedbacks_since_last: number
}

export async function maybeRecalibrate(projectType: string): Promise<RecalibrationResult> {
  const config = await prisma.pricingConfig.findUnique({
    where: { project_type: projectType },
    select: { id: true, updated_at: true },
  })

  const since = config?.updated_at ?? new Date(0)

  const newFeedbacks = await prisma.lead.count({
    where: {
      project_type: projectType,
      NOT: { accuracy_feedback: null },
      updated_at: { gt: since },
    },
  })

  if (newFeedbacks < RECALIBRATION_THRESHOLD) {
    return { ran: false, reason: 'threshold_not_reached', feedbacks_since_last: newFeedbacks }
  }

  if (config) {
    await prisma.pricingConfig.update({
      where: { id: config.id },
      data: { updated_at: new Date() },
    })
  }

  logger.info('recalibration_triggered', {
    project_type: projectType,
    feedbacks_since_last: newFeedbacks,
    threshold: RECALIBRATION_THRESHOLD,
  })

  return { ran: true, reason: 'threshold_reached', feedbacks_since_last: newFeedbacks }
}

// Backward-compat: mantém API antiga chamada após lead completado.
export async function onLeadCompleted(projectType: string, leadId: string): Promise<void> {
  const result = await maybeRecalibrate(projectType)
  if (result.ran) {
    logger.info('recalibration_after_lead', {
      project_type: projectType,
      lead_id: leadId,
      ...result,
    })
  }
}

// Legacy types mantidos para não quebrar imports existentes.
export interface RecalibrationTask {
  project_type: string
  sample_size: number
  avg_deviation_pct: number
  suggested_action: string
  created_at: Date
}

export async function checkRecalibrationNeeded(
  projectType: string
): Promise<RecalibrationTask | null> {
  const result = await maybeRecalibrate(projectType)
  if (!result.ran) return null
  return {
    project_type: projectType,
    sample_size: result.feedbacks_since_last,
    avg_deviation_pct: 0,
    suggested_action: 'Revisar multiplicadores — runbook pricing-calibration-v1',
    created_at: new Date(),
  }
}

export async function scheduleRecalibration(task: RecalibrationTask): Promise<void> {
  logger.info('recalibration_scheduled', {
    project_type: task.project_type,
    sample_size: task.sample_size,
  })
}
