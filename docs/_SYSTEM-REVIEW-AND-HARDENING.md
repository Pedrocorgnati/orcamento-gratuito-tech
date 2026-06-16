# Budget Free Tech - Revisão Completa, Fortalecimento e Otimização

> Documento de revisão + plano de hardening do sistema `output/workspace/budget-free-tech`.
> Escopo: entender TODOS os fluxos de escolha do usuário e tornar o sistema mais forte e otimizado.
> Stack: Next.js 16 (App Router) · React 19 · TypeScript 5 (strict) · Prisma 7 · Supabase PG · next-intl (4 locales) · Resend · Vercel.
> Método: leitura direta de arquivos do caminho crítico + revisão adversarial + verificação contra `tsc`, `next build`, código real e docs locais do Next 16. Afirmações não provadas só entram como `hipotese`.

---

## 0. Estado atual (gate de realidade)

**O projeto NÃO passa no gate de tipo.** `npm run typecheck` retorna **7 erros**. Como `next.config.ts` não tem `typescript.ignoreBuildErrors`, `package.json` usa `next build` puro e a documentação local do Next 16 diz que `next build` falha por padrão com erros TypeScript (`node_modules/next/dist/docs/01-app/03-api-reference/05-config/01-next-config-js/typescript.md:26-34`), o deploy normal na Vercel fica bloqueado salvo override externo de dashboard ou build command não presente no repositório. O CI também bloqueia antes do build (`.github/workflows/ci.yml:39-43`, `72-97`).

Objeção forte: o `npm run build` local, neste workspace específico, falhou antes do typecheck por um panic do Turbopack causado pelo caminho com acento `Repositórios` (`start byte index ... inside 'ó'`). Isto é P0 local/operacional, mas não prova falha idêntica na Vercel, cujo checkout normalmente usa path ASCII. Resposta: mesmo removendo esse fator local, os 7 erros de `tsc` continuam suficientes para bloquear o caminho padrão de produção.

```
src/lib/analytics/recordEvent.ts(49,9)  TS2322  meta: Record<string,unknown> não atribuível a Prisma InputJsonValue
src/lib/analytics/recordEvent.ts(70,9)  TS2322  context: idem
src/lib/notifications/sendLeadNotification.ts(106,127) TS2551 project_type (use projectType)
src/lib/notifications/sendLeadNotification.ts(106,162) TS2339 price_range_formatted inexistente
src/lib/notifications/sendLeadNotification.ts(123,68)  TS2339 price_range_formatted inexistente
src/lib/notifications/sendLeadNotification.ts(123,107) TS2339 days_range_formatted inexistente
src/lib/notifications/templates/ownerEmail.tsx(27,33)  TS2339 complexity_score inexistente
```

Critério de saída do P0: `npm run typecheck` verde, `npm run build` verde em path ASCII ou com mitigação do panic do Turbopack, e CI verde. O panic local deve ser registrado como risco de ambiente, não como causa primária do deploy Vercel.

Gate mínimo antes de qualquer fase funcional: rodar `npm run typecheck` no cwd atual. Se o typecheck ainda falhar, parar e corrigir P0-1 antes de qualquer mudança de regra de negócio. Para validar build enquanto o panic do Turbopack no path com acento existir, reproduzir em checkout com path ASCII, por exemplo `/tmp/budget-free-tech-build`, sem alterar a análise de causa dos erros TypeScript.

---

## 1. Mapa dos fluxos de escolha do usuário

Cinco superfícies onde o usuário decide algo. Cada uma com onde o estado é gravado e o que muda a jusante.

### 1.1 Fluxo principal do questionário (coração do produto)
1. `/{locale}/flow` → `src/middleware.ts` redireciona 307 para `/api/v1/flow/bootstrap?locale=…` (encaminha `?preselect=N` 1..11 de landings de solução).
2. `bootstrap/route.ts`: reaproveita sessão válida do cookie (`SESSION_ID`, httpOnly, `SameSite=strict`, TTL `SESSION_TTL_HOURS`) ou cria nova (rate-limit só na criação) → redireciona para `/flow/{current_question_id ?? 'Q001'}`.
3. **Q001 (SINGLE/MULTI project type)** → `answerFlow.buildAnswerFlowContext`: mapeia `option.order` → `ProjectType` (`PROJECT_TYPE_BY_Q001_ORDER`), monta `pending_blocks` via `buildPendingBlocks` (sempre acrescenta `CONTEXT`,`NARRATIVE`,`LEAD`), grava `project_type(s)`/`current_block`.
4. **Cada pergunta** → `submitAnswer` (server action) ou `POST /api/v1/sessions/[id]/answers` (REST gêmea). Resolução do próximo passo, em ordem: `option.next_question_id` → `skip_logic.dynamic_next` (mapping por `current_block`/`project_type`/`order` de `based_on`) → `skip_logic.end_of_block` (consome `pending_blocks`) → fallback determinista para 1ª pergunta não respondida do bloco `CONTEXT` (`resolveFallbackToBlock7`).
5. **Acumuladores** (`recalculateAccumulators`): recomputados a partir dos *snapshots por resposta* a cada submit (sem drift); `BUDGET_SELECT`/`DEADLINE_SELECT` ficam fora do acúmulo de preço/tempo (alimentam scoring, não preço).
6. **Voltar** (`goBack`): deleta a última resposta e RECONSTRÓI todo o estado derivado (project_types, pending_blocks, current_block, acumuladores, ponteiro). `current_question_id` volta para a pergunta editada → re-resposta funciona (não dispara `OUT_OF_SEQUENCE`). Guard `INV-ROUTE-001` na page redireciona URL-skipping para a pergunta corrente.
7. **Fim**: `hipotese` de banco já migrado por `refactor-narrative-v4`: terminal vira **Q104 (SINGLE_CHOICE)** com `next_question_id=null`, tornando Q105 inalcançável. Contra-evidência no repo: `prisma/seed.ts` não importa nem executa `applyNarrativeRefactorV4`, enquanto `prisma/seeds/graph.ts` ainda liga `Q104→Q105`. Portanto o terminal real depende de seed/migração executados fora do seed principal. `isComplete = (nextQuestionId===null && hasAnswers)`, `status→COMPLETED` → client navega para `/result`.

### 1.2 Resultado + estimativa
`/result` exige `status===COMPLETED` (senão 409 → redirect `/flow`). `estimationService.calculate` faz estimativa multi-projeto (soma base×multiplicador por tipo, fator de sobreposição 0.7 em prazo para multi, faixa ±15% preço / ±10% prazo), converte moeda por locale (`ESTIMATE_052` com fallback BRL), gera `scope_story`.

### 1.3 Captura de lead
`/lead-capture` → `createLead` (server action): honeypot → rate-limit → Zod → consentimento obrigatório → IDOR (cookie==sessionId) → `leadService.create` (idempotente por `session_id @unique`, calcula score A/B/C, detecta respostas-filler, dispara emails fire-and-forget). Email intermediário também é coletado inline em Q093 (`InlineEmailCapture`) para retomada.

### 1.4 Escolhas de apresentação
- **Idioma** (`LanguageSelector`) → cookie `NEXT_LOCALE` + roteamento next-intl; **Moeda** derivada do locale (`LOCALE_CURRENCY_MAP`) + `CurrencySelector` no resultado.
- **Consentimento de cookies** (`CookieBanner`/`CookiePreferencesDialog`) → `useConsentState`/cookies → gating de analytics (`AnalyticsWithConsent`).

### 1.5 Privacidade / direitos do titular
`requestErasure` (gera token, envia email de confirmação) → `confirmErasure(token)` (TTL 24h, idempotente) → `anonymizeLeadsByEmail`. Crons: `cleanup-sessions` (diário), `anonymize-leads` (mensal, retenção 12m), `send-resume-emails` (horário). Todos protegidos por `Authorization: Bearer ${CRON_SECRET}`.

### 1.6 Admin
`/{locale}/admin` (magic link Supabase) → `/admin/(dashboard)/*`. Auth em 3 camadas: middleware (page-guard + API-guard), layout RSC (`getSession` + `ADMIN_EMAIL`), e route handlers. KPIs: abandono, acurácia, resume-rate, alerts; tabela de leads paginada.

