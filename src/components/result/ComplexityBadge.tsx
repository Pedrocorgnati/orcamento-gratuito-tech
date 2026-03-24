import { ComplexityLevel } from '@/lib/enums'
import { COMPLEXITY_LABELS } from '@/lib/constants/complexity-labels'

interface ComplexityBadgeProps {
  complexity: ComplexityLevel
  /** URL locale (BCP-47), ex: 'pt-BR', 'en-US' */
  locale: string
}

const COMPLEXITY_COLORS: Record<ComplexityLevel, string> = {
  // success token for LOW; no yellow/orange tokens — keeping Tailwind for MEDIUM/HIGH
  [ComplexityLevel.LOW]:       'bg-green-100  text-(--color-success)  border-green-200',
  [ComplexityLevel.MEDIUM]:    'bg-yellow-100 text-yellow-800 border-yellow-200',
  [ComplexityLevel.HIGH]:      'bg-orange-100 text-orange-800 border-orange-200',
  [ComplexityLevel.VERY_HIGH]: 'bg-red-100    text-(--color-danger)    border-red-200',
}

// COMPLEXITY_LABELS importado de @/lib/constants/complexity-labels

const COMPLEXITY_PREFIX: Record<string, string> = {
  'pt-BR': 'Complexidade',
  'en-US': 'Complexity',
  'es-ES': 'Complejidad',
  'it-IT': 'Complessità',
}

export function ComplexityBadge({ complexity, locale }: ComplexityBadgeProps) {
  const colorClass = COMPLEXITY_COLORS[complexity]
  const label     = COMPLEXITY_LABELS[complexity]?.[locale] ?? COMPLEXITY_LABELS[complexity]['en-US']
  const prefix    = COMPLEXITY_PREFIX[locale] ?? COMPLEXITY_PREFIX['en-US']

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${colorClass}`}
      role="status"
      aria-label={`${prefix}: ${label}`}
    >
      {label}
    </span>
  )
}
