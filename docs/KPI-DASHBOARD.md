# KPI Dashboard — Budget Free Engine

**Módulo:** module-16-seo-analytics
**Versão:** 1.0

## KPIs de Sucesso

| KPI     | ID      | Meta           | Cálculo                                    | Status |
|---------|---------|----------------|--------------------------------------------|--------|
| Taxa de Conclusão | INT-097 | >= 35% | COMPLETED / (ACTIVE+COMPLETED+ABANDONED) | Pendente |
| Taxa de Conversão | INT-098 | >= 20% | leads / COMPLETED sessions | Pendente |
| Leads A/B | INT-099 | >= 60% | leads score A/B / total leads | Pendente |
| Tempo Médio | INT-100 | < 5 min | avg(updated_at - created_at) COMPLETED | Pendente |
| Acurácia Estimativa | INT-024 | >= 70% | accuracy_feedback=true / total avaliados | V2 |

## Checklist de Entregáveis

- [ ] `app/sitemap.ts` — 12 URLs (4 locales × 3 rotas)
- [ ] `app/robots.ts` — Disallow /admin, /result, /lead-capture
- [ ] `src/lib/analytics/events.ts` — 19 eventos sem PII
- [ ] `public/og-image.jpg` — 1200×630px placeholder
- [ ] Metadata em 5 rotas públicas
- [ ] JSON-LD em / e /flow
- [ ] KPI cards no admin panel (V1 — implementação das queries)
- [ ] Consent gate: sem track se COOKIE_CONSENT não definido

## Notas de Implementação

- `accuracy_feedback` campo `Boolean?` adicionado ao modelo Lead (migration v16)
- KPICards componente agendado para F7 manual (backend-only mode)
- SessionStatus values: `active`, `completed`, `abandoned` (lowercase no schema)