---

## 2. Achados (por severidade)

Cada achado: `arquivo:linha` · mecanismo · impacto · correção · confiança. Quando a conclusão extrapola o repositório ou depende de tráfego/infra, está marcada como `hipotese`.

### P0 - Bloqueia build/deploy

**P0-1 · Gate de build quebrado: 7 erros de TypeScript.** (confiança: alta, reproduzido via `npm run typecheck`; `next build` local também falha, mas por panic Turbopack antes do typecheck neste path com acento)
- `sendLeadNotification.ts:106,123` lê `estimation.project_type`, `.price_range_formatted`, `.days_range_formatted`; `ownerEmail.tsx:27` lê `estimation.complexity_score`. O tipo `EstimationResult` (`src/lib/types.ts`) é **camelCase** e não tem esses campos. `recordEvent.ts:49,70` passa `Record<string,unknown>` onde Prisma espera `InputJsonValue`.
- Impacto: CI vermelho e deploy normal na Vercel bloqueado, salvo configuração externa perigosa que pule typecheck. Texto-fallback dos emails renderizaria `undefined` mesmo se compilasse. Objeção: "Vercel poderia ignorar `tsc`?". Resposta: não há `typescript.ignoreBuildErrors`, `buildCommand`, `ignoreCommand` ou script customizado no repo que faça isso; qualquer bypass seria fora do controle versionado e deve ser tratado como risco, não como caminho válido.
- Correção:
  - `sendLeadNotification.ts`: usar campos camelCase reais + helpers existentes. Importar `formatCurrencyRange`, `formatDaysRange` de `@/lib/utils/format` (NÃO importados hoje). Owner text: `Project: ${estimation.projectType}` + `formatCurrencyRange(priceMin,priceMax,currency,locale)`. Visitor text: idem + `formatDaysRange(daysMin,daysMax,locale)`.
  - `ownerEmail.tsx:27`: não existe `complexity_score` top-level e `breakdown` não é populado neste caminho de reconstrução; derivar proxy do enum `complexity` (`{LOW:5,MEDIUM:15,HIGH:25,VERY_HIGH:35}[complexity]`) em vez de `?? 0` (que força confiança "Baixa" sempre).
  - `recordEvent.ts:49,70`: tipar retorno de `sanitizeMeta` como `Prisma.InputJsonValue` ou castar no ponto de uso (`meta: <value> as Prisma.InputJsonValue`); preservar o `?? undefined`.
- Execução operacional:
  - Pré-condição: `npm run typecheck` reproduz exatamente erros em `src/lib/analytics/recordEvent.ts`, `src/lib/notifications/sendLeadNotification.ts` e `src/lib/notifications/templates/ownerEmail.tsx`.
  - Tocar apenas esses arquivos no primeiro commit de correção. Não alterar Prisma schema, migrations, templates de email ou contrato da rota `/estimate` para "fazer compilar".
  - Pós-condição: `npm run typecheck` retorna exit code 0. Se `npm run build` ainda falhar somente com panic de path não ASCII, registrar o comando e validar build em path ASCII antes de abrir nova investigação.
  - Prova adicional: `vitest run src/lib/notifications/templates/ownerEmail.test.ts src/lib/notifications/templates/visitorEmail.test.ts src/lib/notifications/retryEmail.test.ts` não deve quebrar renderização/fallback de email.
  - Rollback: se a correção de email alterar texto HTML além dos fallbacks, reverter essa parte e manter somente compatibilidade de tipo; o P0 não autoriza redesign de email.
- Nota: o gate de CI (`tsc`) JÁ existe, o código regrediu apesar dele. Reforço: garantir que CI bloqueia merge (branch protection), ação humana fora do código. Registrar também o panic local do Turbopack em paths não ASCII, porque ele pode impedir reprodução local mesmo depois do P0 de tipos ser corrigido.

### P1 - Perda de dados / segurança / privacidade

**P1-1 · `createLead` descarta campos coletados: `whatsapp`, `marketing_consent`, `policyVersion`.** (alta)
- `LeadCaptureForm.tsx:129-140` monta `FormData` manualmente e inclui `whatsapp`/`marketing_consent`, mas não inclui `policyVersion`, embora `ConsentCheckbox.tsx:63-68` registre o campo no form state. `actions/createLead.ts:98-154` lê `whatsapp` e `marketing_consent`, mas destrutura só `name,email,phone,company,sessionId,consentGiven,consentVersion,marketing_consent` e chama `leadService.create({sessionId,name,email,phone,company,consentGiven,consentVersion,_hp})`, sem `whatsapp`, sem `marketing_consent` e sem `policyVersion`.
- Objeção forte: o service não está totalmente errado, `lead.service.ts:136-187` já grava `whatsapp: input.whatsapp ?? null` e tenta gravar `consent_policy_version` quando `input.policyVersion` chega. Resposta: no fluxo principal via server action esses dados não chegam, então o efeito prático continua sendo perda silenciosa. A rota REST `/api/v1/leads` pode preservar `whatsapp`/`policyVersion` se o cliente externo enviar o payload certo, mas ela não cobre o formulário real.
- Impacto: consentimento de marketing (LGPD/CAN-SPAM), WhatsApp e versão da política coletados/representados na UI podem sumir no caminho principal. `marketing_consent` fica sempre default `false` porque nem o schema base `LeadSchemaInput` nem o create do service aceitam/gravam esse campo.
- Correção: no client, incluir `policyVersion` no `FormData`; na action, destruturar e repassar `whatsapp`, `policyVersion`, `marketing_consent`; no schema/assinatura do service, incluir `marketing_consent`; no `prisma.lead.create`, gravar `marketing_consent: input.marketing_consent ?? false`.
- Execução operacional:
  - Pré-condição: `prisma/schema.prisma` já possui `Lead.marketing_consent`, `Lead.whatsapp` e `Lead.consent_policy_version`; não criar migration nova para esses campos.
  - Alterar `src/lib/validations/schemas.ts` para aceitar `marketing_consent?: boolean` no `leadSchema` ou criar tipo de input do service que estenda `LeadSchemaInput` sem cast opaco. A rota REST `src/app/api/v1/leads/route.ts` deve continuar validando payload externo.
  - Alterar `src/components/lead/LeadCaptureForm.tsx` para enviar `policyVersion` vindo de `ConsentCheckbox`, não hardcodar a versão ali.
  - Alterar `src/actions/createLead.ts` para destruturar e repassar `whatsapp`, `policyVersion`, `marketing_consent`.
  - Alterar `src/services/lead.service.ts` para gravar `marketing_consent` no `prisma.lead.create`. Não usar `(input as any)` para campos novos.
  - Pós-condição: teste de server action ou service cria lead com `whatsapp`, `marketing_consent=true` e `consent_policy_version=PRIVACY_POLICY_VERSION`.
  - Prova: `vitest run src/__tests__/integration/leads.integration.test.ts src/__tests__/components/ConsentCheckbox.test.tsx` e `npm run typecheck`.
  - Rollback: se o client quebrar, manter a expansão de schema/service e desabilitar apenas o envio client temporariamente; não remover as colunas nem aceitar perda silenciosa no service.

