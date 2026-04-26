'use client'

import { useEffect, useState } from 'react'

interface AbandonmentResp {
  days: number
  by_block: Array<{ block: string; started: number; abandoned: number; rate: number }>
}
interface ResumeResp {
  days: number
  intermediate_captured: number
  resumed: number
  rate: number
}
interface AlertsResp {
  days: number
  by_type: Array<{ alert_type: string; count: number }>
}

export function MetricsCards() {
  const [days, setDays] = useState<7 | 30 | 0>(30)
  const [ab, setAb] = useState<AbandonmentResp | null>(null)
  const [rs, setRs] = useState<ResumeResp | null>(null)
  const [al, setAl] = useState<AlertsResp | null>(null)
  const qs = days === 0 ? 'days=365' : `days=${days}`

  useEffect(() => {
    Promise.all([
      fetch(`/api/v1/admin/kpi/abandonment?${qs}`).then((r) => r.json()),
      fetch(`/api/v1/admin/kpi/resume-rate?${qs}`).then((r) => r.json()),
      fetch(`/api/v1/admin/alerts?${qs}`).then((r) => r.json()),
    ]).then(([a, r, l]) => {
      setAb(a)
      setRs(r)
      setAl(l)
    }).catch(() => {})
  }, [qs])

  return (
    <div data-testid="admin-metrics-cards" className="mb-6 space-y-4">
      <div className="flex gap-2 text-sm">
        {[7, 30, 0].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDays(d as 7 | 30 | 0)}
            className={`rounded px-3 py-1 ${days === d ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}
          >
            {d === 0 ? 'All' : `${d}d`}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-lg border p-4">
          <h4 className="font-medium">Abandono por bloco</h4>
          {!ab ? <p className="text-sm text-gray-500">...</p> : (
            <ul className="mt-2 space-y-1 text-sm">
              {ab.by_block.slice(0, 8).map((b) => (
                <li key={b.block} className="flex justify-between">
                  <span>{b.block}</span>
                  <span>{(b.rate * 100).toFixed(1)}%</span>
                </li>
              ))}
              {ab.by_block.length === 0 && <li className="text-gray-500">Sem dados</li>}
            </ul>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium">Taxa de retomada</h4>
          {!rs ? <p className="text-sm text-gray-500">...</p> : (
            <div className="mt-2 text-sm">
              <p className="text-2xl font-semibold">{(rs.rate * 100).toFixed(1)}%</p>
              <p className="text-gray-500">
                {rs.resumed} retomadas / {rs.intermediate_captured} sessões
              </p>
            </div>
          )}
        </div>

        <div className="rounded-lg border p-4">
          <h4 className="font-medium">Alertas de consistência</h4>
          {!al ? <p className="text-sm text-gray-500">...</p> : (
            <ul className="mt-2 space-y-1 text-sm">
              {al.by_type.map((a) => (
                <li key={a.alert_type} className="flex justify-between">
                  <span>{a.alert_type}</span>
                  <span>{a.count}</span>
                </li>
              ))}
              {al.by_type.length === 0 && <li className="text-gray-500">Sem alertas</li>}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
