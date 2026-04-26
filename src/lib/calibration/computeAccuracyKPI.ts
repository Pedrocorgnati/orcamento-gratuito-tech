/**
 * INT-024 — KPI de acurácia de estimativas
 *
 * Calcula a fração de leads com accuracy_feedback=true sobre o total com
 * feedback (accuracy_feedback != null). Meta: >= 70%.
 */
import { prisma } from '@/lib/prisma'

export interface AccuracyKPI {
  accuracy: number
  sample_size: number
  positives: number
  threshold: number
  last_recalibration: string | null
}

export async function computeAccuracyKPI(): Promise<AccuracyKPI> {
  const [positives, total, lastRecal] = await Promise.all([
    prisma.lead.count({ where: { accuracy_feedback: true } }),
    prisma.lead.count({ where: { NOT: { accuracy_feedback: null } } }),
    prisma.pricingConfig.findFirst({
      orderBy: { updated_at: 'desc' },
      select: { updated_at: true },
    }),
  ])

  return {
    accuracy: total > 0 ? positives / total : 0,
    sample_size: total,
    positives,
    threshold: 0.7,
    last_recalibration: lastRecal?.updated_at?.toISOString() ?? null,
  }
}