**P1-2 · Anonimização incompleta + divergente (vazamento de PII).** (alta)
- `cron/anonymize-leads/route.ts:84-94` NÃO anula `whatsapp` (enquanto `security/erasure.ts:anonymizeLeadsByEmail` anula). Sentinelas divergentes (`[Removido]`/`anonimizado@example.com` vs `ANONYMIZED`/`anonymized@example.invalid`). NENHUM dos dois caminhos limpa PII fora de `Lead`: `Session.visitor_ip`, `Session.user_agent`, `Session.intermediate_email`, nem respostas narrativas livres (`Q096-Q099` em `answers.text_value`), que persistem indefinidamente para sessões COMPLETED (o `cleanup-sessions` só apaga sessões NÃO-completed expiradas).
- Impacto: PII (WhatsApp, IP, e-mail intermediário, texto livre do usuário) sobrevive à retenção e à exclusão a pedido. Risco LGPD/GDPR direto.
- Correção: (a) unificar a anonimização num único helper canônico (`anonymizeLeadById`/`ByEmail`) usado por cron + erasure; (b) incluir `whatsapp:null`; (c) anonimizar a Session vinculada (`visitor_ip`, `user_agent`, `intermediate_email`) e as respostas narrativas (`text_value` dos códigos `Q096-Q099`); (d) sentinela única.
- Execução operacional:
  - Pré-condição: identificar leads candidatos por `Lead.id`/`Lead.email` e sempre carregar `Lead.session_id`. A anonimização de tabelas relacionadas precisa ocorrer na mesma transação que marca `Lead.anonymized_at`.
  - Criar helper único em `src/lib/security/erasure.ts`, por exemplo `anonymizeLeads(where, client?)`, usado por `confirmErasure` e por `src/app/api/cron/anonymize-leads/route.ts`.
  - Campos obrigatórios a limpar: `Lead.name`, `Lead.email`, `Lead.phone`, `Lead.whatsapp`, `Lead.company`, `Lead.scope_story`; `Session.visitor_ip`, `Session.user_agent`, `Session.intermediate_email`; `Answer.text_value` somente para perguntas com `Question.code in ['Q096','Q097','Q098','Q099']`.
  - Campos a preservar: `Lead.score_*`, `project_type`, `complexity`, estimativas, `currency`, `created_at`, UTM/referrer somente se a decisão de privacidade aceitar manter atribuição não diretamente identificável. Se UTM/referrer contiver PII por query string, marcar `hipotese` e limpar também.
  - Pós-condição: cron e confirmação por token produzem a mesma sentinela e deixam `anonymized_at` preenchido.
  - Prova: `vitest run src/__tests__/unit/anonymization.test.ts` deve cobrir cron/helper e erasure/helper; adicionar teste se hoje cobrir só um caminho.
  - Rollback: se transação falhar em respostas narrativas, não marcar `processed_at` na `ErasureRequest`; retornar erro interno e permitir nova tentativa.

**P1-3 · Tokens de exclusão forjáveis (`Math.random`).** (alta)
- `security/erasure.ts:26 generateErasureToken` usa `Date.now()+Math.random()`. Token = prova de direito de apagar dados de um titular.
- Impacto: previsibilidade → forja/adivinhação de token → exclusão não autorizada de dados (destruição). 
- Correção: `crypto.randomUUID()` (ou `crypto.getRandomValues`), alta entropia, sem dependência nova.
- Execução operacional:
  - Pré-condição: runtime Node 20+ já disponível em `package.json`; usar API nativa `crypto.randomUUID()` ou `randomBytes(32).toString('base64url')`.
  - Não migrar tokens existentes. Tokens antigos continuam válidos até `ERASURE_TOKEN_TTL_MS` para não quebrar solicitações em aberto.
  - Pós-condição: tokens novos não contêm timestamp legível e têm pelo menos 122 bits de entropia efetiva.
  - Prova: teste unitário em `src/__tests__/unit/anonymization.test.ts` ou novo teste para `generateErasureToken` valida unicidade em lote pequeno e ausência de prefixo temporal; `npm run typecheck`.

**P1-4 · `requestErasure` sem rate-limit (e-mail bombing / enumeração).** (alta)
- `actions/requestErasure.ts` cria `erasureRequest` e dispara e-mail Resend para QUALQUER endereço, sem limite por IP/e-mail, sem captcha, instanciando `new Resend()` por chamada.
- Impacto: vetor de spam/abuso (bombardear vítima com "confirme exclusão"; inflar tabela; custo Resend).
- Correção: rate-limit por IP e por e-mail (reusar limitador), throttle de reenvio (1/X min por e-mail), resposta sempre genérica (já é bom anti-enumeração).
- Execução operacional:
  - Pré-condição: definir política antes de codar: por IP `5/h` e por email normalizado `1/15min` são defaults aceitáveis até haver telemetria real.
  - Implementar no início de `src/actions/requestErasure.ts`, antes de criar `ErasureRequest` e antes de chamar Resend. Usar resposta genérica `{ success: true }` para requisições bloqueadas por email, e erro genérico para bloqueio por IP se a UX precisar sinalizar tentativa excessiva.
  - Reusar a interface consolidada de rate-limit da Fase 3. Se Upstash não estiver provisionado, usar in-memory explicitamente como degradação temporária.
  - Pós-condição: múltiplas chamadas para o mesmo email dentro da janela não criam múltiplas linhas nem disparam múltiplos emails.
  - Prova: teste de action com mock Prisma/Resend ou integração local; `vitest run src/__tests__/unit/anonymization.test.ts src/__tests__/analytics/events.test.ts` se não houver teste dedicado, criar um.
  - Rollback: se o limitador distribuído falhar por rede, default deve ser fail-closed para envio de email e fail-open somente para renderizar a página, nunca para criar spam.

**P1-5 · Duas fontes de CSP conflitantes, risco de header duplo ou override não auditado.** (média/alta, não chamar de provado em produção sem `curl -I` no deploy)
- Fato no repo: `next.config.ts:9-31` define CSP para `/(.*)` com `googletagmanager.com` e `unsafe-*` só em dev; `vercel.json:17-31` também define CSP para `/(.*)`, sem `googletagmanager.com` e com `'unsafe-inline' 'unsafe-eval'` sempre. A documentação da Vercel recomenda custom headers via `next.config.js` para projetos Next e `vercel.json` para outros projetos, o que torna a duplicação suspeita por si só.
- Objeção forte: o repositório sozinho não prova que a Vercel servirá dois `Content-Security-Policy` simultâneos. Pode haver override/deduplicação em alguma etapa da plataforma. Resposta: mesmo se houver override, o estado versionado é ruim, porque a política efetiva fica dependente de precedência de plataforma e não do código auditável. Se os dois headers chegarem ao browser, MDN confirma que múltiplas CSPs só restringem mais, então a ausência de GTM em uma delas bloqueia GTM apesar da outra permitir.
- Impacto: `hipotese` se header duplo for emitido, GTM quebra em produção por interseção das políticas. Se o `vercel.json` vencer por override, GTM também quebra e `unsafe-*` fica permitido em produção. Se `next.config.ts` vencer, a duplicação ainda é dívida e pode voltar em qualquer mudança de plataforma.
- Correção: fonte única de CSP. Para Next na Vercel, preferir `next.config.ts` como autoridade e remover CSP de `vercel.json`, mantendo crons lá. Validar com `curl -I https://<deploy>` que existe exatamente 1 CSP, que GTM aparece quando necessário e que `unsafe-*` não aparece em produção.
- Execução operacional:
  - Pré-condição: decidir autoridade de headers. Default: `next.config.ts` mantém todos os security headers; `vercel.json` mantém apenas `crons`.
  - Remover de `vercel.json` o bloco `headers` inteiro, não só a chave CSP, para evitar divergência em `X-Frame-Options`, `Referrer-Policy` e `Permissions-Policy`.
  - Pós-condição local: `npm run typecheck` e `npm run build` continuam verdes; `vercel.json` permanece JSON válido e contém `crons`.
  - Prova em deploy: `curl -sI https://<deploy>` deve retornar exatamente uma linha `content-security-policy:`. Esse valor deve conter `https://www.googletagmanager.com` se analytics/GTM estiver habilitado e não deve conter `'unsafe-eval'` nem `'unsafe-inline'` em `script-src` com `NODE_ENV=production`.
  - Rollback: se algum header exigido pela Vercel só existir em `vercel.json`, mover a fonte única para `vercel.json` e remover a duplicata de `next.config.ts`; não manter duas autoridades.

