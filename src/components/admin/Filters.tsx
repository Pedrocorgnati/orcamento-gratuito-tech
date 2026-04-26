'use client'

import { useRouter, useSearchParams, usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'
import { LeadScore, ProjectType } from '@/lib/enums'
import { useDebounce } from '@/hooks'

const SCORE_OPTIONS = [LeadScore.A, LeadScore.B, LeadScore.C] as const

const SCORE_COLORS: Record<string, string> = {
  [LeadScore.A]: 'bg-green-100 text-green-800 border-green-300 hover:bg-green-200',
  [LeadScore.B]: 'bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200',
  [LeadScore.C]: 'bg-red-100 text-red-800 border-red-300 hover:bg-red-200',
}

const SCORE_COLORS_ACTIVE: Record<string, string> = {
  [LeadScore.A]: 'bg-green-600 text-white border-green-700',
  [LeadScore.B]: 'bg-yellow-500 text-white border-yellow-600',
  [LeadScore.C]: 'bg-red-600 text-white border-red-700',
}

// Classe compartilhada para inputs/selects do filtro
const FILTER_INPUT_CLASS =
  'text-sm border border-(--color-border) rounded-md px-2 py-1.5 bg-(--color-background) text-(--color-text-primary) focus:outline-none focus:ring-2 focus:ring-(--color-primary)'

const PROJECT_TYPE_OPTIONS = [
  { value: '', label: 'Todos os tipos' },
  { value: ProjectType.WEBSITE, label: 'Website' },
  { value: ProjectType.ECOMMERCE, label: 'E-commerce' },
  { value: ProjectType.WEB_APP, label: 'Sistema Web' },
  { value: ProjectType.MOBILE_APP, label: 'App Mobile' },
  { value: ProjectType.AUTOMATION_AI, label: 'Automação/IA' },
  { value: ProjectType.MARKETPLACE, label: 'Marketplace' },
  { value: ProjectType.CRYPTO, label: 'Crypto / Web3' },
  { value: ProjectType.BROWSER_EXT, label: 'Extensão Browser' },
] as const

export function Filters() {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const currentScore = searchParams.get('score')
  const currentType = searchParams.get('type') ?? ''
  const currentFrom = searchParams.get('from') ?? ''
  const currentTo = searchParams.get('to') ?? ''

  // Estado local para date inputs — evita router.push por keystroke
  const [fromInput, setFromInput] = useState(() =>
    currentFrom ? currentFrom.split('T')[0] : ''
  )
  const [toInput, setToInput] = useState(() =>
    currentTo ? currentTo.split('T')[0] : ''
  )
  const debouncedFrom = useDebounce(fromInput, 500)
  const debouncedTo = useDebounce(toInput, 500)

  const updateParam = useCallback(
    (key: string, value: string | null) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value) {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      // Resetar para página 1 ao filtrar
      params.set('page', '1')
      router.push(`${pathname}?${params.toString()}`)
    },
    [router, pathname, searchParams]
  )

  // Sincronizar debouncedFrom com a URL (pula o mount inicial)
  const isMountedFrom = useRef(false)
  useEffect(() => {
    if (!isMountedFrom.current) { isMountedFrom.current = true; return }
    if (debouncedFrom) {
      updateParam('from', `${debouncedFrom}T00:00:00.000Z`)
    } else {
      updateParam('from', null)
    }
  }, [debouncedFrom]) // eslint-disable-line react-hooks/exhaustive-deps

  // Sincronizar debouncedTo com a URL (pula o mount inicial)
  const isMountedTo = useRef(false)
  useEffect(() => {
    if (!isMountedTo.current) { isMountedTo.current = true; return }
    if (debouncedTo) {
      updateParam('to', `${debouncedTo}T23:59:59.999Z`)
    } else {
      updateParam('to', null)
    }
  }, [debouncedTo]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleScoreToggle(score: string) {
    updateParam('score', currentScore === score ? null : score)
  }

  function handleTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    updateParam('type', e.target.value || null)
  }

  function handleClearAll() {
    setFromInput('')
    setToInput('')
    router.push(pathname)
  }

  const hasActiveFilters = !!(currentScore || currentType || currentFrom || currentTo)

  return (
    <div data-testid="admin-leads-filter-bar" className="flex flex-wrap items-center gap-3 rounded-lg border border-gray-200 bg-white px-4 py-3 mb-4">
      {/* Score chips */}
      <div data-testid="admin-leads-filter-score-group" className="flex items-center gap-1.5">
        <span className="text-xs font-medium text-gray-500 mr-1">Score:</span>
        {SCORE_OPTIONS.map((score) => {
          const isActive = currentScore === score
          return (
            <button
              key={score}
              type="button"
              data-testid={`admin-leads-filter-score-${score.toLowerCase()}-button`}
              onClick={() => handleScoreToggle(score)}
              className={`inline-flex items-center justify-center min-w-11 min-h-11 rounded-full text-xs font-bold border transition-all ${
                isActive ? SCORE_COLORS_ACTIVE[score] : SCORE_COLORS[score]
              }`}
              aria-pressed={isActive}
              aria-label={`Filtrar por score ${score}`}
            >
              {score}
            </button>
          )
        })}
      </div>

      {/* Separator */}
      <div className="h-5 w-px bg-gray-200" aria-hidden="true" />

      {/* Project type select */}
      <div data-testid="admin-leads-filter-type-group" className="flex items-center gap-2">
        <label htmlFor="filter-type" className="text-xs font-medium text-gray-500">
          Tipo:
        </label>
        <select
          id="filter-type"
          data-testid="admin-leads-filter-type-select"
          value={currentType}
          onChange={handleTypeChange}
          className={FILTER_INPUT_CLASS}
        >
          {PROJECT_TYPE_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Separator */}
      <div className="h-5 w-px bg-gray-200" aria-hidden="true" />

      {/* Date range */}
      <div data-testid="admin-leads-filter-date-group" className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-gray-500">Período:</span>
        <input
          type="date"
          data-testid="admin-leads-filter-date-from-input"
          value={fromInput}
          onChange={(e) => setFromInput(e.target.value)}
          className={FILTER_INPUT_CLASS}
          aria-label="Data inicial"
        />
        <span className="text-xs text-gray-400">até</span>
        <input
          type="date"
          data-testid="admin-leads-filter-date-to-input"
          value={toInput}
          min={fromInput || undefined}
          onChange={(e) => setToInput(e.target.value)}
          className={FILTER_INPUT_CLASS}
          aria-label="Data final"
        />
      </div>

      {/* Clear all */}
      {hasActiveFilters && (
        <button
          type="button"
          data-testid="admin-leads-filter-clear-button"
          onClick={handleClearAll}
          className="ml-auto text-xs text-gray-500 hover:text-gray-900 underline"
        >
          Limpar filtros
        </button>
      )}
    </div>
  )
}
