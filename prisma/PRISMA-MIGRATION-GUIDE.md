# Prisma Migration Guide — Budget Free Engine

**ORM:** Prisma
**Database:** PostgreSQL (Supabase)
**Schema:** `prisma/schema.prisma`
**Gerado em:** 2026-03-22
**Gerado por:** `/db-migration-create`

---

## Pré-requisitos

Antes de rodar qualquer migration, garanta:

- [ ] Node.js ≥ 18 instalado
- [ ] Dependências instaladas: `npm install`
- [ ] Arquivo `.env.local` configurado com as variáveis abaixo

### Variáveis de Ambiente Obrigatórias

```env
# .env.local (jamais commitar)

# Supabase — connection pooler (Transaction mode, porta 6543)
DATABASE_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres?pgbouncer=true"

# Supabase — conexão direta (para migrations, porta 5432)
DIRECT_URL="postgresql://postgres.[ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres"
```

> **Por que dois URLs?** O `DATABASE_URL` usa o connection pooler (PgBouncer) para requisições de runtime. O `DIRECT_URL` é a conexão direta que o Prisma Migrate precisa para aplicar DDL (poolers não suportam DDL).

---

## Tabelas Gerenciadas

| # | Tabela | Modelo Prisma | Depende de |
|---|--------|---------------|-----------|
| 1 | `questions` | `Question` | — |
| 2 | `options` | `Option` | `questions` |
| 3 | `question_translations` | `QuestionTranslation` | `questions` |
| 4 | `option_translations` | `OptionTranslation` | `options` |
| 5 | `sessions` | `Session` | `questions` |
| 6 | `answers` | `Answer` | `sessions`, `questions`, `options` |
| 7 | `leads` | `Lead` | `sessions` |
| 8 | `exchange_rates` | `ExchangeRate` | — |
| 9 | `pricing_configs` | `PricingConfig` | — |

---

## Plano de Execução

### 1. Desenvolvimento (primeira vez)

```bash
cd output/workspace/budget-free-tech

# Gera os arquivos de migration e aplica no banco de desenvolvimento
npx prisma migrate dev --name init_schema

# Verifica se o Prisma Client foi regenerado
npx prisma generate
```

> O Prisma Migrate cria a pasta `prisma/migrations/` com:
> - `{timestamp}_init_schema/migration.sql` — SQL gerado automaticamente
> - `migration_lock.toml` — lock file (commitar junto)

### 2. Atualizações Subsequentes

Quando o `schema.prisma` for alterado, execute:

```bash
# Gera nova migration com nome descritivo
npx prisma migrate dev --name {nome_da_mudanca}

# Exemplos:
npx prisma migrate dev --name add_lead_utm_fields
npx prisma migrate dev --name alter_session_add_referrer
```

### 3. Staging / Produção

**Nunca use `migrate dev` em produção.** Use `migrate deploy`:

```bash
# Aplica apenas migrations pendentes (sem prompts interativos)
npx prisma migrate deploy
```

> Configurar no CI/CD como step pré-deploy antes de iniciar a aplicação.

### 4. Introspection (banco pré-existente)

Se o banco Supabase já tiver tabelas criadas via SQL Editor:

```bash
# Sincroniza o schema.prisma com o estado real do banco
npx prisma db pull

# Resolve conflito de estado das migrations
npx prisma migrate resolve --applied "migration_name"
```

---

## Índices Criados