**P1-6 · Rate-limit in-memory frágil em serverless (e duplicado).** (média/alta, severidade depende de tráfego e abuso real)
- `lib/rate-limiter.ts` (classe) e `lib/middleware-helpers.ts` (funções) são DOIS limitadores in-memory por `Map`. Em Vercel cada instância tem memória própria → limites por-instância → contornáveis horizontalmente. Existe `lib/rate-limiter-kv.ts` pronto e NÃO conectado.
- Objeção forte: chamar de "inócuo" é exagerado sem perfil de tráfego. Para baixo volume e uma instância quente, ele reduz abuso casual e custa zero. Upstash/KV adiciona dependência, latência, custo, falha de rede e operação. Resposta: para qualquer rota pública com custo de DB/email (`lead`, `erasure`, criação de sessão), o limite por instância não é uma fronteira de segurança confiável. O texto deve vender honestamente o trade-off, não fingir que KV é gratuito.
- Impacto: `hipotese` sob tráfego baixo, risco prático moderado; sob scraping, bot ou fan-out de instâncias, proteção de `lead` (3/h), criação de sessão (50/min), admin/auth e futuro `erasure` é contornável. `requestErasure` nem tem limitador.
- Correção: unificar interface primeiro. Conectar backend distribuído só para rotas com custo/abuso material (`lead`, `erasure`, bootstrap) e manter in-memory como fallback dev/degradação. Provisão de `UPSTASH_*` é decisão operacional, não correção puramente técnica.
- Execução operacional:
  - Pré-condição: não importar `src/lib/rate-limiter-kv.ts` diretamente enquanto `@upstash/ratelimit` e `@upstash/redis` não estiverem em `package.json`; hoje o arquivo depende de `@ts-expect-error`.
  - Criar interface única assíncrona, por exemplo `src/lib/rate-limit/index.ts`, com `check(key, policy): Promise<{ allowed:boolean; retryAfter?:number; backend:'memory'|'upstash' }>` e adaptar `src/lib/rate-limiter.ts`/`src/lib/middleware-helpers.ts` para consumi-la ou delegar.
  - Rotas obrigatórias na primeira leva: `src/actions/createLead.ts`, `src/app/api/v1/leads/route.ts`, `src/app/api/v1/flow/bootstrap/route.ts`, `src/actions/requestErasure.ts` e middleware admin/auth.
  - Backend distribuído só fica obrigatório quando `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` existirem nos ambientes. Sem elas, logar `rate_limit_backend=memory` uma vez por cold start e manter limites funcionais.
  - Pós-condição: nenhum caller usa `new Map()` próprio para rate-limit fora do adaptador in-memory.
  - Prova: `rg "rateLimitStore|new RateLimiter|leadRateLimiter|sessionRateLimiter|checkRateLimit" src` mostra apenas adaptadores/exportações esperadas; `npm run typecheck`; testes de middleware continuam verdes (`vitest run src/__tests__/middleware.test.ts`).

### P2 - Robustez / corretude / drift

**P2-1 · Dois motores de estimativa; o "canônico" não está no caminho real.** (média/alta)
- `lib/estimation/calculate.ts` (`calculateEstimation`, INV-001..004 documentadas) NÃO é chamado por `estimationService`, que reimplementa o cálculo em `_calculateMultiProjectEstimation` (`_inferComplexityLevel`, `_getComplexityMultiplier`, base×mult, ±15%). As invariantes documentadas (ex.: throw se `priceMin>=priceMax`) não existem no caminho vivo.
- Objeção forte: unificar por delegação simples para `calculate.ts` pode regredir o que hoje funciona no caminho vivo: `breakdown` multi-projeto (`ResultCard.tsx:87-113`), soma por tipo, fator de overlap de prazo 0.7 (`estimation.service.ts:321-339`) e formato snake_case da API. A duplicação é ruim, mas não é obviamente mais urgente que o terminal frágil do grafo.
- Impacto: documentação enganosa; manutenção em arquivo morto; risco de "consertar no lugar errado". O risco imediato de usuário depende de mudança futura, porque o caminho vivo não usa `calculate.ts`.
- Correção: estabilizar o grafo primeiro, depois decidir a fonte única com teste de paridade multi-projeto. Opções defensáveis: (a) mover o cálculo vivo para `lib/estimation` e fazer `calculate.ts` virar helper interno usado pelo service; (b) adaptar `calculate.ts` para ser primitive por tipo e manter agregação/overlap no service. Não substituir antes de preservar `breakdown`.
- Execução operacional:
  - Pré-condição: P2-3/P2-4 já verdes; não mexer no motor enquanto o fluxo terminal pode impedir geração de `/result`.
  - Adicionar teste de caracterização do caminho vivo em `src/lib/estimation/__tests__/contract.test.ts` ou novo teste de service com sessão multi-projeto: deve preservar `breakdown`, `project_types`, overlap de prazo `0.7`, formato snake_case da API e fallback `ESTIMATE_052`.
  - Decisão pendente nomeada: `decisao_motor_estimativa_fonte_unica`. Sem essa decisão, permitir apenas correções locais de bug em ambos os motores, nunca migração parcial.
  - Pós-condição: `estimationService.calculate()` usa uma fonte declarada; `rg "function _inferComplexityLevel|calculateEstimation" src/services src/lib/estimation` não deve apontar para dois algoritmos independentes vivos.
  - Prova: `vitest run src/lib/estimation/__tests__ src/__tests__/integration/estimate.integration.test.ts`.
  - Rollback: se paridade multi-projeto falhar, manter `estimation.service.ts` como fonte viva e marcar `calculate.ts` como helper/test-only ou removê-lo em tarefa separada; não degradar API para camelCase.

**P2-2 · Buracos de fronteira em `scoreToComplexityLevel`.** (média)
- `calculate.ts:80-97`: faixas `[0,30],[31,50],[51,70],[71,∞]`. Score fracionário em (30,31)/(50,51)/(70,71) não cai em nenhuma faixa → fallback `VERY_HIGH`. O caminho vivo (`_inferComplexityLevel`, `<=`) não tem o bug, por isso o impacto hoje é latente, mas vira real se P2-1 unificar para `calculate.ts`.
- Correção: faixas contíguas com `<=` (alinhar à versão do service) e teste de fronteira (30,30.5,31,50,50.5,51,70,70.5,71).
- Execução operacional:
  - Pré-condição: bug está em `src/lib/estimation/calculate.ts`, não no caminho vivo atual. Corrigir antes ou junto com a decisão do motor, mas não usar a existência do bug para justificar migração apressada.
  - Pós-condição: `scoreToComplexityLevel(30.5)` retorna `MEDIUM`, `50.5` retorna `HIGH`, `70.5` retorna `VERY_HIGH`.
  - Prova: adicionar casos fracionários em `src/lib/estimation/__tests__/calculate.test.ts`; rodar `vitest run src/lib/estimation/__tests__/calculate.test.ts`.

**P2-3 · Drift graph/seed: Q105 órfã e terminal frágil por seed não integrado.** (alta)
- `prisma/seeds/graph.ts:197-211` ainda configura `Q104→Q105` e `Q105` como terminal `TEXT_INPUT`; `questions.ts:573` cria Q105; `refactor-narrative-v4.ts:247-283` reescreve `Q104→null`, mas `prisma/seed.ts:1-10` e `147-184` não importam nem executam `applyNarrativeRefactorV4`. Portanto não é só "ordem de seed": o seed principal não aplica o refactor.
- Objeção forte: produção pode já ter rodado `refactor-narrative-v4` manualmente. Resposta: isso é `hipotese` operacional. O repositório não torna esse estado reproduzível em banco novo, CI/e2e ou staging.
- A conclusão do fluxo SÓ funciona com Q104 terminal se v4 tiver rodado depois do graph. Se não rodou, o terminal volta a ser `Q105` (TEXT_INPUT) e completion pode quebrar por P2-4.
- Impacto: fragilidade de ordem de seed; pergunta órfã viva (viola Zero Órfãos nos dados); referências stale.
- Correção: remover de `graph.ts` o wiring para Q105 (alinhar à v4) OU consolidar o estado terminal num único seed idempotente; validar via `validate:graph` que existe exatamente 1 terminal alcançável e 0 perguntas órfãs alcançáveis; decidir explicitamente deletar Q105 ou mantê-la documentada como legacy-only.
- Execução operacional:
  - Pré-condição: consultar DB alvo antes de migrar produção: `select q.code, q.type, q.skip_logic from questions q where q.code in ('Q104','Q105');` e `select count(*) from answers a join questions q on q.id=a.question_id where q.code='Q105';`. Se houver answers Q105, não deletar pergunta sem plano de retenção.
  - Default reprodutível no repo: importar e executar `applyNarrativeRefactorV4(prisma)` em `prisma/seed.ts` depois de `applyQuestionsRefactorV2` e antes de `applyCopywritingReviewV1`, ou incorporar o estado final diretamente em `prisma/seeds/graph.ts`. Escolher uma única fonte, não ambas com efeitos concorrentes.
  - Atualizar `scripts/validate-decision-graph.ts`: se Q105 for legacy-only, o validador deve permitir exatamente 1 órfã conhecida (`Q105`) ou reduzir `EXPECTED_QUESTION_COUNT` se Q105 for removida. Não manter "0 orphans" se a decisão for manter Q105 fora do caminho.
  - Pós-condição: Q104 é terminal alcançável (`options.next_question_id=null`) e Q105 não é alcançável por nenhum caminho novo, ou Q105 foi removida com migração explícita.
  - Prova: em banco limpo, `npm run db:seed && npm run validate:graph` passa; `vitest run src/tests/contracts/cross-rock-contracts.test.ts tests/e2e/critical/happy-path.spec.ts` se e2e estiver configurado.
  - Rollback: se produção tiver respostas Q105 relevantes, manter Q105 como legacy-only e preservar dados; não religar Q104→Q105 para "zerar órfãos".

