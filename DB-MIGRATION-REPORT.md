# DB Migration Report

**Projeto:** budget-free-tech (Budget Free Engine)
**ORM:** Prisma
**Database:** PostgreSQL (Supabase)
**Data:** 2026-03-22
**Data-Integrity-Decision:** não disponível
**Schema:** `prisma/schema.prisma`

---

## Migrations Geradas

Esta é a **primeira migration** do projeto. O Prisma criará automaticamente o SQL ao executar `prisma migrate dev --name init_schema`.

| # | Tabela | Operação | Tipo | Reversível |
|---|--------|----------|------|------------|
| 1 | `questions` | CREATE TABLE | additive | Sim |
| 2 | `options` | CREATE TABLE | additive | Sim |
| 3 | `question_translations` | CREATE TABLE | additive | Sim |
| 4 | `option_translations` | CREATE TABLE | additive | Sim |
| 5 | `sessions` | CREATE TABLE | additive | Sim |
| 6 | `answers` | CREATE TABLE | additive | Sim |
| 7 | `leads` | CREATE TABLE | additive | Sim |
| 8 | `exchange_rates` | CREATE TABLE | additive | Sim |
| 9 | `pricing_configs` | CREATE TABLE | additive | Sim |

**Total:** 9 tabelas | 0 alterações | 0 remoções

---

## Correção Aplicada no Schema

O `schema.prisma` existente estava com o bloco `datasource db` incompleto (sem `url` e `directUrl`). Isso foi corrigido:

```prisma
// ANTES (inválido — Prisma CLI não conecta)
datasource db {
  provider = "postgresql"
}

// DEPOIS (correto para Supabase com pooling)
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

Variáveis a configurar em `.env.local`:
- `DATABASE_URL` → connection pooler Supabase (porta 6543, `?pgbouncer=true`)
- `DIRECT_URL` → conexão direta Supabase (porta 5432) — usada pelo Migrate

---

## Ordem de Execução

Executar na seguinte ordem para respeitar dependências de FK:

```
1. questions         (sem dependências)
2. exchange_rates    (sem dependências)
3. pricing_configs   (sem dependências)
4. options           (FK → questions)
5. question_translations  (FK → questions)
6. option_translations    (FK → options)
7. sessions          (FK → questions)
8. answers           (FK → sessions, questions, options)
9. leads             (FK → sessions)
```

> O Prisma resolve automaticamente a ordem de criação. A sequência acima é para referência manual em caso de rollback.

---

## Comandos de Aplicação

### Desenvolvimento

```bash
cd output/workspace/budget-free-tech

# Configura variáveis de ambiente (se ainda não feito)
cp .env.example .env.local
# Editar .env.local com DATABASE_URL e DIRECT_URL do Supabase

# Aplica migration e regenera Prisma Client
npx prisma migrate dev --name init_schema
npx prisma generate
```

### Staging (OBRIGATÓRIO antes de produção)

```bash
# 1. Configurar DATABASE_URL e DIRECT_URL apontando para banco de staging
# 2. Aplicar migrations
npx prisma migrate deploy

# 3. Verificar 9 tabelas criadas
npx prisma db execute --stdin <<< "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='public';"

# 4. Testar rollback em staging antes de ir para produção
```

### Produção

```bash
# 1. Backup do banco de produção (via Supabase dashboard → Backups)
# 2. Aplicar em janela de baixo tráfego
npx prisma migrate deploy

# 3. Verificar logs de erro (primeiros 15 min)
# 4. Confirmar 9 tabelas criadas + indexes presentes
```

---

## Rollback

Para reverter **em desenvolvimento**:

```bash
npx prisma migrate reset
# ATENÇÃO: apaga todos os dados
```

Para reverter **em staging/produção** (criar migration de rollback):

```sql
-- Executar na ordem inversa para respeitar FKs
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

## Checklist de Segurança

### Reversibilidade
- [x] Rollback documentado e testável
- [x] Rollback não depende de dados (tabelas novas/vazias)

### Idempotência
- [x] Prisma controla idempotência via migration history
- [x] Re-execução de `migrate deploy` é segura (idempotente)

### Segurança de Dados
- [x] Nenhuma coluna NOT NULL sem DEFAULT foi adicionada em tabela existente com dados
- [x] Nenhum DROP em dados existentes
- [x] `visitor_ip` e `user_agent` armazenados como String (TEXT) — sem truncamento
- [x] `scope_story` usa `@db.Text` — sem limite de tamanho

### Integridade Referencial
- [x] Todas as FKs têm `ON DELETE` explícito ou campo nullable (SetNull implícito)
- [x] Indexes criados para todas as FKs
- [x] Ordem de criação de tabelas respeita dependências

### Tipos e Formatos
- [x] Enums representados como `String` (validação em app layer via Zod) — decisão de design do LLD
- [x] Campos monetários como `Float` (compatível com cálculos de estimativa)
- [x] Campos JSON como `Json` (path_taken, skip_logic, features)

### Alertas de Alto Risco
- [x] Nenhuma coluna NOT NULL em tabela existente com dados
- [x] Nenhum DROP TABLE
- [x] Nenhum ALTER COLUMN TYPE
- [x] Nenhuma tabela com >100k registros (banco novo)

**CHECKLIST: 14/14 items ok**

---

## Checklist Pré-Deploy

- [ ] Variáveis `DATABASE_URL` e `DIRECT_URL` configuradas em staging e produção
- [ ] Backup do banco de produção realizado (Supabase dashboard)
- [ ] Migrations testadas em staging com `prisma migrate deploy`
- [ ] Rollback testado em staging
- [ ] 9 tabelas confirmadas após migration
- [ ] Indexes confirmados (`pg_indexes`)
- [ ] Integridade referencial verificada (sem FK órfã)
- [ ] Equipe notificada (se houver janela de manutenção)

---

## Referências

- Schema: `prisma/schema.prisma`
- Guia detalhado: `prisma/PRISMA-MIGRATION-GUIDE.md`
- LLD: `output/docs/budget-free-tech/project/LLD.md`
- Config: `.claude/projects/budget-free-tech.json`
