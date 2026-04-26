'use client'

import { useEffect, useState } from 'react'
import type { AccuracyKPI } from '@/lib/calibration/computeAccuracyKPI'

function color(pct: number, threshold: number): string {
  if (pct >= threshold) return 'text-green-600'
  if (pct >= threshold - 0.1) return 'text-yellow-600'
  return 'text-red-600'
}

export function AccuracyCard() {
  const [kpi, setKpi] = useState<AccuracyKPI | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/v1/admin/kpi/accuracy')
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then(setKpi)
      .catch((e) => setError((e as Error).message))
  }, [])

  if (error) {
    return (
      <div data-testid="admin-accuracy-card-error" className="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Falha ao carregar KPI de acurácia: {error}
      </div>
    )
  }

  if (!kpi) {
    return (
      <div data-testid="admin-accuracy-card-loading" className="mb-6 rounded-lg border border-gray-200 p-4 text-sm text-gray-500">
        Carregando KPI de acurácia...
      </div>
    )
  }

  const pct = kpi.accuracy * 100
  const barPct = Math.min(100, pct)
  const barColor = pct >= kpi.threshold * 100 ? 'bg-green-500' : pct >= (kpi.threshold - 0.1) * 100 ? 'bg-yellow-500' : 'bg-red-500'

  return (
    <div data-testid="admin-accuracy-card" className="mb-6 rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-gray-900">Acurácia de Estimativas (INT-024)</h3>
        <span className={`text-2xl font-bold ${color(kpi.accuracy, kpi.threshold)}`}>
          {pct.toFixed(1)}%
        </span>
      </div>
      <div className="mt-3 h-2 w-full rounded bg-gray-100">
        <div className={`h-2 rounded ${barColor}`} style={{ width: `${barPct}%` }} />
      </div>
      <div className="mt-2 flex justify-between text-xs text-gray-500">
        <span>Meta: {(kpi.threshold * 100).toFixed(0)}%</span>
        <span>
          Amostra: {kpi.positives}/{kpi.sample_size}
        </span>
      </div>
      {kpi.last_recalibration && (
        <p className="mt-1 text-xs text-gray-400">
          Última recalibração: {new Date(kpi.last_recalibration).toLocaleString('pt-BR')}
        </p>
      )}
    </div>
  )
}