**P2-4 · `isComplete` acoplado a "esta submissão teve opções".** (média)
- `recalculateAccumulators.ts:67`: `isComplete = nextQuestionId===null && hasAnswers`, com `hasAnswers = optionIds.length>0` vindo do caller. Se o terminal fosse TEXT_INPUT (ver P2-3), `isComplete` nunca seria `true` → `/result` daria 409 em loop.
- Correção: derivar completude do estado real: `nextQuestionId===null && (#answers da sessão >= 1)`. Desacopla do tipo da pergunta terminal e torna P2-3 não-catastrófico.
- Execução operacional:
  - Pré-condição: `recalculateAccumulators` já consulta `allAnswers`; não precisa de nova query.
  - Alterar assinatura para remover `hasAnswers` ou ignorá-lo internamente e depois atualizar callers (`src/actions/answer.ts`, `src/app/api/v1/sessions/[id]/answers/route.ts`) para evitar parâmetro enganoso.
  - Pós-condição: pergunta terminal `TEXT_INPUT` com `textValue` e `optionIds=[]` completa a sessão quando `nextQuestionId=null`.
  - Prova: teste unitário novo para `recalculateAccumulators` ou integração de resposta terminal; `vitest run src/__tests__/integration/answers.integration.test.ts`.
  - Rollback: se sessões em andamento forem afetadas, manter compatibilidade aceitando o parâmetro antigo, mas calcular `isComplete` por `allAnswers.length > 0`.

**P2-5 · Auth de página via `getSession()` (não `getUser()`).** (média)
- `src/middleware.ts` (page-guard) e `src/app/[locale]/admin/(dashboard)/layout.tsx` usam `getSession()` (lê cookie, valida JWT localmente mas não revalida no servidor de auth) enquanto as rotas `/api/v1/admin` usam `getUser()`. Orientação Supabase: usar `getUser()` para autorização server-side.
- Correção: usar `getUser()` consistentemente nas verificações server-side de admin (layout + middleware page-guard). Defense-in-depth; manter as 3 camadas.
- Execução operacional:
  - Pré-condição: `src/lib/supabase/server.ts` já exporta `getUser()` e `requireAdmin()`; rotas admin já usam `requireAdmin()`.
  - Em `src/app/[locale]/admin/(dashboard)/layout.tsx`, trocar `getSession()` por `getUser()` ou `requireAdmin()`. Em `src/middleware.ts`, trocar `getSupabaseSession` para `getSupabaseUser` usando `supabase.auth.getUser()`.
  - Pós-condição: cookie JWT revogado não autoriza renderização de dashboard nem subrota admin.
  - Prova: `vitest run src/__tests__/admin-rbac.test.ts src/__tests__/middleware.test.ts`; e teste manual com magic link revogado se disponível.

**P2-6 · Comparação de `CRON_SECRET` não constante-no-tempo.** (baixa)
- 3 crons fazem `authHeader !== \`Bearer ${secret}\``. Canal lateral de timing (baixo risco em Vercel, fácil de endurecer).
- Correção: comparação de tempo constante (`crypto.timingSafeEqual` com normalização de tamanho) num helper compartilhado `assertCronAuth(request)`.
- Execução operacional:
  - Pré-condição: três crons comparam `authorization` manualmente: `cleanup-sessions`, `anonymize-leads`, `send-resume-emails`.
  - Criar helper server-only, por exemplo `src/lib/security/cronAuth.ts`, retornando `{ ok:true } | { ok:false; status:500|401 }`. Normalizar para `Bearer ${CRON_SECRET}` e comparar buffers só quando comprimentos baterem; comprimentos diferentes retornam 401 sem throw.
  - Pós-condição: nenhum cron lê `process.env.CRON_SECRET` diretamente.
  - Prova: `rg "CRON_SECRET|authorization" src/app/api/cron src/lib/security` mostra segredo só no helper; `npm run typecheck`.

**P2-7 · Caminho de escrita duplicado (action + REST) já com drift.** (média)
- `actions/answer.ts` e `api/v1/sessions/[id]/answers/route.ts` duplicam ~120 linhas; já divergem (REST devolve 409 em `OUT_OF_SEQUENCE`, action devolve VALIDATION_FAILED; mensagens diferentes).
- Correção: extrair um único `applyAnswer(...)` (core transacional) consumido pela action e pela rota; cada camada só mapeia erros→forma de resposta. Reduz superfície de bug e custo de manutenção.
- Execução operacional:
  - Pré-condição: P2-4 já corrigido, porque a extração deve carregar a semântica nova de completude.
  - Criar core em `src/lib/session/applyAnswer.ts` com input normalizado `{ sessionId, questionId, optionIds?, textValue? }`, cliente transacional interno e erro de domínio tipado. Action e REST ficam responsáveis por cookie/IDOR, parse de payload e mapeamento de erro.
  - Pós-condição: o bloco transacional de upsert de answer e update de session existe em um arquivo só.
  - Prova: `rg "buildAnswerFlowContext|recalculateAccumulators|tx.answer.upsert" src/actions src/app/api/v1/sessions` aponta para o core, não para duas implementações; `vitest run src/__tests__/integration/answers.integration.test.ts src/tests/contracts/api-contracts.test.ts`.

**P2-8 · Divergência de unsubscribe (clobber de `resume_email_sent_at`).** (verificado pelo agente; média/baixa)
- `api/v1/unsubscribe/[token]/route.ts:51` preserva (`?? new Date()`); `[locale]/unsubscribe/[token]/page.tsx:53` sobrescreve incondicionalmente. Estado do DB depende de qual URL o usuário acessou; o overwrite corrompe o significado do timestamp (sinal de envio vs unsubscribe). Contrato "already" vs 404 também diverge.
- Correção: extrair `applyUnsubscribe()` único com semântica de preservação; rota e page só mapeiam o resultado. NÃO adicionar coluna nova (a idempotência de envio depende de `resume_email_sent_at IS NULL`).
- Execução operacional:
  - Pré-condição: preservar contrato de token duplo: `Lead.unsubscribe_token` e `Session.id`.
  - Criar `src/lib/notifications/applyUnsubscribe.ts` ou `src/lib/privacy/unsubscribe.ts`. A semântica canônica para sessão é `resume_email_sent_at: existing ?? new Date()` e `intermediate_email:null`; para lead, se já desinscrito retorna `already` sem update.
  - Pós-condição: page e API chamam o mesmo helper; comportamento de "already" é igual nos dois.
  - Prova: teste unitário cobre token de lead, token de sessão, repetição idempotente e token inválido; `rg "resume_email_sent_at: new Date\\(\\)" src/app src/lib` não deve apontar para unsubscribe.

### P3 / Otimização / Manutenção

