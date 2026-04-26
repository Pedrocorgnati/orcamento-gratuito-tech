import type { KPIData } from '@/lib/analytics/kpi'

interface KPICardProps {
  label: string
  value: string
  target: string
  status: 'ok' | 'warning' | 'error'
  description: string
  testId: string
}

function KPICard({ label, value, target, status, description, testId }: KPICardProps) {
  const statusColors = {
    ok: 'border-green-500 bg-green-50 text-green-700',
    warning: 'border-yellow-500 bg-yellow-50 text-yellow-700',
    error: 'border-red-500 bg-red-50 text-red-700',
  }
  return (
    <div data-testid={testId} data-kpi-status={status} className={`rounded-lg border-2 p-4 ${statusColors[status]}`}>
      <p className="text-sm font-medium opacity-75">{label}</p>
      <p className="mt-1 text-3xl font-bold">{value}</p>
      <p className="mt-1 text-xs opacity-75">Meta: {target}</p>
      <p className="mt-2 text-xs">{description}</p>
    </div>
  )
}

interface KPICardsProps {
  data: KPIData
}

export function KPICards({ data }: KPICardsProps) {
  const fmtPct = (n: number) => `${(n * 100).toFixed(1)}%`

  const cards: KPICardProps[] = [
    {
      label: 'Taxa de Conclusão (INT-097)',
      value: fmtPct(data.completionRate),
      target: '≥ 35%',
      status: data.completionRate >= 0.35 ? 'ok' : data.completionRate >= 0.25 ? 'warning' : 'error',
      description: `${data.completedSessions} de ${data.totalSessions} sessões`,
      testId: 'admin-leads-kpi-completion-rate',
    },
    {
      label: 'Taxa de Conversão (INT-098)',
      value: fmtPct(data.conversionRate),
      target: '≥ 20%',
      status: data.conversionRate >= 0.2 ? 'ok' : data.conversionRate >= 0.1 ? 'warning' : 'error',
      description: `${data.totalLeads} leads de ${data.completedSessions} completadas`,
      testId: 'admin-leads-kpi-conversion-rate',
    },
    {
      label: 'Leads A/B (INT-099)',
      value: fmtPct(data.highScoreLeadsRate),
      target: '≥ 60%',
      status: data.highScoreLeadsRate >= 0.6 ? 'ok' : data.highScoreLeadsRate >= 0.4 ? 'warning' : 'error',
      description: `${data.highScoreLeads} leads A/B de ${data.totalLeads} total`,
      testId: 'admin-leads-kpi-high-score-rate',
    },
    {
      label: 'Tempo Médio (INT-100)',
      value: `${data.avgSessionDurationMin} min`,
      target: '< 5 min',
      status: data.avgSessionDurationMin < 5 ? 'ok' : data.avgSessionDurationMin < 7 ? 'warning' : 'error',
      description: `Atualizado ${data.updatedAt.toLocaleDateString('pt-BR')}`,
      testId: 'admin-leads-kpi-avg-duration',
    },
  ]

  return (
    <section data-testid="admin-leads-kpis" className="mb-6">
      <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-(--color-text-secondary)">
        KPIs de Sucesso
      </h2>
      <div data-testid="admin-leads-kpis-grid" className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {cards.map((card) => (
          <KPICard key={card.label} {...card} />
        ))}
      </div>
    </section>
  )
}
