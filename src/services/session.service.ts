import { type CreateSessionInput } from '@/schemas/session.schema'
import { LOCALE_CURRENCY_MAP, Locale, Currency, SessionStatus } from '@/types/enums'

export type SessionCreateResult = {
  id: string
  status: string
  locale: string
  currency: string
  current_question_id: string
  expires_at: Date
}

export type SessionGetResult = {
  id: string
  status: string
  locale: string
  currency: string
  current_question_id: string | null
  project_type: string | null
  path_taken: string[]
  accumulated_price: number
  accumulated_time: number
  accumulated_complexity: number
  questions_answered: number
  progress_percentage: number
  expires_at: Date
  created_at: Date
  updated_at: Date
}

export class SessionService {
  async create(input: CreateSessionInput, meta?: { ip?: string; userAgent?: string }): Promise<SessionCreateResult> {
    // TODO: Implementar via /auto-flow execute
    // 1. Resolver currency a partir do locale (LOCALE_CURRENCY_MAP)
    // 2. Calcular expires_at = new Date() + 7 dias
    // 3. Buscar Q001 (primeira pergunta) do banco
    // 4. Criar registro em sessions via prisma.session.create
    // 5. Retornar sessão criada com current_question_id = Q001
    throw new Error('Not implemented - run /auto-flow execute')
  }

  async findById(id: string): Promise<SessionGetResult | null> {
    // TODO: Implementar via /auto-flow execute
    // 1. prisma.session.findUnique({ where: { id } })
    // 2. Verificar se não é null
    // 3. Retornar ou null
    return null
  }

  isExpired(session: { expires_at: Date; status: string }): boolean {
    return session.status === SessionStatus.EXPIRED || session.expires_at < new Date()
  }

  async markExpired(id: string): Promise<void> {
    // TODO: Implementar via /auto-flow execute
    // prisma.session.update({ where: { id }, data: { status: SessionStatus.EXPIRED } })
    throw new Error('Not implemented - run /auto-flow execute')
  }
}

export const sessionService = new SessionService()
