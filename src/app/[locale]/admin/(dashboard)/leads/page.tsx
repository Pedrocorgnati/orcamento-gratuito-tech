import { Suspense } from 'react'
import type { Metadata } from 'next'
import { LeadsTable } from '@/components/admin/LeadsTable'
import { Filters } from '@/components/admin/Filters'
import { Pagination } from '@/components/admin/Pagination'
import { TableSkeleton } from '@/components/admin/TableSkeleton'
import { KPICards } from '@/components/admin/KPICards'
import { AccuracyPlaceholder } from '@/components/admin/AccuracyPlaceholder'
import { adminLeadsQuerySchema } from '@/lib/validations/schemas'
import { leadService } from '@/services/lead.service'
import { getKPIDashboard } from '@/lib/analytics/kpi'
import type { KPIData } from '@/lib/analytics/kpi'
import { logger } from '@/lib/logger'

export const metadata: Metadata = {
  title: 'Leads — Admin | Budget Free Engine',
}

interface LeadsPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

async function KPISection() {
  let kpiData: KPIData | null = null
  try {
    kpiData = await getKPIDashboard()
  } catch (error) {
    logger.error('kpi_dashboard_load_failed', { error: error instanceof Error ? error.message : String(error) })
  }

  if (!kpiData) {
    return (
      <div className="mb-6 rounded-lg bg-yellow-50 p-4 text-sm text-yellow-700">
        KPIs temporariamente indisponíveis. A tabela de leads continua acessível.
      </div>
    )
  }

  return <KPICards data={kpiData} />
}

async function LeadsContent({
  rawParams,
}: {
  rawParams: Record<string, string | string[] | undefined>
}) {
  // Normalizar params (pegar apenas primeira string de arrays)
  const flat = Object.fromEntries(
    Object.entries(rawParams).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v])
  )

  const parsed = adminLeadsQuerySchema.safeParse(flat)

  if (!parsed.success) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-8 text-center">
        <p className="text-sm font-medium text-red-600">Parâmetros de filtro inválidos</p>
      </div>
    )
  }

  const { data: leads, total } = await leadService.findMany(parsed.data)

  return (
    <>
      <Suspense fallback={<div className="mb-4 h-14 animate-pulse rounded-lg bg-gray-100" aria-busy="true" aria-label="Carregando filtros..." />}>
        <Filters />
      </Suspense>

      <div>
        <LeadsTable data={leads} />
        <Pagination total={total} page={parsed.data.page} pageSize={parsed.data.pageSize} />
      </div>
    </>
  )
}

export default async function LeadsPage({ searchParams }: LeadsPageProps) {
  const rawParams = await searchParams

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Leads</h1>
        <p className="text-sm text-gray-500 mt-1">
          Orçamentos gerados pelos visitantes
        </p>
      </div>

      {/* KPI Cards — acima da tabela (TASK-3 ST004/ST005) */}
      <Suspense fallback={<div className="mb-6 h-24 animate-pulse rounded-lg bg-gray-100" aria-busy="true" aria-label="Carregando KPIs..." />}>
        <KPISection />
      </Suspense>
      <AccuracyPlaceholder />

      <Suspense fallback={<TableSkeleton rows={8} cols={6} />}>
        <LeadsContent rawParams={rawParams} />
      </Suspense>
    </div>
  )
}
