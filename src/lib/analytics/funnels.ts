/**
 * Definição dos 3 funnels para configuração no Vercel Analytics Dashboard.
 *
 * ATENÇÃO: Funnels são configurados na interface do Vercel Analytics,
 * não via código. Este arquivo serve como documentação e referência.
 *
 * FEAT-UX-005, INT-097, INT-098
 */

export const FUNNELS = {
  /**
   * Funnel 1: Visitante → Orçamento completo → Lead
   * Meta: taxa conclusão >= 35%, taxa conversão >= 20%
   */
  visitor_funnel: {
    name: 'Visitor to Lead Funnel',
    steps: [
      { event: 'flow_started', label: 'Iniciou o flow' },
      { event: 'flow_completed', label: 'Completou o flow' },
      { event: 'lead_submitted', label: 'Enviou formulário' },
    ],
    kpis: {
      completion_rate: 'flow_completed / flow_started >= 0.35',
      conversion_rate: 'lead_submitted / flow_completed >= 0.20',
    },
  },

  /**
   * Funnel 2: Admin login → Visualização de leads
   */
  admin_funnel: {
    name: 'Admin Usage Funnel',
    steps: [
      { event: 'admin_login_requested', label: 'Solicitou login' },
      { event: 'admin_leads_viewed', label: 'Visualizou leads' },
    ],
  },

  /**
   * Funnel 3: Locale de entrada → Locale final (troca de idioma)
   */
  locale_funnel: {
    name: 'Locale Preference Funnel',
    steps: [
      { event: 'flow_started', label: 'Iniciou no locale original' },
      { event: 'locale_changed', label: 'Trocou idioma' },
      { event: 'flow_completed', label: 'Completou no novo locale' },
    ],
  },
} as const