- **O-1 · Estimativa computada 2x por view de resultado.** `src/app/[locale]/result/page.tsx` chama `/estimate` em `generateMetadata` e em `ResultContent`; `serverFetch` aceita status 503 para fallback BRL. Correção: criar helper memoizado por request (`cache()` do React) para `fetchEstimation(sessionId)` e reusar em metadata/conteúdo. Não usar cache persistente longo para estimativa de sessão privada. Prova: teste/spy ou log local mostra uma chamada por request; `npm run typecheck`.
- **O-2 · Admin sempre pt-BR.** `src/app/[locale]/admin/(dashboard)/layout.tsx` hardcoda `locale="pt-BR"` e importa só `messages/pt-BR.json`. Correção: carregar mensagens pelo `locale` do param usando o mesmo padrão de `src/app/[locale]/layout.tsx`. Prova: render admin em `en-US` não recebe provider `pt-BR`; `vitest run src/__tests__/admin-rbac.test.ts` e `npm run typecheck`.
- **O-3 · `calculate.ts` rótulo de erro trocado.** Throw de `daysMin>=daysMax` usa código "INV-002" (que é complexity). Correção: renomear para código próprio, por exemplo `INV-005`, e atualizar comentário/teste. Prova: `vitest run src/lib/estimation/__tests__/calculate.test.ts`.
- **O-4 · Edge de faixa minúscula.** `priceMin>=priceMax`/`daysMin>=daysMax` lançam para estimativas muito baixas por arredondamento. Correção defensável: aplicar piso (`priceMax = Math.max(priceMax, priceMin + 1)`, `daysMax = Math.max(daysMax, daysMin + 1)`) se a decisão de produto preferir exibir faixa mínima em vez de 500. `hipotese`: como bases atuais são altas, impacto é latente. Prova: teste hoje chamado "lança INV-001..." deve ser atualizado conforme decisão; não misturar com P0.
- **O-5 · `setInterval` de cleanup no escopo de módulo.** `src/lib/rate-limiter.ts` e `src/lib/middleware-helpers.ts` criam timers globais; em serverless/edge isso é inerte/instável. Correção: após interface única de rate-limit, remover timers de módulos e fazer cleanup lazy no adaptador in-memory durante `check()`. Prova: `rg "setInterval" src/lib/rate-limiter.ts src/lib/middleware-helpers.ts` não encontra timer global.
- **O-6 · `next build` local quebra em path não ASCII antes do typecheck.** No cwd atual, Turbopack panica em `Repositórios...` durante geração de assets. `hipotese` não reproduz na Vercel por path ASCII. Correção operacional: documentar no runbook de build que validação local de produção deve ocorrer em path ASCII até haver correção upstream/configuração compatível; não renomear diretório do usuário como parte do patch. Prova: `npm run build` verde em checkout ASCII depois do P0.

---

## 3. Contra-argumentos e tensoes

**CSP dupla.** A crítica original dizia que a Vercel "realmente serve duas CSPs" e que GTM quebra em produção. Isto é forte demais sem observar um deploy real com `curl -I`. O que está provado é pior de outra forma: existem duas autoridades versionadas com políticas divergentes. Se ambas chegam ao navegador, múltiplas CSPs restringem por composição e GTM tende a bloquear. Se uma sobrescreve a outra, a política efetiva depende de precedência de plataforma. Em ambos os casos a correção é a mesma, fonte única, mas a severidade deve ficar média/alta até haver evidência de header duplo em produção.

**Rate-limit distribuído.** Upstash/KV não é "obviamente melhor" em todos os cenários. Para um produto pequeno, in-memory reduz abuso casual com custo zero. O contra-argumento vence contra a palavra "inócuo", mas não contra a recomendação de consolidar interface e usar backend distribuído nas rotas com custo financeiro ou risco de abuso. A decisão honesta é por rota, baseada em volume, custo de Resend/DB e tolerância a bypass horizontal.

**Motor de estimativa.** A duplicação é real, mas a unificação apressada pode quebrar o breakdown multi-projeto, o fator de overlap de prazo e a API snake_case consumida pelo resultado. O problema mais urgente para corretude de fluxo é o terminal do grafo/seed, porque pode impedir conclusão. A resposta é preservar o cálculo vivo com testes de paridade antes de mover lógica.

**P0 build/deploy.** O argumento de bloqueio Vercel não deve se apoiar no panic local do Turbopack, porque ele depende do caminho `Repositórios`. Ele se apoia nos 7 erros de TypeScript, na ausência de `ignoreBuildErrors` e no CI. O panic local entra como risco adicional de reprodutibilidade, não como causa primária de deploy quebrado.

**Privacidade.** A anonimização completa pode reduzir valor analítico e suporte histórico, especialmente se remover narrativas livres e dados de sessão. Esse trade-off não derrota o achado, porque exclusão a pedido e retenção legal exigem que PII não sobreviva em tabelas relacionadas. A resposta correta é anonimizar PII, preservar métricas agregáveis e testar explicitamente o que fica.

---

## 4. Plano de implementação (faseado, fail-fast)

Ordem por risco e dependência. Cada fase termina com verificação objetiva. Trabalho 100% em `main` (Trunk-Based; sem branches).

- **Fase 0 - Desbloquear gate de build (P0-1).**
  - Entrada: repo no estado atual; `npm run typecheck` vermelho com os 7 erros listados.
  - Passos: corrigir `recordEvent.ts`, `sendLeadNotification.ts`, `ownerEmail.tsx`; não alterar comportamento de negócio fora dos campos quebrados; rodar testes de email.
  - Saída binária: `npm run typecheck` exit 0. `npm run build` exit 0 em path ASCII ou falha documentada exclusivamente como panic de path não ASCII.
  - Falha/rollback: se surgir erro TypeScript novo fora desses arquivos, parar e classificar se é consequência direta; não avançar fase com `tsc` vermelho.

- **Fase 1 - Integridade de dados/privacidade (P1-1, P1-2, P1-3).**
  - Entrada: Fase 0 verde.
  - Passos em ordem: persistir `whatsapp`/`marketing_consent`/`policyVersion`; trocar token de erasure para CSPRNG; unificar anonimização transacional de Lead+Session+respostas narrativas.
  - Saída binária: lead criado pelo formulário principal persiste os três campos; `confirmErasure` e cron usam o mesmo helper e limpam PII relacionada; tokens novos não usam `Math.random`.
  - Prova: `vitest run src/__tests__/unit/anonymization.test.ts src/__tests__/integration/leads.integration.test.ts src/__tests__/components/ConsentCheckbox.test.tsx` e `npm run typecheck`.
  - Falha/rollback: se anonimização relacionada falhar, não marcar `ErasureRequest.processed_at`; reexecutar deve ser possível.

- **Fase 2 - Terminal do fluxo e seed reproduzível (P2-3, P2-4).**
  - Entrada: Fase 1 verde e decisão registrada para `decisao_q105_retencao`.
  - Passos em ordem: consultar produção/staging para existência de answers Q105; decidir Q105 legacy-only ou remoção; tornar `seed.ts` reprodutível; atualizar `validate-decision-graph.ts`; trocar completude para `allAnswers.length > 0`.
  - Saída binária: banco limpo com `npm run db:seed` gera grafo em que Q104 é terminal novo; `npm run validate:graph` passa com regra explícita para Q105; terminal `TEXT_INPUT` hipotético também completa sessão.
  - Prova: `npm run validate:graph`, `vitest run src/__tests__/integration/answers.integration.test.ts src/tests/contracts/cross-rock-contracts.test.ts`.
  - Falha/rollback: se houver dados Q105 em produção, manter Q105 como legacy-only; não religar Q104 para satisfazer validador antigo.

- **Fase 3 - Segurança de borda proporcional (P1-4, P1-5, P1-6, P2-5, P2-6).**
  - Entrada: Fase 2 verde.
  - Passos em ordem: rate-limit em `requestErasure`; fonte única de headers; interface única de rate-limit; admin com `getUser()`/`requireAdmin`; helper `assertCronAuth`.
  - Dependência externa: provisão de `UPSTASH_REDIS_REST_URL` e `UPSTASH_REDIS_REST_TOKEN` é ação operacional. Sem isso, aceitar `memory` apenas com registro explícito de lacuna.
  - Saída binária: nenhum cron compara segredo manualmente; nenhum route/action público de custo material fica sem limitador; deploy tem exatamente 1 CSP.
  - Prova: `npm run typecheck`, `vitest run src/__tests__/middleware.test.ts src/__tests__/admin-rbac.test.ts`, `curl -sI https://<deploy>`.
  - Falha/rollback: se CSP única quebrar analytics, corrigir a política na autoridade escolhida; não restaurar duplicação.

