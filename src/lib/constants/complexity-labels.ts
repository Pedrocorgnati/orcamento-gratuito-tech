/**
 * Labels de complexidade i18n — centralizados para uso em
 * ComplexityBadge, ScopeStoryCard e qualquer outro componente.
 *
 * Indexado por nível de complexidade (string) → locale → label traduzido.
 */
export const COMPLEXITY_LABELS: Record<string, Record<string, string>> = {
  LOW:       { 'pt-BR': 'Baixa',      'en-US': 'Low',       'es-ES': 'Baja',     'it-IT': 'Bassa' },
  MEDIUM:    { 'pt-BR': 'Média',      'en-US': 'Medium',    'es-ES': 'Media',    'it-IT': 'Media' },
  HIGH:      { 'pt-BR': 'Alta',       'en-US': 'High',      'es-ES': 'Alta',     'it-IT': 'Alta' },
  VERY_HIGH: { 'pt-BR': 'Muito Alta', 'en-US': 'Very High', 'es-ES': 'Muy Alta', 'it-IT': 'Molto Alta' },
}

/** Border colors por nível de complexidade (para ScopeStoryCard) */
export const COMPLEXITY_BORDER_COLORS: Record<string, string> = {
  LOW:       '#16a34a',   // verde
  MEDIUM:    '#d97706',   // âmbar
  HIGH:      '#dc2626',   // vermelho
  VERY_HIGH: '#7c3aed',   // roxo
}
