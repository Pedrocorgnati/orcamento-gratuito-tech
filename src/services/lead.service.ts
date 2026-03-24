import { type LeadSchemaInput, type AdminLeadsQuery } from '@/lib/validations/schemas'
import { logger } from '@/lib/logger'
import { LeadScore, EmailStatus, QuestionType, SessionStatus } from '@/lib/enums'
import { prisma } from '@/lib/prisma'
import { calculateLeadScore } from '@/lib/scoring/calculateLeadScore'
import { detectFillerResponses } from '@/lib/scoring/detectFillerResponses'
import { estimationService } from '@/services/estimation.service'
import { sendLeadNotification } from '@/lib/notifications/sendLeadNotification'
import type { Prisma } from '@prisma/client'

export type LeadCreateResult = {
  id: string
  score: LeadScore
  message: string
}

export type LeadSummary = {
  id: string
  name: string
  email: string
  project_type: string
  score: string
  complexity: string
  estimated_price_min: number
  estimated_price_max: number
  estimated_days_min: number
  estimated_days_max: number
  created_at: Date
}

export class LeadService {
  async create(input: LeadSchemaInput): Promise<LeadCreateResult> {
    // 1. Verificar sessão
    const session = await prisma.session.findUnique({
      where: { id: input.sessionId },
      include: {
        answers: {
          orderBy: { step_number: 'asc' },
          include: {
            question: { select: { type: true } },
            option: { select: { order: true } },
          },
        },
      },
    })

    if (!session) throw new Error('SESSION_NOT_FOUND')
    if (session.status !== SessionStatus.COMPLETED) throw new Error('SESSION_NOT_COMPLETE')

    // 2. Idempotência: verificar se lead já existe para esta sessão
    const existingLead = await prisma.lead.findUnique({
      where: { session_id: input.sessionId },
    })
    if (existingLead) throw new Error('LEAD_ALREADY_EXISTS')

    // 3. Calcular estimativa
    const estimation = await estimationService.calculate(input.sessionId)

    // 4. Obter budget e deadline das respostas da sessão
    const budgetAnswer = session.answers.find(
      (a) => a.question.type === QuestionType.BUDGET_SELECT
    )
    const deadlineAnswer = session.answers.find(
      (a) => a.question.type === QuestionType.DEADLINE_SELECT
    )

    const userBudget = budgetAnswer?.text_value
      ? parseFloat(budgetAnswer.text_value)
      : estimation.price_min

    const userDeadlineDays = deadlineAnswer?.text_value
      ? parseInt(deadlineAnswer.text_value, 10)
      : estimation.days_min

    // 5. Calcular score A/B/C
    const scoreResult = calculateLeadScore({
      userBudget,
      userDeadlineDays,
      estimation: {
        priceMin: estimation.price_min,
        daysMin: estimation.days_min,
        complexity: estimation.complexity,
      },
      lead: {
        email: input.email,
        phone: input.phone,
        company: input.company,
      },
    })

    // 6. Detectar padrões suspeitos (informacional — nunca bloqueia o lead)
    const sessionCreatedAt = session.created_at.getTime()
    const answerTimestampsMs = session.answers.map(
      (a) => a.created_at.getTime() - sessionCreatedAt
    )
    const selectedOptionIndexes = session.answers
      .filter((a) => a.option !== null)
      .map((a) => a.option!.order)

    const fillerResult = detectFillerResponses({
      answerTimestampsMs,
      selectedOptionIndexes,
      userBudget,
      priceMin: estimation.price_min,
      userDeadlineDays,
      daysMin: estimation.days_min,
    })

    // 7. Persistir lead com score (DB-first: lead salvo antes do email)
    const lead = await prisma.lead.create({
      data: {
        session_id: input.sessionId,
        name: input.name,
        email: input.email,
        phone: input.phone ?? null,
        company: input.company ?? null,
        score: scoreResult.score,
        score_budget: scoreResult.score_budget,
        score_timeline: scoreResult.score_timeline,
        score_profile: scoreResult.score_profile,
        score_total: scoreResult.score_total,
        project_type: estimation.project_type,
        complexity: estimation.complexity,
        estimated_price_min: estimation.price_min,
        estimated_price_max: estimation.price_max,
        estimated_days_min: estimation.days_min,
        estimated_days_max: estimation.days_max,
        features: estimation.features,
        scope_story: estimation.scope_story,
        locale: session.locale,
        currency: estimation.currency,
        consent_given: input.consentGiven,
        consent_version: input.consentVersion,
        consent_at: new Date(),
        honeypot_triggered: (input._hp ?? '').length > 0,
        is_suspicious: fillerResult.isSuspicious,
        suspicious_pattern: fillerResult.pattern,
        email_status: EmailStatus.PENDING,
      },
    })

    // 8. Enviar notificações (fire-and-forget — falha de email nunca perde o lead)
    sendLeadNotification(lead).catch((err: unknown) => {
      logger.error('notification_failed', {
        leadId: lead.id,
        error: err instanceof Error ? err.message : String(err),
      })
    })

    return {
      id: lead.id,
      score: scoreResult.score,
      message: 'Lead capturado com sucesso.',
    }
  }

  async findMany(query: AdminLeadsQuery): Promise<{ data: LeadSummary[]; total: number }> {
    const { score, type, from, to, page, pageSize } = query

    const where: Prisma.LeadWhereInput = {
      ...(score ? { score } : {}),
      ...(type ? { project_type: type } : {}),
      ...(from || to
        ? {
            created_at: {
              ...(from ? { gte: new Date(from) } : {}),
              ...(to ? { lte: new Date(to) } : {}),
            },
          }
        : {}),
    }

    const [total, rows] = await prisma.$transaction([
      prisma.lead.count({ where }),
      prisma.lead.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          name: true,
          email: true,
          project_type: true,
          score: true,
          complexity: true,
          estimated_price_min: true,
          estimated_price_max: true,
          estimated_days_min: true,
          estimated_days_max: true,
          created_at: true,
        },
      }),
    ])

    return { data: rows as LeadSummary[], total }
  }

  calculateScore(input: {
    userBudget: number
    userDeadlineDays: number
    priceMin: number
    daysMin: number
    complexity: string
    phone?: string | null
    company?: string | null
    email: string
  }): { score_budget: number; score_timeline: number; score_profile: number; score_total: number; score: LeadScore } {
    return calculateLeadScore({
      userBudget: input.userBudget,
      userDeadlineDays: input.userDeadlineDays,
      estimation: {
        priceMin: input.priceMin,
        daysMin: input.daysMin,
        complexity: input.complexity,
      },
      lead: {
        email: input.email,
        phone: input.phone,
        company: input.company,
      },
    })
  }
}

export const leadService = new LeadService()