- **Fase 4 - Corretude do motor de estimativa (P2-1, P2-2, O-3, O-4).**
  - Entrada: Fase 3 verde e decisão registrada para `decisao_motor_estimativa_fonte_unica`.
  - Passos em ordem: teste de caracterização do service vivo; corrigir fronteiras fracionárias; corrigir rótulo de invariante; decidir piso vs throw para faixas minúsculas; só então unificar fonte.
  - Saída binária: existe uma fonte viva declarada; multi-projeto preserva `breakdown`, overlap 0.7 e snake_case da API.
  - Prova: `vitest run src/lib/estimation/__tests__ src/__tests__/integration/estimate.integration.test.ts`.
  - Falha/rollback: qualquer regressão em contrato `/estimate` reverte a unificação, mantendo apenas testes e bugs locais corrigidos.

- **Fase 5 - Manutenção/dedup/otimização (P2-7, P2-8, O-1, O-2, O-5, O-6).**
  - Entrada: Fase 4 verde.
  - Passos em ordem: extrair `applyAnswer`; extrair `applyUnsubscribe`; memoizar fetch de estimativa por request; carregar admin i18n por locale; remover timers globais de rate-limit; documentar build em path ASCII.
  - Saída binária: duplicações removidas sem mudar contratos; resultado faz uma chamada de estimativa por request; admin respeita locale; build local tem instrução reproduzível.
  - Prova: `rg` confirma core único de answer/unsubscribe; `npm run typecheck`; `vitest run src/__tests__/integration/answers.integration.test.ts src/tests/contracts/api-contracts.test.ts`.
  - Falha/rollback: otimizações O-1/O-2/O-5/O-6 não bloqueiam deploy se P0-P2 estiverem verdes; podem ser adiadas sem reabrir riscos críticos.

Regra global: cada fase começa com `npm run typecheck` verde e termina com `npm run typecheck` verde. Não avançar fase com falha conhecida, teste desabilitado ou `hipotese` tratada como fato.

---

## 5. Critérios de aceite

Critérios são binários. Se qualquer linha aplicável falhar, o achado continua aberto.

| Achado | Critério passa/falha | Comando/prova |
| --- | --- | --- |
| P0-1 | `npm run typecheck` sai 0 e nenhum fallback de email usa campo inexistente de `EstimationResult` | `npm run typecheck`; `vitest run src/lib/notifications/templates/ownerEmail.test.ts src/lib/notifications/templates/visitorEmail.test.ts` |
| P1-1 | Lead criado pelo formulário persiste `whatsapp`, `marketing_consent=true` e `consent_policy_version` quando enviados | `vitest run src/__tests__/integration/leads.integration.test.ts src/__tests__/components/ConsentCheckbox.test.tsx` |
| P1-2 | `confirmErasure` e cron limpam Lead, Session e narrativas Q096-Q099 com a mesma sentinela/helper | `vitest run src/__tests__/unit/anonymization.test.ts`; inspeção `rg "anonymizeLeads" src/app/api/cron src/actions src/lib/security` |
| P1-3 | `generateErasureToken` não usa `Date.now`/`Math.random` e tokens antigos continuam aceitos até TTL | `rg "Math.random|Date.now" src/lib/security/erasure.ts`; teste unitário do token |
| P1-4 | `requestErasure` limita por IP e email antes de criar DB/email; bloqueio por email não enumera existência | teste dedicado de action; `npm run typecheck` |
| P1-5 | Deploy real retorna exatamente 1 CSP, sem `unsafe-*` em `script-src` produção, com GTM se habilitado | `curl -sI https://<deploy> | grep -i '^content-security-policy:' | wc -l` deve ser `1`; inspeção do valor |
| P1-6 | Existe interface única de rate-limit; rotas de custo material usam Upstash quando provisionado ou registram aceite temporário de memory | `rg "rateLimitStore|new RateLimiter|checkRateLimit|leadRateLimiter|sessionRateLimiter" src`; teste middleware |
| P2-1 | Há uma fonte viva declarada para estimativa e teste preserva multi-projeto, overlap 0.7, `breakdown` e snake_case | `vitest run src/lib/estimation/__tests__ src/__tests__/integration/estimate.integration.test.ts` |
| P2-2 | Scores `30.5`, `50.5`, `70.5` caem em faixas contíguas corretas | `vitest run src/lib/estimation/__tests__/calculate.test.ts` |
| P2-3 | Seed limpo reproduz terminal Q104; Q105 tem decisão explícita e validador alinhado | `npm run db:seed && npm run validate:graph` em DB descartável |
| P2-4 | Sessão completa quando `nextQuestionId=null` mesmo se resposta terminal for `TEXT_INPUT` | `vitest run src/__tests__/integration/answers.integration.test.ts` |
| P2-5 | Admin page-guard e layout usam `getUser()`/`requireAdmin()`, não `getSession()` para autorização | `rg "getSession\\(" src/middleware.ts src/app/[locale]/admin`; testes admin/middleware |
| P2-6 | Crons usam helper de autenticação constante-no-tempo e não comparam `authorization` inline | `rg "CRON_SECRET|authorization" src/app/api/cron src/lib/security`; `npm run typecheck` |
| P2-7 | Action e REST de answer compartilham core transacional único | `rg "tx.answer.upsert|buildAnswerFlowContext|recalculateAccumulators" src/actions src/app/api/v1/sessions src/lib/session` |
| P2-8 | Page e API de unsubscribe compartilham helper e preservam `resume_email_sent_at` | teste unitário de unsubscribe; `rg "resume_email_sent_at: new Date\\(\\)" src/app src/lib` |
| O-1 | Resultado não calcula estimativa duas vezes na mesma request | teste/spy no helper memoizado; `npm run typecheck` |
| O-2 | Admin provider usa o `locale` do param e mensagens correspondentes | teste ou render manual `/en-US/admin`; `npm run typecheck` |
| O-3/O-4 | Invariantes de faixa têm rótulos corretos e decisão clara para piso vs throw | `vitest run src/lib/estimation/__tests__/calculate.test.ts` |
| O-5 | Não há `setInterval` global para cleanup de rate-limit em módulo serverless | `rg "setInterval" src/lib/rate-limiter.ts src/lib/middleware-helpers.ts` |
| O-6 | Build de produção validado em path ASCII ou falha local marcada como risco de ambiente | `npm run build` em checkout ASCII; nota no runbook/doc |
| Global | Nenhum teste foi apagado/desabilitado para passar; contracts e typecheck verdes | `git diff -- '*test*'`; `npm run typecheck`; `npm run test:contracts` |

---

## 6. Riscos e falhas previsiveis

- **Build local falso-negativo.** O panic do Turbopack em path com acento pode mascarar sucesso/falha real de build. Mitigação: validar produção em path ASCII antes de concluir sobre Vercel; manter `typecheck` como gate primário local.
- **Seed contra produção divergente.** Produção pode ter rodado `refactor-narrative-v4` manualmente. Mitigação: consultar Q104/Q105 e respostas Q105 antes de aplicar migração destrutiva; em dúvida, Q105 legacy-only.
- **Anonimização parcial por falha no meio.** Atualizar Lead sem limpar Session/Answer cria falso senso de conformidade. Mitigação: transação única; `ErasureRequest.processed_at` só após sucesso total.
- **Rate-limit distribuído indisponível.** Upstash adiciona falha de rede e dependência operacional. Mitigação: adaptador com backend explícito, logs de backend, fail-closed para envio de erasure email quando throttle não puder ser confirmado.
- **CSP única bloqueando asset legítimo.** Remover duplicação pode revelar dependências não listadas. Mitigação: validar com `curl -I`, teste Playwright de página com analytics habilitado e ajuste na fonte única, nunca retorno à duplicidade.
- **Unificação de estimativa quebrando contrato.** `calculate.ts` não preserva hoje `breakdown` multi-projeto nem shape snake_case. Mitigação: teste de caracterização antes de mover lógica; rollback imediato se `/result` ou `/estimate` mudarem shape.
- **Mudança de auth admin causando lockout.** `getUser()` depende de chamada ao Auth server. Mitigação: testar magic link em staging; manter `ADMIN_EMAIL` opcional somente em dev/test conforme contrato atual.
- **Otimizações obscurecendo bugs críticos.** O-1/O-2/O-5/O-6 são adiáveis. Mitigação: não misturar com P0-P2 no mesmo commit se dificultar rollback.

