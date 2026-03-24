import { LeadScore } from '@/lib/enums'

interface ScoreBadgeProps {
  score: string
}

const scoreConfig: Record<string, { label: string; className: string }> = {
  [LeadScore.A]: {
    label: 'A',
    className: 'bg-green-100 text-green-800 border border-green-200',
  },
  [LeadScore.B]: {
    label: 'B',
    className: 'bg-yellow-100 text-yellow-800 border border-yellow-200',
  },
  [LeadScore.C]: {
    label: 'C',
    className: 'bg-red-100 text-red-800 border border-red-200',
  },
}

export function ScoreBadge({ score }: ScoreBadgeProps) {
  const config = scoreConfig[score] ?? { label: score, className: 'bg-gray-100 text-gray-700 border border-gray-200' }
  return (
    <span
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${config.className}`}
      aria-label={`Score ${config.label}`}
    >
      {config.label}
    </span>
  )
}
