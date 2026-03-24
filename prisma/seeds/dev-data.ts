import type { PrismaClient } from '@prisma/client'

/**
 * Seed de dados de desenvolvimento — Budget Free Engine
 *
 * Cobre:
 *  - SessionStatus: IN_PROGRESS, COMPLETED, ABANDONED, EXPIRED
 *  - LeadScore: A, B, C
 *  - EmailStatus: PENDING, SENT, FAILED
 *  - ProjectType: todos os 5 tipos
 *  - ComplexityLevel: LOW, MEDIUM, HIGH, VERY_HIGH
 *  - Locale: pt_BR, en_US, es_ES, it_IT
 *  - Currency: BRL, USD, EUR
 *  - Edge cases: honeypot/suspicious, anonimização LGPD, intermediate_email,
 *                sessão sem lead, sessão expirada, lead com accuracy_feedback
 *
 * Idempotente: verifica visitor_ip = SEED_MARKER antes de criar.
 * Não recria usuários (não há tabela de users neste projeto — auth via magic link).
 */

const SEED_MARKER_IP = 'seed-dev-data'

export async function seedDevData(prisma: PrismaClient) {
  // ─── Idempotency check ────────────────────────────────────────────────────

  const existingCount = await prisma.session.count({
    where: { visitor_ip: SEED_MARKER_IP },
  })

  if (existingCount > 0) {
    console.log(`  ℹ️  Dev data já existe (${existingCount} sessões com marker). Pulando.`)
    return
  }

  // ─── Referências de perguntas (anchor records) ────────────────────────────

  // Q001 é a primeira pergunta do fluxo (PROJECT_TYPE), sempre presente após seedQuestions
  const q001 = await prisma.question.findUnique({ where: { code: 'Q001' } })
  if (!q001) {
    console.warn('  ⚠️  Q001 não encontrado — execute seedQuestions antes de seedDevData.')
    return
  }

  const q001FirstOption = await prisma.option.findFirst({
    where: { question_id: q001.id },
    orderBy: { order: 'asc' },
  })

  // ─── Datas relativas ──────────────────────────────────────────────────────

  const now = new Date()
  const in7d   = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  const past8d = new Date(now.getTime() - 8 * 24 * 60 * 60 * 1000)
  const past30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  const past90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)
  const consentAt = new Date(now.getTime() - 5 * 60 * 1000)   // 5 min atrás

  // =========================================================================
  // SESSÕES
  // =========================================================================

  // S1 — IN_PROGRESS, pt_BR / BRL / WEBSITE (visitante no meio do fluxo)
  const s1 = await prisma.session.create({
    data: {
      status: 'IN_PROGRESS',
      current_question_id: q001.id,
      project_type: 'WEBSITE',
      path_taken: [q001.id],
      accumulated_price: 1200,
      accumulated_time: 5,
      accumulated_complexity: 15,
      questions_answered: 6,
      progress_percentage: 40,
      locale: 'pt_BR',
      currency: 'BRL',
      visitor_ip: SEED_MARKER_IP,
      user_agent: 'Mozilla/5.0 (compatible; seed/1.0)',
      expires_at: in7d,
    },
  })

  // S2 — COMPLETED, en_US / USD / ECOMMERCE → Lead A (SENT)
  const s2 = await prisma.session.create({
    data: {
      status: 'COMPLETED',
      current_question_id: null,
      project_type: 'ECOMMERCE',
      path_taken: [q001.id],
      accumulated_price: 18000,
      accumulated_time: 60,
      accumulated_complexity: 25,
      questions_answered: 14,
      progress_percentage: 100,
      locale: 'en_US',
      currency: 'USD',
      visitor_ip: SEED_MARKER_IP,
      user_agent: 'Mozilla/5.0 (compatible; seed/1.0)',
      expires_at: in7d,
    },
  })

  // S3 — COMPLETED, pt_BR / BRL / WEB_APP → Lead B (PENDING)
  const s3 = await prisma.session.create({
    data: {
      status: 'COMPLETED',
      current_question_id: null,
      project_type: 'WEB_APP',
      path_taken: [q001.id],
      accumulated_price: 25000,
      accumulated_time: 90,
      accumulated_complexity: 40,
      questions_answered: 13,
      progress_percentage: 100,
      locale: 'pt_BR',
      currency: 'BRL',
      visitor_ip: SEED_MARKER_IP,
      user_agent: 'Mozilla/5.0 (compatible; seed/1.0)',
      expires_at: in7d,
    },
  })

  // S4 — ABANDONED, es_ES / EUR / MOBILE_APP (saiu no início, sem lead)
  const s4 = await prisma.session.create({
    data: {
      status: 'ABANDONED',
      current_question_id: q001.id,
      project_type: 'MOBILE_APP',
      path_taken: [q001.id],
      accumulated_price: 500,
      accumulated_time: 2,
      accumulated_complexity: 5,
      questions_answered: 3,
      progress_percentage: 20,
      locale: 'es_ES',
      currency: 'EUR',
      visitor_ip: SEED_MARKER_IP,
      user_agent: 'Mozilla/5.0 (compatible; seed/1.0)',
      expires_at: past8d,
    },
  })

  // S5 — EXPIRED, pt_BR / BRL / AUTOMATION_AI (TTL expirado, nenhuma resposta)
  const s5 = await prisma.session.create({
    data: {
      status: 'EXPIRED',
      current_question_id: null,
      project_type: 'AUTOMATION_AI',
      path_taken: [],
      accumulated_price: 0,
      accumulated_time: 0,
      accumulated_complexity: 0,
      questions_answered: 0,
      progress_percentage: 0,
      locale: 'pt_BR',
      currency: 'BRL',
      visitor_ip: SEED_MARKER_IP,
      user_agent: 'Mozilla/5.0 (compatible; seed/1.0)',
      expires_at: past8d,
    },
  })

  // S6 — COMPLETED, it_IT / EUR / WEB_APP → Lead C (FAILED, 3 tentativas)
  const s6 = await prisma.session.create({
    data: {
      status: 'COMPLETED',
      current_question_id: null,
      project_type: 'WEB_APP',
      path_taken: [q001.id],
      accumulated_price: 9000,
      accumulated_time: 30,
      accumulated_complexity: 55,
      questions_answered: 11,
      progress_percentage: 100,
      locale: 'it_IT',
      currency: 'EUR',
      visitor_ip: SEED_MARKER_IP,
      user_agent: 'Mozilla/5.0 (compatible; seed/1.0)',
      expires_at: in7d,
    },
  })

  // S7 — COMPLETED, pt_BR / BRL / WEBSITE → Lead A suspeito (honeypot + TOO_FAST)
  const s7 = await prisma.session.create({
    data: {
      status: 'COMPLETED',
      current_question_id: null,
      project_type: 'WEBSITE',
      path_taken: [q001.id],
      accumulated_price: 8000,
      accumulated_time: 30,
      accumulated_complexity: 10,
      questions_answered: 12,
      progress_percentage: 100,
      locale: 'pt_BR',
      currency: 'BRL',
      visitor_ip: SEED_MARKER_IP,
      user_agent: 'curl/7.68.0 (seed-suspicious-bot)',
      expires_at: in7d,
    },
  })

  // S8 — COMPLETED, pt_BR / BRL / MOBILE_APP → Lead B anonimizado (LGPD)
  const s8 = await prisma.session.create({
    data: {
      status: 'COMPLETED',
      current_question_id: null,
      project_type: 'MOBILE_APP',
      path_taken: [q001.id],
      accumulated_price: 30000,
      accumulated_time: 90,
      accumulated_complexity: 35,
      questions_answered: 14,
      progress_percentage: 100,
      locale: 'pt_BR',
      currency: 'BRL',
      visitor_ip: SEED_MARKER_IP,
      user_agent: 'Mozilla/5.0 (compatible; seed/1.0)',
      expires_at: in7d,
    },
  })

  // S9 — IN_PROGRESS, en_US / USD / WEB_APP (72% progresso + intermediate_email capturado)
  const s9 = await prisma.session.create({
    data: {
      status: 'IN_PROGRESS',
      current_question_id: q001.id,
      project_type: 'WEB_APP',
      path_taken: [q001.id],
      accumulated_price: 12000,
      accumulated_time: 45,
      accumulated_complexity: 30,
      questions_answered: 11,
      progress_percentage: 72,
      locale: 'en_US',
      currency: 'USD',
      intermediate_email: 'visitor+seed9@example.com',
      visitor_ip: SEED_MARKER_IP,
      user_agent: 'Mozilla/5.0 (compatible; seed/1.0)',
      expires_at: in7d,
    },
  })

  // =========================================================================
  // RESPOSTAS — anchor records para sessões COMPLETED
  // (Cobre o unique constraint session_id + question_id)
  // =========================================================================

  if (q001FirstOption) {
    const completedSessions = [s2, s3, s6, s7, s8]
    for (const session of completedSessions) {
      await prisma.answer.create({
        data: {
          session_id: session.id,
          question_id: q001.id,
          option_id: q001FirstOption.id,
          price_impact_snapshot: q001FirstOption.price_impact,
          time_impact_snapshot: q001FirstOption.time_impact,
          complexity_impact_snapshot: q001FirstOption.complexity_impact,
          step_number: 1,
        },
      })
    }
  }

  // =========================================================================
  // LEADS
  // =========================================================================

  // Lead A — Rafael Almeida, ECOMMERCE, LOW complexity, score 78, email SENT
  // marketing_consent: true, accuracy_feedback: true (avaliou estimativa positivamente)
  await prisma.lead.create({
    data: {
      session_id: s2.id,
      name: 'Rafael Almeida',
      email: 'rafael.almeida+seed@example.com',
      phone: '+55 11 98765-4321',
      company: 'Almeida Commerce Ltda',
      score: 'A',
      score_budget: 35,
      score_timeline: 24,
      score_profile: 19,
      score_total: 78,
      project_type: 'ECOMMERCE',
      complexity: 'LOW',
      estimated_price_min: 14400,
      estimated_price_max: 21600,
      estimated_days_min: 48,
      estimated_days_max: 72,
      features: ['Catálogo de produtos', 'Carrinho e checkout', 'Painel do lojista', 'Integração de pagamento'],
      scope_story: 'Rafael busca uma loja virtual completa para sua empresa, com foco em conversão e gestão de estoque. Perfil de alto potencial: budget alinhado, prazo realista e empresa estabelecida.',
      locale: 'en_US',
      currency: 'USD',
      consent_given: true,
      consent_version: '1.0',
      consent_at: consentAt,
      marketing_consent: true,
      honeypot_triggered: false,
      is_suspicious: false,
      email_status: 'SENT',
      email_retry_count: 0,
      email_sent_at: new Date(now.getTime() - 3 * 60 * 1000),
      accuracy_feedback: true,
    },
  })

  // Lead B — Carla Mendonça, WEB_APP, MEDIUM complexity, score 52, email PENDING
  // sem telefone/empresa, marketing_consent: false
  await prisma.lead.create({
    data: {
      session_id: s3.id,
      name: 'Carla Mendonça',
      email: 'carla.mendonca+seed@example.com',
      phone: null,
      company: null,
      score: 'B',
      score_budget: 22,
      score_timeline: 18,
      score_profile: 12,
      score_total: 52,
      project_type: 'WEB_APP',
      complexity: 'MEDIUM',
      estimated_price_min: 18750,
      estimated_price_max: 32500,
      estimated_days_min: 67,
      estimated_days_max: 117,
      features: ['Autenticação e perfil de usuário', 'Dashboard com gráficos', 'API REST', 'Notificações por email'],
      scope_story: 'Carla precisa de um sistema web para gestão interna da sua equipe. Budget moderado para o escopo — há espaço para negociação de escopo.',
      locale: 'pt_BR',
      currency: 'BRL',
      consent_given: true,
      consent_version: '1.0',
      consent_at: consentAt,
      marketing_consent: false,
      honeypot_triggered: false,
      is_suspicious: false,
      email_status: 'PENDING',
      email_retry_count: 0,
      email_sent_at: null,
      accuracy_feedback: null,
    },
  })

  // Lead C — Marco Bianchi, WEB_APP, HIGH complexity, score 28, email FAILED (3x retry)
  // budget insuficiente para o escopo solicitado
  await prisma.lead.create({
    data: {
      session_id: s6.id,
      name: 'Marco Bianchi',
      email: 'marco.bianchi+seed@example.com',
      phone: '+39 02 1234 5678',
      company: 'Bianchi Solutions SRL',
      score: 'C',
      score_budget: 10,
      score_timeline: 8,
      score_profile: 10,
      score_total: 28,
      project_type: 'WEB_APP',
      complexity: 'HIGH',
      estimated_price_min: 42500,
      estimated_price_max: 76500,
      estimated_days_min: 153,
      estimated_days_max: 255,
      features: ['Multitenancy', 'Módulo financeiro completo', 'Integrações ERP', 'Relatórios avançados'],
      scope_story: 'Marco tem um escopo bastante complexo com budget declarado abaixo da estimativa mínima. Lead de baixa prioridade — recomendável negociar redução de escopo.',
      locale: 'it_IT',
      currency: 'EUR',
      consent_given: true,
      consent_version: '1.0',
      consent_at: consentAt,
      marketing_consent: false,
      honeypot_triggered: false,
      is_suspicious: false,
      email_status: 'FAILED',
      email_retry_count: 3,
      email_sent_at: null,
      accuracy_feedback: null,
    },
  })

  // Lead A suspeito — fluxo completado em tempo anormal (honeypot + TOO_FAST)
  // Cobre: honeypot_triggered=true, is_suspicious=true, suspicious_pattern
  await prisma.lead.create({
    data: {
      session_id: s7.id,
      name: 'Lead Suspeito 001',
      email: 'suspeito.001+seed@example.com',
      phone: null,
      company: null,
      score: 'A',
      score_budget: 38,
      score_timeline: 26,
      score_profile: 18,
      score_total: 82,
      project_type: 'WEBSITE',
      complexity: 'LOW',
      estimated_price_min: 6400,
      estimated_price_max: 15200,
      estimated_days_min: 24,
      estimated_days_max: 57,
      features: ['Landing page', 'Blog'],
      scope_story: 'Fluxo completado em menos de 10 segundos — padrão inconsistente com uso humano normal.',
      locale: 'pt_BR',
      currency: 'BRL',
      consent_given: true,
      consent_version: '1.0',
      consent_at: consentAt,
      marketing_consent: false,
      honeypot_triggered: true,
      is_suspicious: true,
      suspicious_pattern: 'TOO_FAST',
      email_status: 'SENT',
      email_retry_count: 0,
      email_sent_at: new Date(now.getTime() - 60 * 1000),
      accuracy_feedback: null,
    },
  })

  // Lead B anonimizado — solicitação LGPD processada há 30 dias (anonymized_at set)
  // Cobre: anonymized_at, accuracy_feedback: null após anonimização
  await prisma.lead.create({
    data: {
      session_id: s8.id,
      name: '[ANONIMIZADO]',
      email: 'anonimizado.001+seed@example.com',
      phone: null,
      company: null,
      score: 'B',
      score_budget: 28,
      score_timeline: 20,
      score_profile: 13,
      score_total: 61,
      project_type: 'MOBILE_APP',
      complexity: 'MEDIUM',
      estimated_price_min: 24000,
      estimated_price_max: 36000,
      estimated_days_min: 72,
      estimated_days_max: 108,
      features: ['App iOS e Android', 'Push notifications', 'Autenticação social'],
      scope_story: '[ANONIMIZADO — solicitação LGPD art. 18 processada]',
      locale: 'pt_BR',
      currency: 'BRL',
      consent_given: true,
      consent_version: '1.0',
      consent_at: new Date(past90d.getTime()),
      marketing_consent: false,
      honeypot_triggered: false,
      is_suspicious: false,
      email_status: 'SENT',
      email_retry_count: 0,
      email_sent_at: new Date(past90d.getTime() + 5 * 60 * 1000),
      anonymized_at: past30d,
      accuracy_feedback: null,
    },
  })

  // ─── Resumo ───────────────────────────────────────────────────────────────

  const answerCount = q001FirstOption ? 5 : 0
  console.log(`✅ Dev data: 9 sessões | 5 leads | ${answerCount} respostas`)
  console.log(`   Sessões: IN_PROGRESS(2), COMPLETED(5), ABANDONED(1), EXPIRED(1)`)
  console.log(`   Leads:   A(2), B(2), C(1) | SENT(3), PENDING(1), FAILED(1)`)
  console.log(`   Extras:  honeypot, LGPD anonimizado, intermediate_email, sessão sem lead`)

  // Suprimir warning de variáveis não usadas (s1, s4, s5, s9 não têm lead/answer)
  void [s1, s4, s5, s9]
}