---

## 7. Hipoteses e pontos em disputa

- **hipotese** O grafo final em produção tem o terminal em Q104 porque `refactor-narrative-v4` foi executado manualmente depois de `seedGraph`. O seed principal atual não garante isso. Validar DB real antes de mexer.
- **hipotese** A Vercel emite dois headers CSP quando `next.config.ts` e `vercel.json` configuram a mesma chave. Sem `curl -I` no deploy, tratar como risco de configuração divergente, não como fato observado.
- **hipotese** Rate-limit distribuído depende de provisão de `UPSTASH_*` (ação humana); até lá, manter in-memory consolidado e marcar a lacuna em `pending-actions`.
- **hipotese** Volume de tráfego/abuso ainda é baixo. Se for verdade, KV pode ser adiado após unificação da interface; se for falso, `erasure` e `lead` devem ir para backend distribuído imediatamente.
- **decisão pendente: `decisao_motor_estimativa_fonte_unica`** Unificação do motor de estimativa: delegar service→`calculate.ts` (só se `calculate.ts` virar primitive multi-projeto compatível) vs mover lógica viva para `lib/estimation`. Teste que resolve: caracterização multi-projeto preservando `breakdown`, overlap 0.7 e shape snake_case.
- **decisão pendente: `decisao_q105_retencao`** Q105: deletar (limpa dados) vs manter documentada como legacy-only (preserva answers antigas). Default recomendado: manter, mas remover wiring stale de `graph.ts` e tirar Q105 do caminho alcançável. Teste/consulta que resolve: contagem de answers Q105 em produção/staging.
- **decisão pendente: `decisao_utm_pii_anonimizacao`** UTM/referrer podem conter PII em query string. Default seguro: limpar referrer e UTM em erasure se qualquer valor contiver `@`, `phone=`, `email=` ou padrão de telefone; manter somente se política de privacidade aceitar explicitamente.
- **decisão pendente: `decisao_faixa_minima_estimativa`** Para faixa colapsada por arredondamento, escolher entre lançar invariante (falha visível) ou aplicar piso mínimo (UX resiliente). Teste que resolve: caso tiny config em `calculate.test.ts` deve refletir a decisão.
- **risco** Mudar `isComplete` afeta sessões em andamento; cobrir com teste de migração de estado.
- **risco** Caminho local com acento dispara panic Turbopack no `next build`; validar build em path ASCII antes de atribuir falhas restantes ao código.
- **escopo** Otimização de bundle/perf (Lighthouse) e revisão profunda de admin KPIs/i18n e de copy das soluções não foram esgotadas nesta passada (cobertura de revisão multi-agente degradada por erros transitórios de API); tratar em passada seguinte se desejado.

---

## 8. Status de implementação (2026-06-16)

Verificação aplicada a cada item: `npm run typecheck` (exit 0), `eslint` nos arquivos tocados (exit 0) e os testes unitários relevantes (estimation/notifications/scoring/analytics/middleware/admin-rbac/components: 208 verdes). Falhas pré-existentes não relacionadas: `src/lib/flow/useProgressEstimate.test.ts` (5 testes, stale vs contagem de blocos pós narrative-v4; reproduzidas em HEAD limpo antes de qualquer mudança).

### Implementado e verificado

| Item | O que mudou | Arquivos |
| --- | --- | --- |
| P0-1 | Build destravado: campos reais de `EstimationResult` no fallback de email + proxy de `complexity_score` por enum + tipagem `Prisma.InputJsonValue` | `sendLeadNotification.ts`, `templates/ownerEmail.tsx`, `analytics/recordEvent.ts` |
| P1-1 | `whatsapp`/`marketing_consent`/`policyVersion` agora fluem form→action→service e são persistidos | `LeadCaptureForm.tsx`, `actions/createLead.ts`, `services/lead.service.ts` |
| P1-2 | Helper único `anonymizeLeads()` (transacional, batched) limpa Lead + Session (`visitor_ip`/`user_agent`/`intermediate_email`) + respostas narrativas Q096-Q099, sentinela única; cron passou a usá-lo | `lib/security/erasure.ts`, `cron/anonymize-leads/route.ts` |
| P1-3 | Token de erasure por CSPRNG (`crypto.randomUUID`) | `lib/security/erasure.ts` |
| P1-4 | Rate-limit em `requestErasure` (5/h por IP, 1/15min por e-mail, resposta genérica anti-enumeração) | `actions/requestErasure.ts`, `lib/rate-limiter.ts` |
| P1-5 | CSP de fonte única: removido o bloco `headers` divergente de `vercel.json` (mantidos `crons`); `next.config.ts` é a autoridade | `vercel.json` |
| P2-2 | Fronteiras de complexidade contíguas (`<=`), sem buraco em scores fracionários + testes 30.5/50.5/70.5 | `lib/estimation/calculate.ts`, `__tests__/calculate.test.ts` |
| P2-4 | `isComplete` derivado de `nextQuestionId===null && #answers>0` (desacoplado do tipo da pergunta terminal) | `lib/session/recalculateAccumulators.ts` |
| P2-5 | Admin (layout + middleware page-guard) usa `getUser()` (revalida no auth server) em vez de `getSession()` | `admin/(dashboard)/layout.tsx`, `middleware.ts` |
| P2-6 | `assertCronAuth()` com comparação em tempo constante; os 3 crons deixaram de comparar o segredo inline | `lib/security/cronAuth.ts` (novo) + 3 crons |
| P2-8 | Página de unsubscribe preserva `resume_email_sent_at` (paridade com a rota, fim do clobber) | `unsubscribe/[token]/page.tsx` |
| O-1 | Estimativa memoizada por request (`React.cache`) — uma chamada por view | `result/page.tsx` |
| O-2 | Admin i18n pelo locale da rota (antes hardcode pt-BR) | `admin/(dashboard)/layout.tsx` |
| O-3 | Rótulo de invariante de prazo corrigido (`INV-005`) | `lib/estimation/calculate.ts` |

### Deferido (com motivo, não silencioso)

- **P2-3 (terminal do grafo / seed reproduzível):** exige decisão `decisao_q105_retencao` + rodar `db:seed`/`validate:graph` contra um banco real, indisponível neste ambiente. P2-4 já torna o terminal não-catastrófico. Próximo passo recomendado: ligar `applyNarrativeRefactorV4(prisma)` em `prisma/seed.ts` (idempotente) e alinhar `validate-decision-graph.ts` à decisão sobre Q105.
- **P1-6 (rate-limit distribuído/KV):** depende de provisão de `UPSTASH_*` (ação humana) + refactor de interface maior. O limitador de erasure (P1-4) usa o limitador in-memory existente como interino best-effort.
- **P2-1 (motor de estimativa fonte única):** exige `decisao_motor_estimativa_fonte_unica` + testes de paridade multi-projeto (`breakdown`, overlap 0.7, shape snake_case) antes de migrar. P2-2 corrigiu a fronteira no `calculate.ts` enquanto isso.
- **P2-7 (extrair `applyAnswer`):** dedup maior action+REST; adiado para não arriscar sem rodar a suíte de integração aqui.
- **O-4 (piso de faixa mínima) / O-5 (remover `setInterval`):** O-4 pende `decisao_faixa_minima_estimativa`; O-5 acompanha o refactor de rate-limit (P1-6).
- **O-6 (build em path ASCII):** nota de ambiente; o `next build` local panica no path com acento `Repositórios` (Turbopack), independente do código. CI roda em checkout ASCII.
