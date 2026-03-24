# Orçamento Gratuito Tech

Sistema web para geração de orçamentos de projetos de software. 42 perguntas inteligentes, estimativa instantânea, 100% gratuito.

## Stack

- Next.js 16 (App Router)
- TypeScript 5
- Tailwind CSS 4
- Prisma 7 + Supabase PostgreSQL
- Zod 4 (validação)
- next-intl (i18n: pt-BR, en-US, es-ES, it-IT)
- Resend (email)
- Vercel (deploy)

## Setup Local

```bash
# 1. Clonar o repositório
git clone git@github.com:Pedrocorgnati/orcamento-gratuito-tech.git
cd orcamento-gratuito-tech

# 2. Configurar variáveis de ambiente
cp .env.example .env
# Preencher variáveis em .env com valores reais

# 3. Instalar dependências
npm install

# 4. Aplicar migrations e popular banco
npm run db:migrate
npm run db:seed

# 5. Iniciar servidor de desenvolvimento
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000) no navegador.

## Scripts Disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção |
| `npm run start` | Servidor de produção |
| `npm run lint` | ESLint |
| `npm run typecheck` | TypeScript check |
| `npm run db:migrate` | Criar/aplicar migrations |
| `npm run db:seed` | Popular banco com dados iniciais |
| `npm run db:studio` | Abrir Prisma Studio |

## Variáveis de Ambiente

Veja `.env.example` para a lista completa. Variáveis obrigatórias:

- `DATABASE_URL` — Connection pooling (PgBouncer)
- `DIRECT_URL` — Conexão direta (para migrations)
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase
- `RESEND_API_KEY` / `RESEND_FROM_EMAIL` — Email
- `CRON_SECRET` — Autenticação de cron jobs
