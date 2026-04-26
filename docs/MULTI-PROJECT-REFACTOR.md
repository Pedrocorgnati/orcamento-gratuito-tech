# Multi-Project Refactor

## Visão Geral

Q001 passou a aceitar múltiplos tipos de projeto. A engine agora monta uma fila de blocos de escopo, percorre cada bloco selecionado na ordem canônica e soma a estimativa final por tipo.

## Diagrama Da Fila

```text
Q001 (MULTIPLE_CHOICE)
  -> project_types[]
  -> pending_blocks[]
  -> current_block
  -> Q005

Q005
  -> dynamic_next baseado em current_block
  -> primeira pergunta do bloco atual

fim de bloco
  -> end_of_block = true
  -> remove pending_blocks[0]
  -> current_block = pending_blocks[0] seguinte
  -> próxima pergunta = primeira do novo bloco

fila vazia
  -> isComplete = true
```

Ordem canônica:

```text
WEBSITES -> ECOMMERCE -> MARKETPLACE -> WEB_SYSTEM -> CRYPTO -> MOBILE_APP -> AUTOMATION_AI -> BROWSER_EXT -> CONTEXT -> LEAD
```

## Mapeamento Tipo -> Bloco

| Opção Q001 | ProjectType | Bloco |
| --- | --- | --- |
| Website Institucional | `WEBSITE` | `WEBSITES` |
| Landing Page | `WEBSITE` | `WEBSITES` |
| E-commerce / Loja Virtual | `ECOMMERCE` | `ECOMMERCE` |
| Sistema Web / Aplicação Web | `WEB_APP` | `WEB_SYSTEM` |
| App Mobile | `MOBILE_APP` | `MOBILE_APP` |
| Automação e IA | `AUTOMATION_AI` | `AUTOMATION_AI` |
| Marketplace | `MARKETPLACE` | `MARKETPLACE` |
| Plataforma Crypto / Web3 | `CRYPTO` | `CRYPTO` |
| Extensão de Browser | `BROWSER_EXT` | `BROWSER_EXT` |

## Pricing Multi-Type

Fórmula aplicada:

```text
para cada project_type selecionado:
  complexity_do_tipo = soma da complexidade das respostas do bloco daquele tipo
  multiplier_do_tipo = pricing_config(project_type, complexity_do_tipo)
  base_ajustada_do_tipo = base_price * multiplier_do_tipo
  dias_base_ajustados_do_tipo = base_days * multiplier_do_tipo

price_total_base = soma(base_ajustada_do_tipo)
days_total_base = soma(dias_base_ajustados_do_tipo)

price_total = price_total_base + accumulated_price_compartilhado
days_total = (days_total_base * overlap_factor) + accumulated_time_compartilhado

overlap_factor = 0.7 quando há mais de um tipo
```

Observações:

- `accumulated_*_compartilhado` considera respostas fora dos blocos tipados, como `PROJECT_TYPE` e `CONTEXT`.
- `project_type` continua sendo mantido como compatibilidade e recebe o primeiro item de `project_types`.
- `features[]` e `scope_story` consolidam todos os tipos selecionados.

## Teste Manual

1. Aplicar a migration SQL.
2. Rodar o script `prisma/seeds/refactor-multi-project-v3.ts`.
3. Iniciar uma sessão nova e selecionar apenas um tipo antigo em `Q001`.
4. Confirmar que o fluxo single-type continua navegando normalmente.
5. Iniciar outra sessão e selecionar `Website + App Mobile + Automação e IA`.
6. Confirmar que `Q005` leva ao bloco `WEBSITES` e que os blocos seguintes seguem a fila canônica.
7. Verificar no banco que a sessão salvou `project_types`, `pending_blocks` e `current_block`.
8. Finalizar o fluxo e abrir `/result`.
9. Confirmar que a página mostra o resumo combinado e o breakdown por tipo.
10. Reexecutar o script v3 e validar que não houve duplicação de opções, perguntas, traduções ou pricing configs.
