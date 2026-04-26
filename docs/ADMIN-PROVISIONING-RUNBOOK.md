# RUNBOOK — Provisionamento do Proprietário (Admin)

**Audience:** operador (você, com acesso ao Supabase Dashboard e à plataforma de hosting do app — Vercel).
**Frequência:** uma única vez por ambiente (`development`, `staging`, `production`). Repetir apenas se trocar o email autorizado.
**Tempo:** ~5 minutos por ambiente.

---

## 1. Modelo de auth

O sistema possui **um único role autenticado**: `PROPRIETARIO`. Não há tabela de usuários nem enum de roles em Prisma. A autenticação é via Supabase Auth (magic link) com **allowlist de email único** controlada pela env var `ADMIN_EMAIL`.

Camadas de defesa:

| Camada | Local | Comportamento |
|--------|-------|---------------|
| Middleware (páginas) | `src/middleware.ts` (`ADMIN_SUBROUTE_PATTERN`) | redirect para `/{locale}/admin?error=unauthorized` |
| Middleware (API) | `src/middleware.ts` (`/api/v1/admin/*`) | retorna `403 AUTH_002` JSON |
| Layout SSR | `src/app/[locale]/admin/(dashboard)/layout.tsx` | redirect com `error=unauthorized` |
| Página de login | `src/app/[locale]/admin/page.tsx` | `signOut()` + redirect |
| Helper server | `src/lib/supabase/server.ts → requireAdmin()` | retorna 401/403 estruturado |
| Route handlers | `src/app/api/v1/admin/*/route.ts` | usam `requireAdmin()` |

Se `ADMIN_EMAIL` **não** estiver definido, qualquer user autenticado vira admin (modo dev/test). **Nunca deixar essa env vazia em staging/production.**

---

## 2. Configurar `ADMIN_EMAIL` no app

### Vercel (staging/production)

```bash
vercel env add ADMIN_EMAIL production
# cole o email do proprietário e ENTER
vercel env add ADMIN_EMAIL preview
vercel env add ADMIN_EMAIL development   # opcional — local usa .env
```

Confirme:

```bash
vercel env ls
```

Re-deploy o ambiente para que a env entre em vigor:

```bash
vercel --prod
```

### Local (desenvolvimento)

`.env.local`:

```
ADMIN_EMAIL=seuemail@dominio.com
```

---

## 3. Habilitar magic link no Supabase

1. Supabase Dashboard → projeto correspondente.
2. **Authentication → Providers**: garantir que `Email` está ativo. Em **Email Auth**, manter `Enable email confirmations = OFF` (magic link não precisa) **e** `Enable email signup = OFF` (defesa em profundidade — apenas usuário pré-criado pode receber link).
3. **Authentication → URL Configuration**:
   - `Site URL`: URL do ambiente (ex.: `https://budgetfree.tech`).
   - `Redirect URLs`: adicionar `https://budgetfree.tech/api/auth/callback` (e a equivalente para preview/staging).
4. **Authentication → Email Templates → Magic Link**: ajustar branding se desejar.

---

## 4. Criar o usuário admin no Supabase

> Como signup foi desabilitado (passo 3.2), crie o user manualmente:

1. Supabase Dashboard → **Authentication → Users → Add user → Send invitation**.
2. Informe **exatamente o mesmo email** configurado em `ADMIN_EMAIL`.
3. Marque "Auto confirm user" (caso a opção apareça) — assim o login direto via magic link funciona.
4. O Supabase enviará o magic link na primeira tentativa de login pelo `/admin`.

---

## 5. Validação end-to-end

1. Abrir `https://<ambiente>/admin` em janela anônima.
2. Informar `ADMIN_EMAIL`. Deve aparecer "Magic link enviado".
3. Conferir caixa de entrada. Clicar no link.
4. Deve redirecionar para `/{locale}/admin/leads` autenticado.
5. **Smoke 403 (defesa em profundidade)** — em outro browser, autenticar via Supabase com email diferente (Supabase Dashboard → Users → Add user) e tentar `GET /api/v1/admin/leads`. Deve retornar `403 { error: { code: "AUTH_002" } }`.

---

## 6. Trocar o admin

1. Atualizar `ADMIN_EMAIL` (Vercel + `.env.local`).
2. Re-deploy.
3. Adicionar o novo user no Supabase (passo 4).
4. (Opcional) Remover o user antigo: Supabase Dashboard → Users → ⋯ → Delete user.

> **Atenção:** trocar `ADMIN_EMAIL` mantém sessões antigas válidas até expirarem; o middleware bloqueia o acesso ao painel imediatamente, mas para encerrar à força revogue todas as sessões em **Authentication → Users** do Supabase.

---

## 7. Incidente — admin não consegue logar

| Sintoma | Causa provável | Ação |
|---------|----------------|------|
| Form retorna mensagem genérica e nunca chega email | Email digitado não bate com `ADMIN_EMAIL` (case-sensitive aplicada via `.toLowerCase()` em runtime; verifique digitação) | Reenvie usando o email exato do env |
| Email chega mas o link redireciona para `/admin?error=unauthorized` | `ADMIN_EMAIL` no app divergente do email do user no Supabase | Conferir `vercel env ls` vs Supabase Users |
| `/api/v1/admin/*` retorna 403 mesmo logado como admin | Sessão antiga; cookie expirado mid-flight | Logout + login novamente |
| `/api/v1/admin/*` retorna 401 logado | Cookies do Supabase não estão sendo propagados (config de proxy/cdn) | Verificar `Site URL` no Supabase e domínio do cookie |
| 429 RATE_001 ao tentar login | Limite de 10 tentativas/min por IP | Aguardar 60s |

Logs relevantes no servidor:
- `admin_api_forbidden` (warn) — tentativa autenticada mas non-admin.
- `auth_callback_failed` — falha de troca code → session.

---

## 8. Referências

- Spec: `output/docs/budget-free-tech/project/PRD.md` §RF-06 (Autenticação do Proprietário).
- Hardening RBAC executado em 2026-04-23: `output/wbs/budget-free-tech/modules/module-5-auth-admin/TASK-8.md`.
- Audit: `output/wbs/budget-free-tech/_ROLES-AUDIT.md`.
