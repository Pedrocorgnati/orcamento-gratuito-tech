/**
 * Placeholder para a KPI INT-024: Acurácia de Estimativa >= 70%
 *
 * V1: campo accuracy_feedback existe no modelo mas não há UI para o cliente avaliar.
 * V2: adicionar link de feedback no email de confirmação.
 */
export function AccuracyPlaceholder() {
  return (
    <div data-testid="admin-leads-accuracy-placeholder" className="mb-6 rounded-lg border border-dashed border-gray-300 p-4 text-center text-sm text-gray-500">
      <p className="font-medium">Acurácia de Estimativas (INT-024) — V2</p>
      <p className="mt-1">
        Meta: ≥ 70% de estimativas avaliadas como precisas pelo cliente.
        <br />
        Implementação: link de feedback no email pós-projeto (fora do escopo V1).
      </p>
      <p className="mt-2 text-xs text-gray-400">
        Campo <code>accuracy_feedback</code> disponível no modelo Lead.
        Dados aparecerão aqui quando leads avaliarem suas estimativas.
      </p>
    </div>
  )
}
