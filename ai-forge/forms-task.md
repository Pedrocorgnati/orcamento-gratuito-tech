# Forms Task List — budget-free-tech

**Data:** 2026-03-24
**Scope:** Acessibilidade de inputs, UX de validação, mensagens de feedback, limpeza de código.

---

## Auditoria Phase 1

### Formulários identificados

| Formulário | Biblioteca | Localização |
|-----------|-----------|-------------|
| LeadCaptureForm | react-hook-form + Zod | `src/components/lead/LeadCaptureForm.tsx` |
| InlineEmailCapture | react-hook-form + Zod | `src/components/flow/InlineEmailCapture.tsx` |
| MagicLinkForm | Server Action + useTransition | `src/app/[locale]/admin/_components/MagicLinkForm.tsx` |
| Logout form | Native HTML POST | `src/app/[locale]/admin/page.tsx` |

### Notas positivas (sem alteração necessária)

- `Input.tsx` — base component com `useId()`, `aria-invalid`, `aria-describedby`, `role="alert"` ✅
- `LeadCaptureForm` — `mode: 'onBlur'`, `zodResolver`, `noValidate`, `aria-label` no `<form>`, `aria-busy` no botão, spinner `aria-hidden="true"` ✅
- `ConsentCheckbox` — `aria-invalid`, `aria-describedby`, `sr-only` hint, `label[htmlFor]` vinculada corretamente ✅
- `MagicLinkForm` — `useTransition`, `aria-live="polite"`, `aria-busy` no botão ✅
- `HoneypotField` — `aria-hidden="true"`, `tabIndex={-1}`, posicionado fora da tela ✅

---

## Tasks Executadas

### T001 – InlineEmailCapture: label, mode e mensagens de toast [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar: `src/components/flow/InlineEmailCapture.tsx`

**Descrição:**
Três problemas no mesmo componente:
1. **F001 (CRÍTICO)**: email input sem `<label>` associada nem `aria-label` — viola WCAG 1.3.1/4.1.2. Screen readers não conseguem identificar o campo.
2. **F002 (MÉDIO)**: `useForm` sem `mode: 'onBlur'` — validação só dispara no submit, prejudicando UX.
3. **F003 (MÉDIO)**: `toast.error(t.title)` e `toast.success(t.title)` usam a string da pergunta ("Quer receber o resultado por e-mail?") como mensagem de toast — confuso para o utilizador.

**Mudanças:**
- Adicionado `<label htmlFor="inline-email">` visível via `sr-only` (label semântica sem impacto visual)
- `id="inline-email"` no input
- `mode: 'onBlur'` no `useForm`
- Strings `successMessage` e `errorMessage` adicionadas ao `STRINGS` object
- `toast.success(t.successMessage)` / `toast.error(t.errorMessage)`

---

### T002 – LeadCaptureForm: prop unused, reValidateMode, duplicate _hp [COMPLETED]

**Tipo:** PARALLEL-GROUP-1
**Dependências:** none
**Arquivos:** modificar: `src/components/lead/LeadCaptureForm.tsx`

**Descrição:**
Três problemas menores no LeadCaptureForm:
1. **F004 (BAIXO)**: `thankYouHref: string` declarada na interface `LeadCaptureFormProps` mas nunca usada no corpo do componente (redirect é feito server-side em `createLead`).
2. **F005 (BAIXO)**: `reValidateMode` não explícito — default `onChange` não documentado. Boa prática: declarar `reValidateMode: 'onChange'` explicitamente para fazer intenção clara.
3. **F006 (BAIXO)**: `_hp` registrado duplamente — `HoneypotField` já faz `{...register('_hp')}` e o form tem um `<input type="hidden" {...register('_hp')} />` adicional redundante. React-hook-form aceita, mas cria dois inputs com o mesmo nome.

**Mudanças:**
- Removido `thankYouHref` da interface e do uso em `lead-capture/page.tsx`
- `reValidateMode: 'onChange'` adicionado explicitamente ao `useForm`
- Removido `<input type="hidden" {...register('_hp')} />` redundante (linhas 281)
