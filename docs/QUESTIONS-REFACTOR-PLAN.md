# Questions Refactor Plan

## Triagem das perguntas atuais

| Code | Decisão | Justificativa | Categoria |
| --- | --- | --- | --- |
| Q001 | MANTER | Define o branch do fluxo e o baseline técnico do orçamento. | (A) escopo |
| Q005 | EDITAR | Continua útil para qualificação comercial, mas com impactos técnicos zerados. | (B) lead |
| Q010 | MANTER | Quantidade de páginas altera esforço de UX, conteúdo e implementação. | (A) escopo |
| Q011 | EDITAR | Reposicionada para modelo de CMS, cobrindo melhor operação editorial real. | (A) escopo |
| Q012 | MANTER | Formulários e CRM ainda são multiplicadores claros de integração e front-end. | (A) escopo |
| Q013 | MANTER | Multilíngue continua sendo expansão real de conteúdo, navegação e manutenção. | (A) escopo |
| Q014 | MANTER | Motion e efeitos especiais continuam alterando esforço de front-end e QA. | (A) escopo |
| Q020 | MANTER | Volume de SKUs segue sendo um multiplicador estrutural de busca, catálogo e performance. | (A) escopo |
| Q021 | EDITAR | Reorientada para cobertura real de meios de pagamento aceitos no checkout. | (A) escopo |
| Q022 | MANTER | Integração ERP/estoque continua impactando arquitetura e operação. | (A) escopo |
| Q023 | MANTER | Área logada do cliente adiciona autenticação, histórico e regras de negócio. | (A) escopo |
| Q024 | MANTER | Promoções/fidelidade seguem adicionando engine de regras e comportamento comercial. | (A) escopo |
| Q030 | MANTER | Autenticação e RBAC continuam sendo núcleo de complexidade do sistema web. | (A) escopo |
| Q031 | MANTER | Dashboards e relatórios seguem aumentando modelagem, queries e visualização. | (A) escopo |
| Q032 | MANTER | Número de integrações externas segue sendo multiplicador técnico direto. | (A) escopo |
| Q033 | MANTER | Upload/processamento de arquivos continua alterando storage, filas e validação. | (A) escopo |
| Q034 | MANTER | Notificações multi-canal seguem aumentando integrações e orquestração. | (A) escopo |
| Q035 | MANTER | Financeiro/faturamento segue sendo um dos maiores aumentadores de risco técnico. | (A) escopo |
| Q036 | MANTER | Offline/PWA ainda altera arquitetura, sincronização e testes. | (A) escopo |
| Q037 | MANTER | Tempo real continua sendo um multiplicador relevante de infra e consistência. | (A) escopo |
| Q038 | MANTER | Busca avançada continua afetando indexação, engine e UX. | (A) escopo |
| Q039 | EDITAR | Mantida, mas ampliada para cobrir multi-cliente e white-label de forma explícita. | (A) escopo |
| Q040 | MANTER | Auditoria/logs seguem relevantes para rastreabilidade e conformidade operacional. | (A) escopo |
| Q041 | MANTER | Exportação continua sendo funcionalidade de produto com esforço mensurável. | (A) escopo |
| Q045 | MANTER | Plataformas alvo continuam sendo multiplicador primário de esforço mobile. | (A) escopo |
| Q046 | EDITAR | Mantida, mas com wording técnico mais claro entre cross-platform e nativo. | (A) escopo |
| Q047 | MANTER | Push continua sendo integração mobile relevante de engajamento. | (A) escopo |
| Q048 | MANTER | Offline mobile continua sendo um multiplicador forte de sincronização e QA. | (A) escopo |
| Q049 | MANTER | Acesso a hardware continua sendo aumento objetivo de esforço nativo. | (A) escopo |
| Q050 | MANTER | Tipo de automação/IA ainda define macroescopo técnico do branch. | (A) escopo |
| Q051 | MANTER | Fonte de dados continua impactando ingestão, integração e preparo. | (A) escopo |
| Q052 | MANTER | Forma de integração da IA continua mudando bastante o desenho da solução. | (A) escopo |
| Q090 | EDITAR | Continua útil para score/comercial, mas com impactos técnicos totalmente zerados. | (B) lead |
| Q091 | EDITAR | Continua útil para roteamento comercial e urgência, sem mexer no baseline técnico. | (B) lead |
| Q092 | MANTER | Estado do design ainda altera discovery, UI e tempo de implementação. | (A) escopo |
| Q093 | EDITAR | Repurpose para documentação/handoff/treinamento, que é escopo transversal real. | (A) escopo |
| Q100 | MANTER | Dado essencial de contato para captura e follow-up comercial. | (B) lead |
| Q101 | MANTER | Canal principal de entrega da estimativa e do contato comercial. | (B) lead |
| Q102 | MANTER | Telefone melhora cadência comercial e roteamento de follow-up. | (B) lead |
| Q103 | MANTER | Empresa ajuda qualificação do lead e contextualização da proposta. | (B) lead |
| Q104 | MANTER | Canal de aquisição continua sendo lead qualifier puro, sem impacto técnico. | (B) lead |
| Q105 | MANTER | Campo livre continua útil para contexto comercial e exceções de escopo. | ambas |

## Adições propostas

