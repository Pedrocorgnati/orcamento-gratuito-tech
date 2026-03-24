# TypeScript Task List — budget-free-tech

**Data:** 2026-03-24
**Scope:** Remoção de `as any`, tipagem explícita de `catch`, `noUncheckedIndexedAccess`, barrel export `src/types/index.ts`.

---

## Auditoria Phase 1

### `tsc --noEmit`
**Resultado:** ✅ PASSOU — 0 erros.

### `as any` em produção
- 1 ocorrência: `src/components/result/ScopeStoryCard.tsx:142`
- Todos os demais `as any` estão em test files (excluídos do tsconfig)

### `catch (err)` sem `: unknown`
9 arquivos com `catch (err)` sem anotação explícita (TypeScript `strict` infere `unknown` internamente, mas a anotação explícita é boa prática e documenta a intenção):
- `src/actions/auth.ts:119`
- `src/actions/answer.ts:199`
- `src/app/api/v1/sessions/route.ts:88`
- `src/app/api/v1/sessions/[id]/answers/route.ts:246`
- `src/app/api/v1/sessions/[id]/route.ts:72`
- `src/app/api/v1/admin/leads/route.ts:47`
- `src/app/api/v1/sessions/[id]/estimate/route.ts:69`
- `src/app/api/auth/callback/route.ts:35`
- `src/app/api/v1/sessions/[id]/email/route.ts:84`

### Notas positivas (sem alteração necessária)
- `useRef(false)` — infere `boolean` corretamente ✅
- `estimation.service.ts` — `catch (err: unknown)` + `err as { code?: string }` — padrão correto ✅
- `params: Promise<{...}>` — todas as pages tipadas corretamente ✅
- `generateMetadata` retorna `Promise<Metadata>` em todas as pages ✅
- Sem `@ts-ignore` nem `@ts-expect-error` em todo o codebase ✅
- `src/lib/types.ts` — utility types (`Nullable<T>`, `Optional<T>`, etc.) bem estruturados ✅
- `src/lib/errors.ts` — `ERROR_CODES as const`, `ErrorCode` type — bem estruturado ✅
- `tsconfig.json` — `strict: true`, `noImplicitAny`, `strictNullChecks` habilitados ✅

---

## Tasks Executadas

### T001 – ScopeStoryCard.tsx: remover `as any` em `tExtra(featureKey)` [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar: `src/components/result/ScopeStoryCard.tsx`

**Descrição:** `featureKey` é `string` (vem de `COMPLEMENTARY_FEATURES: Record<string, string[]>`), mas `tExtra` de `useTranslations('result_extra')` aceita apenas chaves tipadas do namespace. Solução: tipar `COMPLEMENTARY_FEATURES` com `as const` e extrair `ComplementaryFeatureKey` como union type dos valores.

**Mudanças:**
- `COMPLEMENTARY_FEATURES` convertido para `as const satisfies Record<string, readonly string[]>`
- Tipo `ComplementaryFeatureKey` extraído como `(typeof COMPLEMENTARY_FEATURES)[keyof typeof COMPLEMENTARY_FEATURES][number]`
- `complementaryFeatures` tipado como `ComplementaryFeatureKey[]`
- `tExtra(featureKey as any)` → `tExtra(featureKey)`

---

### T002 – Catch blocks: adicionar `: unknown` em 9 arquivos [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar:
- `src/actions/auth.ts`
- `src/actions/answer.ts`
- `src/app/api/v1/sessions/route.ts`
- `src/app/api/v1/sessions/[id]/answers/route.ts`
- `src/app/api/v1/sessions/[id]/route.ts`
- `src/app/api/v1/admin/leads/route.ts`
- `src/app/api/v1/sessions/[id]/estimate/route.ts`
- `src/app/api/auth/callback/route.ts`
- `src/app/api/v1/sessions/[id]/email/route.ts`

**Descrição:** `catch (err)` sem anotação explícita. Com `strict: true` o TypeScript já infere `unknown` internamente, mas a anotação `catch (err: unknown)` documenta a intenção e habilita o linter a impor esse padrão futuramente.

**Mudanças:** `catch (err)` → `catch (err: unknown)` em todos os 9 arquivos.

---

### T003 – tsconfig: `noUncheckedIndexedAccess` [NÃO APLICADO — INCREMENTAL]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** `tsconfig.json`

**Descrição:** `noUncheckedIndexedAccess` não está habilitado. Ao tentar habilitá-lo, introduziu 50+ erros em `privacy/page.tsx`, `LanguageSelector.tsx`, `middleware-helpers.ts`, `useProgressEstimate.ts`, `sendLeadNotification.ts`, etc. — o codebase existente não foi projetado para esse nível de rigor.

**Decisão:** Não aplicado para manter build verde. Habilitar incrementalmente: corrigir arquivo por arquivo e adicionar ao tsconfig apenas quando o count de erros for zero.

---

### T004 – `src/types/index.ts`: criar barrel export [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** criar: `src/types/index.ts`

**Descrição:** `src/types/` contém `messages.d.ts` e `supabase.ts` sem re-export centralizado. Criar barrel `index.ts`.
