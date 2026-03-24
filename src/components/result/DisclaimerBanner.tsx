interface DisclaimerBannerProps {
  locale: string
}

const DISCLAIMER: Record<string, string> = {
  'pt-BR': 'Esta é uma estimativa inicial. O valor final pode variar conforme detalhamento do escopo.',
  'en-US': 'This is an initial estimate. The final value may vary based on scope details.',
  'es-ES': 'Esta es una estimación inicial. El valor final puede variar según los detalles del alcance.',
  'it-IT': 'Questa è una stima iniziale. Il valore finale può variare in base ai dettagli dello scope.',
}

/**
 * CMP-026: DisclaimerBanner — disclaimer obrigatório na página de resultado (INT-102).
 * Extraído de EstimationDisplay para reutilização e verificação isolada.
 */
export function DisclaimerBanner({ locale }: DisclaimerBannerProps) {
  const text = DISCLAIMER[locale] ?? DISCLAIMER['en-US']

  return (
    <p className="text-xs text-(--color-text-muted) border-t border-(--color-border) pt-3 mt-2 leading-relaxed">
      {text}
    </p>
  )
}