| Tabela | Índice | Campos | Tipo |
|--------|--------|--------|------|
| `questions` | `IDX_questions_block` | `block` | Simples |
| `questions` | `IDX_questions_block_order` | `block, order` | Composto |
| `options` | `IDX_options_question_id` | `question_id` | Simples |
| `options` | `IDX_options_next_question_id` | `next_question_id` | Simples |
| `question_translations` | `UNQ_qt_question_locale` | `question_id, locale` | UNIQUE |
| `option_translations` | `UNQ_ot_option_locale` | `option_id, locale` | UNIQUE |
| `sessions` | `IDX_sessions_status` | `status` | Simples |
| `sessions` | `IDX_sessions_expires_at` | `expires_at` | Simples |
| `sessions` | `IDX_sessions_status_expires` | `status, expires_at` | Composto |
| `answers` | `UNQ_answer_session_question` | `session_id, question_id` | UNIQUE |
| `answers` | `IDX_answers_session_id` | `session_id` | Simples |
| `leads` | `IDX_leads_score` | `score` | Simples |
| `leads` | `IDX_leads_project_type` | `project_type` | Simples |
| `leads` | `IDX_leads_created_at` | `created_at` | Simples |
| `leads` | `IDX_leads_email_status` | `email_status` | Simples |
| `leads` | `IDX_leads_anonymized_at` | `anonymized_at` | Simples |
| `exchange_rates` | `UNQ_exchange_from_to` | `from_currency, to_currency` | UNIQUE |
| `pricing_configs` | `UNQ_pricing_project_type` | `project_type` | UNIQUE |

---

## Foreign Keys e ON DELETE

| Tabela | Campo | Referência | ON DELETE |
|--------|-------|-----------|-----------|
| `options` | `question_id` | `questions.id` | Cascade |
| `options` | `next_question_id` | `questions.id` | SetNull (implícito — campo nullable) |
| `question_translations` | `question_id` | `questions.id` | Cascade |
| `option_translations` | `option_id` | `options.id` | Cascade |
| `sessions` | `current_question_id` | `questions.id` | SetNull (implícito — campo nullable) |
| `answers` | `session_id` | `sessions.id` | Cascade |
| `answers` | `question_id` | `questions.id` | Restrict (implícito) |
| `answers` | `option_id` | `options.id` | SetNull (implícito — campo nullable) |
| `leads` | `session_id` | `sessions.id` | Restrict (implícito) |

---

## Rollback

### Reverter última migration (desenvolvimento)

```bash
# Reverte a última migration aplicada (cria migration de rollback)
npx prisma migrate reset

# ATENÇÃO: reset apaga TODOS os dados do banco de desenvolvimento
# Confirme com 'y' quando solicitado
```

### Rollback cirúrgico (staging/produção)

O Prisma não suporta rollback automático em produção. Para reverter:

1. Gerar uma nova migration `revert_init_schema` com os DROPs necessários
2. Testar em staging
3. Aplicar via `prisma migrate deploy`

```sql
-- Exemplo de rollback manual (ordem inversa de dependências)
DROP TABLE IF EXISTS leads CASCADE;
DROP TABLE IF EXISTS answers CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS option_translations CASCADE;
DROP TABLE IF EXISTS question_translations CASCADE;
DROP TABLE IF EXISTS options CASCADE;
DROP TABLE IF EXISTS questions CASCADE;
DROP TABLE IF EXISTS exchange_rates CASCADE;
DROP TABLE IF EXISTS pricing_configs CASCADE;
```

---

## Checklist de Validação Pós-Migration

```bash
# Verificar se todas as tabelas foram criadas
npx prisma db execute --stdin <<< "
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;
"

# Verificar contagem de tabelas esperada (9)
# Verificar indexes criados
npx prisma db execute --stdin <<< "
SELECT indexname, tablename FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
"

# Verificar integridade referencial (sem FKs órfãs)
npx prisma db execute --stdin <<< "
SELECT conname, conrelid::regclass, confrelid::regclass
FROM pg_constraint
WHERE contype = 'f' AND connamespace = 'public'::regnamespace;
"
```

---

## Procedimento de Emergência

Se `prisma migrate deploy` falhar em produção:

1. **NÃO reiniciar a aplicação** com schema incompatível
2. Verificar logs: `npx prisma migrate status`
3. Se migration parcialmente aplicada: resolver manualmente e marcar como aplicada
   ```bash
   npx prisma migrate resolve --applied "{migration_name}"
   ```
4. Contatar DBA se houver corrupção de dados

---

## Próximos Passos

Após migrations aplicadas com sucesso:

1. `/seed-data-create .claude/projects/budget-free-tech.json` — popular banco com perguntas, opções e configs
2. `/integration-test-create .claude/projects/budget-free-tech.json` — testar endpoints com banco real
