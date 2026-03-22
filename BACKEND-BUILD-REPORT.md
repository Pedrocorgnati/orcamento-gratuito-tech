# Backend Build Report

**Projeto:** budget-free-tech (Budget Free Engine)
**Stack:** nextjs-api (Next.js App Router + Prisma 7 + Supabase PostgreSQL)
**Data:** 2026-03-22
**Modo:** COMPLEMENTAR (frontend pré-existente)
**Build:** PASSOU (tsc --noEmit, 0 erros)

---

## Estrutura Gerada

### Schema Prisma (`prisma/schema.prisma`)
9 models completos — ERD fiel ao LLD.md:

| Model | Tabela | Campos-chave |
|-------|--------|-------------|
| Question | questions | id, block, type, order, required, skip_logic |
| Option | options | id, question_id, next_question_id, price/time/complexity_impact, weight |
| QuestionTranslation | question_translations | id, question_id, locale, title (unique: question_id+locale) |
| OptionTranslation | option_translations | id, option_id, locale, label (unique: option_id+locale) |
| Session | sessions | id, status, current_question_id, path_taken, accumulated_*, locale, currency, expires_at |
| Answer | answers | id, session_id, question_id, option_id, *_snapshot, step_number (unique: session_id+question_id) |
| Lead | leads | id, session_id (unique), name, email, score_*, estimated_*, consent_*, email_status |
| ExchangeRate | exchange_rates | id, from/to_currency, rate (unique: from+to) |
| PricingConfig | pricing_configs | id, project_type (unique), base_price, base_days, complexity_multiplier_* |

### Config Prisma (`prisma.config.ts`)
- Prisma 7: URLs não ficam mais no schema — passadas via `datasourceUrl` no construtor e `prisma.config.ts` para migrations

### Tipos e Enums (`src/types/enums.ts`)
10 enums TypeScript + `LOCALE_CURRENCY_MAP`:
`Locale`, `Currency`, `QuestionType`, `QuestionBlock`, `ProjectType`, `SessionStatus`, `ComplexityLevel`, `LeadScore`, `EmailStatus`

### Lib (`src/lib/`)
| Arquivo | Descrição |
|---------|-----------|
| `prisma.ts` | Singleton Prisma Client (Prisma 7, datasourceUrl no construtor) |
| `errors.ts` | ERROR_CODES + buildError() — sincronizado com ERROR-CATALOG.md |
| `supabase/server.ts` | createSupabaseServerClient, getSession, getUser |

### Schemas Zod (`src/schemas/`)
| Arquivo | Schemas |
|---------|---------|
| `session.schema.ts` | CreateSessionSchema, SessionIdParamSchema |
| `answer.schema.ts` | SubmitAnswerSchema, SubmitAnswerResult type |
| `lead.schema.ts` | CreateLeadSchema, AdminLeadsQuerySchema |

### Routes / Controllers (`src/app/api/v1/`)
| Método | Endpoint | Arquivo | Auth |
|--------|----------|---------|------|
| POST | /api/v1/sessions | sessions/route.ts | Público |
| GET | /api/v1/sessions/[id] | sessions/[id]/route.ts | Público |
| GET | /api/v1/sessions/[id]/estimate | sessions/[id]/estimate/route.ts | Público |
| POST | /api/v1/leads | leads/route.ts | Público |
| GET | /api/v1/admin/leads | admin/leads/route.ts | Supabase JWT |
| GET | /api/auth/callback | auth/callback/route.ts | — |
| POST | /api/auth/logout | auth/logout/route.ts | — |

### Server Actions (`src/actions/`)
| Arquivo | Action | Descrição |
|---------|--------|-----------|
| `answer.ts` | submitAnswer | Salva resposta + atualiza scores/progresso da sessão |
| `auth.ts` | adminLogin | Magic link Supabase Auth (implementado) |

### Middlewares (`src/middleware.ts`)
- Rate limiting in-memory: 50 req/60s (API geral), 10 req/60s (admin/leads/auth)
- Refresh de sessão Supabase nos endpoints `/api/v1/admin/*`
- i18n (next-intl) para rotas de página

### Services (`src/services/`) — Stubs
| Arquivo | Métodos |
|---------|---------|
| `session.service.ts` | create, findById, isExpired, markExpired |
| `estimation.service.ts` | calculate, inferComplexityLevel, convertCurrency |
| `lead.service.ts` | create, findMany, calculateScore |
| `notification.service.ts` | sendLeadEmails, sendOwnerNotification, sendLeadConfirmation, withRetry |

---

## Stubs Pendentes de Implementação

| Service | Método | Complexidade |
|---------|--------|-------------|
| session.service | create | Alta — Q001 lookup + cookie + expires_at |
| session.service | findById | Baixa — prisma.session.findUnique |
| session.service | markExpired | Baixa |
| estimation.service | calculate | Alta — fórmula preço + conversão moeda + scope_story |
| estimation.service | convertCurrency | Baixa — ExchangeRate lookup |
| lead.service | create | Alta — scoring A/B/C + deduplicação + fire-and-forget email |
| lead.service | findMany | Média — filtros + paginação |
| lead.service | calculateScore | Média — algoritmo scoring 3 dimensões |
| notification.service | sendLeadEmails | Alta — Resend + retry exponencial + i18n templates |
| notification.service | sendOwnerNotification | Média — template proprietário |
| notification.service | sendLeadConfirmation | Média — template i18n visitante |
| actions/answer | submitAnswer | Alta — transação Prisma + grafo de decisão + progress |
| actions/auth | adminLogin | Implementado |

---

## Dependências Instaladas

```
prisma @prisma/client zod resend @supabase/ssr @supabase/supabase-js
```

## Variáveis de Ambiente Necessárias (`.env.example`)

```
DATABASE_URL         PostgreSQL connection string (pooled)
DIRECT_URL           PostgreSQL direct connection (migrations)
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL
ADMIN_EMAIL
RESEND_API_KEY
RESEND_FROM_EMAIL
```

---

## Próximos Passos

1. `/env-creation` — configurar variáveis de ambiente reais
2. `/db-migration-create` — gerar migrations Prisma (M001–M009)
3. `/seed-data-create` — seeds: ExchangeRate, PricingConfig, Questions (42) + Options + Translations
4. `/auto-flow execute` — implementar lógica de negócio task a task
