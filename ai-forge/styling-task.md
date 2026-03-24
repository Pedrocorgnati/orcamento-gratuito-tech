# Styling Task List — budget-free-tech

**Data:** 2026-03-24
**Scope:** Admin panel + shared UI components — migration from hardcoded Tailwind gray classes + manual `dark:*` overrides to CSS variable token system.

---

## Tokens Correctamente Usados (sem alteração necessária)

- `globals.css` — sistema de tokens `:root` + `.dark` completo. ✅
- `Button.tsx` — usa `cva` + tokens. ✅
- `ScoreBadge.tsx` — cores semânticas A/B/C (green/yellow/red) mantidas intencionalmente. ✅
- `KPICards.tsx` (status cards) — cores `border-green-500`, `border-yellow-500`, `border-red-500` para ok/warning/error são semânticas. ✅

---

## Tasks Executadas

### T001 – Input.tsx: remover dark: overrides e migrar para tokens [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar: `src/components/ui/Input.tsx`

**Descrição:** 6 classes `dark:*` manuais removidas. Todas as cores estruturais migradas para tokens.
**Mudanças:**
- `bg-white dark:bg-gray-800` → `bg-(--color-background)`
- `border-gray-300 dark:border-gray-600` → `border-(--color-border)`
- `text-gray-900 dark:text-white` → `text-(--color-text-primary)`
- `placeholder:text-gray-400 dark:placeholder:text-gray-500` → `placeholder:text-(--color-text-muted)`
- `border-red-500 focus:ring-red-500` → `border-(--color-danger) focus:ring-(--color-danger)`
- `text-red-600 dark:text-red-400` → `text-(--color-danger)`
- `disabled:bg-gray-50 dark:disabled:bg-gray-700` → `disabled:bg-(--color-surface)`
- `disabled:text-gray-400 dark:disabled:text-gray-500` → `disabled:text-(--color-text-secondary)`
- `focus:ring-blue-500` → `focus:ring-(--color-primary)`

---

### T002 – EmptyState.tsx: migrar hardcoded grays [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar: `src/components/ui/EmptyState.tsx`

**Descrição:** Classes `dark:text-gray-100`, `dark:text-gray-400` removidas. Grays estruturais migrados.
- `text-gray-500 dark:text-gray-400` (ícone) → `text-(--color-text-muted)`
- `text-gray-900 dark:text-gray-100` → `text-(--color-text-primary)`
- `text-gray-500 dark:text-gray-400` (descrição) → `text-(--color-text-secondary)`

---

### T003 – LeadsTable.tsx: migrar estrutura da tabela para tokens [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar: `src/components/admin/LeadsTable.tsx`

**Descrição:** 10 edições. Todas as cores estruturais da tabela migradas.
**Mantido:** estado de erro (red) como semântico.

---

### T004 – KPICards.tsx: migrar heading section [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar: `src/components/admin/KPICards.tsx`

**Descrição:** Heading `text-gray-500` → `text-(--color-text-secondary)`.

---

### T005 – Pagination.tsx: migrar para tokens [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar: `src/components/admin/Pagination.tsx`

**Descrição:** Container, texto e botões migrados para tokens via replace_all.

---

### T006 – AdminDashboardLayout: bg-gray-50 → bg-(--color-surface) [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar: `src/app/[locale]/admin/(dashboard)/layout.tsx`

**Descrição:** `bg-gray-50` → `bg-(--color-surface)` (correspondência exata de hex).

---

### T007 – Filters.tsx: FILTER_INPUT_CLASS migrar para tokens [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar: `src/components/admin/Filters.tsx`

**Descrição:** Constante `FILTER_INPUT_CLASS` migrada. Chip colors A/B/C mantidos (semânticos).

---

## Bugs corrigidos durante build

- `src/components/flow/QuestionTransition.tsx:4` — import com sintaxe inválida (`SESSION_SESSION_STORAGE_KEYS.FLOW_NAV_DIRECTIONS`) corrigido para `SESSION_STORAGE_KEYS`.
- `src/app/[locale]/flow/[questionId]/page.tsx:86` — `serverFetch<Record<string, unknown>>` tipado com shape correto para satisfazer `QuestionData`.
