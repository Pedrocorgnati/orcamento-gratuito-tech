import { type CreateLeadInput } from '@/schemas/lead.schema'
import { type AdminLeadsQuery } from '@/schemas/lead.schema'
import { LeadScore, ComplexityLevel } from '@/types/enums'

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
  async create(input: CreateLeadInput): Promise<LeadCreateResult> {
    // TODO: Implementar via /auto-flow execute
    // Fluxo:
    // 1. Verificar se sessão existe e status === 'completed'
    // 2. Verificar idempotência: prisma.lead.findUnique({ where: { session_id } })
    // 3. Buscar estimativa calculada da sessão (accumulated_*)
    // 4. Calcular scoring A/B/C:
    //    - score_budget (0-40): baseado em accumulated_price vs ranges de budget
    //    - score_timeline (0-30): baseado em accumulated_time vs prazo esperado
    //    - score_profile (0-30): phone (+10) + company (+10) + project_type (+10)
    //    - score_total = soma
    //    - score = A se >= 70, B se >= 40, C se < 40
    // 5. Criar lead via prisma.lead.create
    // 6. Disparar notificationService.sendLeadEmails (fire-and-forget)
    // 7. Retornar { id, score, message }
    throw new Error('Not implemented - run /auto-flow execute')
  }

  async findMany(query: AdminLeadsQuery): Promise<{ data: LeadSummary[]; total: number }> {
    // TODO: Implementar via /auto-flow execute
    // 1. Construir where clause com filtros (score, type, from, to)
    // 2. prisma.lead.findMany com skip/take para paginação
    // 3. prisma.lead.count com mesmo where
    // 4. Retornar { data, total }
    return { data: [], total: 0 }
  }

  calculateScore(input: {
    accumulatedPrice: number
    accumulatedTime: number
    phone?: string
    company?: string
    projectType?: string
  }): { score_budget: number; score_timeline: number; score_profile: number; score_total: number; score: LeadScore } {
    // TODO: Implementar via /auto-flow execute
    // Algoritmo de scoring definido no LLD
    const score_budget = 0
    const score_timeline = 0
    const score_profile = 0
    const score_total = 0
    return {
      score_budget,
      score_timeline,
      score_profile,
      score_total,
      score: LeadScore.C,
    }
  }
}

export const leadService = new LeadService()
