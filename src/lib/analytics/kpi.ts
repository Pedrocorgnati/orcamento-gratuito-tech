import { prisma } from '@/lib/prisma'
import { SessionStatus } from '@/lib/enums'

export interface KPIData {
  completionRate: number       // INT-097: >= 0.35 (35%)
  conversionRate: number       // INT-098: >= 0.20 (20%)
  highScoreLeadsRate: number   // INT-099: leads A/B >= 60%
  avgSessionDurationMin: number // INT-100: < 5 minutos
  totalSessions: number
  completedSessions: number
  totalLeads: number
  highScoreLeads: number
  updatedAt: Date
}

/**
 * INT-097: Taxa de conclusão = sessões COMPLETED / sessões totais iniciadas
 * Exclui sessões EXPIRED que nunca tiveram interação
 */
async function getCompletionRate(): Promise<{ rate: number; total: number; completed: number }> {
  const [total, completed] = await Promise.all([
    prisma.session.count({
      where: { status: { in: [SessionStatus.IN_PROGRESS, SessionStatus.COMPLETED, SessionStatus.ABANDONED] } },
    }),
    prisma.session.count({
      where: { status: SessionStatus.COMPLETED },
    }),
  ])
  return {
    rate: total > 0 ? completed / total : 0,
    total,
    completed,
  }
}

/**
 * INT-098: Taxa de conversão = leads submetidos / sessões completadas
 */
async function getConversionRate(): Promise<{ rate: number; leads: number; completed: number }> {
  const [completed, leads] = await Promise.all([
    prisma.session.count({ where: { status: SessionStatus.COMPLETED } }),
    prisma.lead.count({ where: { email: { not: '' } } }),
  ])
  return {
    rate: completed > 0 ? leads / completed : 0,
    leads,
    completed,
  }
}

/**
 * INT-099: Leads A/B = leads com score A ou B / total de leads
 */
async function getHighScoreLeadsRate(): Promise<{ rate: number; highScore: number; total: number }> {
  const [total, highScore] = await Promise.all([
    prisma.lead.count(),
    prisma.lead.count({ where: { score: { in: ['A', 'B'] } } }),
  ])
  return {
    rate: total > 0 ? highScore / total : 0,
    highScore,
    total,
  }
}

/**
 * INT-100: Tempo médio de sessão em minutos
 * Calculado como: (updated_at - created_at) para sessões COMPLETED
 */
async function getAvgSessionDuration(): Promise<{ avgMinutes: number; sampleSize: number }> {
  const completedSessions = await prisma.session.findMany({
    where: { status: SessionStatus.COMPLETED },
    select: {
      created_at: true,
      updated_at: true,
    },
    take: 500, // sample dos últimos 500
    orderBy: { updated_at: 'desc' },
  })

  if (completedSessions.length === 0) return { avgMinutes: 0, sampleSize: 0 }

  const durations = completedSessions.map((s) => {
    const ms = s.updated_at.getTime() - s.created_at.getTime()
    return ms / 1000 / 60 // converte para minutos
  })

  const avg = durations.reduce((a, b) => a + b, 0) / durations.length
  return { avgMinutes: Math.round(avg * 10) / 10, sampleSize: completedSessions.length }
}

/**
 * Agrega todas as 4 KPIs em uma única chamada (para o dashboard admin).
 * Executa as 4 queries em paralelo para minimizar latência.
 */
export async function getKPIDashboard(): Promise<KPIData> {
  const [completionData, conversionData, highScoreData, durationData] = await Promise.all([
    getCompletionRate(),
    getConversionRate(),
    getHighScoreLeadsRate(),
    getAvgSessionDuration(),
  ])

  return {
    completionRate: completionData.rate,
    conversionRate: conversionData.rate,
    highScoreLeadsRate: highScoreData.rate,
    avgSessionDurationMin: durationData.avgMinutes,
    totalSessions: completionData.total,
    completedSessions: completionData.completed,
    totalLeads: highScoreData.total,
    highScoreLeads: highScoreData.highScore,
    updatedAt: new Date(),
  }
}