| Novo code | Bloco | Type | Title pt-BR | Motivo | Categoria | Impactos estimados (price/time/complexity/weight) |
| --- | --- | --- | --- | --- | --- | --- |
| Q015 | WEBSITES | SINGLE_CHOICE | Qual profundidade de SEO técnico o site precisa ter? | Gap explícito de SEO técnico no branch de websites. | (A) escopo | `0/0/0/1.0` até `1800/14/22/1.2` |
| Q016 | WEBSITES | SINGLE_CHOICE | Quais analytics, pixels ou tags o site precisa ter? | Gap explícito de analytics/pixels e tracking de conversão. | (A) escopo | `0/0/0/1.0` até `1200/7/12/1.12` |
| Q017 | WEBSITES | SINGLE_CHOICE | Qual meta de performance o site precisa atingir? | Gap explícito de performance/PageSpeed/Core Web Vitals. | (A) escopo | `0/0/0/1.0` até `2500/14/22/1.2` |
| Q025 | ECOMMERCE | SINGLE_CHOICE | Como o cálculo de frete deve funcionar? | Gap explícito de frete/transportadora/Correios. | (A) escopo | `0/0/0/1.0` até `2500/14/30/1.2` |
| Q026 | ECOMMERCE | SINGLE_CHOICE | Qual nível de fiscal e tributação a loja precisa suportar? | Gap explícito de NF-e/SPED/tributação. | (A) escopo | `0/0/0/1.0` até `7000/45/60/1.45` |
| Q027 | ECOMMERCE | SINGLE_CHOICE | A loja precisa integrar com marketplaces? | Gap explícito de marketplaces e sync operacional. | (A) escopo | `0/0/0/1.0` até `4500/30/45/1.3` |
| Q042 | WEB_SYSTEM | SINGLE_CHOICE | Qual volume de usuários simultâneos o sistema deve suportar? | Gap explícito de concorrência e escala. | (A) escopo | `0/0/0/1.0` até `4000/21/35/1.25` |
| Q043 | WEB_SYSTEM | SINGLE_CHOICE | Há exigências de compliance, privacidade ou segurança formal? | Gap explícito de LGPD/SOC2/security posture. | (A) escopo | `0/0/0/1.0` até `6000/30/50/1.35` |
| Q044 | WEB_SYSTEM | SINGLE_CHOICE | Qual nível de backup e disaster recovery é esperado? | Gap explícito de backup/restore/DR. | (A) escopo | `0/0/0/1.0` até `3500/21/35/1.2` |
| Q053 | MOBILE_APP | SINGLE_CHOICE | Vocês precisam de apoio para publicação nas lojas? | Gap explícito de Apple/Google store ops. | (A) escopo | `0/0/0/1.0` até `1800/10/15/1.1` |
| Q054 | MOBILE_APP | SINGLE_CHOICE | O app precisa de deep linking ou universal links? | Gap explícito de deep linking/universal links. | (A) escopo | `0/0/0/1.0` até `2200/14/25/1.2` |
| Q055 | MOBILE_APP | SINGLE_CHOICE | Qual nível de analytics e crash reporting o app precisa? | Gap explícito de Firebase/Mixpanel/crash reporting. | (A) escopo | `0/0/0/1.0` até `1800/10/18/1.15` |
| Q060 | AUTOMATION_AI | SINGLE_CHOICE | Qual volume de dados a solução precisa processar? | Gap explícito de volume de dados para IA/automação. | (A) escopo | `0/0/0/1.0` até `5000/21/40/1.3` |
| Q061 | AUTOMATION_AI | SINGLE_CHOICE | Com que frequência o processamento deve acontecer? | Gap explícito de batch vs real-time. | (A) escopo | `0/0/0/1.0` até `3500/14/30/1.2` |
| Q062 | AUTOMATION_AI | SINGLE_CHOICE | Qual estratégia de modelo ou provedor de IA é esperada? | Gap explícito de OpenAI/Anthropic/self-hosted/fallback. | (A) escopo | `0/0/0/1.0` até `5000/21/45/1.3` |
| Q063 | AUTOMATION_AI | SINGLE_CHOICE | Qual governança de custo e volume de chamadas de IA vocês esperam? | Gap explícito de budget de API calls e observabilidade de uso. | (A) escopo | `0/0/0/1.0` até `2500/10/25/1.18` |
| Q094 | CONTEXT | SINGLE_CHOICE | Qual nível de testes automatizados é esperado? | Gap transversal explícito de testes automatizados. | (A) escopo | `0/0/0/1.0` até `6000/30/45/1.3` |
| Q095 | CONTEXT | SINGLE_CHOICE | Qual nível de code review e CI/CD deve fazer parte da entrega? | Gap transversal explícito de review/pipeline/deploy. | (A) escopo | `0/0/0/1.0` até `3000/14/25/1.18` |

## Notas de estimativa

As faixas novas foram ancoradas nas perguntas irmãs do mesmo bloco. Fiscal/compliance/self-hosted/multi-marketplace ficaram nas bandas altas por aumentarem risco, homologação e operação; analytics/publicação/pixels/deep linking ficaram nas bandas médias por serem integrações pontuais porém mensuráveis.

## Resumo

Resumo: 34 manter, 8 editar, 0 remover, 18 adicionar.

Cobertura por bloco após mudanças:

- `PROJECT_TYPE`: 2 perguntas
- `WEBSITES`: 8 perguntas
- `ECOMMERCE`: 8 perguntas
- `WEB_SYSTEM`: 15 perguntas
- `MOBILE_APP`: 8 perguntas
- `AUTOMATION_AI`: 7 perguntas
- `CONTEXT`: 6 perguntas
- `LEAD`: 6 perguntas
